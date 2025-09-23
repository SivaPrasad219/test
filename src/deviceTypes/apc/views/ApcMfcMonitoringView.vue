<template>
  <div class="mfc-monitoring-view">
    <div class="page-header">
      <div class="header-top">
        <h1 class="page-title">
          {{ translateLabel("mfgPage", "MFG Monitoring") }}
        </h1>
        <div class="global-buttons">
          <a-button
            type="primary"
            size="small"
            class="refresh-btn"
            :loading="isRefreshing"
            @click="refreshView"
          >
            <template #icon>
              <SyncOutlined :spin="isRefreshing" />
            </template>
            {{ translateLabel("mfgPage", "Refresh") }}
          </a-button>
          <a-button type="primary" size="small" class="sort-btn">
            <template #icon>
              <SortAscendingOutlined />
            </template>
            {{ translateLabel("mfgPage", "Sort Cards") }}
          </a-button>
          <a-button type="primary" size="small" class="manage-btn">
            <template #icon>
              <SettingOutlined />
            </template>
            {{ translateLabel("mfgPage", "Manage Cards") }}
          </a-button>
          <a-button
            type="default"
            size="small"
            class="export-btn"
            :loading="isExporting"
            @click="exportCSV"
          >
            <template #icon>
              <ExportOutlined />
            </template>
            {{ `${translateLabel("mfgPage", "Export")} CSV` }}
          </a-button>
        </div>
      </div>
    </div>

    <a-row :gutter="16" class="monitoring-layout">
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="left-panel">
        <div class="device-cards-container">
          <MfcDeviceCard
            v-for="device in devices"
            :key="device.id"
            :device-name="device.name"
            :device-id="device.id"
            :location="device.location"
            :control-badge="device.controlBadge"
            :sample-data="device.sampleData"
            :program="device.program || '-'"
            :asset-time="device.assetTime"
          />

          <!-- Empty state when no devices are running -->
          <div v-if="devices.length === 0" class="empty-state">
            <div class="empty-state-content">
              <ExperimentOutlined class="empty-state-icon" />
              <h3 class="empty-state-title">
                {{ translateLabel("mfgPage", "Ready for Monitoring") }}
              </h3>
              <p class="empty-state-description">
                {{
                  translateLabel(
                    "mfgPage",
                    "There are no instruments running samples right now"
                  )
                }}{{
                  translateLabel(
                    "mfgPage",
                    "Instruments will be displayed here once they start"
                  )
                }}
              </p>
            </div>
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16" class="right-panel">
        <div class="alerts-section">
          <MfcActiveAlertsTable
            :alerts="alerts"
            :loading="isLoadingAlerts"
            :total-alerts="totalAlerts"
            :current-page="currentAlertsPage"
            :page-size="alertsPageSize"
            @pagination-change="handleAlertsPaginationChange"
            @alert-confirm-success="handleAlertConfirmSuccess"
            @fetch-all-alerts="handleFetchAllAlerts"
          />
        </div>

        <div class="monitoring-section">
          <MfcContinuousMonitoringTable
            :samples="monitoringSamples"
            :original-data="originalSamplesData"
            :total-samples="totalSamples"
            :new-samples="newSamples"
            :selected-sample-filter="selectedSampleFilter"
            :selected-sort-by="selectedSortBy"
            :search-query="searchQuery"
            :loading="isLoadingMonitoring"
            :current-page="currentPage"
            :page-size="pageSize"
            @update:selected-sample-filter="selectedSampleFilter = $event"
            @update:selected-sort-by="selectedSortBy = $event"
            @update:search-query="searchQuery = $event"
            @pagination-change="handleMonitoringPaginationChange"
            @update:mfg-table-header="mfgTableHeader = $event"
            @mfg-data-confirm="handleMfgDataConfirm"
            @fetch-all-unacked="handleFetchAllUnacked"
            @modal-visible-change="isModalVisible = $event"
          />
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { translateLabel } from "@/common/utils";
import {
  SyncOutlined,
  ExportOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  ExperimentOutlined,
} from "@ant-design/icons-vue";
import MfcDeviceCard from "../components/mfc/MfcDeviceCard.vue";
import MfcActiveAlertsTable from "../components/mfc/MfcActiveAlertsTable.vue";
import MfcContinuousMonitoringTable from "../components/mfc/MfcContinuousMonitoringTable.vue";
import { SocketService } from "@/services/socketService";
import {
  fetchDataFromAPI,
  getTaskResultsWithNotifications,
} from "@/services/apiService";
import { environment } from "@/environment/environment";
import { processHeartbeat, generateExportTypeParams } from "@/common/utils";
import { apcApiServices } from "../services/apcService";
import exportFile from "@/services/exportFile";
import moment from "moment-timezone";
import eventBus from "@/services/eventBus";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

