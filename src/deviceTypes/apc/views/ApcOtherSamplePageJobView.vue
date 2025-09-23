<template>
  <div>
    <div>
      <a-row class="pb-4">
        <a-col :span="24">
          <SearchComponent
            :dropdownOptions="dataDropdownOptions"
            @search="performSearch"
            @reset="shouldResetSearchComponent"
            @exportType="exportDataByType"
            :isExportTypeLoading="isExportTypeLoading"
          />
        </a-col>
      </a-row>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="false"
        :loading="isLoading"
        class="data-table custom-table"
        size="middle"
        :scroll="{ x: 'max-content' }"
        :customRow="customRow"
      >
        <template #headerCell="{ column }">
          <span>
            <ReloadOutlined
              v-if="column.title === 'Sample Status'"
              class="refreshIcon"
              @click="refreshDataPage"
            />
            {{ column.title }}
            <a-popover trigger="hover" placement="topLeft">
              <template #content>
                <template
                  v-if="typeof InfoCommentsData.data[column.title] === 'string'"
                >
                  <div style="color: black; max-width: 350px">
                    {{ InfoCommentsData.data[column.title] }}
                  </div>
                </template>
                <template v-else-if="InfoCommentsData.data[column.title]?.data">
                  <a-list
                    size="middle"
                    bordered
                    :data-source="InfoCommentsData.data[column.title].data"
                    style="
                      max-width: 500px;
                      max-height: 300px;
                      overflow-y: auto;
                    "
                  >
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <div class="flex-container">
                          <span
                            style="color: black; font-weight: bold; width: 35%"
                            >{{ item.name }} -</span
                          >
                          <span style="width: 65%">{{ item.value }}</span>
                        </div>
                      </a-list-item>
                    </template>
                    <template #header>
                      <div style="color: black; font-weight: bold">
                        {{ InfoCommentsData.data[column.title].head }}
                      </div>
                    </template>
                  </a-list>
                </template>
              </template>
              <InfoCircleOutlined />
            </a-popover>
          </span>
        </template>
        <template #emptyText>
          <div class="no-data-available">
            {{ t("dataPage.No data available", "No data available") }}
          </div>
        </template>
      </a-table>

      <a-row class="light-gray-bg py-2">
        <a-col :span="24" class="text-right">
          <a-pagination
            v-model:current="currentPage"
            :total="paginationTotalCount"
            @change="handlePageChange"
            :show-size-changer="false"
            :defaultPageSize="10"
          />
        </a-col>
      </a-row>
    </div>

    <a-modal
      v-model:open="modalVisible"
      width="55%"
      height="60%"
      style="top: 20px"
      class="data-modal-popup"
    >
      <template #title>
        <div class="modal-header">
          <div class="recordTitle">
            <div v-if="modalStatus === 'Completed'">
              {{ modalTitle }}
            </div>
          </div>
          <div :class="'recordStatus ' + modalStatus.toLowerCase()">
            {{ t(`dataPage.${modalStatus}`, `${modalStatus}`) }}
          </div>
        </div>
      </template>
      <hr />

      <div class="measure-popup-content">
        <ApcExternalSamplePopUp v-if="modalData" :data="modalData" />
      </div>
      <hr />
      <template #footer>
        <ConfirmLogin
          :data="modalData"
          @back="closeModal"
          @confirmed="handleConfirmation"
        />
      </template>
    </a-modal>

    <esign-verify-modal
      :open="isModalVisible"
      @update:open="isModalVisible = $event"
      :data="connectionData"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  reactive,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import SearchComponent from "../components/ApcSearchComponent.vue";
import externalJsonData from "../config/apcExternalPageJob.json";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { SocketService } from "@/services/socketService";
import { generateExportTypeParams } from "@/common/utils";
import infoComments from "@/common/constants.json";
import { ReloadOutlined } from "@ant-design/icons-vue";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import ApcExternalSamplePopUp from "../components/ApcExternalSamplePopUp.vue";
import ConfirmLogin from "@/common/ConfirmLogin.vue";
import { apcApiServices } from "../services/apcService";
import exportFile from "@/services/exportFile";
import esignVerifyModal from "@/components/esignVerifyModal.vue";
import { environment } from "@/environment/environment";

