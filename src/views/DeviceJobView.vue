<template>
  <div class="device">
    <div class="row first-row-container">
      <div class="column-70">
        <div
          v-if="isRenderDeviceImage"
          style="width: 15%; display: inline-block"
        >
          <div class="device-image">
            <h2 style="padding: 0.5rem 0rem 0rem 1rem">
              {{ renderDeviceImage.title }}
              <span>
                <ReloadOutlined
                  style="color: #00bceb"
                  @click="refreshstatistics()"
                />
              </span>
            </h2>
            <img
              class="ImageStatistics"
              :src="getDeviceImage"
              :alt="renderDeviceImage.details.altText"
            />
          </div>
        </div>
        <div style="width: 85%; display: inline-block">
          <div class="statistics">
            <div class="StatisticsTable">
              <div class="row">
                <div
                  v-if="isSampleDataLoaded"
                  class="sampleStatsContainer deviceStatsRow column-55"
                >
                  <h2>{{ renderSampleStatistics.title }}</h2>
                  <div
                    v-for="column in renderSampleStatistics.columns"
                    :key="column.dataIndex"
                  >
                    <div v-if="column.isVisible" class="sampleStatsPair">
                      <div class="sampleStatsKey">{{ column.title }}</div>
                      <div class="sampleStatsValue">
                        {{ getSampleStatsData(column.dataIndex) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else></div>
                <div class="verticalLine"></div>
                <div v-if="isDeviceDataLoaded" class="deviceStatsRow column-35">
                  <h2>{{ renderDeviceStatistics.title }}</h2>
                  <div
                    v-for="column in renderDeviceStatistics.columns"
                    :key="column.dataIndex"
                  >
                    <div v-if="column.isVisible" class="sampleStatsPair">
                      <div class="sampleStatsKey">{{ column.title }}</div>
                      <div class="sampleStatsValue">
                        {{ getSampleStatsData(column.dataIndex) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isRenderResources" class="column-25">
        <div class="resources">
          <h2>{{ renderResources.title }}</h2>
          <ul>
            <template v-for="column in renderResources.columns">
              <li v-if="column.isVisible" :key="column.dataIndex">
                {{ column.title }}
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div
    v-for="task in deviceView.tasks"
    :key="task.id"
    style="padding: 0rem 1.5rem"
  >
    <SearchComponent
      class="measure-search"
      v-if="
        task.isVisible &&
        task.type === 'renderSearch' &&
        task.search?.dropdownOptions
      "
      :dropdownOptions="task.search.dropdownOptions"
      @search="performSearch"
    />
    <div style="margin-top: 15px">
      <TableComponent
        v-if="
          task.isVisible && task.type === 'renderTable' && task.table?.columns
        "
        :tableColumns="task.table.columns"
        :data="tableData"
        :showCheckbox="task.table.isCheckboxVisible"
        @selectedTableRecord="handleSelectedTableRowClick"
      />
    </div>

    <a-pagination
      style="text-align: right"
      v-if="
        task.isVisible &&
        task.type === 'renderPagination' &&
        task.pagination?.totalCount !== undefined
      "
      v-model:current="currentPage"
      :total="task.pagination.totalCount"
      @change="handlePageChange(currentPage, searchKey, searchTerm)"
      :show-size-changer="false"
      :defaultPageSize="deviceTable?.table?.defaultLimit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from "vue";
import { ReloadOutlined } from "@ant-design/icons-vue";
import deviceMockData from "../mockdata/deviceDetailsData.json";
import { fetchDataFromAPI } from "../services/apiService";
import { SocketService } from "../services/socketService";
import SearchComponent from "../components/SearchComponent.vue";
import TableComponent from "../components/TableComponent.vue";
import { environment } from "@/environment/environment";

interface Task {
  id: number;
  name: string;
  type: string;
  title?: string;
  columns?: { title: string; dataIndex: string }[];
  details?: {
    imagePath?: string;
    altText?: string;
    link?: string;
  };
}

interface DeviceView {
  name: string;
  tasks: Task[];
}
let statisticsTask: any;
let deviceStatisticsTask: any;

const deviceView = ref<DeviceView>({
  name: deviceMockData.name,
  tasks: deviceMockData.jobs[0].tasks,
});
let selectedTableRecord = ref({});
let selectedDeviceStatistics: any;
const isSampleDataLoaded = ref(false);
const isDeviceDataLoaded = ref(false);
const socketService = new SocketService(environment.DB_API_URL);

socketService.connectSocket();
const connectionStatusMap = ref<{ [key: number]: string }>({});

socketService.handleMessage((data: any) => {
  tableData.value.forEach((device: any, index: number) => {
    const deviceHeartbeat = data;
    const deviceID = deviceHeartbeat?.request?.device_id;
    if (deviceID && device.id && deviceID == device.id) {
      console.log(device.id);
      try {
        tableData.value[index].connection_status =
          deviceHeartbeat?.request?.connection_status;
      } catch (e) {
        console.error(
          `connection status not updated for instrument id:${device.id}`,
          e
        );
      }
      try {
        tableData.value[index].discover_timestamp =
          deviceHeartbeat?.deviceinfo?.currenttime;
      } catch (e) {
        console.error(
          `discovered time not updated for instrument id${device.id}`,
          e
        );
      }
    }
  });
});
const fetchData = async (taskData: any) => {
  try {
    if (taskData.type === "renderTable" && taskData.table?.api) {
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

      const paginationTask = deviceView.value.tasks.find(
        (task) => task.type === "renderPagination"
      );
      if (paginationTask && paginationTask.pagination) {
        paginationTask.pagination.totalCount = response.pagination.totalCount;
      } else {
        console.error("Pagination task or pagination property is undefined");
      }

      tableData.value = response.data;
      console.log("filteredDeviceIds", response.data);
      const deviceIds = response.data.map((device: any) => device.id);
      const filteredDeviceIds = deviceIds.filter(
        (deviceId: string | undefined) => deviceId
      );
      console.log("filteredDeviceIds:::::", filteredDeviceIds);
      if (filteredDeviceIds.length > 0) {
        socketService.subscribeToRooms(filteredDeviceIds);
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
const fetchSampleStatisticsData = async (taskData: any) => {
  console.log("fetchSampleStatisticsData", taskData);
  if (
    (taskData.type === "renderSampleStatistics" ||
      taskData.type === "renderDeviceStatistics") &&
    taskData.api
  ) {
    const params = {
      page: currentPage.value,
      orderBy: "id",
      limit: 10,
      strict: "no",
      ...(searchKey && searchTerm ? { [searchKey]: searchTerm } : {}),
    };

    let sampleStatisticsUrl = taskData.api.url;
    console.log(
      "selectedTableRecord",
      toRaw(selectedTableRecord),
      "tabledata",
      toRaw(tableData)
    );
    let deviceId = selectedTableRecord.value?.id || tableData.value[0]?.id;
    console.log("selectedTableRecord::::", deviceId);
    if (taskData.type === "renderSampleStatistics") {
      sampleStatisticsUrl += `&id=${deviceId}`;
    }

    if (selectedTableRecord.value?.id || tableData.value[0]?.id) {
      try {
        const response = await fetchDataFromAPI(
          sampleStatisticsUrl,
          "GET",
          params,
          taskData.api.authToken,
          taskData.api.clientId
        );

        if (taskData.type === "renderSampleStatistics") {
          selectedDeviceStatistics = response.data;
          isSampleDataLoaded.value = true;
        } else {
          selectedDeviceStatistics = response.data[0];
          isDeviceDataLoaded.value = true;
          console.log(
            "selectedDeviceStatisticsselectedDeviceStatistics",
            selectedDeviceStatistics
          );
        }
      } catch (err) {
        handleNoIdAvailable(taskData);
        console.log("error occurred for sample statistics api", err);
      }
    } else {
      handleNoIdAvailable(taskData);
    }
  }
};
const handleNoIdAvailable = (taskData: any) => {
  if (taskData.type === "renderSampleStatistics") {
    isSampleDataLoaded.value = true;
  } else {
    isDeviceDataLoaded.value = true;
  }
};

const performSearch = async (values: {
  selectedKey: string | null;
  searchQuery: string;
}) => {
  searchKey = values.selectedKey !== null ? values.selectedKey : undefined;
  searchTerm = values.searchQuery.trim();
  currentPage.value = 1;
  await fetchData(
    deviceView.value.tasks.find((task) => task.type === "renderTable")
  );
};

const handlePageChange = async (
  page: number,
  searchKey: string | undefined,
  searchTerm: string | undefined
) => {
  currentPage.value = page;
  const tableTask = deviceView.value.tasks.find(
    (task) => task.type === "renderTable"
  );
  if (tableTask && tableTask.table) {
    await fetchData(tableTask);
  } else {
    console.error("Table task or table property is undefined");
  }
};

const tableData = ref([]);
const currentPage = ref(1);
let searchKey: string | undefined;
let searchTerm: string | undefined;

const renderDeviceImage = computed(() =>
  deviceView.value.tasks.find((task) => task.type === "renderDeviceImage")
);
const renderSampleStatistics = computed(() =>
  deviceView.value.tasks.find((task) => task.type === "renderSampleStatistics")
);
const renderDeviceStatistics = computed(() =>
  deviceView.value.tasks.find((task) => task.type === "renderDeviceStatistics")
);
const renderResources = computed(() =>
  deviceView.value.tasks.find((task) => task.type === "renderResources")
);
const getDeviceImage = computed(() => {
  if (renderDeviceImage?.value?.details?.imagePath) {
    return require(`../assets/${renderDeviceImage?.value?.details.imagePath}`);
  } else return "";
});
const isRenderSampleStatistics = computed(() => !!renderSampleStatistics.value);
const isRenderDeviceStatistics = computed(() => !!renderDeviceStatistics.value);
const isRenderResources = computed(() => !!renderResources.value);
const isRenderDeviceImage = computed(() => !!renderDeviceImage.value);
const deviceTable = computed(() =>
  deviceView.value.tasks.find((task) => task.type === "renderTable")
);
const deviceTableData = ref([]);

const getSampleStatsData = (dataIndex: string): string | number => {
  try {
    console.log("getSampleStatsData", dataIndex, selectedDeviceStatistics);
    return selectedDeviceStatistics[dataIndex] || 0;
  } catch (err) {
    console.log("error occured at getSampleStatsData", err);
    return 0;
  }
};
const handleSelectedTableRowClick = (record: any) => {
  console.log("Instrument home page handleSelectedTableRowClick", record.id);
  selectedTableRecord.value = record;
  statisticsTask = deviceView.value.tasks.find(
    (task) => task.type === "renderSampleStatistics"
  );
  deviceStatisticsTask = deviceView.value.tasks.find(
    (task) => task.type === "renderDeviceStatistics"
  );
  fetchSampleStatisticsData(statisticsTask);
  fetchSampleStatisticsData(deviceStatisticsTask);
};

onMounted(async () => {
  // socketService.subscribeToRooms([
  //   "32",
  //   "26",
  //   "25",
  //   "20",
  //   "19",
  //   "18",
  //   "17",
  //   "16",
  //   "14",
  //   "13",
  // ]);
  const tableTask = deviceView.value.tasks.find(
    (task) => task.type === "renderTable"
  );
  if (tableTask) {
    await fetchData(tableTask);
  }
  statisticsTask = deviceView.value.tasks.find(
    (task) => task.type === "renderSampleStatistics"
  );
  deviceStatisticsTask = deviceView.value.tasks.find(
    (task) => task.type === "renderDeviceStatistics"
  );
  if (statisticsTask) {
    console.log("statisticsTask", statisticsTask);
    await fetchSampleStatisticsData(statisticsTask);
  }
  if (deviceStatisticsTask) {
    console.log("deviceStatisticsTask", deviceStatisticsTask);
    await fetchSampleStatisticsData(deviceStatisticsTask);
  }
});
const refreshstatistics = async () => {
  await fetchSampleStatisticsData(statisticsTask);
  await fetchSampleStatisticsData(deviceStatisticsTask);
};
</script>

<style scoped>
.row {
  display: flex;
  margin-bottom: 20px;
}
.first-row-container {
  max-height: 350px;
  min-height: 350px;
  overflow-y: auto;
  padding: 1rem;
}
.column-15 {
  flex: 15%;
}
.ImageStatistics {
  width: 100%;
  vertical-align: top;
  margin-top: 20px;
}
.column-70 {
  flex: 70%;
  background-color: #fafafa;
  border: 1px solid #e9e9e9;
  overflow-y: auto;
  border-radius: 5px;
}
.column-55 {
  flex: 55%;
}
.column-50 {
  flex: 50%;
}
.column-35 {
  flex: 35%;
}
.column-25 {
  flex: 25%;
  margin-left: 1rem;
  padding: 1rem;
  background-color: #fafafa;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
}
.full-width {
  width: 100%;
}
.sampleStatsContainer {
  display: flex;
  flex-direction: column;
}

.sampleStatsPair {
  display: flex;
  margin-bottom: 10px;
  width: 100%;
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
}

.sampleStatsKey {
  width: 100%;
  margin-right: 10px;
}
.sampleStatsValue {
  text-align: center;
  width: 50%;
}
.sampleStatsRow {
  display: inline;
}
.deviceStatsRow {
  display: inline;
  padding: 1rem;
}
.verticalLine {
  border-left: 1px solid #e8e8e8;
  margin: 0.5rem;
}
.measure-search {
  display: flex;
  justify-content: end;
}
</style>
