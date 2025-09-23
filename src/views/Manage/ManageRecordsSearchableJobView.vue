<template>
  <a-tabs v-model:activeKey="activeKey" @change="onTabChange">
    <a-tab-pane key="manage-user">
      <template #tab>
        <span>
          <UserOutlined />
          {{ t(`commonData.Manage Users`, "Manage Users") }}
          <a-popover trigger="hover" placement="topLeft">
            <template #content>
              <div style="color: black; max-width: 350px">
                {{ t("commonData.manageUsersContent", "manageUsersContent") }}
              </div>
            </template>
            <InfoCircleOutlined />
          </a-popover>
        </span>
      </template>
    </a-tab-pane>
    <a-tab-pane key="manage-site">
      <template #tab>
        <span>
          <GlobalOutlined />
          {{ t(`commonData.Manage Sites`, "Manage Sites") }}
          <a-popover trigger="hover" placement="topLeft">
            <template #content>
              <div style="color: black; max-width: 350px">
                {{ t("commonData.manageSitesContent", "manageSitesContent") }}
              </div>
            </template>
            <InfoCircleOutlined />
          </a-popover>
        </span>
      </template>
    </a-tab-pane>
  </a-tabs>

  <div v-for="task in jsonData.tasks" :key="task.taskID">
    <a-row
      class="pb-4"
      v-if="
        task.visible &&
        task.taskName === 'renderSearch' &&
        task.search?.dropdownOptions
      "
    >
      <a-col :span="20">
        <SearchComponent
          :dropdownOptions="translatedDropdownOptions"
          :selectedKey="selectedKey"
          @search="performSearch"
          @reset="shouldResetSearchComponent"
          @exportType="exportDataByType"
          :isExportTypeLoading="isExportTypeLoading"
        />
      </a-col>
      <a-col :span="2" class="text-right">
        <!-- Conditionally display the button based on the active tab -->
        <a-button
          v-if="activeKey === 'manage-user'"
          type="primary"
          @click="showAddUserModal"
        >
          {{ t(`commonData.Add User`, "Add User") }}
        </a-button>
        <a-button
          v-if="activeKey === 'manage-site'"
          type="primary"
          @click="showAddSiteModal"
        >
          {{ t(`commonData.Add Site`, "Add Site") }}
        </a-button>
      </a-col>
    </a-row>

    <TableComponent
      v-if="
        task.visible && task.taskName === 'renderTable' && task.table?.columns
      "
      :tableColumns="task.table.columns"
      :data="tableData"
      @selectedTableRecord="handleSelectedTableRowClick"
      :isUserTable="true"
      :isSiteTable="true"
      :isTableLoading="isTableLoading"
      @userEdited="handleUserSubmitted"
      @siteEdited="handleSiteSubmitted"
      @filterChange="onFilterChange"
    />
    <!-- show pagination  -->
    <a-row
      v-if="
        task.visible &&
        task.taskName === 'renderPagination' &&
        task.pagination?.totalCount !== undefined
      "
      class="light-gray-bg py-2"
    >
      <a-col :span="24" class="text-right">
        <a-pagination
          v-model:current="currentPage"
          :total="task.pagination.totalCount"
          @change="handlePageChange"
          :show-size-changer="false"
          :defaultPageSize="
            jsonData.tasks.find((t) => t.taskName === 'renderTable')?.table
              ?.defaultLimit
          "
        />
      </a-col>
    </a-row>
  </div>
  <ManageUserModal
    :open="isModalVisible"
    :data="{}"
    @close="closeModal"
    @userSubmitted="handleUserSubmitted"
  />
  <ManageSiteModel
    :open="isModalSiteVisible"
    @close="closeModal"
    @submit="handleSiteSubmitted"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import SearchComponent from "../../components/SearchComponent.vue";