const modelName = "";
// Initialize apc service
const apcService = new apcApiServices();

const mfgTableHeader = ref<{ field: string; header: string }[]>([]);

const mfgDataPageHeaders = [
  {
    header: "Sample Status",
    field: "status",
  },
  {
    header: "Sample Type",
    field: "meta.sample_type_label",
  },
  {
    field: "volume",
    header: "Volume",
  },
  {
    field: "meta.input.id",
    header: "Text ID",
  },
  {
    header: "Program",
    field: "meta.input.program",
  },
  {
    field: "meta.input.worklistid",
    header: "Worklist ID",
  },
  {
    field: "meta.input.limssampleid",
    header: "LIMS Sample #",
  },
  {
    header: "Location",
    field: "meta.input.location",
  },
  {
    header: "Notes",
    field: "meta.input.notes",
  },
  {
    field: "period",
    header: "Period",
  },
  {
    header: "Measure Start Time",
    field: "measure_start_time",
  },
  {
    header: "Measure End Time",
    field: "measure_end_time",
  },
  {
    header: "Sample ID",
    field: "id",
  },
  {
    field: "cumulative",
    header: "Cumulative Data",
  },
  {
    field: "differential",
    header: "Differential Data",
  },
  {
    field: "model_name",
    header: "Model",
  },
  {
    field: "serial_number",
    header: "Serial #",
  },
  {
    field: "last_calibration_date",
    header: "Last Calibration Date",
  },
  {
    field: "next_calibration_date",
    header: "Next Calibration Date",
  },
  {
    field: "firmware_version",
    header: "Firmware",
  },
  {
    field: "site_name",
    header: "Site Name",
  },
  {
    header: "Instrument Name",
    field: "meta.asset_info.name",
  },
  {
    header: "Source",
    field: "meta.source",
  },
  {
    header: "Continuous Run ID",
    field: "meta.cr_id",
  },
  {
    field: "operator",
    header: "User",
  },
  {
    field: "comments",
    header: "Comment(s)",
  },
];

const isExporting = ref(false);
const isRefreshing = ref(false);
const isLoadingAlerts = ref(false);
const isLoadingMonitoring = ref(false);

// Header controls
const selectedSampleFilter = ref("id");
const selectedSortBy = ref("newest");
const searchQuery = ref("");
const statusFilter = ref("");

// Dashboard data
const devices = ref<any[]>([]);
const alerts = ref<any[]>([]);
const monitoringSamples = ref<any[]>([]);
const originalSamplesData = ref<any[]>([]); // Store original API response data
const fetchedAssets = ref<any[]>([]); // Store all fetched assets for filtering notifications
const totalSamples = ref(0);
const newSamples = ref(0);
const isModalVisible = ref(false);

// Pagination state for monitoring samples
const currentPage = ref(1);
const pageSize = ref(10);

// Pagination state for alerts
const currentAlertsPage = ref(1);
const alertsPageSize = ref(10);
const totalAlerts = ref(0);
const alertsFilter = ref(false); // For All Alerts filter

// Fetch assets from API
const fetchAssets = async (modelName?: string) => {
  try {
    let url = "/pm/asset?status=Onboarded&strict=no";

    // Add model name filter if provided
    if (modelName) {
      url += `&asset__asset_model___name=${modelName}`;
    }

    const response = await fetchDataFromAPI(url, "GET", {});

    // Store fetched assets globally
    fetchedAssets.value = response.data || [];

    if (response.data && response.data.length > 0) {
      // Subscribe to heartbeats for all assets
      if (socketService) {
        const heartbeatRooms = response.data.map(
          (asset: any) => `instrument/apc/${asset.asset_id}/heartbeats/basic`
        );
        socketService.subscribeToRooms(heartbeatRooms);
      }
    }
  } catch (error) {
    console.error("Error fetching assets:", error);
  }
};

