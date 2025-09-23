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
          :dropdownOptions="searchDropdownOptions"
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
      :locale="customLocale"
      class="data-class custom-table"
      :loading="isLoading"
      size="middle"
      :getPopupContainer="
        (triggerNode) => triggerNode.closest('.ant-table-container')
      "
      :scroll="{ x: 'max-content' }"
      :customRow="customRow"
      @change="handleSelectedFilter"
      v-if="
        task.visible && task.taskName === 'renderTable' && task.table?.columns
      "
    >
      <template #headerCell="{ column }">
        <span>
          <ReloadOutlined
            v-if="column.title === 'Sample Status'"
            class="refreshIcon"
            @click="refreshDataPage"
          />
          {{ t(`dataPage.${column.title}`, `${column.title}`) }}
          <a-popover trigger="hover" placement="topLeft">
            <template #content>
              <template
                v-if="typeof InfoCommentsData.lims[column.title] === 'string'"
              >
                <div style="color: black; max-width: 350px">
                  {{
                    t(
                      `constantsTranslate['${
                        InfoCommentsData.lims[column.title]
                      }']`,
                      `${InfoCommentsData.lims[column.title]}`
                    )
                  }}
                </div>
              </template>
              <template v-else-if="InfoCommentsData.lims[column.title]?.data">
                <a-list
                  size="middle"
                  bordered
                  :data-source="InfoCommentsData.lims[column.title].data"
                  style="max-width: 500px; max-height: 300px; overflow-y: auto"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <div class="flex-container">
                        <span
                          style="color: black; font-weight: bold; width: 35%"
                          >{{
                            t(
                              `constantsTranslate['${item.name}']`,
                              `${item.name}`
                            )
                          }}
                          -
                        </span>
                        <span style="width: 65%">{{
                          t(
                            `constantsTranslate['${item.value}']`,
                            `${item.value}`
                          )
                        }}</span>
                      </div>
                    </a-list-item>
                  </template>
                  <template #header>
                    <div style="color: black; font-weight: bold">
                      {{
                        t(
                          `constantsTranslate['${
                            InfoCommentsData.lims[column.title].head
                          }']`,
                          `${InfoCommentsData.lims[column.title].head}`
                        )
                      }}
                    </div>
                  </template>
                </a-list>
              </template>
            </template>
            <InfoCircleOutlined />
          </a-popover>
        </span>
      </template>
      <template #bodyCell="{ column, record }">
        <template
          v-if="
            t(`dataPage.${column.title}`, `${column.title}`) ===
            t('dataPage.Sample Status', 'Sample Status')
          "
        >
          <span
            v-if="
              record.status === 'In-Progress' &&
              record.connectionStatus.toLowerCase() === 'disconnected'
            "
          >
            {{ t("dataPage.In-Progress", "In-Progress") }}<br />
            {{ t("dataPage.Disconnected", "Disconnected") }}
          </span>
          <span
            v-else-if="
              record.status === 'Force-Dropping' &&
              record.connectionStatus.toLowerCase() === 'connected'
            "
          >
            {{ t("dataPage.In-Progress", "In-Progress") }}
          </span>
          <span v-else>
            {{ t(`dataPage.${record.status}`, `${record.status}`) }}
          </span>
        </template>
        <template v-if="column.dataIndex === 'lims_id'">
          {{ record.lims_id }}
        </template>
        <template v-if="column.dataIndex === 'sample_type_label'">
          {{ record.sample_type_label }}
        </template>
        <template v-if="column.dataIndex === 'meta.author'">
          {{ record.meta.author }}
        </template>
        <template
          v-if="column.dataIndex === 'task_result_meta.asset_info.name'"
        >
          {{ getDeviceName(record) }}
        </template>
        <template v-if="column.dataIndex === 'action'">
          <a-button
            v-if="showActionButtons && record.status === 'New'"
            type="primary"
            @click="handleStartSample(record)"
            size="small"
            >{{ t("dataPage.Start", "Start") }}</a-button
          >
          <a-button
            v-if="
              (record.status === 'Reviewed' ||
                record.status === 'Aborted' ||
                record.status === 'Force Drop' ||
                record.status === 'External Interrupt') &&
              (record.lims_status === null || record.lims_status === '') &&
              record.details &&
              Object.prototype.hasOwnProperty.call(record.details, 'comment')
            "
            style="background-color: chartreuse"
            @click="handleSyncSample(record)"
            size="small"
          >
            {{ t("dataPage.To Sync", "To Sync") }}
          </a-button>
        </template>
      </template>
      <template #emptyText>
        <div class="no-data-available">
          {{ translateLabel("dataPage", "No data available") }}
        </div>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      width="70%"
      height="60%"
      style="top: 20px"
      :maskClosable="false"
      class="data-modal-popup-lims"
      @cancel="handleModalClose"
    >
      <template #title>
        <div class="modal-header">
          <div class="recordTitle">
            <div>
              {{ modalTitle }}
            </div>
          </div>
          <div
            :class="
              'recordStatus ' + modalStatus.toLowerCase().replace(/\s+/g, '-')
            "
          >
            {{ t(`dataPage.${modalStatus}`, `${modalStatus}`) }}
          </div>
        </div>
      </template>
      <hr />

      <div class="measure-popup-content" ref="scrollableDiv">
        <ApcMeasurePopUpRecordData
          v-if="modalData && modalVisible"
          :data="modalData"
        />
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
          :total="paginationTotalCount"
          @change="handlePageChange"
          :show-size-changer="false"
          :defaultPageSize="10"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  reactive,
  onUnmounted,
  watch,
  computed,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import SearchComponent from "../components/ApcSearchComponent.vue";