// interface Column {
//   title: string;
//   dataIndex: string;
//   width?: string;
//   customCell?: (record: any) => { style: any; onClick: () => void };
// }

export default defineComponent({
  components: {
    SearchComponent,
    InfoCircleOutlined,
    ApcExternalSamplePopUp,
    ConfirmLogin,
    ReloadOutlined,
    esignVerifyModal,
  },
  setup() {
    const apcService = new apcApiServices();
    const modalTitle = ref("");
    const modalStatus = ref("");
    const modalData = ref(null);
    const modalTaskResult = ref(null);
    const paginationTotalCount = ref(10);
    const modalVisible = ref(false);
    const isExportTypeLoading = ref(false);
    const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");
    const router = useRouter();
    const route = useRoute();

    const store = useStore();
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);

    const InfoCommentsData = infoComments;
    const isLoading = ref(false);
    // const columns = ref<Column[]>(externalJsonData.columns);
    const loggedRole = ref<string>("");

    let searchKey: string | null = null;
    let searchTerm: string | null = null;
    const tableData = ref<any[]>([]);
    const currentPage = ref<number>(1);
    let connectionData: any = reactive({});
    socketService.connectSocket();
    const searchKeyMapping = ref<{ [key: string]: string }>({});
    const { t, locale } = useI18n();

    // Track subscribed rooms

    const listConfig = ref([
      { label: "Task Result Id", value: "taskResultId", order: 2 },
      { label: "Created Time", value: "createdTime", order: 4 },
    ]);
    const isModalVisible = ref(false);
    const searchDropdownOptions = ref(externalJsonData.dropdownOptions);
    const dataDropdownOptions = computed(() => {
      return searchDropdownOptions.value.map((eachColumn: any) => {
        return {
          ...eachColumn,
          label: eachColumn.label,
        };
      });
    });
    const closeModal = () => {
      modalVisible.value = false;
      isModalVisible.value = false;

      if (router && route) {
        router.replace({ path: route.path, query: {} });
      } else {
        console.error("Router instance or route instance is not available.");
      }
    };

    const customRow = (record: any) => {
      return {
        onClick: () => openPop(record),
      };
    };
    const getUserRole = () => {
      const decodedToken = localStorage.getItem("DecodedToken");
      const storedToken = decodedToken ? JSON.parse(decodedToken) : {};
      loggedRole.value = storedToken.role || "";
    };

    const showActionButtons = computed(() => {
      return !["auditor", "tester", "administrator"].includes(loggedRole.value);
    });

    const getCellStyle = (columnTitle: string, record: any) => {
      if (columnTitle === t("dataPage.Sample Status", "Sample Status")) {
        switch (record.status) {
          case "Reviewed":
          case "Confirmed":
          case "viewed":
          case "success":
            return {
              backgroundColor: "#94e498",
              textAlign: "center",
              cursor: "pointer",
            };
          case "error":
          case "Aborted":
          case "Failed":
          case "Suspended":
          case "Force-Dropped":
            return {
              backgroundColor: "#e89b96",
              textAlign: "center",
              cursor: "pointer",
            };
          case "Complete":
          case "Completed":
            return {
              backgroundColor: "#ecc699",
              textAlign: "center",
              cursor: "pointer",
            };
          case "ready":
            return {
              backgroundColor: "rgb(73, 162, 235)",
              textAlign: "center",
              cursor: "pointer",
            };
          case "Synced":
            return {
              backgroundColor: "rgb(148, 228, 152)",
              textAlign: "center",
              cursor: "pointer",
            };
          case "Active":
            return {
              backgroundColor: "#f6e3ce",
              textAlign: "center",
              cursor: "pointer",
            };
          case "New":
            return {
              backgroundColor: "#c9c9c9",
              textAlign: "center",
              cursor: "pointer",
            };
          case "In-Progress":
          case "In Progress": // Handle both variants
          case "Force-Dropping":
            if (record.connectionStatus === "disconnected") {
              return {
                backgroundColor: "#e89b96",
                textAlign: "center",
                cursor: "pointer",
              };
            } else if (record.connectionStatus === "connected") {
              return {
                backgroundColor: "#94d2de",
                textAlign: "center",
                cursor: "pointer",
              };
            }
            break;
          default:
            return { textAlign: "center", cursor: "pointer" };
        }
      }
      return {};
    };

    const openPop = async (record: any) => {
      console.log(":::: record ::::", record);
      modalTitle.value = t(
        "dataPage.E-Signature Needed to Confirm Sample",
        "E-Signature Needed to Confirm Sample"
      );

      const params: { [key: string]: any } = {
        id: record.id,
      };
      try {
        const taskResultData = await apcService.getExternalSampleData(params);
        if (taskResultData) {
          // modalTaskResult.value = taskResultData;
          modalData.value = taskResultData.data[0];
          modalStatus.value = record?.status || taskResultData.data[0]?.status;
          modalVisible.value = true;

          console.log("Task Result Data:", taskResultData.data[0]);
        } else {
          console.error(
            `No task result data found for task_id: ${record.task_id}`
          );
          notification.error({
            // message: `No task result data found`,
            message: `${t(
              "notificationPage.No task result data found",
              "No task result data found"
            )}`,
            description: `No data found for task_id: ${record.task_id}`,
          });
        }
      } catch (error: any) {
        console.error("Error fetching data from API:", error);
        notification.error({
          // message: "Error fetching data from API",
          message: `${t(
            "notificationPage.Error fetching data from API",
            "Error fetching data from API"
          )}`,
          description: error.message,
        });
      }
    };

    // const openDeviceActionData = async () => {
    //   const taskId = route.query.task_id as string;
    //   if (taskId) {
    //     // Construct a complete record object
    //     const record = {
    //       task_id: taskId,
    //     };
    //     console.log("Constructed record:", record);
    //     await openPop(record);
    //   } else {
    //     console.error("No task_id found in route query parameters.");
    //   }
    // };

    const dataPageHeaders = () => {
      let devicePageHeader: any = [];
      columns.value.forEach((column) => {
        devicePageHeader.push({
          field: column.dataIndex,
          header: column.title,
        });
      });
      devicePageHeader = devicePageHeader.filter(
        (item: any) => item.header !== "Exception"
      );
      devicePageHeader.push(
        { field: "volume", header: "Volume" },
        { field: "operator", header: "User" },
        { field: "cumulative", header: "Cumulative Data" },
        { field: "differential", header: "Differential Data" },
        { field: "model_name", header: "Model" },
        { field: "serial_number", header: "Serial #" },
        { field: "last_calibration_date", header: "Last Calibration Date" },
        { field: "next_calibration_date", header: "Next Calibration Date" },
        { field: "firmware_version", header: "Firmware" },
        { field: "site_name", header: "Site" },
        { field: "comments", header: "Comment(s)" }
      );
      return devicePageHeader;
    };

    const fetchData = async (page: number) => {
      isLoading.value = true;
      const params: { [key: string]: any } = {
        to_show: true,
        orderBy: "id",
        limit: 10,
        page: page,
        strict: "no",
      };
      if (searchKey && searchTerm) {
        params[searchKey] = searchTerm.trim();
      }
      try {
        const response = await apcService.getExternalSampleData(params);
        paginationTotalCount.value = response.pagination?.totalCount;
        response.data.forEach((each: any) => {
          each.status = "Completed";
        });
        tableData.value = response.data;
        columns.value.forEach((column: any) => {
          if (column.title === t("dataPage.Sample Status", "Sample Status")) {
            column["customCell"] = (record: any) => ({
              style: getCellStyle(
                t("dataPage.Sample Status", "Sample Status"),
                record
              ),
            });
          }
        });
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        isLoading.value = false;
      }
    };

    const performSearch = async (values: {
      selectedKey: string;
      searchQuery: string;
    }) => {
      isLoading.value = true;
      searchKey = values.selectedKey;
      searchTerm = values.searchQuery;
      currentPage.value = 1;
      fetchData(currentPage.value);
    };

    const exportDataByType = async (dataType: string) => {
      isExportTypeLoading.value = true;
      const params: { [key: string]: any } = {
        to_show: true,
        orderBy: "id",
        locale: locale.value,
        // page: currentPage.value,
        strict: "no",
      };
      const dataHeaders = dataPageHeaders();
      if (searchTerm && searchTerm.trim() !== "") {
        params[`${searchKey}`] = searchTerm;
      }
      console.log(":::: export params ::::", params, searchTerm);

      const exportParams = generateExportTypeParams(
        searchKey,
        searchTerm,
        dataType,
        dataHeaders
      );
      exportParams.fileName = "Other Sample";
      const dataParams = { ...params, ...exportParams };
      console.log("exportParams", dataParams);
      try {
        const data = await apcService.getExternalSampleData(dataParams);
        exportFile(data, "data_page", dataType);
      } catch (error) {
        console.error("Error exporting data:", error);
      } finally {
        isLoading.value = false;
        isExportTypeLoading.value = false;
      }
    };

    const shouldResetSearchComponent = async () => {
      searchKey = null;
      searchTerm = null;
      currentPage.value = 1;
      fetchData(currentPage.value);
      return true;
    };

    const handlePageChange = async (page: number) => {
      currentPage.value = page;
      fetchData(currentPage.value);
    };

    const handleConfirmation = () => {
      console.log("Handling confirmation...");
      fetchData(currentPage.value);
    };

    const refreshDataPage = async () => {
      console.log("::::::;refreshDatapage");
      currentPage.value = 1;
      fetchData(currentPage.value);
    };

    const openAbortModal = (record: any, actionType: any, event: any) => {
      event.stopPropagation();
      isModalVisible.value = true;
      connectionData.value = { ...record, action: actionType };
    };

    const openForceDropModal = (record: any, actionType: any, event: any) => {
      event.stopPropagation();
      isModalVisible.value = true;
      connectionData.value = { ...record, action: actionType };
    };

    watch(isModalVisible, async (newValue) => {
      console.log("::: watch isMeasureModalVisible", newValue);
      if (newValue === false) {
        await fetchData(currentPage.value);
      }
    });

    // const setupWatchers = () => {
    //   for (let i = 0; i < tableData.value.length; i++) {
    //     const item = tableData.value[i];
    //     watch(
    //       () => [item.actionStatus, item.isSampling],
    //       (
    //         [newActionStatus, newIsSampling],
    //         [oldActionStatus, oldIsSampling]
    //       ) => {
    //         console.log(
    //           ":::: watch :::: newActionStatus ::: oldActionStatus",
    //           newActionStatus,
    //           oldActionStatus
    //         );
    //         console.log(
    //           ":::: watch :::: newIsSampling ::: oldIsSampling",
    //           newIsSampling,
    //           oldIsSampling
    //         );
    //         if (
    //           newActionStatus !== oldActionStatus ||
    //           newIsSampling !== oldIsSampling
    //         ) {
    //           fetchData(currentPage.value);
    //           return;
    //         }
    //       }
    //     );
    //   }
    // };

    watch(locale, () => {
      columns.value.map((eachColumn: any) => {
        if (eachColumn.title === t("dataPage.Sample Status", "Sample Status")) {
          eachColumn["customCell"] = (record: any) => ({
            style: getCellStyle(
              t("dataPage.Sample Status", "Sample Status"),
              record
            ),
            // onClick: () => openPop(record),
          });
        }
      });
    });
    const localizedTitles = computed(() => ({
      sampleStatus: t("dataPage.Sample Status", "Sample Status"),
      fileName: t("dataPage.File Name", "File Name"),
      operator: t("dataPage.Operator", "Operator"),
      createdBy: t("dataPage.Created By", "Created By"),
    }));
    const columns = computed(() => [
      {
        title: localizedTitles.value.sampleStatus,
        dataIndex: "status",
        width: 70,
      },
      { title: localizedTitles.value.fileName, dataIndex: "file_name" },
      { title: localizedTitles.value.operator, dataIndex: "operator" },
      { title: localizedTitles.value.createdBy, dataIndex: "createdBy" },
    ]);

    onMounted(async () => {
      getUserRole();
      fetchData(currentPage.value);
    });

    // onUnmounted(() => {
    //   // Unsubscribe from all rooms
    //   subscribedDeviceIds.value.forEach((deviceId) => {
    //     socketService.leaveRooms([
    //       `instrument/apc/${deviceId}/heartbeats/basic`,
    //     ]);
    //   });
    //   subscribedDeviceIds.value.clear();
    // });

    return {
      deviceTypeId,
      tableData,
      currentPage,
      modalVisible,
      modalTitle,
      modalStatus,
      modalData,
      modalTaskResult,
      columns,
      InfoCommentsData,
      performSearch,
      closeModal,
      refreshDataPage,
      shouldResetSearchComponent,
      handlePageChange,
      handleConfirmation,
      exportDataByType,
      searchKeyMapping,
      listConfig,
      isLoading,
      getCellStyle,
      openPop,
      dataDropdownOptions,
      paginationTotalCount,
      isExportTypeLoading,
      customRow,
      isModalVisible,
      openForceDropModal,
      openAbortModal,
      connectionData,
      showActionButtons,
      t,
    };
  },
});
</script>

