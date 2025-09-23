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
      <a-col :span="24">
        <SearchComponent
          :dropdownOptions="task.search.dropdownOptions"
          @search="performSearch"
          :reset="shouldResetSearchComponent"
        />
      </a-col>
    </a-row>

    <TableComponent
      v-if="
        task.visible && task.taskName === 'renderTable' && task.table?.columns
      "
      :tableColumns="task.table.columns"
      :data="tableData"
      @selectedTableRecord="handleSelectedTableRowClick"
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
            jsonData.tasks.find((t:any) => t.taskName === 'renderTable')?.table
              ?.defaultLimit
          "
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import SearchComponent from "../components/SearchComponent.vue";
import TableComponent from "../components/TableComponent.vue";
import { fetchDataFromAPI } from "../services/apiService";
import { JsonData, ApiResponse } from "../common/types"; // Assuming you have a types file with the JsonData type defined
import auditJsonData from "../mockdata/auditSearchableJobView.json";
import dataJsonData from "../mockdata/dataSearchableJobView.json";

// Define global defaults
const tableData = ref<ApiResponse[]>([]);
const currentPage = ref<number>(1);
let searchKey: string | undefined;
let searchTerm: string | undefined;
const jsonData = ref<JsonData>({ tasks: [] });
const shouldResetSearchComponent = ref(false); // Add shouldResetSearchComponent

const fetchData = async (taskData: any) => {
  try {
    if (taskData.taskName === "renderTable" && taskData.table?.api) {
      const params = {
        page: currentPage.value,
        orderBy: taskData.table.defaultOrderBy,
        limit: taskData.table.defaultLimit,
        strict: taskData.table.defaultStrict,
        ...(searchKey && searchTerm ? { [searchKey]: searchTerm } : {}),
      };
      const response = await fetchDataFromAPI(
        taskData.table.api.url,
        "GET",
        params,
        taskData.table.api.authToken,
        taskData.table.api.clientId
      );

      const paginationTask = jsonData.value.tasks.find(
        (t) => t.taskName === "renderPagination"
      );
      if (paginationTask && paginationTask.pagination) {
        paginationTask.pagination.totalCount = response.pagination.totalCount;
      } else {
        console.error("Pagination task or pagination property is undefined");
      }

      tableData.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const performSearch = async (values: {
  selectedKey: string;
  searchQuery: string;
}) => {
  searchKey = values.selectedKey;
  searchTerm = values.searchQuery.trim();
  currentPage.value = 1;
  shouldResetSearchComponent.value = false; // Reset the search component
  await fetchData(
    jsonData.value.tasks.find((t) => t.taskName === "renderTable")
  );
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;

  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  } else {
    console.error("Table task or table property is undefined");
  }
};
const handleSelectedTableRowClick = (record: any) => {
  console.log("Audit page handleSelectedTableRowClick", record);
};

// Fetch data initially based on the route
onMounted(async () => {
  const router = useRouter();
  const path = router.currentRoute.value.path;
  if (path === "/apc/audit") {
    jsonData.value = auditJsonData;
  } else if (path === "/apc/data") {
    jsonData.value = dataJsonData;
  }

  // Fetch data initially
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask) {
    await fetchData(tableTask);
  }
});

// Listen to route changes
const router = useRouter();
router.beforeEach(async (to, from, next) => {
  // Reset search and pagination when route changes
  searchKey = undefined;
  searchTerm = undefined;
  currentPage.value = 1;
  shouldResetSearchComponent.value = true; // Reset the search component

  if (to.path === "/apc/audit") {
    jsonData.value = auditJsonData;
  } else if (to.path === "/apc/data") {
    jsonData.value = dataJsonData;
  }
  // Fetch data initially
  const tableTask = jsonData.value.tasks.find(
    (t) => t.taskName === "renderTable"
  );
  if (tableTask) {
    await fetchData(tableTask);
  }
  next();
});
</script>