import { message } from "ant-design-vue";
import { apcApiServices } from "../services/apcService";
import limsJsonData from "../../../mockdata/limsSamplesData.json";
import { notification } from "ant-design-vue";
import infoComments from "@/common/constants.json";
import { useI18n } from "vue-i18n";
import {
  processHeartbeat,
  generateExportTypeParams,
  translateLabel,
} from "@/common/utils";
import ApcMeasurePopUpRecordData from "../components/ApcMeasurePopUpRecordData.vue";
import ConfirmLogin from "@/common/ConfirmLogin.vue";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";
import exportFile from "@/services/exportFile";
import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons-vue";

// interface ModalData {
//   id?: number;
//   meta?: any;
//   [key: string]: any;
// }
const modalStatus = ref("");
let modalData: any | null;
const modalVisible = ref(false);
let modalTaskResult: any;
const InfoCommentsData = infoComments;
const isLoading = ref(false);
const tableData = ref<any[]>([]);
const currentPage = ref<number>(1);
let searchKey: string | null;
let searchTerm: string | null;
const isExportTypeLoading = ref(false);
const jsonData = ref<any>({ tasks: [] });
const router = useRouter();
const apcService = new apcApiServices();
const paginationTotalCount = ref(10);
let limitCount = 2000;
const searchKeyMapping = ref<{ [key: string]: string }>({});
const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");

socketService.connectSocket();
let exportDataType: any;
const subscribedDeviceIds = ref<Set<string>>(new Set());
let connectionData: any = reactive({});
const { t, locale } = useI18n();
const modalTitle = ref("");
const loggedRole = ref<string>("");
const scrollableDiv = ref<HTMLDivElement[]>([]);
jsonData.value = limsJsonData;