// Helper function to find device index by asset ID
const findDeviceIndex = (assetId: string) => {
  return devices.value.findIndex((device: any) => device.id === assetId);
};

// Helper function to remove device and clear its interval
const removeDevice = (assetId: string) => {
  const index = findDeviceIndex(assetId);
  if (index !== -1) {
    // Clear interval if it exists
    if (devices.value[index].interval) {
      clearInterval(devices.value[index].interval);
    }
    // Remove device from array
    devices.value.splice(index, 1);
    // Device removed
  }
};

// Helper function to format sample point
const formatSamplePoint = (id: string, measureStartTime: string) => {
  if (!measureStartTime || measureStartTime === "-") {
    return `CM-${id}`;
  }

  // Parse the formatted date string
  const date = moment(measureStartTime, "MMM D, YYYY, h:mm:ss A");

  if (!date.isValid()) {
    return `CM-${id}`;
  }

  // Format as DDMMMYYHHMM
  const dateFormat = date.format("DDMMMYYHHMM").toUpperCase();
  return `CM-${id}-${dateFormat}`;
};

// Fetch alerts using getTaskResultsWithNotifications API
const fetchAlerts = async (page = 1, limit = 10) => {
  isLoadingAlerts.value = true;
  try {
    const response = await getTaskResultsWithNotifications(
      2,
      page,
      limit,
      modelName,
      alertsFilter.value
    );

    // Check if response has the expected structure
    if (response?.data?.data) {
      // Transform notification response to alert format
      const transformedAlerts = response.data.data.map((item: any) => ({
        id: item.notification_id,
        type: "Particles", // Hardcoded as requested
        sampleId: item.meta?.input?.id || "-",
        samplePoint: formatSamplePoint(item.id, item.measure_start_time),
        program: item.meta?.input?.program || "-",
        worklistId: item.meta?.input?.worklistid || "-",
        limsSampleId: item.meta?.input?.limssampleid || "-",
        asset: item.asset_id || "-",
        severity: "CRITICAL", // Hardcoded as requested
        message: item.notification_message || "-",
        is_read: item.is_read || false,
        hasComment: !!item.details?.comment, // Check if comment exists in details
        originalData: item, // Store the complete original record
      }));

      // Update alerts ref with transformed data
      alerts.value = transformedAlerts;

      // Update pagination info
      if (response.data.pagination) {
        totalAlerts.value = response.data.pagination.total || 0;
        currentAlertsPage.value = response.data.pagination.page || 1;
      }
    } else {
      alerts.value = [];
      totalAlerts.value = 0;
    }
  } catch (error) {
    console.error("Error fetching alerts:", error);
    alerts.value = [];
    totalAlerts.value = 0;
  } finally {
    isLoadingAlerts.value = false;
  }
};