<style scoped>
.viewed,
.viewed:hover {
  background-color: rgb(82, 251, 101) !important;
  cursor: pointer;
}

.ready,
.ready:hover {
  background-color: rgb(73, 162, 235) !important;
}

.error,
.error:hover {
  background-color: #f8e0e6 !important;
}

.completed,
.completed:hover {
  background-color: #ecc699 !important;
}

.confirmed,
.confirmed:hover {
  background-color: #ced8f6 !important;
}

.active,
.active:hover {
  background-color: #f6e3ce !important;
  cursor: pointer;
}

.new,
.new:hover {
  background-color: #c9c9c9 !important;
}

.failed,
.failed:hover {
  background-color: #fd9494 !important;
}

.force-dropped,
.Force-Dropped:hover {
  background-color: #fd9494 !important;
}

.force-dropping,
.Force-Dropping:hover {
  background-color: #fd9494 !important;
}

.aborted,
.aborted:hover {
  background-color: #fd9494 !important;
}

.suspended,
.suspended:hover {
  background-color: #e89b96 !important;
}

.loaderData {
  text-align: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 20px;
  padding: 30px 50px;
  margin: 20px 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
}

hr {
  margin: 0;
}

.data-table .ant-table-tbody > tr {
  background-color: rgba(242, 242, 242, 1);
}