socketService.handleMessage((incomingHeartbeat: any) => {
  tableData.value.forEach((taskResult: any, index: number) => {
    const processedHeartbeat = processHeartbeat(incomingHeartbeat);
    // console.log("#ProgressHeartBeat:::", processedHeartbeat);

    const deviceID = processedHeartbeat?.basic?.asset_id;
    const deviceTaskId = processedHeartbeat?.taskId;
    // console.log(":::::taskResultData:::", taskResult);
    if (
      deviceID == taskResult?.task_result_meta?.asset_info?.asset_id &&
      deviceTaskId == taskResult.task_result_task_id
    ) {
      try {
        Object.assign(tableData.value[index], {
          // device_status: processedHeartbeat?.device_status,
          connectionStatus: processedHeartbeat.connectionStatus,
          isSampling: processedHeartbeat.isSampling,
          actionStatus: processedHeartbeat.actionStatus,
          sampleType: processedHeartbeat.sampleType,
          jobId: processedHeartbeat.jobId,
          taskId: processedHeartbeat.taskId,
        });
      } catch (e) {
        console.error(
          `Error updating instrument data for instrument id:${taskResult?.meta?.asset_info?.asset_id}`,
          e
        );
      }

      try {
        if (tableData.value[index]["interval"]) {
          clearInterval(tableData.value[index]["interval"]);
        }

        tableData.value[index]["timer"] = new Date().getTime();
        tableData.value[index]["interval"] = setInterval(() => {
          // try {
          //   if (
          //     tableData.value[index] &&
          //     new Date().getTime() - tableData.value[index]["timer"] >= 3000
          //   ) {
          //     tableData.value[index]["device_status"] = "disconnected";
          //     tableData.value[index]["connectionStatus"] = "disconnected";
          //     clearInterval(tableData.value[index]["interval"]);
          //   }
          // } catch (e) {
          //   console.log("Unable to auto disconnect on no heartbeat", e);
          // }
        }, 1000);
      } catch (e) {
        console.log("Error updating disconnect status", e);
      }
      //console.log("::::::connectionData", connectionData);
    }
  });
});

const getUserRole = () => {
  const decodedToken = localStorage.getItem("DecodedToken");
  const storedToken = decodedToken ? JSON.parse(decodedToken) : {};
  loggedRole.value = storedToken.role || "";
};

const getPopupContainer = () => {
  return document.body;
};

const showActionButtons = computed(() => {
  return !["auditor", "tester", "administrator"].includes(loggedRole.value);
});

const fetchSearchKeys = async () => {
  try {
    if (searchDropdownOptions.value) {
      searchKeyMapping.value = searchDropdownOptions.value.reduce(
        (acc: { [key: string]: string }, item: any) => {
          acc[item.value] = item.label;
          return acc;
        },
        {}
      );
    } else {
      console.error("Dropdown options are undefined");
    }
  } catch (error) {
    console.error("Error fetching search keys:", error);
  }
};

