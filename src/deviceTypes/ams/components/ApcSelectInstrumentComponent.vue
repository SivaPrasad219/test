<template>
  <SearchComponent
    class="measure-search"
    :dropdownOptions="searchDropdownOptions"
    @search="performSearch"
    @reset="shouldResetSearchComponent"
    @exportType="exportDataByType"
    :isExportTypeLoading="isExportTypeLoading"
  />
  <a-table
    :columns="tableColumns"
    :data-source="tableData"
    row-key="id"
    :pagination="false"
    :loading="isLoading"
    size="middle"
    class="selectedInstrument custom-table"
  >
    <template #headerCell="{ column }">
      <ColumnTitle :column="column" />
    </template>
    <template #bodyCell="{ column, record }">
      <a-checkbox
        v-if="column.dataIndex === 'check'"
        :checked="record['id'] === selectedRowKey"
        :class="getCheckboxClass()"
        :disabled="
          isCurrentStepTwo ||
          record.connection_status.toLowerCase() === 'disconnected' ||
          record.isSampling === true ||
          record.isTaskInProgress === true ||
          record.asset__site___name === null ||
          record.isAssetTimeIsMatching === false
        "
        @change="handleCheckboxChange($event, record['id'], record)"
      />

      <template v-if="column.dataIndex === 'connection_status'">
        <a-popover
          v-if="column.title"
          trigger="hover"
          placement="rightTop"
          :overlayStyle="{ maxWidth: '350px' }"
        >
          <span
            :style="
              getStatusCellStyle(
                record.connection_status.toLowerCase(),
                record.isSampling,
                record.isTaskInProgress,
                record.isAssetTimeIsMatching
              )
            "
          >
            {{
              getStatusText(
                record.connection_status?.toLowerCase(),
                record.isSampling,
                record.isTaskInProgress,
                record.isAssetTimeIsMatching
              )
            }}
          </span>
          <!-- Popover Content -->
          <template #content>
            <div>
              <!-- Main Status -->
              <div style="font-weight: bold; margin-bottom: 5px">
                {{
                  getStatusText(
                    record.connection_status?.toLowerCase(),
                    record.isSampling,
                    record.isTaskInProgress,
                    record.isAssetTimeIsMatching
                  )
                }}
              </div>
              <!-- Additional Device Details -->
              <div>
                {{
                  getDevicePopoverStatus(
                    record,
                    record.isSampling,
                    record.isTaskInProgress
                  )
                }}
              </div>
            </div>
          </template>
        </a-popover>
      </template>

      <div v-if="column.dataIndex === 'data'">
        <img
          src="@/assets/icons/sample.gif"
          alt="sampling"
          class="status-icons"
          v-if="
            record.isSampling &&
            (record?.sampleType?.includes('Sample') ||
              record?.sampleType === '') &&
            record.connection_status.toLowerCase() === 'connected' &&
            record.isSampling === true
          "
        />
        <img
          src="@/assets/icons/flush.gif"
          alt="flushing"
          class="status-icons"
          v-if="
            record.isSampling &&
            record?.sampleType?.includes('Flush') &&
            record.connection_status.toLowerCase() === 'connected' &&
            record.isSampling === true
          "
        />
        <img
          src="@/assets/icons/data.png"
          alt="data"
          class="status-icons"
          style="padding: 5px"
          @click="handleDataImageClick(record)"
          v-if="
            !record.isSampling &&
            record.taskResultId &&
            (record.connection_status === 'connected' ||
              record.connection_status === 'disconnected')
          "
        />
      </div>
      <div v-if="column.dataIndex === 'exception'">
        <a-space>
          <a-button
            v-if="
              record.isSampling &&
              record.connection_status === 'disconnected' &&
              (record.actionStatus.toLowerCase() === 'in-progress' ||
                record.actionStatus === '')
            "
            @click="openForceDropModal(record, 'Force Drop')"
            type="primary"
            danger
            size="small"
            >{{ translateLabel("dataPage", "Force Drop") }}</a-button
          >
          <a-button
            v-if="
              record.isSampling === true &&
              record.connection_status === 'connected' &&
              record.actionStatus.toLowerCase() === 'in-progress'
            "
            @click="openAbortModal(record, 'Abort')"
            type="primary"
            size="small"
            :style="{ backgroundColor: '#e68754' }"
            >{{ translateLabel("dataPage", "Abort") }}</a-button
          >
        </a-space>
      </div>
    </template>
    <template #emptyText>
      <div class="no-data-available">
        {{ translateLabel("dataPage", "No data available") }}
      </div>
    </template>
  </a-table>
  <div style="text-align: right; padding: 10px 0px">
    <a-pagination
      v-model:current="currentPage"
      :total="paginationDetails"
      @change="handlePageChange(currentPage)"
      :show-size-changer="false"
      defaultPageSize="10"
    />
  </div>
  <esign-verify-modal
    :open="isMeasureModalVisible"
    @update:open="isMeasureModalVisible = $event"
    :data="connectionData"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  reactive,
  watch,
  CSSProperties,
} from "vue";