// Fetch monitoring samples using getTasksData API
const fetchMonitoringSamples = async (page = 1, limit = 10) => {
  isLoadingMonitoring.value = true;
  try {
    const params: any = {
      strict: "no",
      is_asset_result: true,
      page: page,
      limit: limit,
      "meta.sample_type": "continuous-sample",
      // "meta.sample_type": meta.sample_type
    };

    // Only add orderBy if "newest" is selected
    if (selectedSortBy.value === "newest") {
      params.orderBy = "id";
    }
    // If "oldest" is selected, don't include orderBy in params

    // Add search functionality
    if (searchQuery.value && selectedSampleFilter.value) {
      const searchField = selectedSampleFilter.value;
      const searchValue = searchQuery.value.trim();

      // Skip adding search query for status when All Unacked is active
      if (!(searchField === "status" && statusFilter.value)) {
        // Construct search parameter: field=value
        if (searchValue) {
          params[searchField] = searchValue;
        }
      }
    }

    // Add status filter for All Unacked functionality
    if (statusFilter.value) {
      params.status = statusFilter.value;
      params.unacked = true;
    }

    // Add model name filter if provided
    if (modelName) {
      params["meta.asset_info.info.model"] = modelName;
    }

    const response = await apcService.getTasksData(params);

    // Store the original API response data

    // Transform the response data to match MonitoringRecord interface
    // Store and transform the response data.
    const transformedSamples =
      response.data?.map((item: any) => ({
        id: item.id,
        sampleId: item.meta?.input?.id || "-",
        samplePoint: formatSamplePoint(item.id, item.measure_start_time),
        worklistId: item.meta?.input?.worklistid || "-",
        limsSampleId: item.meta?.input?.limssampleid || "-",
        asset: item.asset_id || "-",
        status: item.status || "-",
        dateTime: item.measure_start_time || "-",
        count05mm: item.data?.data?.cumulative_data?.["0.5μm"] ?? null,
        count50mm: item.data?.data?.cumulative_data?.["5.0μm"] ?? null,
        program: item.meta?.input?.program || "-",
      })) || [];

    // Update the monitoring samples and total count
    monitoringSamples.value = transformedSamples;
    originalSamplesData.value = response.data || [];
    console.log("::::: og data", transformedSamples);
    totalSamples.value = response.pagination?.totalCount || 0;
  } catch (error) {
    console.error("Error fetching monitoring samples:", error);
  } finally {
    isLoadingMonitoring.value = false;
  }
};

//  Export csv
const exportCSV = async () => {
  isExporting.value = true;

  const limit = 2000;

  const params: { [key: string]: any } = {
    to_show: true,
    orderBy: "id",
    locale: locale.value,
    is_asset_result: true,
    strict: "no",
    limit,
  };
  params.fileName = "MFG";

  // Add model name filter if provided
  if (modelName) {
    params["meta.asset_info.info.model"] = modelName;
  }

  const dataHeaders = mfgDataPageHeaders;

  const exportParams = generateExportTypeParams(
    "", // no searchKey
    "", // no searchTerm
    "csv",
    dataHeaders
  );

  const dataParams = { ...params, ...exportParams };

  try {
    const data = await apcService.getTasksData(dataParams);
    console.log(":::::dataParams", dataParams);
    exportFile(data, "MFG_Monitoring_Data", "csv");
  } catch (error) {
    console.error("Error exporting CSV:", error);
  } finally {
    isExporting.value = false;
  }
};

// Handle pagination changes from MfcContinuousMonitoringTable
const handleMonitoringPaginationChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchMonitoringSamples(page, size);
};

// Handle pagination changes from MfcActiveAlertsTable
const handleAlertsPaginationChange = (page: number, size: number) => {
  currentAlertsPage.value = page;
  alertsPageSize.value = size;
  fetchAlerts(page, size);
};

// Handle fetch all unacknowledged records
const handleFetchAllUnacked = (statuses: string) => {
  statusFilter.value = statuses;
  currentPage.value = 1; // Reset to first page
  fetchMonitoringSamples(1, pageSize.value);
};

// Handle MFG data confirmation - wait for API response before reloading
const handleMfgDataConfirm = async () => {
  console.log("MFG data confirmation successful - refreshing both tables");
  currentPage.value = 1; // Reset to first page
  // Refresh both tables since data acknowledgment affects both
  await Promise.all([
    fetchMonitoringSamples(1, pageSize.value),
    fetchAlerts(currentAlertsPage.value, alertsPageSize.value),
  ]);
};

// Handle alert confirmation success
const handleAlertConfirmSuccess = async () => {
  console.log("Alert confirmation successful - refreshing both tables");
  // Refresh both tables since data acknowledgment affects both
  await Promise.all([
    fetchAlerts(currentAlertsPage.value, alertsPageSize.value),
    fetchMonitoringSamples(currentPage.value, pageSize.value),
  ]);
};

// Handle fetch all alerts
const handleFetchAllAlerts = (filter: boolean) => {
  alertsFilter.value = filter;
  currentAlertsPage.value = 1; // Reset to first page
  fetchAlerts(1, alertsPageSize.value);
};