const fetchData = async (page: number) => {
  isLoading.value = true;

  const params: { [key: string]: any } = {
    orderBy: "id",
    limit: 10,
    page: page,
    strict: "no",
  };

  fetchSearchKeys();

  const searchHeaders: any = ref([]);
  if (searchKey && searchTerm) {
    params[searchKey] = searchTerm.trim();
    //key map for searckKey
    const searchedKeyFor = searchKeyMapping.value[searchKey] || searchKey;
    searchHeaders.value.push({
      [searchedKeyFor]: searchTerm,
    });
  }
  if (selectedFilter.value.length > 0) {
    if (searchKey === null && searchTerm === null) {
      searchKey = "status";
      searchTerm = selectedFilter.value[0];
    }
    params.status = selectedFilter.value[0];
    searchHeaders.value.push({ status: selectedFilter.value[0] });
  }
  // added search header and filtered status
  const searchCSVHeaders = JSON.stringify(searchHeaders.value);
  params.searchHeaders = encodeURIComponent(searchCSVHeaders);

  try {
    const response = await apcService.getLimsSampleData(params);
    paginationTotalCount.value = response.pagination.totalCount;
    tableData.value = response.data.map((taskResult: any) => {
      taskResult.connectionStatus = "disconnected";
      taskResult.isSampling = false;
      taskResult.actionStatus = "";
      taskResult.sampleType = "";
      taskResult.jobId = null;
      taskResult.taskId = null;

      if (taskResult.task_id) {
        taskResult.taskId = taskResult.task_result_task_id;
      }

      if (taskResult.job_id) {
        taskResult.jobId = taskResult.job_id;
      }

      const TASK_STATUSES = [
        "Aborted",
        "Aborting",
        "Force Dropped",
        "Completed",
        "Reviewed",
        "Synced",
        "Force Drop",
        "New",
        "Suspended",
        "External Sample",
        "External Interrupt",
      ];
      if (!TASK_STATUSES.includes(taskResult.status)) {
        taskResult.isSampling = true;
      }

      const PROCESSING_STATUSES = [
        "Force-Dropping",
        "Aborting",
        "Aborted",
        "Force-Dropped",
        "external_interrupt",
        "New",
      ];

      if (PROCESSING_STATUSES.includes(taskResult.status)) {
        taskResult.actionStatus = taskResult.status;

        if (
          taskResult.status === "Force-Dropped" ||
          taskResult.status === "Aborted"
        ) {
          taskResult.actionStatus = "";
        }
      }

      return taskResult;
    });
    // table returned data based on this filter.
    // need to render instantly after filter.
    // console.log("tableData after filter", tableData.value);

    const deviceIds = response.data
      .map(
        (taskResult: any) =>
          taskResult?.task_result_meta?.asset_info?.asset_id ?? null
      )
      .filter((id: string | null) => id !== null);
    const filteredDeviceIds = deviceIds.filter(
      (deviceId: string | undefined) => deviceId
    );
    //console.log("#deviceIds:::", deviceIds, filteredDeviceIds);
    // console.log("#responseData::::", response.data);

    // Unsubscribe from devices that are no longer in the filtered list
    subscribedDeviceIds.value.forEach((deviceId) => {
      if (!filteredDeviceIds.includes(deviceId)) {
        socketService.leaveRooms([
          `instrument/ams/${deviceId}/heartbeats/basic`,
        ]);
        subscribedDeviceIds.value.delete(deviceId);
      }
    });

    // Subscribe to new devices in the filtered list
    filteredDeviceIds.forEach((asset_id: any) => {
      if (!subscribedDeviceIds.value.has(asset_id)) {
        socketService.subscribeToRooms([
          `instrument/ams/${asset_id}/heartbeats/basic`,
        ]);
        subscribedDeviceIds.value.add(asset_id);
      }
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    isLoading.value = false;
  }
  setupWatchers();
};
const getDeviceName = (record: any) => {
  if (record?.task_result_meta?.asset_info.name) {
    return record.task_result_meta.asset_info.name;
  } else return "";
};

const customRow = (record: any) => {
  return {
    onClick: () => openPop(record),
  };
};

const renderSearchTask = jsonData.value.tasks.find(
  (task: any) => task.taskName === "renderSearch"
);
const dropdownOptions = ref(renderSearchTask.search.dropdownOptions);
const searchDropdownOptions = computed(() => {
  return dropdownOptions.value.map((eachColumn: any) => {
    return {
      ...eachColumn,
      label: eachColumn.label,
    };
  });
});

console.log(searchDropdownOptions);

const handleConfirmation = async () => {
  await fetchData(currentPage.value);
};
const handleModalClose = async () => {
  modalVisible.value = false;
};

const getCellStyle = (columnTitle: string, record: any) => {
  if (columnTitle === t("dataPage.Sample Status", "Sample Status")) {
    switch (t(`dataPage.${record.status}`)) {
      case t("dataPage.Reviewed", "Reviewed"):
        return {
          backgroundColor: "#94e498",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Confirmed", "Confirmed"):
        return {
          backgroundColor: "#94e498",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.viewed", "viewed"):
        return {
          backgroundColor: "#94e498",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.success", "success"):
        return {
          backgroundColor: "#94e498",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.force-dropping", "force-dropping"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.error", "error"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Complete", "Complete"):
        return {
          backgroundColor: "#ecc699",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Completed", "Completed"):
        return {
          backgroundColor: "#ecc699",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.ready", "ready"):
        return {
          backgroundColor: "rgb(73, 162, 235)",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Aborted", "Aborted"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Force Dropping", "Force Dropping"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Synced", "Synced"):
        return {
          backgroundColor: "rgb(148, 228, 152)",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Active", "Active"):
        return {
          backgroundColor: "#f6e3ce",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.New", "New"):
        return {
          backgroundColor: "#c9c9c9",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.In-Progress", "In-Progress"):
      case t("dataPage.In Progress", "In Progress"):
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
      case t("dataPage.Force-Dropping", "Force-Dropping"):
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
      case t("dataPage.Force Drop", "Force Drop"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.External Interrupt", "External Interrupt"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      case t("dataPage.Failed", "Failed"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      // Force-Dropped
      case t("dataPage.Suspended", "Suspended"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };

      case t("dataPage.external_interrupt", "external_interrupt"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };

      case t("dataPage.Force-Dropped", "Force-Dropped"):
        return {
          backgroundColor: "#e89b96",
          textAlign: "center",
          cursor: "pointer",
        };
      default:
        return { textAlign: "center", cursor: "pointer" };
    }
  }
  return {};
};

const performSearch = async (values: {
  selectedKey: string;
  searchQuery: string;
}) => {
  //console.log(":::::values", values);
  searchKey = values.selectedKey;
  searchTerm = values.searchQuery.trim();

  //console.log("Process flow for search - 1");

  currentPage.value = 1;
  await fetchData(currentPage.value);
};
const limsPageHeaders = () => {
  let limsPageTableHeader: any = [];
  // console.log(":::::::::::::::::::columns:::::::::::::::::", columns);
  columns.value.forEach((column: Column) => {
    limsPageTableHeader.push({
      field: column.dataIndex,
      header: column.title,
    });
  });
  limsPageTableHeader = limsPageTableHeader.filter(
    (item: any) => item.header !== "Action"
  );
  limsPageTableHeader.push(
    { field: "volume", header: "Volume" },
    { field: "operator", header: "User" },
    { field: "task_result_id", header: "Sample ID" },
    { field: "period", header: "Period" },
    { field: "count_limits", header: "Counts" },
    {
      field: "flow_limits",
      header: "Flow Rate Percentage Limits",
    },
    { field: "measure_start_time", header: "Measure Start Time" },
    { field: "measure_end_time", header: "Measure End Time" },
    { field: "cumulative", header: "Cumulative Data" },
    { field: "differential", header: "Differential Data" },
    { field: "model_name", header: "Model" },
    { field: "serial_number", header: "Serial #" },
    { field: "last_calibration_date", header: "Last Calibration Date" },
    { field: "next_calibration_date", header: "Next Calibration Date" },
    { field: "firmware_version", header: "Firmware" },
    { field: "site_name", header: "Site Name" },
    { field: "comments", header: "Comment(s)" }
  );
  return limsPageTableHeader;
};

const exportDataByType = async (dataType: any) => {
  isExportTypeLoading.value = true;
  exportDataType = dataType;
  const params: { [key: string]: any } = {
    orderBy: "id",
    strict: "no",
    locale: locale.value,
  };
  const dataHeaders = limsPageHeaders();
  if (searchTerm && searchTerm.trim() !== "") {
    params[`${searchKey}`] = searchTerm;
  }
  console.log("::: export params :::", params, searchTerm, searchKey);

  const exportParams = generateExportTypeParams(
    searchKey,
    searchTerm,
    dataType,
    dataHeaders
  );
  exportParams.limit = limitCount;
  // console.log("::::::dataHeaders", dataHeaders);
  exportParams.fileName = "Lims Sample";
  const dataParams = { ...params, ...exportParams };

  //console.log("params for lims exportParams", dataParams);
  //console.log("Export type value:", exportDataType);
  try {
    let limsExportResponse = await apcService.getLimsSampleData(dataParams);
    //console.log("limsExportResponse", limsExportResponse);
    exportFile(limsExportResponse, "lims_page", dataType);
  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    isLoading.value = false;
    isExportTypeLoading.value = false;
    if (paginationTotalCount.value > limitCount) {
      const messageText = t("dataPage.ExportMessage", {
        total: paginationTotalCount.value,
        limit: limitCount,
      });

      message.info(messageText);
    }
  }
  isExportTypeLoading.value = false;
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  fetchData(currentPage.value);
};

const customLocale = computed(() => ({
  filterConfirm: t("commonData.OK", "OK"),
  filterReset: t("commonData.Reset", "Reset"),
}));

const handleStartSample = (record: any) => {
  // console.log(" handleSelectedTableRowClick", record);
  if (record?.id) {
    router.push(`/ams/lims/${record?.id}`);
  } else {
    alert("Sample data not found. Please try another sample");
  }
};
const handleSyncSample = (record: any) => {
  // console.log(" handleSelectedTableRowClick", record);
  if (record) {
    router.push(`/ams/lims-editor/${record?.id}`);
  } else {
    alert("Sample data not found. Please try another sample");
  }
};

const closeModal = () => {
  modalVisible.value = false;
};

const refreshDataPage = async () => {
  //.log("::::::;refreshDatapage");
  searchKey = null;
  searchTerm = null;
  currentPage.value = 1;
  fetchData(currentPage.value);
};

const openPop = async (record: any) => {
  if (
    record?.details &&
    Object.prototype.hasOwnProperty.call(record.details, "comment")
  ) {
    modalTitle.value = "";
  } else if (
    ![
      "In-Progress",
      "In-Progress Disconnect",
      "Reviewed",
      "Force Dropping",
      "New",
      "Synced",
    ].includes(record?.status)
  ) {
    modalTitle.value = "E-Signature Needed to Confirm Sample";
  } else {
    modalTitle.value = ""; // Clear modalTitle for excluded statuses
  }

  // Ensure modalTitle is prefixed with `dataPage.` dynamically
  if (modalTitle.value) {
    modalTitle.value = t(`dataPage.${modalTitle.value}`, `${modalTitle.value}`);
  }

  isLoading.value = true;
  let limsSampleCreator = record.meta.author;
  // Update modalStatus with the new condition
  try {
    // console.log("#Record::::", record);
    // Fetch the API data
    const taskResultData: any = await apcService.getApcLimsSampleById(
      record.id
    );
    if (taskResultData) {
      const fetchedData = taskResultData.data[0];
      modalData = fetchedData; // Updated assignment
      if (record.status !== "New") {
        modalData["meta"] = record?.task_result_meta;
        modalData.meta["author"] = limsSampleCreator;
        modalData.data = fetchedData.task_result_data;
        modalData.id = fetchedData.task_result_id;
        modalData.task_id = fetchedData.task_result_task_id;
      }
      modalStatus.value = record.status || fetchedData.status;
      // }

      modalVisible.value = true;
      //console.log("Task Result Data:", fetchedData);
    } else {
      //console.error(`No task result data found for task_id: ${record.task_id}`);
      notification.error({
        message: `No task result data found`,
        description: `${t(
          "dataPage.No data found for task_id",
          "No data found for task_id"
        )}: ${record.task_id}`,
      });
    }
  } catch (error: any) {
    console.error("Error fetching data from API:", error);
    notification.error({
      message: `${t(
        "dataPage.Error fetching data from API",
        "Error fetching data from API"
      )}`,
      description: error.message,
    });
  }
  if (
    (record.status === "Force-Dropping" || record.status === "In-Progress") &&
    record.connectionStatus === "disconnected"
  ) {
    modalStatus.value = "In-Progress Disconnect";
  } else {
    modalStatus.value = record.status;
  }

  try {
    modalData = record;
    if (record.status === "New") {
      modalData = { ...record };
      if (modalData) {
        modalData["meta"] = record.meta;
        modalData.data = {};
        modalData.data.data = record.sample_input;
        delete modalData["id"];
      }
    } else {
      if (modalData) {
        modalData["meta"] = record.task_result_meta;
        modalData.meta["author"] = limsSampleCreator;
        modalData.data = record.task_result_data;
        modalData.id = record.task_result_id;
        modalData.task_id = record.task_result_task_id;
        modalData.measure_start_time = record.measure_start_time;
        modalData.measure_end_time = record.measure_end_time;
      }
    }
    modalData.filename = "Lims Data Exporter";
    if (record.data == undefined && record.sample_input) {
      record.data = {};
      record.data.data = record.sample_input;
    }

    if (modalTaskResult) {
      modalTaskResult.job_id = record.task_result_job_id;
    }
    modalVisible.value = true;

    // console.log("Selected Record Data:", record);
  } catch (error: any) {
    console.error("Error fetching data from API:", error);
  }
  isLoading.value = false;
};

const shouldResetSearchComponent = async () => {
  searchKey = null;
  searchTerm = null;
  currentPage.value = 1;
  await fetchData(currentPage.value);
  return true;
};

const selectedFilter = ref<string[]>([]);
let columns: any = computed(() => [
  {
    title: "Sample Status",
    dataIndex: "status",
    customCell: (record: any) => {
      return {
        style: getCellStyle(
          t("dataPage.Sample Status", "Sample Status"),
          record
        ),
      };
    },
    filters: [
      { text: t("dataPage.New", "New"), value: "New" },
      { text: t("dataPage.Completed", "Completed"), value: "Completed" },
      { text: t("dataPage.Aborted", "Aborted"), value: "Aborted" },
      { text: t("dataPage.Force Drop", "Force Drop"), value: "Force Drop" },
      { text: t("dataPage.Synced"), value: "Synced" },
      { text: t("dataPage.Reviewed", "Reviewed"), value: "Reviewed" },
      {
        text: t("dataPage.External Interrupt", "External Interrupt"),
        value: "External Interrupt",
      },
    ],

    filtered: selectedFilter.value.length > 0,
    filteredValue: selectedFilter.value,
    // direct filtered value
    //filteredValue:selectedStatues.value
    onFilter: (value: string, record: any) => {
      return record.status === value; //, (selectedFilter.value = value);
    },
    filterMultiple: false,
    align: "center",
    width: "180px",
  },
  {
    title: "Lims Status",
    dataIndex: "lims_status",
  },
  {
    title: "Instrument Name",
    dataIndex: "task_result_meta.asset_info.name",
  },
  {
    title: "Sample Type",
    dataIndex: "sample_type_label",
  },
  { title: "LIMS ID", dataIndex: "lims_id" },
  { title: "LIMS", dataIndex: "source" },
  { title: "Created By", dataIndex: "meta.author" },
  { title: "Action", dataIndex: "action" },
]);

const handleSelectedFilter = async (
  pagination: any,
  filters: any,
  sorter: any
) => {
  console.log("selected filter is working", pagination, filters, sorter);
  const statusFilters = filters["status"] || [];
  selectedFilter.value = statusFilters;
  currentPage.value = 1;
  fetchData(currentPage.value);
};

interface Column {
  dataIndex: string;
  title: string;
}
//console.log("columnsData:::", columns);
// let limsSamplePageHeader: any = [];
// limsSamplePageHeader = columns.value
//   .filter((column: Column) => column.title !== "Action")
//   .map((column: Column) => ({
//     field: column.dataIndex,
//     header: column.title,
//   }));

// limsSamplePageHeader.push(
//   { field: "device_name", header: "Instrument Name" },
//   { field: "volume", header: "Volume" },
//   { field: "operator", header: "User" },
//   { field: "cumulative", header: "Cumulative Data" },
//   { field: "differential", header: "Differential Data" },
//   { field: "model_name", header: "Model" },
//   { field: "serial_number", header: "Serial #" },
//   { field: "last_calibration_date", header: "Last Calibration Date" },
//   { field: "firmware_version", header: "Firmware" },
//   { field: "site_name", header: "Site" },
//   { field: "comments", header: "Comment(s)" }
// );

// let tableHeaders = JSON.stringify(limsSamplePageHeader);

watch(modalVisible, async (newValue) => {
  console.log("newValue", newValue, scrollableDiv.value);
  if (newValue && scrollableDiv.value.length > 0) {
    // scrollableDiv returns a array of divs, set scrolltop =0 to them.
    await nextTick();
    console.log("newvalue going inside");
    scrollableDiv.value.forEach((div) => {
      console.log("newe value inside divs", div);
      if (div) div.scrollTop = 0;
    });
  }
});

const setupWatchers = () => {
  console.log("process flow for search - 3 ");
  for (let i = 0; i < tableData.value.length; i++) {
    const item = tableData.value[i];
    watch(
      () => [item.actionStatus, item.isSampling],
      ([newActionStatus, newIsSampling], [oldActionStatus, oldIsSampling]) => {
        // console.log(
        //   ":::: watch :::: newActionStatus ::: oldActionStatus",
        //   newActionStatus,
        //   oldActionStatus
        // );
        // console.log(
        //   ":::: watch :::: newIsSampling ::: oldIsSampling",
        //   newIsSampling,
        //   oldIsSampling,
        //   currentPage.value
        // );
        if (newIsSampling !== oldIsSampling) {
          fetchData(currentPage.value);
          return;
        }
      }
    );
  }
};

// Fetch data initially based on the route
onMounted(async () => {
  getUserRole();

  // Fetch data initially
  fetchData(currentPage.value);
  // await fetchSearchKeys();
});

onUnmounted(() => {
  // handleSelectFilterValue(filters);
  // Unsubscribe from all rooms
  subscribedDeviceIds.value.forEach((deviceId) => {
    socketService.leaveRooms([`instrument/ams/${deviceId}/heartbeats/basic`]);
  });
  subscribedDeviceIds.value.clear();
});
</script>
<style>
.data-class .ant-table-tbody > tr {
  background-color: rgba(242, 242, 242, 1);
}

.data-class .ant-table-tbody > tr > td {
  border-bottom: 1px solid #e8e8e8 !important;
}

.data-class
  .ant-table-tbody
  > tr:hover
  td:not(:nth-child(1)):not(:nth-child(2)) {
  background-color: aliceblue !important;
}
.data-class {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.data-class {
  max-width: 100%; /* Make sure it's not wider than its parent container */
}

/* Optional: Customize column widths */
.data-class .ant-table-thead th {
  white-space: nowrap;
}

.recordStatus {
  margin-right: 50px;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  width: 150px;
  height: 48px;
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

  &.completed,
  .completed:hover {
    background-color: #ecc699 !important;
  }

  &.in-progress {
    background-color: #94d2de !important;
  }

  &.in progress {
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

  &.suspended {
    background-color: #e89b96 !important;
  }

  &.external_interrupt {
    background-color: #e89b96 !important;
  }

  &.force-drop {
    background-color: #e89b96 !important;
  }

  &.in-progress-disconnect {
    background-color: #e89b96 !important;
  }
  &.external-interrupt {
    background-color: #e89b96 !important;
  }
}

.external_interrupt,
.external_interrupt:hover {
  background-color: #e89b96 !important;
}

.data-modal-popup-lims .ant-modal-content {
  font-family: Montserrat-Regular, sans-serif !important;
  padding: 0 15px !important;
  box-shadow: none !important;
}

.data-modal-popup-lims .ant-modal-header {
  margin-bottom: 0 !important;
}

.data-modal-popup-lims .measure-popup-content {
  padding: 0 8px !important;
  height: 50vh !important;
  overflow-y: auto !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
}

hr {
  margin: 0;
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

.ant-modal-root .ant-modal-mask {
  background-color: rgba(0, 0, 0, 0.1) !important;
}

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

.external_interrupt,
.external_interrupt:hover {
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
</style>
