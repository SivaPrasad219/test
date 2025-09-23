<template>
  <a-table
    :columns="visibleColumns"
    :data-source="processedData"
    :pagination="false"
    :getPopupContainer="
      (triggerNode) => triggerNode.closest('.ant-table-container')
    "
    :locale="customLocale"
    :loading="isTableLoading || internalLoading"
    class="custom-table data-class"
    @change="handleTableChange"
  >
    <template #headerCell="{ column }">
      <span>
        {{ translateLabel("commonData", `${column.title}`) }}
        <a-popover
          v-if="infoCommentsPop?.manage?.[column.page]?.[column.title]"
          trigger="hover"
          placement="topLeft"
        >
          <template #content>
            <div style="color: black; max-width: 350px">
              {{
                translateLabel(
                  "constantsTranslate",
                  infoCommentsPop?.manage?.[column.page]?.[column.title]
                )
              }}
            </div>
          </template>
          <InfoCircleOutlined />
        </a-popover>
      </span>
    </template>

    <template #bodyCell="{ column, record }">
      <template v-if="column?.title === 'Timezone' && column.page === 'sites'">
        {{ record.timezone }}
      </template>
      <template v-if="column?.title === 'Status'">
        <a-switch
          :checked="isActive(record, column)"
          @change="(checked: any) =>
    column?.page === 'users'
      ? toggleUserStatus(record, checked)
      : toggleSiteStatus(record, checked)
    "
          :disabled="
            (column.page === 'users' && record.username === userDetails) ||
            (column.page === 'sites' && record.id === 1)
          "
          :checked-children="translateLabel('commonData', 'Active')"
          :un-checked-children="translateLabel('commonData', 'Inactive')"
        />
      </template>
      <template v-if="column?.dataIndex === 'edit'">
        <a-tooltip :title="tooltipTitle(record, column)">
          <EditOutlined
            @click="handleEditClick(record, column)"
            :style="{
              cursor: isEditDisabled(record, column)
                ? 'not-allowed'
                : 'pointer',
              color: isEditDisabled(record, column) ? '#ccc' : 'inherit',
            }"
          />
        </a-tooltip>
      </template>
    </template>
    <template #emptyText>
      <div class="no-data-available">
        {{ translateLabel("dataPage", "No data available") }}
      </div>
    </template>
  </a-table>
  <ManageUserModal
    v-if="isUserTable"
    :open="usermodalVisible"
    :data="modalUserContent || {}"
    @userSubmitted="userEditSubmitted"
    @close="closeModal"
  />
  <ManageSiteModel
    v-if="isSiteTable"
    :open="sitemodalVisible"
    :data="modalSiteContent"
    @submit="siteEditSubmitted"
    @close="closeModal"
  />
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref, watch } from "vue";
import { Table, Modal, message } from "ant-design-vue";
import { ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons-vue";
import { createVNode } from "vue";
import { transformCustomColumnCell } from "@/common/customColumnTransformer";
import ManageUserModal from "@/views/Manage/ManageUserModal.vue";
import ManageSiteModel from "@/views/Manage/ManageSiteModel.vue";
import { translateLabel, convertTimesZoneAbb } from "@/common/utils";
import { useI18n } from "vue-i18n";
import i18n from "@/i18n";
import {
  activateUserApi,
  deactivateUserApi,
  activateSiteApi,
  deactivateSiteApi,
  getUserById,
  getSiteById,
} from "../services/apiService";
import infoComments from "@/common/constants.json";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
import { computed } from "vue";
interface TableColumn {
  title: string;
  dataIndex: string;
  customColumnCell?: any;
}

interface TableRow {
  id: number;
  user__user___status: string;
  username?: string;
  siteName?: string;
  [key: string]: any;
}

interface Handlers {
  toggleSiteStatus: (record: TableRow, checked: boolean) => void;
  toggleUserStatus: (record: TableRow, checked: boolean) => void;
  editUserRecord: (record: any) => void;
  editSiteRecord: (record: any) => void;
  deactivate: (record: any) => void;

  [key: string]: any;
}

export default defineComponent({
  name: "TableComponent",
  components: {
    "a-table": Table,
    ManageUserModal,
    ManageSiteModel,
    InfoCircleOutlined,
    EditOutlined,
  },
  props: {
    tableColumns: {
      type: Array as PropType<TableColumn[]>,
      required: true,
    },
    data: {
      type: Array as PropType<TableRow[]>,
      required: true,
    },
    isUserTable: {
      type: Boolean,
      required: true,
    },
    isSiteTable: {
      type: Boolean,
      required: true,
    },
    isTableLoading: {
      type: Boolean,
      required: false,
    },
  },
  methods: {
    handleTableChange(pagination: any, filters: any, sorter: any) {
      console.log(pagination, sorter);
      this.$emit("filterChange", filters);
    },
  },
  setup(props, { emit }) {
    const infoCommentsPop = ref(infoComments);
    const { t, locale } = useI18n();
    const columns = ref<TableColumn[]>([]);
    const visibleColumns = ref<TableColumn[]>([]);
    const dataSource = ref<TableRow[]>([]);
    const usermodalVisible = ref(false);
    const sitemodalVisible = ref(false);
    const modalUserContent = ref<TableRow | null>(null);
    const modalSiteContent = ref<TableRow | null>(null);
    const processedData = ref<TableRow[]>([]);
    const toggleRecord = ref<TableRow | null>(null);
    const toggleChecked = ref<boolean | string | number | undefined>(false);
    const toggleHandler = ref<(record: TableRow, checked: boolean) => void>();
    const userDetails = ref(null);
    const internalLoading = ref(false);
    const closeModal = () => {
      usermodalVisible.value = false;
      sitemodalVisible.value = false;
    };

    const toggleUserStatus = (record: TableRow, checked: boolean) => {
      toggleRecord.value = record;
      toggleChecked.value = checked;
      toggleHandler.value = updateUserStatus;
      showConfirmModal(record, checked, "user");
    };

    const toggleSiteStatus = (record: TableRow, checked: boolean) => {
      toggleRecord.value = record;
      toggleChecked.value = checked;
      toggleHandler.value = updateSiteStatus;
      showConfirmModal(record, checked, "site");
    };

    const updateUserStatus = async (record: TableRow, checked: boolean) => {
      try {
        const userId: string = record.id.toString();
        const status = checked ? "Active" : "Inactive";
        const messageStatus = checked ? "Activated" : "Inactivated";
        const payload = { status };
        status === "Active"
          ? await activateUserApi(userId, payload)
          : await deactivateUserApi(userId, payload);

        message.success(
          `'${record.username}' ${t(
            `commonData.${messageStatus} successfully`
          )}`
        );
        record.user__user___status = status;
        closeModal();
      } catch (error) {
        console.error(`Error updating user status:`, error);
        closeModal();
      }
    };

    const tooltipTitle = (record: any, column: any) => {
      const entity = column.page === "users" ? "User" : "Site";
      return isEditDisabled(record, column)
        ? `${t("commonData.Cannot Edit", "Cannot Edit")}`
        : `${t(`commonData.Edit ${entity}`, `Edit ${entity}`)} `;
    };

    const updateSiteStatus = async (record: TableRow, checked: boolean) => {
      try {
        const siteId: string = record.id.toString();
        const status = checked ? "Active" : "Inactive";
        const messageStatus = checked ? "Activated" : "Inactivated";
        const payload = { status };
        const response =
          status === "Active"
            ? await activateSiteApi(siteId, payload)
            : await deactivateSiteApi(siteId, payload);
        console.log(response.code, response.message);
        if (
          response &&
          response.code === 400 &&
          (response.message ===
            "Unable to edit site when user(s) are associated to this site." ||
            response.message ===
              "Unable to inactivate site when user(s) are associated to this site." ||
            response.message === "Unable to deactivate default site" ||
            response.message ===
              "Unable to edit site when the instrument(s) are associated to this site." ||
            response.message ===
              "Unable to inactivate site when the instrument(s) are associated to this site." ||
            response.message ===
              "Unable to inactivate site when user(s) and device(s) are associated with this site." ||
            response.message ===
              "Unable to edit site when user(s) and device(s) are associated with this site.")
        ) {
          message.error(
            i18n.global.t(
              `commonData['${response.message}']`,
              `${response.message}`
            )
          );
        } else {
          message.success(
            `'${record.name}' ${t(
              `commonData.${messageStatus} successfully`,
              `${messageStatus} successfully`
            )}`
          );
          record.status = status;
        }
        closeModal();
      } catch (error: any) {
        console.error(`Error updating site status:`, error);

        if (
          error &&
          error.code === 400 &&
          (error.message ===
            "Unable to edit site when user(s) are associated to this site." ||
            error.message ===
              "Unable to inactivate site when user(s) are associated to this site." ||
            error.message === "Unable to deactivate default site" ||
            error.message ===
              "Unable to edit site when the instrument(s) are associated to this site." ||
            error.message ===
              "Unable to inactivate site when the instrument(s) are associated to this site." ||
            error.message ===
              "Unable to edit site when user(s) and device(s) are associated with this site." ||
            error.message ===
              "Unable to inactivate site when user(s) and device(s) are associated with this site.")
        ) {
          message.error(
            i18n.global.t(`commonData['${error.message}']`, `${error.message}`)
          );
        }
        closeModal();
      }
    };

    const handleEditClick = async (record: any, column: any) => {
      internalLoading.value = true;
      if (column.dataIndex === "edit") {
        if (column?.page === "users") {
          if (
            record.username !== userDetails.value &&
            record.user__user___status !== "Inactive"
          ) {
            try {
              const userData = await getUserById(record.id);
              await editUserRecord(userData.data[0]);
            } catch (error) {
              console.error(`Error fetching user data:`, error);
            }
          }
        } else {
          if (column?.page === "sites") {
            if (record.status !== "Inactive" && record.id !== 1) {
              try {
                const siteData = await getSiteById(record.id);
                await editSiteRecord(siteData.data);
              } catch (error) {
                console.error(`Error fetching site data:`, error);
              }
            }
          }
        }
      }
      internalLoading.value = false;
    };

    const editUserRecord = (record: TableRow) => {
      modalUserContent.value = record;
      usermodalVisible.value = true;
      sitemodalVisible.value = false;
    };

    const editSiteRecord = (record: TableRow) => {
      modalSiteContent.value = record;
      usermodalVisible.value = false;
      sitemodalVisible.value = true;
    };

    const userEditSubmitted = (editPayLoad: any) => {
      emit("userEdited", editPayLoad);
      console.log("::::::::user is Updated are added");
    };
    const siteEditSubmitted = (sitePayload: any) => {
      emit("siteEdited", sitePayload);
      console.log("::::::::user is Updated are added");
    };

    const deactivate = (record: TableRow) => {
      console.log("Deactivate Record", record);
    };

    const confirmToggle = async (confirm: boolean) => {
      if (confirm && toggleRecord.value && toggleHandler.value) {
        try {
          await toggleHandler.value(
            toggleRecord.value,
            toggleChecked.value as boolean
          );
          internalLoading.value = false;
        } catch (error) {
          console.error(`Error toggling status:`, error);
          internalLoading.value = false;
        }
      }
    };

    const showConfirmModal = (
      record: TableRow,
      checked: boolean,
      type: string
    ) => {
      const name = type === "user" ? record.username : record.name;
      const action = checked ? "activate" : "inactivate";
      const content = `${t(
        `commonData.This action will ${action} the ${type}`,
        `This action will ${action} the ${type}`
      )} "${name}".`;

      Modal.confirm({
        title: `${t(
          `commonData.Do you want to ${action}`,
          `Do you want to ${action}`
        )} "${name}"?`,
        icon: createVNode(ExclamationCircleOutlined),
        okText: t("commonData.OK", "OK"),
        cancelText: t("commonData.Cancel", "Cancel"),
        content,
        async onOk() {
          try {
            internalLoading.value = true;

            await confirmToggle(true);
          } catch (error) {
            console.error("Error during confirmation:", error);
          } finally {
            Modal.destroyAll();
          }
        },
        onCancel() {
          confirmToggle(false);
        },
      });
    };

    const handlers: Handlers = {
      toggleSiteStatus,
      toggleUserStatus,
      editUserRecord,
      editSiteRecord,
      deactivate,
    };
    const getNestedValue = (
      obj: any,
      path: string,
      defaultValue: any = null
    ) => {
      try {
        const keys = path.split(".");
        const result = keys.reduce((acc, key) => {
          if (acc && typeof acc === "object") {
            if (key.includes("[")) {
              const [arrayKey, indexPart] = key.split("[");
              const index = parseInt(indexPart.replace("]", ""), 10);
              const array = acc[arrayKey as keyof typeof acc];
              if (array && Array.isArray(array)) {
                return array[index];
              }
              return defaultValue;
            }
            return acc[key as keyof typeof acc];
          }
          return defaultValue;
        }, obj);
        if (
          Array.isArray(result) ||
          (typeof result === "object" && result !== null)
        ) {
          return JSON.stringify(result);
        }
        return result;
      } catch (error) {
        return defaultValue;
      }
    };
    const processData = (data: TableRow[], columns: TableColumn[]) => {
      console.log("#data columns:::", data, columns);

      return data.map((record: TableRow) => {
        const processedRecord: TableRow = {
          id: record.id,
          user__user___status: record.user__user___status || "ACTIVE",
          username: record.username,
          siteName: record.siteName,
          status: record.status || "ACTIVE",
        };
        columns.forEach((col: TableColumn) => {
          processedRecord[col.dataIndex] = getNestedValue(
            record,
            col.dataIndex
          );
        });
        return processedRecord;
      });
    };

    const updateColumnsWithCustomCells = (columns: TableColumn[]) => {
      const updatedColumns = columns.map((column) => {
        if (column.customColumnCell) {
          const transformedCustomCell = transformCustomColumnCell(
            column.customColumnCell,
            column,
            handlers
          );
          return { ...column, ...transformedCustomCell };
        }
        return column;
      });
      visibleColumns.value = updatedColumns.filter(
        (column) => column.dataIndex !== "id"
      );
      return updatedColumns;
    };

    watch(locale, () => {
      visibleColumns.value.forEach((col: any) => {
        console.log("myvisiblecolumns", col.title);
        if (col.title === "Status") {
          col["filters"] = [
            { text: t("commonData.Active", "Active"), value: "ACTIVE" },
            { text: t("commonData.Inactive", "Inactive"), value: "INACTIVE" },
          ];
        }
        col["filterMultiple"] = false;
        // delete col.onFilter;
      });
    });

    const updateProcessedData = () => {
      processedData.value = processData(dataSource.value, columns.value);
    };

    watch(
      () => props.tableColumns,
      (newValue) => {
        columns.value = updateColumnsWithCustomCells(newValue);
        updateProcessedData();
        const token = localStorage.getItem("DecodedToken");
        userDetails.value = token ? JSON.parse(token).username : null;
        console.log("infoComments", infoCommentsPop);
      },
      { immediate: true }
    );

    watch(
      () => props.data,
      (newValue) => {
        dataSource.value = newValue;
        updateProcessedData();
      },
      { immediate: true }
    );

    const isActive = (record: any, column: any) => {
      if (column.page === "users") {
        return record.user__user___status !== "Inactive";
      } else if (column.page === "sites") {
        return record.status !== "Inactive";
      } else {
        return true;
      }
    };

    const isEditDisabled = (record: any, column: any) => {
      if (column?.page === "users") {
        if (
          record.username === userDetails.value ||
          record.user__user___status === "Inactive"
        ) {
          return true;
        }
      } else if (column?.page === "sites") {
        if (record.status === "Inactive" || record.id === 1) {
          return true;
        } else {
          return false;
        }
      }
    };
    const customLocale = computed(() => ({
      filterConfirm: t("commonData.OK", "OK"),
      filterReset: t("commonData.Reset", "Reset"),
    }));
    onMounted(() => {
      const token = localStorage.getItem("DecodedToken");
      userDetails.value = token ? JSON.parse(token).username : null;
      emit("filterChange", []);
    });

    return {
      columns,
      visibleColumns,
      dataSource,
      usermodalVisible,
      sitemodalVisible,
      editSiteRecord,
      modalUserContent,
      modalSiteContent,
      closeModal,
      processedData,
      handlers,
      toggleRecord,
      toggleChecked,
      toggleHandler,
      InfoCircleOutlined,
      infoCommentsPop,
      toggleUserStatus,
      editUserRecord,
      EditOutlined,
      userDetails,
      toggleSiteStatus,
      handleEditClick,
      isEditDisabled,
      isActive,
      userEditSubmitted,
      siteEditSubmitted,
      internalLoading,
      tooltipTitle,
      translateLabel,
      t,
      customLocale,
      convertTimesZoneAbb,
    };
  },
});
</script>
<style scoped>
.ant-switch-checked {
  background-color: #52c41a !important;
  border-color: #52c41a !important;
  /* width: 79px; */
  min-width: 79px;
  width: auto;
}

.ant-switch {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}
.ant-switch:hover:not(.ant-switch-disabled) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.custom-table .ant-table-column-title {
  flex: none !important;
}
.custom-table th .ant-table-cell {
  display: flex !important;
  justify-content: left !important;
  text-align: start;
}
th .ant-table-cell {
  display: flex !important;
}
.data-class {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}
</style>