// Refresh all view data
const refreshView = async () => {
  // Prevent multiple simultaneous refreshes
  if (isRefreshing.value) return;

  isRefreshing.value = true;

  try {
    // Fetch all data components
    currentPage.value = 1; // Reset to first page
    currentAlertsPage.value = 1; // Reset alerts to first page
    await Promise.all([
      fetchAssets(modelName),
      fetchAlerts(1, alertsPageSize.value),
      fetchMonitoringSamples(1, pageSize.value),
    ]);

    // Update sample counts for all devices
    // await Promise.all(
    //   devices.value.map((device, index) => {
    //     if (device.jobId) {
    //       return updateDeviceSampleCount(index, device.id, device.jobId);
    //     }
    //     return Promise.resolve();
    //   })
    // );
  } finally {
    isRefreshing.value = false;
  }
};

// Fetch sample count for a device when sample_buffered changes
const fetchSampleCount = async (assetId: string, jobId: number) => {
  try {
    const response = await fetchDataFromAPI(
      `/pm/task-result?asset_id=${assetId}&job_id=${jobId}&is_asset_result=true`,
      "GET",
      {}
    );
    return response?.pagination?.count || 0;
  } catch (error) {
    console.error("Error fetching sample count:", error);
    return 0;
  }
};

// Update device sample count
// const updateDeviceSampleCount = async (
//   deviceIndex: number,
//   assetId: string,
//   jobId: number
// ) => {
//   if (!jobId || deviceIndex === -1) return;

//   try {
//     const count = await fetchSampleCount(assetId, jobId);
//     if (devices.value[deviceIndex]) {
//       devices.value[deviceIndex].sampleData.samples = count;
//     }
//   } catch (error) {
//     // Error already logged in fetchSampleCount
//   }
// };

// Watch for sort order changes
watch(selectedSortBy, () => {
  statusFilter.value = ""; // Clear status filter
  currentPage.value = 1; // Reset to first page
  fetchMonitoringSamples(1, pageSize.value);
});

// Watch for sample filter changes
watch(selectedSampleFilter, () => {
  statusFilter.value = ""; // Clear status filter
  currentPage.value = 1; // Reset to first page
  fetchMonitoringSamples(1, pageSize.value);
});

// Watch for search query changes
watch(searchQuery, () => {
  // Don't clear status filter if it's currently active (All Unacked is on)
  if (!statusFilter.value) {
    statusFilter.value = ""; // Clear status filter only if not active
  }
  currentPage.value = 1; // Reset to first page
  fetchMonitoringSamples(1, pageSize.value);
});

// Socket.IO integration
let socketService: SocketService | null = null;

// Handler for notification updates from baseLayout
const handleMfcNotificationUpdate = (message: any) => {
  console.log("MFC received notification update:", message);

  // Check if notification is for an asset we're monitoring
  const assetId = message?.meta?.asset_id;
  if (
    assetId &&
    fetchedAssets.value.some((asset) => asset.asset_id === assetId)
  ) {
    console.log("Notification is for monitored asset:", assetId);
    // Refresh alerts when notification is for a relevant asset
    fetchAlerts(currentAlertsPage.value, alertsPageSize.value);
  } else {
    console.log("Ignoring notification for unmonitored asset:", assetId);
  }
};