import TableComponent from "../../components/TableComponent.vue";
import { fetchDataFromAPI } from "../../services/apiService";
import { JsonData, ApiResponse } from "../../common/types";
import manageUserJsonData from "../../mockdata/manageUser.json";
import manageSiteJsonData from "../../mockdata/manageSite.json";
import { message } from "ant-design-vue";
import {
  GlobalOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import ManageUserModal from "./ManageUserModal.vue";
import ManageSiteModel from "./ManageSiteModel.vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

// Define global defaults
const tableData = ref<ApiResponse[]>([]);
const isTableLoading = ref(false);
const currentPage = ref<number>(1);
const searchKey = ref<string | null>(null);
const searchTerm = ref<string | null>(null);
const selectedKey = ref<string>("");
const filteredInfo = ref(null);
const isExportTypeLoading = ref(false);
const jsonData = ref<JsonData>({ tasks: [] });
const activeKey = ref("manage-user");
const isModalVisible = ref(false);
const isModalSiteVisible = ref(false);
const fileName = ref<string>("manage_user_page");
const searchDropdownOptions = ref([]);
const pageTotalCount = ref();
let limit = 2000;
let translatedDropdownOptions = ref<any[]>([]);
const isActiveFilter = ref<any>(null);

const filteredValue = ref(null);
const managePageHeader = ref<Array<{ field: string; header: string }>>([]);
let tableHeaders = "";

const searchKeyMapping = ref<{ [key: string]: string }>({});

const setTableHeaders = (
  columns: Array<{ dataIndex: string; title: string }>
) => {
  const headers = columns
    .filter(
      (column) => !(column.title === "Edit" && column.dataIndex === "edit")
    )
    .map((column) => {
      const field = column.dataIndex;
      console.log("dataIndex:", column.dataIndex, "→ field:", field);

      return {
        field,
        header: column.title,
      };
    });

  managePageHeader.value = headers;
  tableHeaders = JSON.stringify(headers);
};

const fetchData = async (taskData: any, exportType?: any) => {
  try {
    if (taskData.taskName === "renderTable" && taskData.table?.api) {
      const params: any = {
        page: currentPage.value,
        limit: taskData.table.defaultLimit,
        ...(!filteredValue.value
          ? { strict: taskData.table.defaultStrict }
          : {}),
        ...(searchKey.value && searchTerm.value
          ? { [searchKey.value]: searchTerm.value }
          : {}),
        ...(filteredValue.value ? { status: filteredValue.value } : {}),
      };

      console.log(
        ":::::isActiveFilter",
        isActiveFilter.value,
        filteredValue.value
      );

      if (exportType !== undefined) {
        await setTableHeaders(taskData.table.columns);
        params.exportType = exportType;
        params.fileName = fileName.value;
        params.locale = locale.value;
        params.tableHeaders = encodeURIComponent(tableHeaders);
        params.limit = limit;
        // delete params.limit;
        delete params.page;
        const searchHeaders: Record<string, any> = [];
        console.log("apc device page", searchKey, searchTerm);
        if (searchKey.value && searchTerm.value) {
          const searchedKeyFor =
            searchKeyMapping.value[searchKey.value] || searchKey.value;
          searchHeaders.push({
            [searchedKeyFor]: searchTerm.value,
          });
        }

        if (isActiveFilter.value !== null) {
          console.log("filter value", isActiveFilter.value);
          searchHeaders.push({
            Status: isActiveFilter.value ? "Active" : "Inactive",
          });
        }
        if (searchHeaders.length > 0) {
          const searchCSVHeaders = JSON.stringify(searchHeaders);
          params.searchHeaders = encodeURIComponent(searchCSVHeaders);
        }

        console.log("::::::params.searchHeaders data", params.searchHeaders);
        console.log(
          "::::::params.searchHeaders data",
          searchKey.value,
          searchTerm.value
        );
      }

      const response = await fetchDataFromAPI(
        taskData.table.api.url,
        "GET",
        params,
        undefined,
        fileName.value
      );

      const paginationTask = jsonData.value.tasks.find(
        (t) => t.taskName === "renderPagination"
      );
      if (paginationTask && paginationTask.pagination) {
        paginationTask.pagination.totalCount = response.pagination.totalCount;
        pageTotalCount.value = response.pagination.totalCount;
      } else {
        console.error("Pagination task or pagination property is undefined");
      }
      if (taskData.table.api.url === "/pm/user") {
        response.data.forEach((eachUser: any) => {
          eachUser.user__role___name =
            eachUser.user__role___name.charAt(0).toUpperCase() +
            eachUser.user__role___name.slice(1).toLowerCase();
        });
      }

      tableData.value = response.data;
      console.log(":::::::::tableData.value", tableData.value);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const performSearch = async (values: {
  selectedKey: string;
  searchQuery: string;
}) => {
  isTableLoading.value = true;
  searchKey.value = values.selectedKey;
  // Extract timezone from search query
  const match = values.searchQuery.match(/\(([^)]+)\)/); // Matches content inside parentheses
  searchTerm.value = match ? match[1].trim() : values.searchQuery.trim();
  console.log(
    ":: serach values for the manage site ::",
    searchKey.value,
    searchTerm.value
  );
  currentPage.value = 1;
  await fetchData(
    jsonData.value.tasks.find((t) => t.taskName === "renderTable")
  );
  isTableLoading.value = false;
};

const exportDataByType = async (dataType: any) => {
  isExportTypeLoading.value = true;
  await fetchData(
    jsonData.value.tasks.find((t: any) => t.taskName === "renderTable"),
    dataType
  );
  isExportTypeLoading.value = false;

  // if (pageTotalCount.value > limit) {
  //   message.info(
  //     `Total record count is ${pageTotalCount.value}. Exporting the latest ${limit} records only`
  //   );
  // }
  if (pageTotalCount.value > limit) {
    const messageText = t("constantsTranslate.ExportMessage", {
      total: pageTotalCount.value,
      limit: limit,
    });

    message.info(messageText);
  }
};
const arrangeFilters = (columns: any) => {
  columns.forEach((col: any) => {
    if (col.filters) {
      col.filteredValue = filteredInfo.value; // Set to null when filter is cleared, or to the selected filter value
    }
  });
  // Reset search-related values when arranging filters
  searchKey.value = null;
  searchTerm.value = null;
};
const shouldResetSearchComponent = async () => {
  searchKey.value = null;
  searchTerm.value = null;
  filteredValue.value = null;
  currentPage.value = 1;
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  isTableLoading.value = true;

  if (tableTask && tableTask.table) {
    tableTask.table.columns.forEach((col) => {
      if (col.title === "Status") {
        col["filters"] = [
          { text: t("commonData.Active", "Active"), value: "ACTIVE" },
          { text: t("commonData.Inactive", "Inactive"), value: "INACTIVE" },
        ];
      }
      col["filterMultiple"] = false;
      col["filteredValue"] = [];
      col["onFilter"] = (data: any) => {
        onFilterChange(data);
      };
      delete col.onFilter;
    });
    await fetchData(tableTask);
    isTableLoading.value = false;
  } else {
    console.log(":::: Not reseted");
    isTableLoading.value = false;
  }
  return true;
};

const handlePageChange = async (page: number) => {
  isTableLoading.value = true;
  currentPage.value = page;

  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  } else {
    console.error("Table task or table property is undefined");
  }
  isTableLoading.value = false;
};

const handleSelectedTableRowClick = (record: any) => {
  console.log("Audit page handleSelectedTableRowClick", record);
};

const showAddUserModal = () => {
  isModalVisible.value = true;
};

const showAddSiteModal = () => {
  isModalSiteVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  isModalSiteVisible.value = false;
};

const onTabChange = async (key: string) => {
  activeKey.value = key;
  isTableLoading.value = true;
  filteredValue.value = null;
  if (key === "manage-user") {
    jsonData.value = manageUserJsonData;
    fileName.value = "manage_user_page";
    await shouldResetSearchComponent();
  } else if (key === "manage-site") {
    jsonData.value = manageSiteJsonData;
    fileName.value = "manage_site_page";
    await shouldResetSearchComponent();
  } else {
    console.error("Table task or table property is undefined");
  }
  isTableLoading.value = false;
};
// Fetch search keys
// const fetchSearchKeys = async () => {
//   try {
//     const renderSearchTask = jsonData.value.tasks.find(
//       (task) => task.taskName === "renderSearch"
//     );

//     if (renderSearchTask && renderSearchTask.search) {
//       const dropdownOptions = renderSearchTask.search.dropdownOptions;
//       searchKeyMapping.value = dropdownOptions.reduce(
//         (acc: { [key: string]: string }, item: any) => {
//           acc[item.value] = item.label;
//           return acc;
//         },
//         {}
//       );
//     } else {
//       console.error("Render search task or dropdown options are undefined");
//     }
//   } catch (error) {
//     console.error("Error fetching search keys:", error);
//   }
// };

const onFilterChange = async (data: any) => {
  isTableLoading.value = true;
  console.log("filter values", data.user__user___status);
  if (data?.user__user___status) {
    filteredInfo.value = data.user__user___status;
    filteredValue.value = data.user__user___status[0];
    isActiveFilter.value = filteredValue.value === "ACTIVE";
  } else if (data?.status) {
    filteredInfo.value = data.status;
    filteredValue.value = data.status[0];
  } else {
    filteredInfo.value = null;
    filteredValue.value = null;
    searchKey.value = null;
    searchTerm.value = null;
    isActiveFilter.value = null;
  }

  console.log(
    "::::::: filtered values",
    filteredInfo.value,
    filteredValue.value
  );

  console.log(
    "::::::: filtered values search ",
    searchKey.value,
    searchTerm.value
  );
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask && tableTask.table) {
    arrangeFilters(tableTask.table.columns);
    currentPage.value = 1;
    await fetchData(tableTask);
    isTableLoading.value = false;
  }
};

// let jsonFileToRead: any;

const getJsonFileLoaded = () => {
  const tableTaskFromJson = jsonData.value.tasks.find(
    (t: any) => t.taskName === "renderTable"
  );

  const renderSearchTask: any = jsonData.value.tasks.find(
    (task: any) => task.taskName === "renderSearch"
  );
  // Make sure the dropdownOptions are correctly set
  if (
    renderSearchTask &&
    renderSearchTask.search &&
    renderSearchTask.search.dropdownOptions
  ) {
    searchDropdownOptions.value = renderSearchTask.search.dropdownOptions;
  }

  // Define computed property to translate dropdown options
  translatedDropdownOptions = computed(() => {
    return searchDropdownOptions.value.map((eachColumn: any) => {
      return {
        ...eachColumn,
        label: eachColumn.label,
      };
    });
  });
  if (tableTaskFromJson && tableTaskFromJson.table) {
    console.log("Current locale:", locale.value);
    tableTaskFromJson.table.columns.forEach((col: any) => {
      // Add filters to the "Status" column
      if (col.title === "Status") {
        col["filters"] = [
          { text: t("commonData.Active", "Active"), value: "ACTIVE" },
          { text: t("commonData.Inactive", "Inactive"), value: "INACTIVE" },
        ];
        col["filterMultiple"] = false;
        delete col.onFilter;
      }
      // col["translated"] = true;
    });
  }
};
watch(activeKey, async (newKey) => {
  if (newKey === "manage-user") {
    jsonData.value = { ...manageUserJsonData };
  } else if (newKey === "manage-site") {
    jsonData.value = { ...manageSiteJsonData };
  }
  getJsonFileLoaded();
});
const router = useRouter();
const path = router.currentRoute.value.path;
if (path === "/manage" && activeKey.value === "manage-user") {
  jsonData.value = { ...manageUserJsonData };
} else if (path === "/manage" && activeKey.value === "manage-site") {
  jsonData.value = { ...manageSiteJsonData };
}

// Fetch data initially based on the route
onMounted(async () => {
  // await fetchSearchKeys();

  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );

  // Add filters to the "Status" column
  if (tableTask && tableTask.table) {
    tableTask.table.columns.forEach((col) => {
      if (col.title === "Status") {
        col["filters"] = [
          { text: t("commonData.Active", "Active"), value: "ACTIVE" },
          { text: t("commonData.Inactive", "Inactive"), value: "INACTIVE" },
        ];
      }
      col["filterMultiple"] = false;
      delete col.onFilter;
    });
    setTableHeaders(tableTask.table.columns);
    getJsonFileLoaded();
    await fetchData(tableTask);
  }
});

const handleUserSubmitted = async (userData: any, userAction: any) => {
  isTableLoading.value = true;
  if (userAction === "create") currentPage.value = 1;
  console.log("User submitted:::::", userData);
  const tableTask: any = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  } else {
    console.error("Table task or table property is undefined");
  }
  isTableLoading.value = false;
};

// const handelUsereditSubmited = async () => {
//   const tableTask: any = jsonData.value.tasks.find(
//     (t) => t.taskName === "renderTable"
//   );
//   if (tableTask && tableTask.table) {
//     await fetchData(tableTask);
//   } else {
//     console.error("Table task or table property is undefined");
//   }
// };

const handleSiteSubmitted = async (sitePayload: any, userAction: any) => {
  if (userAction === "create") currentPage.value = 1;
  console.log("site submitted:::::", sitePayload);
  isTableLoading.value = true;
  const tableTask: any = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  } else {
    console.error("Table task or table property is undefined");
  }
  isTableLoading.value = false;
};
</script>
<style scoped>
::v-deep .ant-table-wrapper .ant-table-filter-column {
  justify-content: center !important;
}
</style>
