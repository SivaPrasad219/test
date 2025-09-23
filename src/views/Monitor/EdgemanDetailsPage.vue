<template>
  <div class="edgeman-details-page">
    <a-spin
      :spinning="isLoading"
      :tip="
        t('monitorPage.Loading EdgeManager data', 'Loading EdgeManager data...')
      "
    >
      <div class="details-header">
        <h2>
          {{ t("monitorPage.Details for", "Details for") }}
          {{ selectedEdgemanIp }}
        </h2>
        <a-button class="back-btn" @click="handleBack" type="primary">{{
          t("monitorPage.Back", "Back")
        }}</a-button>
      </div>

      <a-tabs default-active-key="devices" @change="onTabChange">
        <!-- Instruments Tab -->
        <a-tab-pane
          key="devices"
          :tab="t('monitorPage.Instruments', 'Instruments')"
        >
          <div class="button-container">
            <a-button
              type="primary"
              class="upload-btn"
              :loading="isUploading"
              :disabled="isUploading || isButtonsDisable"
              @click="uploadEmFiles()"
            >
              <upload-outlined />
              {{ t("monitorPage.Upload File", "Upload File") }}
            </a-button>
            <a-button
              type="primary"
              class="add-btn"
              :disabled="isButtonsDisable || isUploading"
              @click="handleAddInstrument"
            >
              <PlusOutlined />
              {{ t("monitorPage.Add Instrument", "Add Instrument") }}
            </a-button>
            <a-button
              type="primary"
              class="service-restart-btn"
              :disabled="isButtonsDisable || isUploading"
              @click="handleServiceRestart"
            >
              <ReloadOutlined />
              {{ t("monitorPage.Restart Service", "Restart Service") }}
            </a-button>
          </div>
          <div class="data-section">
            <a-empty
              v-if="
                !server?.meta?.devices ||
                Object.keys(server?.meta?.devices).length === 0
              "
              :description="
                t(
                  'monitorPage.No Instruments available for this EdgeManager',
                  'No Instruments available for this EdgeManager'
                )
              "
            />
            <a-row v-else :gutter="[16, 16]">
              <a-col
                v-for="(device, key) in sortDevicesAndPlatForms(
                  server,
                  'devices'
                )"
                :key="key"
                :span="8"
              >
                <a-card
                  :title="key"
                  size="small"
                  :class="
                    getDeviceStatusClass(device)
                      ? 'device-status-connected'
                      : 'device-status-disconnected'
                  "
                >
                  <template #extra>
                    <a-button
                      type="text"
                      class="edit-button"
                      :disabled="isButtonsDisable || isUploading"
                      @click="editInstrument(key)"
                    >
                      <EditOutlined />
                      {{ t("monitorPage.Edit", "Edit") }}
                    </a-button>
                  </template>
                  <div class="device-data-section">
                    <a-row :gutter="[8, 8]" class="device-data-row">
                      <template
                        v-for="(field, index) in deviceFields"
                        :key="index"
                      >
                        <a-col :span="8" class="label-col">
                          <strong>{{ field.label }}</strong>
                        </a-col>

                        <a-col :span="16" class="value-col">
                          <span class="colon-col">:</span>

                          <!-- Special handling for Platform -->

                          <template
                            v-if="
                              field.label ===
                              t('monitorPage.Platform', 'Platform')
                            "
                          >
                            <div class="platform-selector">
                              <a-space>
                                <a-select
                                  :value="
                                    (selectedPlatforms.hasOwnProperty(key) &&
                                      selectedPlatforms[key]) ||
                                    device.platform
                                  "
                                  :placeholder="
                                    t(
                                      'monitorPage.Select Platform',
                                      'Select Platform'
                                    )
                                  "
                                  size="small"
                                  :getPopupContainer="
                                    (triggerNode:any) => triggerNode.parentElement
                                  "
                                  :disabled="isButtonsDisable"
                                  @change="
                                    (value:any) =>
                                      platformSelectionForEachDevice(key, value)
                                  "
                                  style="width: 140px; border-radius: 6px"
                                  :bordered="true"
                                >
                                  <a-select-option
                                    v-for="platform in platformsAvailable(
                                      device.version,
                                      server
                                    )"
                                    :key="platform"
                                    :value="platform"
                                  >
                                    {{ platform }}
                                  </a-select-option>
                                </a-select>

                                <a-button
                                  size="small"
                                  shape="round"
                                  :disabled="isButtonsDisable"
                                  :loading="isDevicePlatformsChanging[key]"
                                  @click="
                                    () => setPlatform(key, device.platform)
                                  "
                                  class="platform-set-button"
                                >
                                  {{
                                    device.platform && !selectedPlatforms[key]
                                      ? t("monitorPage.Unset", "Unset")
                                      : t("monitorPage.Set", "Set")
                                  }}
                                </a-button>
                              </a-space>
                            </div>
                          </template>

                          <template
                            v-else-if="
                              field.label ===
                              t(
                                'monitorPage.Agent connection',
                                'Agent connection'
                              )
                            "
                          >
                            <span
                              :class="
                                getDeviceStatusClass(device)
                                  ? 'status-connected'
                                  : 'status-disconnected'
                              "
                            >
                              {{
                                device?.agentConnected
                                  ? t("monitorPage.Connected", "Connected")
                                  : t(
                                      "monitorPage.Disconnected",
                                      "Disconnected"
                                    )
                              }}
                            </span>
                          </template>

                          <template v-else
                            ><span> {{ " " }}</span>
                            {{ device[field.value] || "N/A" }}
                          </template>
                        </a-col>
                      </template>
                    </a-row>
                  </div>
                  <!-- Action Table -->
                  <a-table
                    :columns="getActionColumns"
                    :data-source="[{ key }]"
                    :pagination="false"
                    :show-header="true"
                    class="action-table"
                    :row-key="(record) => record.key"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'agentStatus'">
                        <a-switch
                          :checked="device.agentRunning"
                          :checked-children="t('monitorPage.Stop', 'Stop')"
                          :un-checked-children="t('monitorPage.Start', 'Start')"
                          :disabled="isButtonsDisable"
                          :loading="loadingStates[record.key]?.agent"
                          @change="() => toggleAgent(record.key)"
                          class="agent-switch"
                        />
                      </template>
                      <template v-if="column.key === 'handlerStatus'">
                        <a-switch
                          :checked="device.handlerRunning"
                          :checked-children="t('monitorPage.Stop', 'Stop')"
                          :un-checked-children="t('monitorPage.Start', 'Start')"
                          :disabled="isButtonsDisable"
                          :loading="loadingStates[record.key]?.handler"
                          @change="() => toggleHandler(record.key)"
                          class="handler-switch"
                        />
                      </template>
                      <template v-if="column.key === 'action'">
                        <a-button
                          danger
                          size="small"
                          :loading="loadingStates[record.key]?.delete"
                          :disabled="isButtonsDisable"
                          @click="() => deleteInstrument(record.key)"
                          class="delete-button"
                        >
                          {{ t("monitorPage.Delete", "Delete") }}
                        </a-button>
                      </template>
                      <template v-if="column.key === 'logs'">
                        <a-button
                          type="primary"
                          shape="round"
                          size="small"
                          :loading="isLogsDownloading[record.key]"
                          :disabled="makeLogsButtonsDisable || isButtonsDisable"
                          @click="() => downloadLogs(record.key)"
                          class="logs-button"
                        >
                          <template #icon>
                            <DownloadOutlined />
                          </template>
                        </a-button>
                      </template>
                    </template>
                  </a-table>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>

        <!-- Platforms Tab -->
        <a-tab-pane
          key="platforms"
          :tab="t('monitorPage.Platforms', 'Platforms')"
        >
          <div class="data-section">
            <a-empty
              v-if="
                !server?.meta?.platforms ||
                Object.keys(server?.meta?.platforms).length === 0
              "
              :description="
                t(
                  'monitorPage.No platforms available for this EdgeManager',
                  'No platforms available for this EdgeManager'
                )
              "
            />
            <div v-else class="grid-container">
              <div
                class="grid-item"
                v-for="(platform, key) in sortDevicesAndPlatForms(
                  server,
                  'platforms'
                )"
                :key="key"
              >
                <a-card
                  :title="key"
                  size="small"
                  :class="getPlatformStatusClass(platform)"
                >
                  <div class="platform-data-section">
                    <a-row :gutter="[8, 8]" class="platform-data-row">
                      <a-row
                        class="info-row"
                        v-for="(label, value) in platformDetails"
                        :key="label"
                      >
                        <a-col :span="8" class="label-col"
                          ><strong>{{ value }}</strong></a-col
                        >
                        <a-col :span="1" class="colon-col">:</a-col>
                        <a-col :span="15" class="value-col">{{
                          platform?.[label] || "N/A"
                        }}</a-col>
                      </a-row>
                    </a-row>
                  </div>
                </a-card>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- Network Tab -->
        <a-tab-pane key="network" :tab="t('monitorPage.Network', 'Network')">
          <a-card
            :title="
              t(
                'monitorPage.EdgeManager Network Details',
                'EdgeManager Network Details'
              )
            "
            class="device-card"
          >
            <div class="network-data-section">
              <div
                v-for="(field, index) in networkFields"
                :key="index"
                class="data-row"
                :class="{ 'battery-section': field.isNested }"
              >
                <div v-if="field.isNested && isBatteryStatsAvailable">
                  <div
                    class="data-row"
                    v-for="(subField, subIndex) in field.subFields"
                    :key="subIndex"
                  >
                    <span class="label">{{ subField.label }}</span>
                    <span class="value">
                      : {{ getNestedValue(subField.key) || "N/A" }}
                      {{ subField.unit || "" }}
                    </span>
                  </div>
                </div>

                <div v-else class="field-row">
                  <span class="label">{{ field.label }}</span>
                  <span class="value">
                    : {{ getFieldValue(field.key) || "N/A" }}
                  </span>
                </div>
              </div>
            </div>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <UploadEmFilesModal
      :visible="isModalVisible"
      :uploadType="`singleUpload`"
      :selectedEmIps="selectedEmIps"
      :connection_status="server?.is_connected"
      :emData="{ [selectedEdgemanIp]: server }"
      @close="handleModalClose"
      @loading="handleLoading"
    />
    <!-- @upload="handleUploadByEmit" -->

    <RestartModel
      :visible="isRestartModelVisible"
      :restartType="selectedServiceType"
      :selectedEmIps="selectedEmIps"
      :singleIpMode="true"
      :emData="{ [selectedEdgemanIp]: server }"
      @close="handleRestartModalClose"
      @upload="handleRestartTypeUpload"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  watch,
  ref,
  onMounted,
  reactive,
  onUnmounted,
  computed,
} from "vue";
import {
  updateEmDeviceState,
  getPollingStatus,
  downloadCompletedLogs,
} from "@/services/apiService";
import {
  Tabs,
  TabPane,
  Row,
  Col,
  Card,
  Switch,
  Button,
  Table,
  Empty,
  message,
} from "ant-design-vue";
import {
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import UploadEmFilesModal from "./UploadEmFilesModal.vue";
import RestartModel from "./RestartModel.vue";
import {
  getMonitorDataByIp,
  // emServiceStart
} from "../../services/apiService";
import { useRestartService } from "@/composables/useRestartService";
export default defineComponent({
  name: "EdgemanDetailsPage",
  components: {
    ATabs: Tabs,
    ATabPane: TabPane,
    ARow: Row,
    ACol: Col,
    ACard: Card,
    ASwitch: Switch,
    AButton: Button,
    ATable: Table,
    AEmpty: Empty,
    DownloadOutlined,
    PlusOutlined,
    ReloadOutlined,
    UploadOutlined,
    UploadEmFilesModal,
    RestartModel,
    EditOutlined,
  },
  setup() {
    const { t } = useI18n();
    const loadingStates = ref<{
      [key: string]: { agent: boolean; handler: boolean; delete: boolean };
    }>({});
    const previousStates = ref<{
      [key: string]: { agent: boolean; handler: boolean };
    }>({});
    const isLogsDownloading = ref<{ [key: string]: boolean }>({});
    const isDevicePlatformsChanging = ref<{ [key: string]: boolean }>({});
    const uploadProgress = ref(0);
    const route = useRoute();
    const router = useRouter();
    const selectedEdgemanIp = route.params.edgemanIp as string;
    const edgemanData = reactive<Record<string, any>>({});
    const server: any = ref();
    const activeTab = ref("devices");
    const socketService = new SocketService(
      `${environment.MONITORING_URL}`,
      "ms"
    );

    const {
      isRestartModelVisible,
      selectedServiceType,
      handleServiceRestart,
      handleRestartModalClose,
      handleRestartTypeUpload: handleRestartTypeUploadComposable,
    } = useRestartService();

    const networkFields = computed(() => [
      { label: t("monitorPage.Status", "Status"), key: "meta.network.status" },
      { label: t("monitorPage.Name", "Name"), key: "meta.network.name" },
      {
        label: t("monitorPage.Current Time (UTC)", "Current Time (UTC)"),
        key: "meta.network.currenttimeUTC",
      },
      {
        label: t("monitorPage.Version", "Version"),
        key: "meta.network.version",
      },
      {
        label: t("monitorPage.Platform Version", "Platform Version"),
        key: "meta.network.PLATFORM_VERSION",
      },
      {
        label: t("monitorPage.Gateway ID", "Gateway ID"),
        key: "meta.network.gatewayId",
      },
      {
        label: t("monitorPage.Total RAM", "Total RAM"),
        key: "meta.network.totalRamMb",
      },
      {
        label: t("monitorPage.Free RAM", "Free RAM"),
        key: "meta.network.freeRamMb",
      },
      {
        label: t("monitorPage.Total Disk", "Total Disk"),
        key: "meta.network.totalDisk",
      },
      {
        label: t("monitorPage.Free Disk", "Free Disk"),
        key: "meta.network.freeDisk",
      },
      {
        label: t("monitorPage.Free Disk Percent", "Free Disk Percent"),
        key: "meta.network.freeDiskPercent",
      },
      {
        label: t("monitorPage.Battery Status", "Battery Status"),
        key: "meta.network.batteryStats",
        isNested: true,
        subFields: [
          {
            label: t("monitorPage.Battery Percentage", "Battery Percentage"),
            key: "batPercent",
            unit: "%",
          },
          { label: t("monitorPage.EST Time", "EST Time"), key: "batTime" },
          {
            label: t("monitorPage.Battery Voltage", "Battery Voltage"),
            key: "batVolt",
            unit: "V",
          },
          {
            label: t("monitorPage.Power State", "Power State"),
            key: "chargeMessage",
          },
          {
            label: t("monitorPage.Battery Temperature", "Battery Temperature"),
            key: "batTemp",
            unit: "°C",
          },
        ],
      },
    ]);

    const deviceFields = computed(() => [
      {
        label: t("monitorPage.Platform", "Platform"),
        value: "platform",
      },
      {
        label: t("monitorPage.Version", "Version"),
        value: "version",
      },
      {
        label: t("monitorPage.Agent Version", "Agent Version"),
        value: "agentVersion",
      },
      {
        label: t("monitorPage.Agent connection", "Agent connection"),
        value: "agentConnection",
      },
      {
        label: t("monitorPage.Model", "Model"),
        value: "model",
      },
      {
        label: t("monitorPage.Modbus IP", "Modbus IP"),
        value: "modbusIp",
      },
      {
        label: t("monitorPage.Modbus Port", "Modbus Port"),
        value: "modbusPort",
      },
    ]);
    const makeLogsButtonsDisable = ref(false);

    const isButtonsDisable = computed(() => {
      const devices = server.value?.meta?.devices;
      const platforms = server.value?.meta?.platforms;
      if (!server.value || server.value.is_connected !== "connected") {
        return true;
      }

      if (activeTab.value === "devices" || activeTab.value === "platforms") {
        return (
          (!devices || Object.keys(devices).length === 0) &&
          (!platforms || Object.keys(platforms).length === 0)
        );
      }

      // Check if both devices and platforms are missing or empty
      return false;
    });

    const isBatteryStatsAvailable = computed(() => {
      return (
        server?.value.meta?.network?.batteryStats &&
        typeof server?.value.meta.network.batteryStats === "object"
      );
    });

    const getFieldValue = (key: string) => {
      return key.split(".").reduce((obj: any, part: any) => {
        return obj && obj[part] !== undefined ? obj[part] : null;
      }, server?.value);
    };
    const getNestedValue = (subKey: string) => {
      return server?.value.meta?.network?.batteryStats?.[subKey];
    };

    const onTabChange = (key: string | number) => {
      activeTab.value = key.toString();
    };

    const editInstrument = (deviceName: string) => {
      router.push(
        `/monitoring/${selectedEdgemanIp}/${deviceName}/editInstrument`
      );
    };

    const isUploading = ref(false);
    const statusTopic = `instrument/apc/edgeman/upload/status/${selectedEdgemanIp}`;
    const isLoading = ref(true);

    const isModalVisible = ref(false);
    const selectedEmIps = ref([selectedEdgemanIp]);
    const platformsAvailable = (version: any, server: any) => {
      if (!server?.meta?.platforms) {
        return []; // Return empty array if server data is not loaded
      }

      // Filter platforms where the version matches
      const matchingPlatformKeys = Object.entries(server.meta.platforms)
        .filter(
          ([_, platform]: [string, any]) =>
            platform.version === version && platform.mqttConnected === true
        )
        .map(([key]) => key);

      return matchingPlatformKeys;
    };
    const subscribedTopic = `instrument/apc/edgeman/${selectedEdgemanIp}`;

    const selectedBatchIps = ref([]);

    const selectedPlatforms = ref<any>({});

    const handleLoading = (batchIps: any) => {
      isUploading.value = true;
      socketService.subscribeToRooms([statusTopic]);
      selectedBatchIps.value = batchIps.value;
      subscribeToDynamicTopics();
      isSubscribed.value = true;
    };

    const getActionColumns = computed(() => {
      const columns = [
        {
          title: t("monitorPage.Agent Status", "Agent Status"),
          key: "agentStatus",
          align: "center",
        },
        {
          title: t("monitorPage.Action", "Action"),
          key: "action",
          align: "center",
        },
        {
          title: t("monitorPage.Logs", "Logs"),
          key: "logs",
          align: "center",
        },
      ];

      if (isHandlerDisable.value) {
        columns.splice(1, 0, {
          title: t("monitorPage.Handler Status", "Handler Status"),
          key: "handlerStatus",
          align: "center",
        });
      }

      return columns;
    });

    const lastHeartbeat = ref<number | null>(null);
    const HEARTBEAT_TIMEOUT = 5000;
    const isSubscribed = ref(false);

    const platformDetails = computed(() => ({
      [t("monitorPage.MQTT Connected", "MQTT Connected")]: "mqttConnected",
      [t("monitorPage.Version", "Version")]: "version",
      [t("monitorPage.UI", "UI")]: "uiAddress",
      [t("monitorPage.MQTT", "MQTT")]: "mqttUrl",
    }));

    const isHandlerDisable = ref(process.env.VUE_APP_PROJECT_TYPE === "CP");
    console.log(
      "isHandlerDisable",
      isHandlerDisable.value,
      process.env.VUE_APP_PROJECT_TYPE
    );

    const getDeviceStatusClass = (device: any) => {
      const isEmConnected = server.value?.is_connected === "connected";
      return isEmConnected && device.agentConnected;
    };

    const uploadEmFiles = () => {
      if (!isUploading.value) {
        isModalVisible.value = true;
      }
    };

    const handleModalClose = () => {
      isModalVisible.value = false;
    };

    const getPlatformStatusClass = (platform: any) => {
      const isEmConnected = server.value?.is_connected === "connected";
      return platform.mqttConnected && isEmConnected
        ? "device-status-connected"
        : "device-status-disconnected";
    };

    const handleRestartTypeUpload = async (data: any) => {
      await handleRestartTypeUploadComposable(data, socketService);
    };

    const toggleAgent = async (deviceKey: string) => {
      if (deviceKey.trim().length === 0) return;
      const updatedServer = { ...server.value };
      console.log("devicekey", updatedServer?.meta?.devices, deviceKey);
      const device = updatedServer?.meta?.devices[deviceKey];

      if (!device) return;
      if (device.platform === null || device?.platform.trim().length === 0) {
        message.error(
          t(
            "monitorPage.Please select platform to start",
            "Please select platform to start"
          )
        );

        return;
      }
      const runningDevice = Object.entries(
        updatedServer?.meta?.devices || {}
      ).find(
        ([, eachDevice]: [string, any]) => eachDevice?.targetState === "run"
      );
      if (runningDevice && !device.agentRunning) {
        const [runningKey, runningDeviceData] = runningDevice;
        console.log("running device:", runningKey, runningDeviceData);
        message.error(
          t(
            "monitorPage.Unable to process request, Device runningKey is already running",
            "Unable to process request, Device runningKey is already running"
          ).replace("runningKey", runningKey)
        );
        return;
      }

      const newState = !device.agentRunning;
      if (!loadingStates.value[deviceKey]) {
        loadingStates.value[deviceKey] = {
          agent: false,
          handler: false,
          delete: false,
        };
      }
      loadingStates.value[deviceKey].agent = true;

      if (!previousStates.value[deviceKey]) {
        previousStates.value[deviceKey] = {
          agent: device.agentRunning,
          handler: device.handlerRunning,
        };
      } else {
        previousStates.value[deviceKey].agent = device.agentRunning;
      }

      try {
        const payload = {
          deviceName: deviceKey,
          component: "agent",
          state: newState ? "start" : "stop",
        };
        const updateEMDeviceState = await updateEmDeviceState(
          selectedEdgemanIp,
          payload
        );

        if (updateEMDeviceState.message === "Success") {
          setTimeout(() => {
            const currentDevice = server.value?.meta?.devices?.[deviceKey];
            if (currentDevice && currentDevice.agentRunning === newState) {
              device.agentRunning = newState;
              let agentState = "";
              if (newState === true) {
                agentState = "started";
              } else if (newState === false) {
                agentState = "stopped";
              }
              message.success(`Agent for ${deviceKey} is ${agentState}`);
            } else {
              message.error(
                t(
                  "monitorPage.Failed to update agent state for",
                  "Failed to update agent state for"
                ) + ` ${deviceKey}`
              );
              device.agentRunning = previousStates.value[deviceKey].agent;
            }
            loadingStates.value[deviceKey].agent = false;
          }, 3000);
        } else {
          message.error(
            t(
              "monitorPage.API error: Failed to update agent state for",
              "API error: Failed to update agent state for"
            ) + ` ${deviceKey}`
          );
          device.agentRunning = previousStates.value[deviceKey].agent;
          loadingStates.value[deviceKey].agent = false;
        }
      } catch (error) {
        console.error("Error updating agent state:", error);
        message.error(
          t(
            "monitorPage.Error: Failed to update agent state for",
            "Error: Failed to update agent state for"
          ) + ` ${deviceKey}`
        );
        device.agentRunning = previousStates.value[deviceKey].agent;
        loadingStates.value[deviceKey].agent = false;
      }
    };

    const toggleHandler = async (deviceKey: string) => {
      const updatedServer = { ...server.value };
      const device = updatedServer.meta.devices[deviceKey];
      if (!device) return;

      // Store previous state
      if (!previousStates.value[deviceKey]) {
        previousStates.value[deviceKey] = {
          agent: device.agentRunning,
          handler: device.handlerRunning,
        };
      } else {
        previousStates.value[deviceKey].handler = device.handlerRunning;
      }

      const newState = !device.handlerRunning;
      // Set loading state
      if (!loadingStates.value[deviceKey]) {
        loadingStates.value[deviceKey] = {
          agent: false,
          handler: false,
          delete: false,
        };
      }
      loadingStates.value[deviceKey].handler = true;

      try {
        const payload = {
          deviceName: deviceKey,
          component: "handler",
          state: newState ? "start" : "stop",
        };
        const updateEMDeviceState = await updateEmDeviceState(
          selectedEdgemanIp,
          payload
        );
        console.log("updateEMDeviceState", updateEMDeviceState);

        if (updateEMDeviceState.message === "Success") {
          // Wait 3 seconds to check if props.server reflects the new state
          setTimeout(() => {
            const currentDevice = server.value?.meta?.devices?.[deviceKey];
            if (currentDevice && currentDevice.handlerRunning === newState) {
              device.handlerRunning = newState;
              message.success(
                t(
                  "monitorPage.handler state for deviceKey is updated",
                  "handler state for deviceKey is updated"
                ).replace("deviceKey", deviceKey)
              );
            } else {
              message.error(
                t(
                  "monitorPage.Failed to update handler state for",
                  "Failed to update handler state for"
                ) + ` ${deviceKey}`
              );
              device.handlerRunning = previousStates.value[deviceKey].handler;
            }
            loadingStates.value[deviceKey].handler = false;
          }, 3000);
        } else {
          message.error(
            t(
              "monitorPage.API error: Failed to update handler state for",
              "API error: Failed to update handler state for"
            ) + ` ${deviceKey}`
          );
          device.handlerRunning = previousStates.value[deviceKey].handler;
          loadingStates.value[deviceKey].handler = false;
        }
      } catch (error) {
        console.error("Error updating handler state:", error);
        message.error(
          t(
            "monitorPage.Error: Failed to update handler state for",
            "Error: Failed to update handler state for"
          ) + ` ${deviceKey}`
        );
        device.handlerRunning = previousStates.value[deviceKey].handler;
        loadingStates.value[deviceKey].handler = false;
      }
    };

    //Guys for future reference : handle with care this function, very fragile based on heartbeat and no heartbeat.
    const setPlatform = async (deviceKey: any, platform: any) => {
      console.log("data before set platform", {
        deviceKey,
        platform,
        existed: selectedPlatforms.value[deviceKey],
      });
      isDevicePlatformsChanging.value[deviceKey] = true;
      if (
        selectedPlatforms.value[deviceKey] !== undefined &&
        selectedPlatforms.value[deviceKey] !== null
      ) {
        const payload = {
          deviceName: deviceKey,
          platformName: selectedPlatforms.value[deviceKey],
          state: "setDevicePlatform",
        };
        console.log("set Payload:", payload);
        const response = await updateEmDeviceState(selectedEdgemanIp, payload);
        if (response.message === "Success") {
          console.log(response);
          // selectedPlatforms.value[deviceKey] = null;
        } else {
          message.error(
            t(
              "monitorPage.Failed to set platform for",
              "Failed to set platform for"
            ) + ` ${deviceKey}`
          );
          isDevicePlatformsChanging.value[deviceKey] = false;
        }
        console.log("response of set", response);
      } else if (
        (typeof platform === "object"
          ? platform !== null
          : platform.trim().length > 0) &&
        (selectedPlatforms.value[deviceKey] === undefined ||
          selectedPlatforms.value[deviceKey] === null)
      ) {
        // Handle unSet: Send selected platform
        const payload = {
          deviceName: deviceKey,
          platformName: "",
          state: "setDevicePlatform",
        };
        console.log("UnSet Payload:", payload);
        const response = await updateEmDeviceState(selectedEdgemanIp, payload);
        console.log("response of unset", response);
      } else {
        message.error(
          t(
            "monitorPage.No platform is selected to set for",
            "No platform is selected to set for"
          ) + ` ${deviceKey}`
        );
      }
    };

    const platformSelectionForEachDevice = (deviceKey: any, value: any) => {
      if (server.value.meta.devices[deviceKey].platform === value) {
        delete selectedPlatforms.value[deviceKey];
      } else {
        selectedPlatforms.value[deviceKey] = value === "null" ? null : value;
      }
    };

    const deleteInstrument = async (deviceKey: string) => {
      if (!loadingStates.value[deviceKey]) {
        loadingStates.value[deviceKey] = {
          agent: false,
          handler: false,
          delete: false,
        };
      }
      loadingStates.value[deviceKey].delete = true;
      const updatedServer = { ...server.value };
      const device = updatedServer.meta.devices[deviceKey];
      const isEmConnected = server.value?.is_connected === "connected";
      if (device) {
        const payload = {
          deviceName: deviceKey,
          component: "",
          state: "delete",
        };
        try {
          if (isEmConnected) {
            const updateEMDeviceState = await updateEmDeviceState(
              selectedEdgemanIp,
              payload
            );
            if (updateEMDeviceState.message === "Success") {
              setTimeout(() => {
                loadingStates.value[deviceKey].delete = false;
                delete updatedServer.meta.devices[deviceKey];
                server.value = updatedServer;
                message.success(
                  `${deviceKey} ` +
                    t("monitorPage.instrument deleted", "instrument deleted")
                );
              }, 3000);
            } else {
              message.error(
                t(
                  "monitorPage.Failed to delete instrument",
                  "Failed to delete instrument"
                ) + ` ${deviceKey}`
              );
            }
          } else {
            await new Promise((res) => setTimeout(res, 3000));
            loadingStates.value[deviceKey].delete = false;
            message.error(
              t(
                "monitorPage.EdgeManager selectedEdgemanIp is not connected, cannot delete instrument deviceKey",
                "EdgeManager selectedEdgemanIp is not connected, cannot delete instrument deviceKey"
              )
                .replace("selectedEdgemanIp", selectedEdgemanIp)
                .replace("deviceKey", deviceKey)
            );
            return;
          }
        } catch (error) {
          loadingStates.value[deviceKey].delete = false;
          console.error("Error deleting instrument:", error);
          message.error(
            t("monitorPage.Error: Failed to delete instrument", "") +
              ` ${deviceKey}`
          );
        }
      }
    };
    const downloadLogs = async (deviceKey: string) => {
      isLogsDownloading.value[deviceKey] = true;
      makeLogsButtonsDisable.value = true;
      try {
        const payload = {
          deviceName: deviceKey,
          state: "logs",
        };
        const updateResult = await updateEmDeviceState(
          selectedEdgemanIp,
          payload
        );
        const isEmConnected = server.value?.is_connected === "connected";
        if (!isEmConnected) {
          await new Promise((res) => setTimeout(res, 3000));
          isLogsDownloading.value[deviceKey] = false;
          makeLogsButtonsDisable.value = false;
          message.error(
            t(
              "monitorPage.EdgeManager selectedEdgemanIp is not connected, cannot download logs for deviceKey",
              "EdgeManager selectedEdgemanIp is not connected, cannot download logs for deviceKey"
            )
              .replace("selectedEdgemanIp", selectedEdgemanIp)
              .replace("deviceKey", deviceKey)
          );

          return;
        }
        if (updateResult.message === "Success") {
          message.info(
            t(
              "monitorPage.Logs requested successfully for deviceKey, will be downloaded in few seconds in background",
              "Logs requested successfully for deviceKey, will be downloaded in few seconds in background"
            ).replace("deviceKey", deviceKey)
          );
          await pollForLogsStatus(selectedEdgemanIp, deviceKey);
        } else {
          throw new Error(`HTTP error: ${updateResult.status}`);
        }
      } catch (error) {
        //loader stops.

        console.error("Error requesting logs:", error);
        await new Promise((res) => setTimeout(res, 3000));
        isLogsDownloading.value[deviceKey] = false;
        makeLogsButtonsDisable.value = false;
        message.error(
          t(
            "monitorPage.Failed to request logs for",
            "Failed to request logs for"
          ) + ` ${deviceKey}`
        );
      }
    };
    const fetchData = async () => {
      try {
        const response = await getMonitorDataByIp(selectedEdgemanIp);
        if (response.data) {
          const parsedData = response.data[0];

          const ip = parsedData.ip;
          const hostType = parsedData.host_type;
          const meta = parsedData.meta;

          const emDataByIp = {
            host_type: hostType,
            ip: ip,
            meta: meta,
            is_connected: parsedData.connection_status,
          };

          server.value = emDataByIp || {
            ip: selectedEdgemanIp,
            meta: {},
            is_connected: "disconnected",
          };

          if (server.value && server.value.meta && server.value.meta.devices) {
            Object.entries(server.value.meta.devices).forEach(
              ([, device]: [any, any]) => {
                if (!device.platform) {
                  device.platform = undefined;
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        server.value = {
          ip: selectedEdgemanIp,
          meta: {},

          is_connected: "disconnected",
        };
        message.error(
          t(
            "monitorPage.Failed to fetch initial EdgeManager data",
            "Failed to fetch initial EdgeManager data"
          )
        );
      } finally {
        isLoading.value = false; // Ensure loading is stopped
      }
    };

    const pollForLogsStatus = async (ip: string, deviceName: string) => {
      const pollingInterval = 2000;
      let isLogsReady = false;
      const delayHandler = (delayTime: number) =>
        new Promise((res) => setTimeout(res, delayTime));
      // initial delay
      await delayHandler(pollingInterval);
      let logDownloadAttemptCount = 0;
      while (!isLogsReady) {
        try {
          const data = await getPollingStatus(ip);

          switch (data.status) {
            case "not-started":
              if (logDownloadAttemptCount >= 3) {
                message.error(
                  t(
                    "monitorPage.Something went wrong, please try again after sometime",
                    "Something went wrong, please try again after sometime"
                  )
                );
                isLogsDownloading.value[deviceName] = false;
                makeLogsButtonsDisable.value = false;
                isLogsReady = true;
              }
              logDownloadAttemptCount++;
              await delayHandler(1000);
              break;
            case "stalled":
              isLogsDownloading.value[deviceName] = false;
              makeLogsButtonsDisable.value = false;
              isLogsReady = true;
              message.error(
                t(
                  "monitorPage.Something went wrong, please try again after sometime",
                  "Something went wrong, please try again after sometime"
                )
              );
              break;
            case "Request received":
              console.log("logs request received, waiting for processing...");
              await delayHandler(pollingInterval);
              break;
            case "Log file is Zipped":
              console.log("Log file is Zipped, waiting for download...");
              await delayHandler(pollingInterval);
              break;
            case "failed":
              isLogsDownloading.value[deviceName] = false;
              makeLogsButtonsDisable.value = false;
              isLogsReady = true;
              message.error(`${data.message}`);
              break;
            case "completed":
              await downloadCompletedLogs(ip, deviceName);

              isLogsReady = true;
              isLogsDownloading.value[deviceName] = false;
              makeLogsButtonsDisable.value = false;
              break;
            case "in-progress":
              await delayHandler(pollingInterval);
              console.log("Logs still being processed...");
              break;
            default:
              isLogsDownloading.value[deviceName] = false;
              makeLogsButtonsDisable.value = false;
              throw new Error("Unexpected status response");
          }
        } catch (err) {
          isLogsDownloading.value[deviceName] = false;
          makeLogsButtonsDisable.value = false;
          console.error("Error while polling for logs status:", err);
          break;
        }
      }
    };

    let heartbeatCheckInterval: ReturnType<typeof setTimeout> | null = null;

    const scheduleHeartbeatCheck = () => {
      // debouncing , reduce this api calls monitor.
      if (heartbeatCheckInterval) {
        clearTimeout(heartbeatCheckInterval);
      }
      // Schedule a check after HEARTBEAT_TIMEOUT
      heartbeatCheckInterval = setTimeout(() => {
        if (
          lastHeartbeat.value &&
          Date.now() - lastHeartbeat.value > HEARTBEAT_TIMEOUT - 1000
        ) {
          console.log("No recent heartbeat,make null");
          fetchData();
        }
      }, HEARTBEAT_TIMEOUT);
    };

    const subscribeToDynamicTopics = () => {
      socketService.subscribeToRooms([
        `instrument/apc/edgeman/${selectedEdgemanIp}`,
      ]);

      socketService.addEventListener("connect", () => {
        console.log("Socket Connected");
        lastHeartbeat.value = Date.now();
      });

      socketService.addEventListener("disconnect", () => {
        console.log("Socket Disconnected");
        lastHeartbeat.value = null;
        if (heartbeatCheckInterval) {
          clearTimeout(heartbeatCheckInterval);
        }
      });

      socketService.addEventListener("error", (error: any) => {
        console.error("Socket Error:", error);
      });

      socketService.handleEdgemanMessage((data: any) => {
        const topic = data.topic;
        data = data?.msg;

        if (typeof data === "string") data = JSON.parse(data);

        const edgemanIp = data?.edgemanIp;
        const emData = data?.emData;
        if (!edgemanIp || !emData) {
          console.error("Invalid message data - missing edgemanIp or emData", {
            edgemanIp,
            emData,
          });
          return;
        }
        if (selectedEdgemanIp && edgemanIp !== selectedEdgemanIp) {
          return;
        }

        const hardwareName = emData?.network?.hardwareName || "Supermicro";
        let newData;

        if (
          isUploading.value &&
          topic.includes(
            `/instrument/apc/edgeman/upload/status/${selectedEdgemanIp}`
          )
        ) {
          newData = {
            ip: edgemanIp,
            meta: {
              fileName: emData?.fileName,
              status: emData?.status,
              message: "",
              timestamp: emData?.timestamp,
            },
            host_type: hardwareName,
            is_connected: "connected",
          };

          if (newData?.meta?.status === "completed") {
            newData.meta.message = `File ${newData.meta.fileName} uploaded successfully into ${edgemanIp}`;
          } else {
            newData.meta.message = `Error in uploading File ${newData.meta.fileName} into ${edgemanIp}`;
          }

          message[newData?.meta?.status === "completed" ? "success" : "error"](
            newData?.meta?.message
          );

          isUploading.value = false;
          edgemanData[edgemanIp] = newData;
          socketService.leaveRooms(
            `instrument/apc/edgeman/upload/status/${edgemanIp}`
          );
          return;
        } else if (topic.includes(`/instrument/apc/edgeman/control/status/`)) {
          console.log("logs from the restarted em", data);
          const newData = {
            ip: edgemanIp,
            meta: {
              success: emData?.success,
              status: emData?.status,
              message: emData?.message || emData?.error,
              timestamp: emData?.timestamp,
            },
            host_type: hardwareName,
            is_connected: "connected",
          };

          if (newData.meta.success) {
            message.success(newData.meta.message);
          } else {
            message.error(newData?.meta.message);
          }

          if (selectedServiceType.value === "edgeman") {
            router.push("/monitoring");
          }

          socketService.leaveRooms(
            `instrument/apc/edgeman/control/status/${edgemanIp}`
          );
        } else {
          newData = {
            ip: edgemanIp,
            meta: {
              network: JSON.parse(JSON.stringify(emData.network || {})),
              platforms: JSON.parse(JSON.stringify(emData.platforms || {})),
              devices: JSON.parse(JSON.stringify(emData.devices || {})),
              isFileUploading: emData?.isFileUploading,
            },
            host_type: hardwareName,
            is_connected: "connected",
          };

          Object.entries(newData.meta.devices).forEach(
            ([key, device]: [string, any]) => {
              if (
                isDevicePlatformsChanging.value[key] &&
                selectedPlatforms.value[key] === device.platform
              ) {
                selectedPlatforms.value[key] = null;
              }
            }
          );

          edgemanData[edgemanIp] = newData;
        }
        lastHeartbeat.value = Date.now(); // Update heartbeat timestamp
        scheduleHeartbeatCheck();
        window.dispatchEvent(
          new CustomEvent("edgeman-updated", {
            detail: { ip: edgemanIp },
          })
        );
      });
    };

    const handleAddInstrument = () => {
      router.push(`/monitoring/${selectedEdgemanIp}/addDevice`);
    };

    const handleBack = () => {
      router.push("/monitoring");
    };
    const sortDevicesAndPlatForms = (currentData: any, type: string) => {
      if (!currentData || !currentData.meta) {
        return;
      }
      if (currentData.meta.devices && type === "devices") {
        const sortedDevices = Object.entries(currentData.meta.devices)
          .map(([key, device]: [any, any]) => ({
            key,
            ...device,
          }))
          .sort((a, b) => {
            if (a.agentConnected && !b.agentConnected) return -1;
            if (!a.agentConnected && b.agentConnected) return 1;

            return a.key.localeCompare(b.key);
          })
          .reduce((acc, { key, ...device }) => {
            acc[key] = device;
            return acc;
          }, {});

        return sortedDevices;
      }

      if (currentData.meta.platforms && type === "platforms") {
        const sortedPlatforms = Object.entries(currentData.meta.platforms)
          .map(([key, platform]: [any, any]) => ({ key, ...platform }))
          .sort((a, b) => {
            if (a.mqttConnected && !b.mqttConnected) return -1;
            if (!a.mqttConnected && b.mqttConnected) return 1;

            return a.key.localeCompare(b.key);
          })

          .reduce((acc, { key, ...platform }) => {
            acc[key] = platform;
            return acc;
          }, {});

        return sortedPlatforms;
      }
    };

    watch(
      () => edgemanData[selectedEdgemanIp],
      (newValue) => {
        if (
          newValue &&
          lastHeartbeat.value &&
          Date.now() - lastHeartbeat.value < HEARTBEAT_TIMEOUT
        ) {
          if (newValue?.meta?.status) {
            return;
          }

          server.value = newValue;

          Object.entries(server.value.meta.devices).forEach(
            ([key, device]: [string, any]) => {
              if (isDevicePlatformsChanging.value[key]) {
                device.platform =
                  selectedPlatforms.value[key] || device.platform;
              } else if (!device.platform) {
                device.platform = null;
              }
            }
          );

          const loaderNeeded = Object.entries(
            isDevicePlatformsChanging.value
          ).some(([key, value]: [string, boolean]) => {
            // Your logic here
            console.log(key);
            return value === true;
          });

          if (loaderNeeded) {
            isDevicePlatformsChanging.value = {};
          }
        } else if (!server.value || !server.value.meta) {
          fetchData();
        }
        selectedEmIps.value = [selectedEdgemanIp];
        isLoading.value = false;
      },
      { deep: true }
    );

    watch(
      () => edgemanData[selectedEdgemanIp],
      (newVal) => {
        if (
          edgemanData[selectedEdgemanIp]?.meta?.isFileUploading &&
          !isSubscribed.value
        ) {
          isSubscribed.value = newVal?.meta?.isFileUploading;
          isUploading.value = true; // if page refreshed

          socketService.connectSocket();
          socketService.subscribeToRooms([statusTopic]);
          subscribeToDynamicTopics();
        }
      },
      { immediate: true, deep: true }
    );

    onMounted(() => {
      fetchData();
      socketService.connectSocket();
      socketService.leaveRooms([subscribedTopic]);
      // server.value = edgemanData[selectedEdgemanIp];
      subscribeToDynamicTopics();
      setTimeout(() => {
        isLoading.value = false;
      }, 2000);
    });
    onUnmounted(() => {
      if (heartbeatCheckInterval) {
        clearInterval(heartbeatCheckInterval);
      }
      socketService.leaveRooms([subscribedTopic]);
      socketService.disconnectSocket();
    });

    return {
      t,
      selectedEdgemanIp,
      platformDetails,
      handleLoading,
      handleBack,
      setPlatform,
      isDevicePlatformsChanging,
      platformsAvailable,
      selectedPlatforms,
      platformSelectionForEachDevice,
      isHandlerDisable,
      selectedEmIps,
      isModalVisible,
      handleModalClose,
      uploadEmFiles,
      isUploading,
      getActionColumns,
      server,
      loadingStates,
      getDeviceStatusClass,
      getPlatformStatusClass,
      toggleAgent,
      toggleHandler,
      deleteInstrument,
      downloadLogs,
      isLogsDownloading,
      makeLogsButtonsDisable,
      isLoading,
      uploadProgress,
      isButtonsDisable,
      onTabChange,
      handleAddInstrument,
      isRestartModelVisible,
      selectedServiceType,
      handleServiceRestart,
      handleRestartModalClose,
      handleRestartTypeUpload,
      sortDevicesAndPlatForms,
      networkFields,
      isBatteryStatsAvailable,
      getFieldValue,
      getNestedValue,
      deviceFields,
      editInstrument,
    };
  },
});
</script>

<style scoped>
.edgeman-details-page {
  padding: 24px;
  min-height: 90vh;
  background: white;
  margin: 0 auto;
}
.device-data-section {
  padding: 12px;
}

.ant-table-tbody .ant-btn-primary.logs-button {
  border: 1px solid #262626;
  border-radius: 5px;
  background-color: #fff !important;
  color: #262626;
}

.ant-table-tbody .ant-btn-primary.logs-button[disabled],
.ant-table-tbody .ant-btn-primary.logs-button:disabled {
  border: 1px solid #262626;
  border-radius: 5px;
  background-color: #fff !important;
  color: #262626;
  opacity: 0.5;
}

.edit-button[disabled],
.edit-button:disabled {
  color: #95a1a9 !important;
}

/* .ant-table-tbody .ant-btn-primary.logs-button:hover {
  background-color: #e4e8eb !important;
} */
.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.back-button {
  padding: 4px 8px;
}
.upload-progress {
  position: absolute;
  bottom: -8px;
  color: whitesmoke;
  left: 0;
  width: 100%;
}
.data-section {
  padding: 16px 0px;
}
.info-row {
  margin-bottom: 8px;
  align-items: flex-start;
  display: contents;
}
.platform-selector {
  /* display: flex; */
  margin-left: 0.2rem;
  align-items: center;
}

.edit-button.ant-btn-text {
  border: none !important;
  color: white;
}

.edit-button.ant-btn-text:active,
.edit-button.ant-btn-text:hover,
.edit-button.ant-btn-text:focus {
  background-color: rgb(0, 0, 0, 0) !important;
  border: none !important;
  color: white;
}
.edit-button.ant-btn:focus-visible {
  outline: none;
}

.platform-set-button {
  background-color: #95a1a9;
  /* border-color: #1890ff; */
  color: white;
  border-radius: 6px;
  transition: all 0.3s;
}
.status-connected {
  color: #6fb788;
  margin: 2px 0 0 2px;
}

.status-disconnected {
  color: #b76f6f;
  margin: 2px 0 0 2px;
}
.platform-set-button:hover {
  background-color: #95a1a9 !important;
  border-color: #95a1a9 !important;
  color: #fff !important;
  transform: translateY(-1px);
}
.colon-col {
  text-align: center;
  display: flex;
  align-items: baseline;
  padding: 0 4px;
  font-weight: bold;
  color: black;
}

.ant-card {
  margin-bottom: 16px;
  min-height: 35vh;
}
.device-status-connected ::v-deep(.ant-card-head) {
  background-color: #6fb788;
  color: white;
}

.device-status-disconnected ::v-deep(.ant-card-head) {
  background-color: #b76f6f;
  color: white;
}

.button-container {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-bottom: 16px;
  /* margin-right: 15px; */
}

:deep(.ant-card-body p) {
  margin-bottom: 10px;
  line-height: 1.5;
  font-size: 14px;
}

.action-table {
  margin-top: 16px;
}

.text-green {
  color: #6fb788;
}

.text-red {
  color: #b76f6f;
}

.action-table {
  margin-top: 16px;
}

.platform-data-section {
  padding: 12px;
}

:deep(.action-table .ant-table-thead > tr > th) {
  background-color: #f7f7f7;
  font-weight: 600;
  color: #333;
  padding: 5px;
  text-align: center;
  font-size: 14px;
}

:deep(.action-table .ant-table-tbody > tr > td) {
  padding: 8px;
  text-align: center;
}

:deep(.action-table .ant-table-tbody > tr:hover > td) {
  background-color: #f0f7ff;
}

.ant-switch-checked {
  background-color: #6fb788 !important;
  border-color: #6fb788 !important;
  width: 79px;
}

.ant-switch {
  background-color: #b76f6f;
  border-color: #b76f6f;
}

.ant-switch:hover:not(.ant-switch-disabled) {
  background-color: #b76f6f;
  border-color: #b76f6f;
}

.ant-switch-inner {
  color: white;
}

.network-data-section {
  display: grid;
  /* grid-template-columns: auto 1fr; */
  gap: 1px 16px;
  align-items: start;
  font-size: 14px;
}

.data-row {
  display: contents;
}

.label {
  font-weight: bold;
  white-space: nowrap;
}

.value {
  white-space: pre-line;
}

.battery-section .value > div {
  margin-bottom: 4px;
}

.network-data-section {
  padding: 16px;
}

.network-data-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
}
.device-data-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
}

.label-col {
  text-align: left;
  padding-right: 8px;
  font-weight: 500;
  color: black;
  align-items: center;
  min-height: 20px;
  /* white-space: nowrap; */
  word-break: break-word;
}

.value-col {
  padding-left: 8px;
  color: #262626;
  display: flex;
  align-items: baseline;
  min-height: 20px;
  white-space: normal;
  word-break: break-word;
}

.battery-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.battery-info div {
  line-height: 1.5;
}

.device-card .ant-card-head {
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: 600;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.grid-item {
  display: flex;
}
</style>