const setupRealtimeUpdates = () => {
  try {
    // Initialize socket service same as ApcSelectInstrumentComponent
    socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");
    socketService.connectSocket();

    // Handle heartbeat messages
    socketService.handleMessage((incomingHeartbeat: any) => {
      // Process the heartbeat using the same utility as ApcSelectInstrumentComponent
      const processedHeartbeat = processHeartbeat(incomingHeartbeat.msg);
      // Process heartbeat

      if (!processedHeartbeat?.basic?.asset_id) {
        return;
      }
      const assetId = processedHeartbeat.basic.asset_id;

      // Check if status is "Running" and progress object exists
      if (
        processedHeartbeat?.basic?.status === "Running" &&
        processedHeartbeat?.basic?.sample_type === "continuous-sample" &&
        processedHeartbeat?.progress
      ) {
        let deviceIndex = findDeviceIndex(assetId);

        // Get current sample_buffered value
        const currentSampleBuffered =
          processedHeartbeat?.basic?.real_time_data?.samples_buffered || 0;
        const runningTasks = processedHeartbeat?.progress?.running_tasks || {};
        const taskIds = Object.keys(runningTasks);

        if (taskIds.length === 0) {
          removeDevice(assetId);
          return;
        }

        // Use the last task for device data
        const lastTaskId = taskIds[taskIds.length - 1];
        const lastTask = runningTasks[lastTaskId];
        const jobId = lastTask?.input?.job_id || null;

        // Skip if sample type is "Delete Internal Sample"
        if (lastTask?.input?.sample_type === "Delete Internal Sample") {
          return;
        }

        // If device doesn't exist, create it
        const isNewDevice = deviceIndex === -1;
        if (isNewDevice) {
          const assetName = lastTask?.input?.asset_name || "-";
          const location = lastTask?.input?.input?.location || "-";
          const program = lastTask?.input?.input?.program || "-";
          const volume =
            lastTask?.output?.data?.volume?.value !== undefined
              ? `${lastTask?.output?.data?.volume?.value} ${lastTask?.output?.data?.volume?.unit}`
              : "-";
          const elapsed = lastTask?.output?.data?.run_time?.elapsed || "-";
          const assetTime = processedHeartbeat?.basic?.asset_time?.time || "-";
          const samples =
            processedHeartbeat?.basic?.real_time_data?.samples_buffered || "0";

          const newDevice = {
            id: assetId,
            name: assetName,
            location: location,
            controlBadge: "CONTINUOUS",
            sampleData: {
              status: "CONTINUOUS",
              volume: volume,
              samples: samples,
              elapsed: elapsed,
              output: lastTask?.output || {},
            },
            program: program,
            timer: new Date().getTime(),
            interval: null as any,
            assetTime: assetTime,
            lastSampleBuffered: currentSampleBuffered,
            jobId: jobId,
          };
          devices.value.push(newDevice);
          deviceIndex = devices.value.length - 1;
        }

        // Update device data and check for sample changes
        const device = devices.value[deviceIndex];

        // Check if we should fetch samples
        const shouldFetchSamples =
          jobId &&
          (isNewDevice || // Always fetch for new devices
            (device.lastSampleBuffered !== null &&
              device.lastSampleBuffered !== currentSampleBuffered));

        if (shouldFetchSamples) {
          // updateDeviceSampleCount(deviceIndex, assetId, jobId);
          // Also refresh the monitoring samples table when buffer updates (only if modal is not visible)
          if (!isModalVisible.value) {
            currentPage.value = 1; // Reset to first page
            fetchMonitoringSamples(1, pageSize.value);
          }
        }

        // Update device data with latest heartbeat information
        const volume =
          lastTask?.output?.data?.volume?.value !== undefined
            ? `${lastTask?.output?.data?.volume?.value} ${lastTask?.output?.data?.volume?.unit}`
            : "-";

        devices.value[deviceIndex].sampleData = {
          ...devices.value[deviceIndex].sampleData,
          status: "CONTINUOUS",
          volume: volume,
          samples: currentSampleBuffered,
          elapsed: lastTask?.output?.data?.run_time?.elapsed || "-",
          output: lastTask?.output || {},
        };

        devices.value[deviceIndex].assetTime =
          processedHeartbeat?.basic?.asset_time?.time || "-";
        devices.value[deviceIndex].lastSampleBuffered = currentSampleBuffered;
        devices.value[deviceIndex].jobId = jobId || device.jobId;

        // Clear existing interval
        const currentDevice = devices.value[deviceIndex];
        if (!currentDevice) {
          return;
        }

        if (currentDevice.interval) {
          clearInterval(currentDevice.interval);
        }

        // Update timer
        currentDevice.timer = new Date().getTime();

        // Set new interval to check for timeout
        currentDevice.interval = setInterval(() => {
          try {
            const currentDeviceIndex = findDeviceIndex(assetId);
            if (currentDeviceIndex === -1) {
              // Device already removed
              return;
            }
            const currentDevice = devices.value[currentDeviceIndex];
            if (
              currentDevice &&
              new Date().getTime() - currentDevice.timer >= 5000
            ) {
              removeDevice(assetId);
            }
          } catch (e) {
            // Handle timeout check error silently
          }
        }, 1000);
      } else {
        // Status is not "Running" or no progress object - remove device immediately
        removeDevice(assetId);
      }
    });
  } catch (error) {
    // Silently handle socket errors in development
  }
};