import selectInstrument from "../config/selectInstrument.json";
import { fetchDataFromAPI } from "../../../services/apiService";
import { SocketService } from "@/services/socketService";
import SearchComponent from "./ApcSearchComponent.vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { environment } from "@/environment/environment";
import {
  formatMeasureTime,
  compareAssetTime,
  processHeartbeat,
  translateLabel,
} from "@/common/utils";
import { useI18n } from "vue-i18n";
import eventBus from "@/services/eventBus";
import ColumnTitle from "./ColumnTitle.vue";
import esignVerifyModal from "@/components/esignVerifyModal.vue";
import { message } from "ant-design-vue";

export default defineComponent({
  name: "ApcSelectInstrumentComponent",
  components: {
    SearchComponent,
    esignVerifyModal,
    ColumnTitle,
  },
  emits: ["instrumentSelected", "sampleStarted"],
  setup(_, { emit }) {
    const selectedTableRecord = ref({});
    const searchKey = ref<string | null>(null);
    const searchTerm = ref<string | null>(null);
    const exportDataType = ref<string | null>(null);
    const isDataLoaded = ref(false);
    const store = useStore();
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);
    const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");

    const tableData = ref<any[]>([]);
    const currentPage = ref(1);
    const isExportTypeLoading = ref(false);
    const paginationDetails = ref(1);
    const searchKeyMapping = ref<{ [key: string]: string }>({});
    const isLoading = ref(false);
    let connectionData: any = reactive({});
    const selectedRowKey = ref<any | null>(null);
    const router = useRouter();
    const { locale } = useI18n();
    let limit = 2000;
    const { t } = useI18n();

    const currentStep = computed(() => store.getters.getCurrentStep);

    const isCurrentStepTwo = computed(() => currentStep.value === 1);

    console.log(":::::::;currentStep", currentStep.value);

    socketService.connectSocket();

    const isMeasureModalVisible = ref(false);

    const dropdownOptions = ref(selectInstrument?.dropdownOptions);
    const searchDropdownOptions = computed(() => {
      return dropdownOptions.value?.map((eachColumn: any) => {
        return {
          ...eachColumn,
          label: eachColumn.label,
        };
      });
    });
    const originalTableColumns = ref(selectInstrument?.table?.columns);

    const tableColumns = computed(() => {
      return originalTableColumns.value?.map((eachColumn) => {
        if (eachColumn.title === "Status") {
          return {
            ...eachColumn,
            title: eachColumn.title,
            // filters: [
            //   {
            //     text: "Ready For Use",
            //     value: "connected",
            //   },
            //   {
            //     text: "Disconnected",
            //     value: "disconnected",
            //   },
            //   {
            //     text: "Inactivated",
            //     value: "disabled",
            //   },
            //   { text: "In-Use", value: "in-Use" },
            // ],
            // onFilter: (value: any, record: any) => {
            //   console.log(
            //     "::: record.connection_status :::",
            //     record?.connection_status
            //   );
            //   return (
            //     record.connection_status?.toLowerCase() === value.toLowerCase()
            //   );
            // },
            // filtered: selectedStatusFilter.value.length > 0,
            // filteredValue:
            //   selectedStatusFilter.value.length > 0
            //     ? selectedStatusFilter.value
            //     : null,
            // filterMultiple: false,
          };
        } else {
          return {
            ...eachColumn,
            title: eachColumn.title,
          };
        }
      });
    });

    // const selectedStatusFilter = ref<string[]>([]);
    // const handleSelectedStatusFilter = async (
    //   pagination: any,
    //   sorters: any,
    //   filters: any
    // ) => {
    //   console.log("selected ", pagination, sorters, filters);
    //   const selectedFilter = sorters["connection_status"] || [];
    //   // searchKey = "connection_status";
    //   // searchTerm = selectedFilter[0];
    //   //console.log("is device active state for status filter value", searchTerm);
    //   //console.log("Selected filter array", selectedFilter);
    //   selectedStatusFilter.value = selectedFilter;
    //   currentPage.value = 1;
    //   await fetchData();
    // };
    const measurePageHeader = ref(selectInstrument?.measurePageHeader || []);
    let tableHeaders = JSON.stringify(measurePageHeader.value);

    // Track subscribed rooms
    const subscribedDeviceIds = ref<Set<string>>(new Set());

    // watch(
    //   () => tableData.value?.map((item) => item.taskId) || [], // Ensure it's always an array
    //   (newTaskIds, oldTaskIds = []) => {
    //     // Safeguard to ensure both newTaskIds and oldTaskIds are arrays
    //     const updatedTaskIds = newTaskIds?.filter(
    //       (taskId, index) => taskId !== oldTaskIds[index]
    //     );

    //     // Log the new or updated taskIds
    //     console.log("New or updated taskIds:", updatedTaskIds);

    //     // Perform your API call or any other action for the updated taskIds
    //     updatedTaskIds?.forEach((taskId) => {
    //       if (taskId) {
    //         console.log("Make a task result API call for:", taskId);
    //       }
    //       // Example: Call fetchTaskResult(taskId)
    //     });
    //   },
    //   { deep: true } // Ensure deep observation of taskId
    // );

    const fetchData = async (exportType?: any, fileName?: any) => {
      isLoading.value = true;
      fetchSearchKeys();
      try {
        if (currentPage.value === 0) currentPage.value = 1;
        const params: any = {
          page: currentPage.value,
          orderBy: selectInstrument?.table?.defaultOrderBy,
          limit: selectInstrument?.table?.defaultLimit,
          strict: selectInstrument?.table?.defaultStrict,
          asset_type_id: deviceTypeId.value,
          ...(searchKey.value && searchTerm.value
            ? { [searchKey.value]: searchTerm.value, strict: "no" }
            : {}),
        };
        if (exportType !== undefined) {
          params.exportType = exportType;
          params.tableHeaders = encodeURIComponent(tableHeaders);
          params.fileName = "Measure";
          params.locale = locale.value;
          params.limit = limit;
          delete params.page;
          const searchHeaders: any = {};
          if (searchKey.value && searchTerm.value) {
            const searchedKeyFor =
              searchKeyMapping.value[searchKey.value] || searchKey.value;
            searchHeaders[searchedKeyFor] = searchTerm.value;
            //searchHeaders["searchValue"] = searchTerm.value;
            let searchCSVHeaders = JSON.stringify([searchHeaders]);
            params.searchHeaders = encodeURIComponent(searchCSVHeaders);
          }
          console.log("#Params::: in instrument page", params);
        }

        const response = await fetchDataFromAPI(
          "/pm/asset?status=Onboarded",
          "GET",
          params,
          undefined,
          fileName
        );

        if (exportType) console.log("#Params response:::", params, response);
        console.log("pagination response after first call", response);
        if (paginationDetails.value) {
          console.log("response after the second call", response);
          paginationDetails.value = response?.pagination?.totalCount;
          console.log("paginationDetails", paginationDetails.value);
        } else {
          console.error("Pagination task or pagination property is undefined");
        }

        tableData.value = response.data;
        console.log("export start-4", tableData.value); // table data printing null after api call for downloading.

        tableData.value?.forEach((asset) => {
          asset.status = "disconnected";
          asset.connectionStatus = "disconnected";
          asset.connection_status = "disconnected";
          asset.isSampling = false;
          asset.actionStatus = "";
          asset.sampleType = "";
          asset.jobId = null;
          asset.taskId = null;
          asset.taskResultId = null;
          asset.isTaskInProgress = false;
          asset.isAssetTimeIsMatching = false;

          if (asset?.meta?.sample_data?.sample_type) {
            console.log("set taskID from asset table");
            asset.isSampling = true;
          }

          if (asset?.meta?.sample_data?.cancel_operation) {
            asset.isSampling = true;
            if (asset?.meta?.sample_data?.cancel_operation === "force-drop") {
              asset.actionStatus = "Force-Dropping";
            }
            if (asset?.meta?.sample_data?.cancel_operation === "abort") {
              asset.actionStatus = "Aborting";
            }
          }

          if (asset?.meta?.sample_data?.job_id) {
            asset.jobId = asset.meta.sample_data?.job_id;
          }
          if (asset?.meta?.sample_data?.id) {
            asset.taskId = asset?.meta?.sample_data?.id;
          }

          if (asset?.meta?.sample_data?.task_id) {
            asset.taskId = asset?.meta?.sample_data?.task_id;
          }

          if (asset?.meta?.sample_data?.task_result_id) {
            asset.taskResultId = asset?.meta?.sample_data?.task_result_id;
          }
          if (asset.connectionStatus.toLowerCase() === "disconnected") {
            asset.create_timestamp = "";
          } else {
            asset.create_timestamp = formatMeasureTime(
              asset.create_timestamp,
              asset.asset__site___timezone
            );
          }
          if (asset.asset__site___name === null) {
            asset.create_timestamp = "Site Name Not assigned";
          }
        });

        const deviceIds = response.data?.map((device: any) => device.asset_id);
        const filteredDeviceIds =
          deviceIds?.filter((deviceId: string | undefined) => deviceId) || []; // Ensure filteredDeviceIds is always an array

        // Safeguard: Ensure subscribedDeviceIds.value is initialized and is a Set
        if (!subscribedDeviceIds.value) {
          subscribedDeviceIds.value = new Set();
        }

        // Unsubscribe from devices that are no longer in the filtered list
        subscribedDeviceIds.value?.forEach((deviceId) => {
          if (!filteredDeviceIds.includes(deviceId)) {
            console.log(`Unsubscribing from: ${deviceId}`);
            socketService.leaveRooms([
              `instrument/ams/${deviceId}/heartbeats/basic`,
            ]);

            subscribedDeviceIds.value.delete(deviceId); // Safely remove the deviceId
          }
        });

        // Subscribe to new devices in the filtered list
        filteredDeviceIds?.forEach((asset_id: any) => {
          if (!subscribedDeviceIds.value.has(asset_id)) {
            console.log(`Subscribing to: ${asset_id}`);
            socketService.subscribeToRooms([
              `instrument/ams/${asset_id}/heartbeats/basic`,
            ]);
            subscribedDeviceIds.value.add(asset_id); // Add the asset_id to the Set
          }
        });

        isLoading.value = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        isLoading.value = false;
      }
    };

    const performSearch = async (values: {
      selectedKey: string | null;
      searchQuery: string;
    }) => {
      searchKey.value = values.selectedKey;
      searchTerm.value = values.searchQuery.trim();
      currentPage.value = 1;
      await fetchData();
    };

    const shouldResetSearchComponent = async () => {
      searchKey.value = null;
      searchTerm.value = null;
      currentPage.value = 1;
      await fetchData();
      return true;
    };

    const exportDataByType = async (dataType: string) => {
      isExportTypeLoading.value = true;
      exportDataType.value = dataType;

      console.log("paginationDetails.value:::::::::", paginationDetails.value);
      await fetchData(exportDataType.value, "measure_page");
      await fetchData(undefined, "measure_page");
      // tableData.value = response;

      isExportTypeLoading.value = false;
      if (paginationDetails.value > limit) {
        const messageText = t("devicePage.ExportMessage", {
          total: paginationDetails.value,
          limit: limit,
        });

        message.info(messageText);
      }
    };

    const handlePageChange = async (page: number) => {
      currentPage.value = page;
      await fetchSearchKeys();
      await fetchData();
      await fetchSearchKeys();
    };
    const handleDataImageClick = (record: any) => {
      console.log("Image clicked!");
      console.log("recordData from the measurePage", record.taskId);
      router.push({
        path: "/ams/data",
        query: { task_result_id: record.taskResultId },
      });
    };

    const fetchSearchKeys = async () => {
      try {
        const dropdownOptions = selectInstrument?.dropdownOptions;
        searchKeyMapping.value = dropdownOptions.reduce(
          (acc: { [key: string]: string }, item: any) => {
            acc[item.value] = item.label;
            return acc;
          },
          {}
        );
      } catch (error) {
        console.error("Error fetching search keys:", error);
      }
    };

    const handleSelectedTableRowClick = (record: any) => {
      selectedTableRecord.value = record;
      emit("instrumentSelected", record);
    };

    socketService.handleMessage((incomingHeartbeat: any) => {
      // console.log("::: handleMessage - incoming heartbeat", incomingHeartbeat);
      tableData.value?.forEach((asset: any, index: number) => {
        // console.log("::: handleMessage - asset for table :::", asset);
        const processedHeartbeat = processHeartbeat(incomingHeartbeat);
        const deviceID = processedHeartbeat?.basic?.asset_id;
        if (deviceID && asset.id && deviceID == asset.asset_id) {
          try {
            Object.assign(tableData.value[index], {
              status: processedHeartbeat?.status,
              connectionStatus: processedHeartbeat.connectionStatus,
              isSampling: processedHeartbeat.isSampling,
              actionStatus: processedHeartbeat.actionStatus,
              sampleType: processedHeartbeat.sampleType,
              jobId: processedHeartbeat.jobId,
              taskId: processedHeartbeat.taskId,
              taskResultId: processedHeartbeat.taskResultId,
              isTaskInProgress: processedHeartbeat.isTaskInProgress,
            });
          } catch (e) {
            console.error(
              `Error updating instrument data for instrument id:${asset.asset_id}`,
              e
            );
          }

          try {
            // console.log(
            //   "connection status upated",
            //   tableData.value[index].connectionStatus
            // );
            tableData.value[index].connection_status =
              tableData.value[index].connectionStatus;
          } catch (e) {
            console.log("error while updating connection_status");
          }

          try {
            if (tableData.value[index]["interval"]) {
              clearInterval(tableData.value[index]["interval"]);
            }

            tableData.value[index]["timer"] = new Date().getTime();
            tableData.value[index]["interval"] = setInterval(() => {
              try {
                if (
                  tableData.value[index] &&
                  new Date().getTime() - tableData.value[index]["timer"] >=
                    10000
                ) {
                  tableData.value[index]["status"] = "disconnected";
                  tableData.value[index]["connectionStatus"] = "disconnected";
                  tableData.value[index]["connection_status"] = "disconnected";
                  tableData.value[index].create_timestamp = "";

                  clearInterval(tableData.value[index]["interval"]);
                }
              } catch (e) {
                console.log("Unable to auto disconnect on no heartbeat", e);
              }
            }, 1000);
          } catch (e) {
            console.log("Error updating disconnect status", e);
          }

          // try {
          //   tableData.value[index].create_timestamp = formatMeasureTime(
          //     processedHeartbeat?.basic?.asset_time?.time,
          //     tableData.value[index].asset__site___timezone
          //   );
          // } catch (e) {
          //   console.error(
          //     `Discovered time not updated for instrument ent id ${asset.id}`,
          //     e
          //   );
          // }

          try {
            const assetTimeObj = processedHeartbeat?.basic?.asset_time;
            const siteTimezone = tableData.value[index].asset__site___timezone;
            const isTimeValid = compareAssetTime(assetTimeObj, siteTimezone);
            if (isTimeValid) {
              tableData.value[index].create_timestamp = formatMeasureTime(
                assetTimeObj.time,
                siteTimezone
              );
              tableData.value[index].isAssetTimeIsMatching = true;
            } else {
              tableData.value[index].create_timestamp = "Time is out of sync";
              tableData.value[index].isAssetTimeIsMatching = false;
            }
            if (tableData.value[index].asset__site___name === null) {
              tableData.value[index].create_timestamp =
                "Site Name Not assigned";
            }
          } catch (e) {
            console.error(
              `Discovered time not updated for instrument id ${tableData.value[index].asset_id}`,
              e
            );
          }

          if (processedHeartbeat.connectionStatus === "disconnected") {
            tableData.value[index].create_timestamp = "";
          }
          // if (
          //   (processedHeartbeat.is_cr_running === true &&
          //     processedHeartbeat.device_status !== "disconnected") ||
          //   processedHeartbeat.device_status === "running"
          // ) {
          //   tableData.value[index].connectionStatus = "running";
          //   console.log(
          //     "#tableData.value[index].connectionStatus:::",
          //     tableData.value[index].connectionStatus
          //   );
          // }
          // console.log("::: handleMessage - asset after updating  :::", asset);
          //console.log("::: handleMessage - tableData.value[index] :::", tableData.value[index]);
        }
      });
    });

    const openAbortModal = (record: any, actionType: any) => {
      isMeasureModalVisible.value = true;
      console.log("::::::recordAbortData", record);
      connectionData.value = record;
      connectionData.value.action = actionType;
    };
    const openForceDropModal = (record: any, actionType: any) => {
      isMeasureModalVisible.value = true;
      connectionData.value = record;
      connectionData.value.action = actionType;
    };

    const closeModal = () => {
      isMeasureModalVisible.value = false;
    };

    const getStatusCellStyle = (
      connectionStatus: any,
      isSampling: boolean,
      isTaskInProgress: boolean,
      isAssetTimeIsMatching: boolean
    ): CSSProperties => {
      const baseStyle: CSSProperties = {
        borderRadius: "15px",
        width: "130px",
        height: "auto",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        wordWrap: "break-word",
        overflowWrap: "break-word",
      };

      let assetStatus: string;

      if (
        connectionStatus === "connected" &&
        !isSampling &&
        !isTaskInProgress &&
        isAssetTimeIsMatching === true
      ) {
        assetStatus = "connected";
      } else if (
        connectionStatus === "connected" &&
        (isSampling || isTaskInProgress)
      ) {
        assetStatus = "running";
      } else if (
        connectionStatus === "connected" &&
        (isSampling === true ||
          isTaskInProgress === true ||
          isAssetTimeIsMatching === false)
      ) {
        assetStatus = "notready";
      } else {
        assetStatus = "disconnected";
      }

      switch (assetStatus) {
        case "connected":
          return {
            ...baseStyle,
            backgroundColor: "#94e498",
          };
        case "running":
          return {
            ...baseStyle,
            backgroundColor: "#94d2de",
          };
        case "notready":
          return {
            ...baseStyle,
            backgroundColor: "#e89b96",
          };
        case "disconnected":
          return {
            ...baseStyle,
            backgroundColor: "#e89b96",
          };
        default:
          return baseStyle;
      }
    };

    type DeviceState =
      | "connected"
      | "Inactivated"
      | "disconnected"
      | "Disabled"
      | "New"
      | "Ready for Use"
      | "running"
      | "default"
      | "notReadyForUse";

    const getDevicePopoverStatus = (
      record: any,
      isSampling: boolean,
      isTaskInProgress: boolean
    ) => {
      const statusMessages: { [key in DeviceState]: string } = {
        connected: "Instrument is ready to start measurements",
        Inactivated: "Instrument inactivated when it is in connected State",
        disconnected: "Instrument is in disconnected State",
        Disabled: "Instrument inactivated when it is in disconnected State",
        New: "Instrument is ready to get onboarded",
        "Ready for Use": "Instrument is ready to start measurements",
        running: "Instrument is executing measurements",
        notReadyForUse: "Instrument is not available for measurement",
        default: "Unknown State",
      };
      const statusType = () => {
        if (record.connection_status === "disconnected" && !record.is_active) {
          return "Disabled";
        } else if (
          record.connection_status === "connected" &&
          !record.is_active
        ) {
          return "Inactivated";
        } else if (
          record.connection_status === "connected" &&
          (isSampling || isTaskInProgress)
        ) {
          return "running";
        } else if (
          record.connection_status === "connected" &&
          record.isAssetTimeIsMatching === false
        ) {
          return "notReadyForUse";
        } else {
          return record.connection_status;
        }
      };

      const devicePop: DeviceState = statusType();
      return (
        t(`devicePage.${statusMessages[devicePop]}`) ||
        statusMessages["default"]
      );
    };

    const handleCheckboxChange = (e: any, key: any, record: any) => {
      const checked = e.target.checked;
      selectedRowKey.value = checked ? key : null;
      emit("instrumentSelected", checked ? record : null);
    };

    const getStatusText = (
      connectionStatus: string,
      isSampling: boolean,
      isTaskInProgress: boolean,
      isAssetTimeIsMatching: boolean
    ): string => {
      // console.log(
      //   "getStatusText() -> isSampling",
      //   isSampling,
      //   connectionStatus,
      //   isTaskInProgress,
      //   isAssetTimeIsMatching
      // );

      if (
        connectionStatus === "connected" &&
        isSampling === false &&
        isTaskInProgress === false &&
        isAssetTimeIsMatching === true
      ) {
        return translateLabel("devicePage", "Ready For Use");
      } else if (
        connectionStatus === "connected" &&
        (isSampling === true || isTaskInProgress === true)
      ) {
        return translateLabel("devicePage", "In-Use");
      } else if (
        connectionStatus === "connected" &&
        (isSampling === true ||
          isTaskInProgress === true ||
          isAssetTimeIsMatching === false)
      ) {
        return translateLabel("devicePage", "Not Ready for Use");
      } else {
        return translateLabel("devicePage", "Disconnected");
      }
    };

    // const isCheckboxDisplay = (record: any): boolean => {
    //   return (
    //     record.device_status === "running" ||
    //     record.device_status === "disconnected"
    //   );
    // };

    const getCheckboxClass = (): string => {
      return isCurrentStepTwo.value ? "disabledCheckbox" : "";
    };

    const handleSampleStarted = () => {
      selectedRowKey.value = null;
      currentPage.value = 1;
      fetchData();
      emit("sampleStarted");
    };

    watch(isMeasureModalVisible, async (newValue) => {
      console.log("::: watch isMeasureModalVisible", newValue);
      if (newValue === false) {
        await fetchSearchKeys();
        await fetchData();
      }
    });

    onMounted(async () => {
      await fetchSearchKeys();
      await fetchData();
      isDataLoaded.value = true;
      eventBus.on("clearChekboxAndMoveToStep1", handleSampleStarted);
    });

    onUnmounted(() => {
      // Unsubscribe from all rooms
      subscribedDeviceIds.value.forEach((deviceId) => {
        socketService.leaveRooms([
          `instrument/ams/${deviceId}/heartbeats/basic`,
        ]);
      });
      subscribedDeviceIds.value.clear();

      eventBus.off("clearChekboxAndMoveToStep1", handleSampleStarted);
    });

    return {
      tableData,
      currentPage,
      performSearch,
      handlePageChange,
      handleSelectedTableRowClick,
      shouldResetSearchComponent,
      handleSampleStarted,
      exportDataByType,
      paginationDetails,
      isExportTypeLoading,
      searchDropdownOptions,
      tableColumns,
      isLoading,
      isMeasureModalVisible,
      getStatusText,
      // isCheckboxDisplay,
      isCurrentStepTwo,
      getCheckboxClass,
      getStatusCellStyle,
      handleCheckboxChange,
      selectedRowKey,
      connectionData,
      openForceDropModal,
      openAbortModal,
      closeModal,
      handleDataImageClick,
      translateLabel,
      getDevicePopoverStatus,
      //handleSelectedStatusFilter,
    };
  },
});
</script>

