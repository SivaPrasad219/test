<template>
  <div>
    <div>
      <a-row class="pb-4">
        <a-col :span="24">
          <SearchComponent
            :shouldReset="shouldReset"
            @update:shouldReset="shouldReset = $event"
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
        :locale="customLocale"
        class="data-table custom-table"
        :getPopupContainer="
          (triggerNode) => triggerNode.closest('.custom-table')
        "
        size="middle"
        :scroll="{ x: 'max-content' }"
        :customRow="customRow"
        @change="handleTableChange"
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
                  v-if="typeof InfoCommentsData.data[column.title] === 'string'"
                >
                  <div style="color: black; max-width: 350px">
                    {{
                      t(
                        `constantsTranslate['${
                          InfoCommentsData.data[column.title]
                        }']`,
                        `${InfoCommentsData.data[column.title]}`
                      )
                    }}
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
                            >{{
                              t(
                                `constantsTranslate['${item.name}']`,
                                `${item.name}`
                              )
                            }}
                            -</span
                          >
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
                              InfoCommentsData.data[column.title].head
                            }']`,
                            `${InfoCommentsData.data[column.title].head}`
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
          <div>
            <template v-if="column.title === localizedTitles.sampleStatus">
              <span
                v-if="
                  record.status === 'In-Progress' &&
                  record.connectionStatus === 'disconnected'
                "
              >
                {{ translateRecordsAsPerLanguage("In-Progress") }}<br />{{
                  translateRecordsAsPerLanguage("Disconnected")
                }}
              </span>
              <span
                v-else-if="
                  record.status === 'Force-Dropping' &&
                  record.connectionStatus === 'connected'
                "
              >
                {{ translateRecordsAsPerLanguage("In-Progress") }}
              </span>
              <span v-else>
                {{ translateRecordsAsPerLanguage(record.status) }}
              </span>
            </template>
            <template v-else-if="column.title === localizedTitles.deviceName">
              {{ record?.meta?.asset_info?.name }}
            </template>
            <template v-else-if="column.title === localizedTitles.sampleId">
              {{ record?.id }}
            </template>
            <template v-else-if="column.title === localizedTitles.sampleType">
              {{ record?.meta?.sample_type }}
            </template>
            <template v-else-if="column.title === localizedTitles.source">
              {{ record?.meta?.source }}
            </template>

            <template
              v-else-if="column.title === localizedTitles.measureStartTime"
            >
              {{ record?.measure_start_time }}
            </template>
            <template
              v-else-if="column.title === localizedTitles.measureEndTime"
            >
              {{ record?.measure_end_time }}
            </template>
            <template v-else-if="column.title === localizedTitles.exception">
              <a-space>
                <!-- Force Drop Button -->
                <a-button
                  v-if="
                    showActionButtons('Force Drop') &&
                    record.isSampling &&
                    record.connectionStatus === 'disconnected' &&
                    record.actionStatus?.toLowerCase() === 'in-progress' &&
                    record.status !== 'New' &&
                    record.status !== 'Suspended'
                  "
                  @click="openForceDropModal(record, 'Force Drop', $event)"
                  type="primary"
                  danger
                  size="small"
                >
                  {{ translateRecordsAsPerLanguage("Force Drop") }}
                </a-button>

                <!-- Abort Button -->
                <a-button
                  v-if="
                    showActionButtons('Abort') &&
                    record.isSampling &&
                    record.connectionStatus === 'connected' &&
                    record.actionStatus?.toLowerCase() === 'in-progress'
                  "
                  @click="openAbortModal(record, 'Abort', $event)"
                  type="primary"
                  size="small"
                  :style="{ backgroundColor: '#e68754' }"
                >
                  {{ translateRecordsAsPerLanguage("Abort") }}
                </a-button>
              </a-space>
            </template>
            <template
              v-else-if="column.title === localizedTitles.continuousRunId"
            >
              {{ record?.meta?.cr_id }}
            </template>
          </div>
        </template>
        <template #emptyText>
          <div class="no-data-available">
            {{ translateRecordsAsPerLanguage("No data available") }}
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
      width="70%"
      height="60%"
      style="top: 20px"
      :maskClosable="false"
      class="data-modal-popup"
    >
      <template #title>
        <div class="modal-header">
          <div class="recordTitle">
            <div v-if="!modalData?.details?.comment">
              {{ modalTitle }}
              <!-- Show the modal title only if the comment key is absent -->
            </div>
          </div>
          <div
            :class="
              'recordStatus ' + modalStatus?.toLowerCase().replace(/\s+/g, '-')
            "
          >
            {{ translateRecordsAsPerLanguage(modalStatus) }}
          </div>
        </div>
      </template>
      <hr />
      <div class="measure-popup-content" ref="modalContent">
        <PhmeterMeasurePopUpRecordData
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

    <esign-verify-modal
      v-if="isModalVisible"
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
  onUnmounted,
  reactive,
  watch,
  nextTick,
} from "vue";
import SearchComponent from "../components/PhmeterSearchComponent.vue";
import dataJsonData from "../config/phmeterDataPageJob.json"; // Import the JSON data directly
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { SocketService } from "@/services/socketService";
import { message } from "ant-design-vue";
import { generateExportTypeParams, processHeartbeat } from "@/common/utils";
import infoComments from "@/common/constants.json";
import { ReloadOutlined } from "@ant-design/icons-vue";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import PhmeterMeasurePopUpRecordData from "../components/PhmeterMeasurePopUpRecordData.vue";
import ConfirmLogin from "@/common/ConfirmLogin.vue";
import exportFile from "@/services/exportFile";
import esignVerifyModal from "@/components/esignVerifyModal.vue";
import { apcApiServices } from "../services/apcService";
import { useI18n } from "vue-i18n";
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
    PhmeterMeasurePopUpRecordData,
    ConfirmLogin,
    ReloadOutlined,
    esignVerifyModal,
  },
  setup() {
    const { t, locale } = useI18n();
    const currentLocale = ref(locale.value);
    const modalTitle = ref("");
    const modalStatus = ref("");
    const modalData = ref<{ status?: string } | null>(null);
    const modalContent = ref<HTMLDivElement | null>(null);
    const modalTaskResult = ref(null);
    const paginationTotalCount = ref(10);
    const modalVisible = ref(false);
    const isExportTypeLoading = ref(false);
    const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");
    const apcService = new apcApiServices();
    const router = useRouter();
    const route = useRoute();
    const shouldReset = ref(false);

    const store = useStore();
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);

    const InfoCommentsData = infoComments;
    const isLoading = ref(false);

    const changeLocale = (value: string) => {
      locale.value = value;
      currentLocale.value = value;
    };

    const getPopupContainer = () => {
      return document.body;
    };

    const localizedTitles = computed(() => ({
      sampleStatus: "Sample Status",
      deviceName: "Instrument Name",
      sampleId: "Sample ID",
      // user: "User",
      sampleType: "Equipment Method",
      source: "Source",
      continuousRunId: "Run Comment",
      measureStartTime: "Measure Start Time",
      measureEndTime: "Measure End Time",
      exception: "Exception",
    }));
    // const columns = ref<Column[]>(dataJsonData.columns);
    const selectedStatuses = ref<string[]>([]);
    const columns = computed(() => [
      {
        title: localizedTitles.value.sampleStatus,
        dataIndex: "status",
        // render colors with columns initial only.
        customCell: (record: any) => {
          return {
            style: getCellStyle(t("dataPage.Sample Status"), record),
          };
        },
        filters: [
          //{ text: t("dataPage.New"), value: "New" },
          { text: t("dataPage.Reviewed", "Reviewed"), value: "Reviewed" },
          { text: t("dataPage.Completed", "Completed"), value: "Completed" },
          { text: t("dataPage.Aborted", "Aborted"), value: "Aborted" },
          { text: t("dataPage.Synced", "Synced"), value: "Synced" },
          { text: t("dataPage.Force Drop", "Force Drop"), value: "Force Drop" },
          // { text: t("dataPage.In-Progress", "In-Progress"), value: "In-progress" },
          // { text: t("dataPage.In-Progress", "In-Progress"), value: "In-progress Disconnected" },
          // only add api call for force drop.
          {
            text: t("dataPage.External Interrupt", "External Interrupt"),
            value: "External Interrupt",
          },
          {
            text: t("dataPage.External Sample", "External Sample"),
            value: "External Sample",
          },
          { text: t("dataPage.Suspended", "Suspended"), value: "Suspended" },
        ],
        filtered: selectedStatuses.value.length > 0,
        filteredValue: selectedStatuses.value,
        onFilter: (value: string, record: any) => record.status === value,
        filterMultiple: false,
      },
      {
        title: localizedTitles.value.deviceName,
        dataIndex: "meta.asset_info.name",
      },
      // { title: localizedTitles.value.user, dataIndex: "user" },
      {
        title: localizedTitles.value.sampleType,
        dataIndex: "sample_type_label",
      },

      { title: localizedTitles.value.sampleId, dataIndex: "id" },

      { title: localizedTitles.value.source, dataIndex: "meta.source" },
      {
        title: localizedTitles.value.measureStartTime,
        dataIndex: "measure_start_time",
      },
      {
        title: localizedTitles.value.measureEndTime,
        dataIndex: "measure_end_time",
      },
      { title: localizedTitles.value.exception, dataIndex: "exception" },
      {
        title: localizedTitles.value.continuousRunId,
        dataIndex: "meta.cr_id",
      },
    ]);
    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
      console.log(
        "handleTableChangehandleTableChange",
        pagination,
        filters,
        sorter
      );
      const statusFilters = filters["status"] || [];
      selectedStatuses.value = statusFilters;
      console.log("statusFiltersstatusFilters", statusFilters);

      // Reset pagination and fetch data
      currentPage.value = 1;
      fetchData(currentPage.value);
    };

    const translateRecordsAsPerLanguage = (recordDataVariable: any) => {
      // console.log("recordDataVariablerecordDataVariable", recordDataVariable);
      return t(`dataPage.${recordDataVariable}`, `${recordDataVariable}`);
    };

    const loggedRole = ref<string>("");

    const searchDropdownOptions = ref(dataJsonData.dropdownOptions);
    const dataDropdownOptions = computed(() => {
      return searchDropdownOptions.value.map((eachColumn: any) => {
        return {
          ...eachColumn,
          label: eachColumn.label,
        };
      });
    });
    let searchKey: any | null;
    let searchTerm: string | null;
    const tableData = ref<any[]>([]);
    const currentPage = ref<number>(1);
    let connectionData: any = reactive({});
    socketService.connectSocket();

    const searchKeyMapping = ref<{ [key: string]: string }>({});
    // Track subscribed rooms
    const subscribedDeviceIds = ref<Set<string>>(new Set());

    const listConfig = ref([
      { label: "Task Result Id", value: "taskResultId", order: 2 },
      { label: "Created Time", value: "createdTime", order: 4 },
    ]);
    const isModalVisible = ref(false);
    const closeModal = () => {
      modalVisible.value = false;
      isModalVisible.value = false;

      if (router && route) {
        router.replace({ path: route.path, query: {} });
      } else {
        console.error("Router instance or route instance is not available.");
      }
    };

    const customLocale = computed(() => ({
      filterConfirm: t("commonData.OK", "OK"),
      filterReset: t("commonData.Reset", "Reset"),
    }));

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

    const showActionButtons = (actionType: string): boolean => {
      const forceDropExcludedRoles = ["auditor", "tester"];
      const abortExcludedRoles = ["auditor", "tester", "administrator"];
      if (
        actionType === "Force Drop" &&
        forceDropExcludedRoles.includes(loggedRole.value)
      ) {
        return false;
      }
      if (
        actionType === "Abort" &&
        abortExcludedRoles.includes(loggedRole.value)
      ) {
        return false;
      }
      return true;
    };

    const getCellStyle = (columnTitle: string, record: any) => {
      // console.log("#record Data:::", record);
      if (columnTitle === t("dataPage.Sample Status", "Sample Status")) {
        //console.log("recordstatus", record.status);
        switch (translateRecordsAsPerLanguage(record.status)) {
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
          case t("dataPage.Aborting", "Aborting"):
            return {
              backgroundColor: "#e89b96",
              textAlign: "center",
              cursor: "pointer",
            };
          case t("dataPage.External-Sample", "External-Sample"):
            return {
              backgroundColor: "#e89b96",
              textAlign: "center",
              cursor: "pointer",
            };
          case t("dataPage.External Sample", "External Sample"):
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
          case t("dataPage.In-Progress", "In-Progress"):
          case t("dataPage.In Progress", "In Progress"): // Handle both variants
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
    const openPop = async (record: any, isFromDeviceActionData = false) => {
      const excludedStatuses = [
        "In-Progress",
        "Reviewed",
        "New",
        "In-Progress Disconnected",
        "Force Dropping",
        // to stop showing modaltitle
      ];

      if (
        !excludedStatuses.includes(record?.status) &&
        record?.details &&
        Object.prototype.hasOwnProperty.call(record.details, "comment")
      ) {
        modalTitle.value = "";
      } else if (!excludedStatuses.includes(record?.status)) {
        modalTitle.value = translateRecordsAsPerLanguage(
          "E-Signature Needed to Confirm Sample"
        );
      } else {
        modalTitle.value = "";
      }

      isLoading.value = true;
      //console.log(":::::isLoading.value", isLoading.value);
      if (!record.task_id) {
        console.error("No task_id found in record.");
        return;
      }

      try {
        let taskResultData: any;

        // If called from openDeviceActionData, use getApcTaskIdResults API
        if (isFromDeviceActionData) {
          // console.log(
          //   "Calling getApcTaskIdResults with task_id:",
          //   record.task_id
          // );
          taskResultData = await apcService.getApcTaskIdResults(record.task_id);
        }
        // Otherwise, use the default getApcTaskResults API
        else {
          //console.log("Calling getApcTaskResults with record.id:", record.id);
          taskResultData = await apcService.getApcTaskResults(record.id);
        }

        if (taskResultData) {
          modalData.value = taskResultData.data[0];

          if (
            record.status === "In-Progress" &&
            record.connectionStatus === "disconnected"
          ) {
            modalStatus.value = "In-Progress Disconnected";
            if (
              modalData.value &&
              modalData.value !== null &&
              modalData.value !== undefined &&
              modalData.value.status !== undefined &&
              modalData.value.status
            ) {
              modalData.value.status = "In-Progress Disconnected";
            }
          } else {
            modalStatus.value = record.status || taskResultData.data[0].status;
          }

          modalVisible.value = true;
          //console.log("Task Result Data:", taskResultData.data[0]);
        } else {
          console.error(
            `No task result data found for task_id: ${record.task_id}`
          );
          notification.error({
            message: `No task result data found`,
            description: `No data found for task_id: ${record.task_id}`,
          });
        }
      } catch (error: any) {
        console.error("Error fetching data from API:", error);
        notification.error({
          message: "Error fetching data from API",
          description: error.message,
        });
      }
      isLoading.value = false;
    };

    const openDeviceActionData = async () => {
      const taskId = route.query.task_id as string;
      if (taskId) {
        const record = {
          task_id: taskId,
        };
        //
        // console.log("Constructed record:", record);

        // Call openPop and pass isFromDeviceActionData as true
        await openPop(record, true);
      } else {
        console.error("No task_id found in route query parameters.");
      }
    };

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
        { field: "period", header: "Period" },
        { field: "operator", header: "User" },
        { field: "count_limits", header: "Count Limits" },
        {
          field: "flow_limits",
          header: "Flow Rate Percentage Limits",
        },
        { field: "location", header: "Location" },
        { field: "cumulative", header: "Cumulative Data" },
        { field: "differential", header: "Differential Data" },
        { field: "model_name", header: "Model" },
        { field: "serial_number", header: "Serial #" },
        { field: "last_calibration_date", header: "Last Calibration Date" },
        { field: "firmware_version", header: "Firmware" },
        { field: "site_name", header: "Site Name" },
        { field: "comments", header: "Comment(s)" }
      );
      return devicePageHeader;
    };

    // Socket Data Handling
    socketService.handleMessage((incomingHeartbeat: any) => {
      tableData.value.forEach((taskResult: any, index: number) => {
        const processedHeartbeat = processHeartbeat(incomingHeartbeat);
        const deviceID = processedHeartbeat?.basic?.asset_id;
        const deviceTaskId = processedHeartbeat?.taskId;

        if (
          deviceID === taskResult?.meta?.asset_info?.asset_id &&
          deviceTaskId === taskResult.task_id
        ) {
          try {
            Object.assign(tableData.value[index], {
              connectionStatus: processedHeartbeat.connectionStatus,
              isSampling: processedHeartbeat.isSampling,
              actionStatus: processedHeartbeat.actionStatus,
              sampleType: processedHeartbeat.sampleType,
              jobId: processedHeartbeat.jobId,
              taskId: processedHeartbeat.taskId,
            });

            // Pass updated data along with the action if the record matches
            if (
              activeRecordId.value === taskResult.task_id &&
              isModalVisible.value
            ) {
              connectionData.value = {
                ...tableData.value[index],
                action: activeAction.value, // Ensure action is included
              };
            }
          } catch (e) {
            console.error(
              `Error updating instrument data for instrument id:${taskResult?.meta?.asset_info?.asset_id}`,
              e
            );
          }

          // Auto-disconnect logic
          try {
            if (tableData.value[index]["interval"]) {
              clearInterval(tableData.value[index]["interval"]);
            }

            tableData.value[index]["timer"] = new Date().getTime();
            tableData.value[index]["interval"] = setInterval(() => {
              try {
                if (
                  tableData.value[index] &&
                  new Date().getTime() - tableData.value[index]["timer"] >= 5000
                ) {
                  tableData.value[index]["connectionStatus"] = "disconnected";
                  clearInterval(tableData.value[index]["interval"]);

                  // Update modal data if this is the active record
                  if (
                    activeRecordId.value === taskResult.task_id &&
                    isModalVisible.value
                  ) {
                    connectionData.value = {
                      ...tableData.value[index],
                      action: activeAction.value, // Retain the action
                    };
                  }
                }
              } catch (e) {
                console.log("Unable to auto disconnect on no heartbeat", e);
              }
            }, 1000);
          } catch (e) {
            console.log("Error updating disconnect status", e);
          }
        }
      });
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
    const searchHeaders: any = ref([]);

    const fetchData = async (page: number) => {
      isLoading.value = true;
      const params: { [key: string]: any } = {
        to_show: true,
        orderBy: "id",
        is_asset_result: true,
        limit: 10,
        page: page,
      };
      fetchSearchKeys();
      searchHeaders.value.length = 0;

      if (searchKey && searchTerm) {
        params[searchKey] = searchTerm.trim();
        const searchedKeyFor = searchKeyMapping.value[searchKey] || searchKey;
        searchHeaders.value.push({
          [searchedKeyFor]: searchTerm,
        });
      }
      //after entering searchKey once for filter searchkey is modifying and viceversa
      if (selectedStatuses.value.length > 0) {
        if (searchKey === null && searchTerm === null) {
          searchKey = "status";
          searchTerm = selectedStatuses.value[0];
        }
        console.log("going inside the condition");
        params.status = selectedStatuses.value[0];
        searchHeaders.value.push({
          status: selectedStatuses.value[0],
        });
      }

      console.log("intial call", searchKey, searchTerm, selectedStatuses.value);

      // if (selectedStatuses.value.length === 0) {
      // }

      const searchCSVHeaders = JSON.stringify(searchHeaders);
      console.log(
        "going inside the condition required searchHeaders",
        searchCSVHeaders
      );
      params.searchHeaders = encodeURIComponent(searchCSVHeaders);

      if (!["id", "meta.cr_id"].includes(searchKey)) {
        params.strict = "no";
      }

      try {
        const response = await apcService.getTasksData(params);
        shouldReset.value = false;
        //console.log("newresponse", response);
        paginationTotalCount.value = response.pagination?.totalCount;
        // const userTimeZone = localStorage.getItem("timeZone");
        tableData.value = [
          ...response.data.map((taskResult: any) => {
            // taskResult.device_status = "disconnected";
            taskResult.connectionStatus = "disconnected";
            taskResult.isSampling = false;
            taskResult.actionStatus = "";
            taskResult.sampleType = "";
            taskResult.jobId = null;
            taskResult.taskId = null;

            if (taskResult.task_id) {
              taskResult.taskId = taskResult.task_id;
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
              "Force Dropping",
              "Aborting",
              "Aborted",
              "Force Dropped",
              "New",
              "In-Progress",
            ];

            if (PROCESSING_STATUSES.includes(taskResult.status)) {
              taskResult.actionStatus = taskResult.status;

              if (
                taskResult.status === "Force Dropped" ||
                taskResult.status === "Aborted"
              ) {
                taskResult.actionStatus = "";
              }
            }

            const convertedItem = { ...taskResult };
            columns.value.forEach((column: any) => {
              if (
                [
                  "measure_start_time",
                  "measure_end_time",
                  "created_date",
                  "last_updated_date",
                ].includes(column.dataIndex)
              ) {
                convertTimestamps(convertedItem, column.dataIndex);
              }
              if (
                t(`dataPage.${column.title}`, `${column.title}`) ===
                t("dataPage.Sample Status", "Sample Status")
              ) {
                column["customCell"] = (record: any) => ({
                  style: getCellStyle(
                    t("dataPage.Sample Status", "Sample Status"),
                    record
                  ),
                  // onClick: () => openPop(record),
                });
              }
            });

            const deviceIds = response.data
              .map(
                (taskResult: any) =>
                  taskResult?.meta?.asset_info?.asset_id ?? null
              )
              .filter((id: string | null) => id !== null);
            const filteredDeviceIds = deviceIds.filter(
              (deviceId: string | undefined) => deviceId
            );

            // Unsubscribe from devices that are no longer in the filtered list
            subscribedDeviceIds.value.forEach((deviceId) => {
              if (!filteredDeviceIds.includes(deviceId)) {
                socketService.leaveRooms([
                  `instrument/phmeter/${deviceId}/heartbeats/basic`,
                ]);
                subscribedDeviceIds.value.delete(deviceId);
              }
            });
            // Subscribe to new devices in the filtered list
            filteredDeviceIds.forEach((asset_id: any) => {
              if (!subscribedDeviceIds.value.has(asset_id)) {
                socketService.subscribeToRooms([
                  `instrument/phmeter/${asset_id}/heartbeats/basic`,
                ]);
                subscribedDeviceIds.value.add(asset_id);
              }
            });
            return convertedItem;
          }),
        ];
        //console.log(":::::::::TableData:::::::", tableData.value);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        isLoading.value = false;
        shouldReset.value = false;
      }

      setupWatchers();
    };

    // watch(locale, () => {
    //   columns.value.map((eachColumn: any) => {
    //     if (eachColumn.title === t("dataPage.Sample Status", "Sample Status")) {
    //       eachColumn["customCell"] = (record: any) => ({
    //         style: getCellStyle(
    //           t("dataPage.Sample Status", "Sample Status"),
    //           record
    //         ),
    //         // onClick: () => openPop(record),
    //       });
    //     }
    //   });
    // });
    watch(modalVisible, async (newVal) => {
      if (newVal && modalContent.value) {
        await nextTick();
        modalContent.value.scrollTop = 0;
      }
    });
    // watch(selectedStatuses, () => {
    //   alert("test");
    //   fetchData(currentPage.value);
    // });

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
      const limit = 2000;

      const params: { [key: string]: any } = {
        to_show: true,
        orderBy: "id",
        is_asset_result: true,
        locale: locale.value,
        limit,
      };

      if (!["id", "meta.cr_id"].includes(searchKey)) {
        params.strict = "no";
      }

      const dataHeaders = dataPageHeaders();
      if (searchTerm && searchTerm.trim() !== "") {
        params[`${searchKey}`] = searchTerm.trim();
      }

      if (selectedStatuses.value.length > 0 && searchKey !== "status") {
        params["status"] = selectedStatuses.value[0];
      }

      const exportParams = generateExportTypeParams(
        searchKey,
        searchTerm,
        dataType,
        dataHeaders,
        searchHeaders
      );
      exportParams.fileName = "Data";
      const dataParams = { ...params, ...exportParams };

      // console.log("exportParams", dataParams);
      console.log("Export params Headers -->", { ...params, ...exportParams });

      try {
        const data = await apcService.getTasksData(dataParams);
        exportFile(data, "data_page", dataType);
      } catch (error) {
        console.error("Error exporting data:", error);
      } finally {
        isLoading.value = false;
        isExportTypeLoading.value = false;
        if (paginationTotalCount.value > limit) {
          const messageText = t("dataPage.ExportMessage", {
            total: paginationTotalCount.value,
            limit: limit,
          });

          message.info(messageText);
        }
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
      //console.log("Handling confirmation...");
      fetchData(currentPage.value);
    };
    function getNestedProperty(sample: any, nestedkeypath: any) {
      return nestedkeypath
        .split(".")
        .reduce(
          (eachSample: any, eachkey: any) =>
            eachSample ? eachSample[eachkey] : undefined,
          sample
        );
    }
    function setNestedProperty(sample: any, path: any, value: any) {
      const keys = path.split(".");
      const lastKey = keys.pop();
      const lastsample = keys.reduce(
        (eachSample: any, eachkey: any) =>
          (eachSample[eachkey] = eachSample[eachkey] || {}),
        sample
      );
      lastsample[lastKey] = value;
      sample = lastsample;
    }
    function convertTimestamps(sample: any, ...timeProperties: string[]) {
      timeProperties.forEach((prop) => {
        try {
          if (getNestedProperty(sample, prop)) {
            // let timezone =
            //   sample?.meta?.asset_info?.site_info?.site_timezone || timeZone;
            setNestedProperty(sample, prop, getNestedProperty(sample, prop));
            //console.log("final sample", sample);
          }
        } catch (error) {
          console.error(
            `Error converting timestamp for property ${prop}:`,
            error
          );
        }
      });
    }
    const refreshDataPage = async () => {
      // console.log("::::::;refreshDatapage");
      currentPage.value = 1;

      // Trigger reset
      shouldReset.value = true;
      fetchData(currentPage.value);
    };
    const activeRecordId = ref<string | null>(null); // Track the active record ID

    const activeAction = ref<string | null>(null); // Track active action

    // Open Abort Modal
    const openAbortModal = (record: any, actionType: any, event: any) => {
      event.stopPropagation();
      isModalVisible.value = true;
      activeRecordId.value = record.task_id; // Set active record ID
      activeAction.value = actionType; // Set active action

      connectionData.value = { ...record, action: actionType }; // Pass action
    };

    const openForceDropModal = (record: any, actionType: any, event: any) => {
      event.stopPropagation();
      isModalVisible.value = true;
      activeRecordId.value = record.task_id; // Set active record ID
      activeAction.value = actionType; // Set active action
      connectionData.value = { ...record, action: actionType };
    };

    watch(isModalVisible, async (newValue) => {
      console.log("::: watch isMeasureModalVisible", newValue);
      // if (newValue === false) {
      //   await fetchData(currentPage.value);
      // }
    });

    const setupWatchers = () => {
      for (let i = 0; i < tableData.value.length; i++) {
        const item = tableData.value[i];
        watch(
          () => [item.actionStatus, item.isSampling],
          (
            [newActionStatus, newIsSampling],
            [oldActionStatus, oldIsSampling]
          ) => {
            // console.log(
            //   ":::: watch :::: newActionStatus ::: oldActionStatus",
            //   newActionStatus,
            //   oldActionStatus
            // );
            // console.log(
            //   ":::: watch :::: newIsSampling ::: oldIsSampling",
            //   newIsSampling,
            //   oldIsSampling
            // );
            if (
              newActionStatus !== oldActionStatus ||
              newIsSampling !== oldIsSampling
            ) {
              fetchData(currentPage.value);
              return;
            }
          }
        );
      }
    };

    onMounted(async () => {
      getUserRole();
      fetchData(currentPage.value);
      if (route.query.task_id) {
        await openDeviceActionData();
      }
    });

    onUnmounted(() => {
      // Unsubscribe from all rooms
      subscribedDeviceIds.value.forEach((deviceId) => {
        socketService.leaveRooms([
          `instrument/phmeter/${deviceId}/heartbeats/basic`,
        ]);
      });
      subscribedDeviceIds.value.clear();
    });

    return {
      deviceTypeId,
      searchHeaders,
      tableData,
      currentPage,
      modalVisible,
      modalTitle,
      modalStatus,
      modalData,
      shouldReset,
      modalTaskResult,
      columns,
      InfoCommentsData,
      customLocale,
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
      openDeviceActionData,
      showActionButtons,
      changeLocale,
      localizedTitles,
      translateRecordsAsPerLanguage,
      getPopupContainer,
      t,
      handleTableChange,
      modalContent,
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
.Force-dropping:hover {
  background-color: #fd9494 !important;
}
.force_dropping,
.force_dropping:hover {
  background-color: #fd9494 !important;
}

.aborted,
.aborted:hover {
  background-color: #fd9494 !important;
}
.aborting,
.aborting:hover {
  background-color: #fd9494 !important;
}

.external-sample,
.external-sample:hover {
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

.custom-table {
  position: relative;
  overflow: visible !important;
}

.custom-table .ant-table-container {
  overflow: visible !important;
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
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65) !important;

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
  &.aborting {
    background-color: #e89b96 !important;
  }
  &.external-sample {
    background-color: #e89b96 !important;
  }

  &.force-dropped {
    background-color: #e89b96 !important;
  }

  &.force-dropping {
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
  &.external-interrupt {
    background-color: #e89b96 !important;
  }

  &.in-progress-disconnect {
    background-color: #e89b96 !important;
  }
  &.in-progress-disconnected {
    background-color: #e89b96 !important;
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
