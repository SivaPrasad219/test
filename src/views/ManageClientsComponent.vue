<template>
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
        <a-button type="primary" @click="showAddClientModal">
          {{ t(`commonData.Add Client`, "Add Client") }}
        </a-button>
      </a-col>
    </a-row>
    <TableComponent
      v-if="
        task.visible && task.taskName === 'renderTable' && task.table?.columns
      "
      :tableColumns="task.table.columns"
      :data="tableData"
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
  <ManageClientModal
    :open="isModalVisible"
    @close="closeModal"
    @userSubmitted="handleUserSubmitted"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import superadminjsonData from "../mockdata/superadmin.json";
import SearchComponent from "../components/SearchComponent.vue";
import TableComponent from "../components/TableComponent.vue";
import { fetchDataFromAPI } from "../services/apiService";
import { JsonData, ApiResponse } from "../common/types";
import ManageClientModal from "./ManageClientModal.vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
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
const managePageHeader = ref<Array<{ field: string; header: string }>>([]);
let tableHeaders = "";
let limit = 2000;
let translatedDropdownOptions = ref<any[]>([]);
const searchKeyMapping = ref<{ [key: string]: string }>({});

const closeModal = () => {
  isModalVisible.value = false;
};

const getJsonFileLoaded = () => {
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
};
const setTableHeaders = (
  columns: Array<{ dataIndex: string; title: string }>
) => {
  const headers = columns
    .filter(
      (column) => !(column.title === "Edit" && column.dataIndex === "edit")
    )
    .map((column) => ({
      field: column.dataIndex,
      header: column.title,
    }));

  managePageHeader.value = headers;
  tableHeaders = JSON.stringify(headers);
  console.log("deviceDataHeader:::::::", managePageHeader.value);
};
const fetchData = async (taskData: any, exportType?: any) => {
  try {
    if (taskData.taskName === "renderTable" && taskData.table?.api) {
      const params: any = {
        page: currentPage.value,
        limit: taskData.table.defaultLimit,
        ...(searchKey.value && searchTerm.value
          ? { [searchKey.value]: searchTerm.value }
          : {}),
      };

      if (exportType !== undefined) {
        setTableHeaders(taskData.table.columns);
        params.exportType = exportType;
        params.fileName = fileName.value;
        params.locale = locale.value;
        params.tableHeaders = encodeURIComponent(tableHeaders);
        params.limit = limit;
        // delete params.limit;
        delete params.page;
        const searchHeaders: any = {};
        if (searchKey.value && searchTerm.value) {
          const searchedKeyFor =
            searchKeyMapping.value[searchKey.value] || searchKey.value;
          searchHeaders["searchKey"] = searchedKeyFor;
          searchHeaders["searchValue"] = searchTerm.value;
          let searchCSVHeaders = JSON.stringify([searchHeaders]);
          params.searchHeaders = encodeURIComponent(searchCSVHeaders);
        }
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

      tableData.value = response.data;
      console.log(":::::::::tableData.value", tableData.value);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
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
const performSearch = async (values: {
  selectedKey: string;
  searchQuery: string;
}) => {
  isTableLoading.value = true;
  searchKey.value = values.selectedKey;
  searchTerm.value = values.searchQuery.trim();
  currentPage.value = 1;
  await fetchData(
    jsonData.value.tasks.find((t) => t.taskName === "renderTable")
  );
  isTableLoading.value = false;
};
const shouldResetSearchComponent = async () => {
  searchKey.value = null;
  searchTerm.value = null;
  currentPage.value = 1;
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  await fetchData(tableTask);
  return true;
};
const showAddClientModal = () => {
  isModalVisible.value = true;
};
onMounted(async () => {
  jsonData.value = superadminjsonData;
  console.log("jsonData.value", jsonData.value);
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  getJsonFileLoaded();
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  }
});
</script>