<style scoped>
.row {
  display: flex;
  margin-bottom: 20px;
}

.first-row-container {
  max-height: 300px;
  min-height: 300px;
  overflow-y: auto;
}

.column-15 {
  flex: 15%;
}

.ImageStatistics {
  width: 10rem;
}

.column-60 {
  flex: 60%;
}

.column-25 {
  flex: 25%;
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
}

.sampleStatsKey {
  width: 100%;
  margin-right: 10px;
  font-weight: bold;
}

.selectedInstrument .ant-checkbox-wrapper {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.selectedInstrument .ant-checkbox-inner {
  width: 22px !important;
  height: 22px !important;
  border: 2px solid #1890ff !important;
  border-radius: 3px !important;
}

.selectedInstrument {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  background-color: rgba(242, 242, 242, 1) !important;
}

.selectedInstrument tr {
  background-color: rgba(242, 242, 242, 1) !important;
}

.disabledCheckbox .ant-checkbox-inner {
  width: 22px !important;
  height: 22px !important;
  border: 2px solid #dbdbdb !important;
  border-radius: 3px !important;
}

.selectedInstrument .ant-table-tbody > tr {
  background-color: rgba(242, 242, 242, 1) !important;
}

.selectedInstrument .ant-table-tbody > tr > td {
  border-bottom: 1px solid #e8e8e8 !important;
}

.selectedInstrument .ant-table-tbody > tr:hover td {
  background-color: aliceblue !important;
}

.status-icons {
  width: 25px;
}
.status-text {
  display: inline-block;
  white-space: nowrap; /* Prevent text from wrapping */
  overflow: hidden; /* Hide overflowed text */
  text-overflow: ellipsis; /* Show ellipsis (...) for overflowing text */
  max-width: 120px; /* Set a max width to make it overflow */
  cursor: pointer; /* Make it look clickable (for the popover) */
}
</style>