.data-table .ant-table-tbody > tr > td {
  border-bottom: 1px solid #e8e8e8 !important;
}

.data-table .ant-table-tbody > tr:hover td:not(:first-child) {
  background-color: aliceblue !important;
}

.data-table {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.recordTitle {
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  height: 48px;
  color: black;
  font-size: 18px;
  padding-left: 0px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
}

.recordStatus {
  margin-right: 50px;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  width: 150px;
  height: 48px;
  color: black;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-size: 14px;

  &.active {
    background-color: #f6e3ce !important;
  }

  &.new {
    background-color: #c9c9c9 !important;
  }

  &.failed {
    background-color: #e89b96 !important;
  }

  &.reviewed {
    background-color: #94e498 !important;
  }

  &.completed {
    background-color: #ecc699 !important;
  }

  &.in-progress {
    background-color: #94d2de !important;
  }

  &.synced {
    background-color: #94e498 !important;
  }

  &.aborted {
    background-color: #e89b96 !important;
  }

  &.force-dropped {
    background-color: #e89b96 !important;
  }

  &.force-dropping {
    background-color: #e89b96 !important;
  }

  &.suspended {
    background-color: #fd9494 !important;
  }
}
</style>

<style>
.data-modal-popup .ant-modal-content {
  font-family: Montserrat-Regular, sans-serif;
  padding: 0 24px !important;
  border-radius: 3px !important;
}

.data-modal-popup .ant-modal-header {
  margin-bottom: 0;
}

.data-modal-popup .measure-popup-content {
  padding: 0 8px;
  height: 50vh;
  overflow-y: auto;
}

.refreshIcon {
  font-size: 14px;
  color: #00bceb;
  margin: 0 5px;
}
</style>