const cleanupRealtimeUpdates = () => {
  try {
    if (socketService) {
      // Clear all device intervals before cleanup
      devices.value.forEach((device: any) => {
        if (device.interval) {
          clearInterval(device.interval);
        }
      });

      // Unsubscribe from all asset heartbeat rooms
      if (devices.value.length > 0) {
        const heartbeatRooms = devices.value.map(
          (device: any) => `instrument/apc/${device.id}/heartbeats/basic`
        );
        socketService.leaveRooms(heartbeatRooms);
      }

      socketService.disconnectSocket();
      socketService = null;
    }
  } catch (error) {
    // Silently handle cleanup errors
  }
};

onMounted(() => {
  setupRealtimeUpdates();
  // Fetch assets after socket is initialized to enable heartbeat subscriptions
  setTimeout(() => {
    fetchAssets(modelName);
  }, 500);
  // Fetch alerts using getTaskResultsWithNotifications
  fetchAlerts(currentAlertsPage.value, alertsPageSize.value);
  // Fetch monitoring samples using getTasksData with initial pagination
  fetchMonitoringSamples(currentPage.value, pageSize.value);

  // Listen for notification updates from baseLayout
  eventBus.on("notificationUpdate", handleMfcNotificationUpdate);
});

onUnmounted(() => {
  cleanupRealtimeUpdates();

  // Remove only this component's notification handler
  eventBus.off("notificationUpdate", handleMfcNotificationUpdate);
});
</script>

<style scoped>
.mfc-monitoring-view {
  background-color: #f5f5f5;

  max-width: 100vw;
  box-sizing: border-box;
}

.page-header {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1890ff;
}

.global-buttons {
  display: flex;
  gap: 8px;
}

.global-buttons :deep(.ant-btn) {
  font-size: 10px;
}

.left-panel {
  height: calc(100vh - 160px);
  overflow-y: auto;
  padding-right: 4px;
}

/* .device-cards-container scrolling is handled by left-panel */

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  height: calc(100vh - 160px);
}

.alerts-section {
  flex-shrink: 0;
  min-height: 280px;
}

.monitoring-section {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

@media (max-width: 991px) {
  .left-panel,
  .right-panel {
    height: auto;
    overflow-y: visible;
    margin-bottom: 24px;
  }

  .device-cards-container {
    max-height: 600px;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .mfc-monitoring-view {
    padding: 16px;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .global-buttons {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  /* Order can be controlled with flex-direction in row */
  .monitoring-layout {
    flex-direction: column-reverse;
  }
}

/* Custom button colors */
.refresh-btn {
  background-color: #4098b8 !important;
  border-color: #4098b8 !important;
  color: white !important;
}

.refresh-btn:hover {
  background-color: #357a9a !important;
  border-color: #357a9a !important;
}

.sort-btn {
  background-color: #d38834 !important;
  border-color: #d38834 !important;
  color: white !important;
}

.sort-btn:hover {
  background-color: #b8732a !important;
  border-color: #b8732a !important;
}

.manage-btn {
  background-color: #42a079 !important;
  border-color: #42a079 !important;
  color: white !important;
}

.manage-btn:hover {
  background-color: #378866 !important;
  border-color: #378866 !important;
}

.export-btn {
  background-color: #4e89c0 !important;
  border-color: #4e89c0 !important;
  color: white !important;
}

.export-btn:hover {
  background-color: #4073a1 !important;
  border-color: #4073a1 !important;
}

/* Empty state styles */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.empty-state-content {
  text-align: center;
  max-width: 300px;
}

.empty-state-icon {
  font-size: 48px;
  color: #bfbfbf;
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 500;
  color: #595959;
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  color: #8c8c8c;
  line-height: 1.6;
  margin: 0;
}
</style>
