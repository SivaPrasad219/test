<template>
  <div class="monitor-view">
    <a-spin
      :spinning="isPageLoading"
      :tip="
        t('monitorPage.Loading EdgeManager data', 'Loading EdgeManager data...')
      "
    >
      <div class="layout">
        <div class="main-content">
          <div class="tabHeaderWithReload">
            <!-- Reload Icon -->
            <ReloadOutlined class="refreshIcon" @click="refreshMonitorPage" />
            <!-- Tabs -->
            <a-tabs
              v-model:activeKey="activeKey"
              @change="onTabChange"
              class="host-tabs"
            >
              <a-tab-pane v-for="host in hostTypes" :key="host" :tab="host">
                <a-col :span="24">
                  <div class="stats-container">
                    <div class="deviceStatsRow column-35">
                      <div class="header-div">
                        <div>
                          <h3 class="headerName">
                            {{
                              t(
                                "monitorPage.EdgeManager Statistics",
                                "EdgeManager Statistics"
                              )
                            }}
                          </h3>
                          <a-popover trigger="hover" placement="topLeft">
                            <template #content>
                              <div style="color: black; max-width: 350px">
                                {{
                                  t(
                                    "monitorPage.Displays real-time statistics and status information for all registered EdgeManagers in the system",
                                    "Displays real-time statistics and status information for all registered EdgeManagers in the system."
                                  )
                                }}
                              </div>
                            </template>
                            <InfoCircleOutlined
                              style="
                                margin-left: 8px;
                                color: #1890ff;
                                cursor: pointer;
                              "
                            />
                          </a-popover>
                        </div>
                        <div class="button-container">
                          <a-form-item>
                            <a-button
                              :style="{ margin: '0px auto' }"
                              v-if="!isSuperMicro"
                              type="primary"
                              @click="handleBatchUpload"
                              class="upload-btn"
                            >
                              <upload-outlined />
                              {{
                                t("monitorPage.Batch Upload", "Batch Upload")
                              }}
                            </a-button>
                          </a-form-item>

                          <a-form-item>
                            <a-button
                              v-if="!isSuperMicro"
                              :style="{ margin: '0px auto' }"
                              type="primary"
                              class="service-restart-btn"
                              @click="handleServiceRestart"
                            >
                              <ReloadOutlined />
                              {{
                                t(
                                  "monitorPage.Restart Service",
                                  "Restart Service"
                                )
                              }}
                            </a-button>
                          </a-form-item>

                          <a-form-item>
                            <a-button
                              :style="{ margin: '0px auto' }"
                              type="primary"
                              class="terminal-btn"
                              @click="handleOpenTerminal"
                            >
                              <CodeOutlined />
                              {{ t("monitorPage.Terminal", "Terminal") }}
                            </a-button>
                          </a-form-item>
                        </div>
                      </div>
                      <div class="sampleStatsContainer">
                        <div
                          v-for="column in deviceStatsColumns"
                          :key="column.dataIndex"
                          class="sampleStatsPair"
                        >
                          <div class="sampleStatsKey">
                            {{ column.title }}
                            <a-popover trigger="hover" placement="topLeft">
                              <template #content>
                                <div style="color: black; max-width: 350px">
                                  <template
                                    v-if="column.dataIndex === 'totalEdgeman'"
                                  >
                                    {{
                                      t(
                                        "monitorPage.Total number of EdgeManagers registered in the system across specific host types",
                                        "Total number of EdgeManagers registered in the system across specific host types."
                                      )
                                    }}
                                  </template>
                                  <template
                                    v-else-if="
                                      column.dataIndex === 'connectedDevices'
                                    "
                                  >
                                    {{
                                      t(
                                        "monitorPage.Number of EdgeManagers currently connected and actively communicating",
                                        "Number of EdgeManagers currently connected and actively communicating."
                                      )
                                    }}
                                  </template>
                                  <template
                                    v-else-if="
                                      column.dataIndex === 'disconnectedDevices'
                                    "
                                  >
                                    {{
                                      t(
                                        "monitorPage.Number of EdgeManagers that are registered but currently not responding",
                                        "Number of EdgeManagers that are registered but currently not responding."
                                      )
                                    }}
                                  </template>
                                </div>
                              </template>
                              <InfoCircleOutlined
                                style="
                                  margin-left: 4px;
                                  font-size: 12px;
                                  color: #1890ff;
                                  cursor: pointer;
                                "
                              />
                            </a-popover>
                          </div>
                          <div class="sampleStatsValue">
                            {{ deviceStats[column.dataIndex] ?? "" }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="filteredData.length > 0">
                      <EdgemanCard :filtered-data="filteredData" />
                    </div>
                    <div v-else class="empty-page">
                      <a-empty
                        :description="
                          t(
                            'monitorPage.No EdgeManagers available for host type',
                            'No EdgeManagers available for host type'
                          ) +
                          ' ' +
                          activeKey
                        "
                      />
                    </div>
                  </div>
                </a-col>
              </a-tab-pane>
            </a-tabs>

            <a-empty
              v-if="hostTypes.length === 0 && !isPageLoading"
              class="empty-page"
            >
              <p class="empty-text">
                {{
                  translateLabel(
                    "monitorPage",
                    "Host types not found contact admin. please try after some time"
                  )
                }}
              </p>
            </a-empty>
          </div>
        </div>

        <UploadEmFilesModal
          :visible="isModalVisible"
          :uploadType="`batchUpload`"
          :selectedEmIps="connectedEmIps"
          :emData="edgemanData"
          @close="handleModalClose"
          @loading="handleLoading"
          @uploadId="handleUploadId"
        />

        <RestartModel
          :visible="isRestartModelVisible"
          :restartType="selectedServiceType"
          :selectedEmIps="connectedEmIps"
          :emData="edgemanData"
          @close="handleRestartModalClose"
          @upload="handleRestartTypeUpload"
        />

        <!-- Terminal Modal -->
        <a-modal
          :open="isTerminalVisible"
          :title="t('monitorPage.DAS Terminal', terminalTitle)"
          :width="900"
          :maskClosable="false"
          :body-style="{ padding: 0, height: '600px' }"
          :footer="null"
          @cancel="handleTerminalClose"
        >
          <WebTerminal
            :title="terminalTitle"
            :wsUrl="terminalWsUrl"
            v-if="isTerminalVisible"
          />
        </a-modal>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import { Tabs, message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import EdgemanCard from "./EdgemanCard.vue";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";

import {
  ReloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  CodeOutlined,
} from "@ant-design/icons-vue";
import {
  fetchChunksStatusByEdgemanIp,
  getMonitorData,
} from "../../services/apiService";
import UploadEmFilesModal from "./UploadEmFilesModal.vue";
import RestartModel from "./RestartModel.vue";
import WebTerminal from "./WebTerminal.vue";
import { useRestartService } from "@/composables/useRestartService";
import infoComments from "@/common/constants.json";
import { translateLabel } from "@/common/utils";

export default defineComponent({
  name: "MonitorView",
  components: {
    ATabs: Tabs,
    ATabPane: Tabs.TabPane,
    ReloadOutlined,
    UploadOutlined,
    InfoCircleOutlined,
    CodeOutlined,
    EdgemanCard,
    RestartModel,
    UploadEmFilesModal,
    WebTerminal,
  },

  setup() {
    const { t } = useI18n();
    const InfoCommentsData = infoComments;
    const edgemanData = ref<{ [key: string]: any }>({});
    const isModalVisible = ref(false);
    const emDataSet = ref<any[]>([]);
    const activeKey = ref<string>("");
    const subscribedEmIds = ref<Set<string>>(new Set());
    // const handleRestartModalClose = () => {
    //   isRestartModelVisible.value = false;
    // };

    // Use the restart service composable
    const {
      isRestartModelVisible,
      selectedServiceType,
      handleServiceRestart,
      handleRestartModalClose,
      handleRestartTypeUpload: handleRestartTypeUploadComposable,
      // handleBatchEdgemanRestart,
      // handleBatchScreenRestart,
    } = useRestartService();

    // Wrapper function to handle restart type upload with existing socket service
    const handleRestartTypeUpload = async (data: any) => {
      await handleRestartTypeUploadComposable(data, socketService);
    };

    const deviceStatsColumns = computed(() => [
      {
        title: t(
          "monitorPage.Total Registered EdgeManagers",
          "Total Registered EdgeManagers"
        ),
        dataIndex: "totalEdgeman",
      },
      {
        title: t("monitorPage.Connected", "Connected"),
        dataIndex: "connectedDevices",
      },
      {
        title: t("monitorPage.Disconnected", "Disconnected"),
        dataIndex: "disconnectedDevices",
      },
    ]);

    const socketService = new SocketService(
      `${environment.MONITORING_URL}`,
      "ms"
    );

    const selectedBatchIps = ref<any[]>([]);
    const isBatchUploadingStarted = ref(false);
    const batchEmsUploading = ref([]);

    const lastHeartbeats = new Map<string, number>();
    const edgemanTimeouts = new Map<string, any>();
    const interval = ref();
    const uploadId = ref<string>();

    const refreshMonitorPage = () => {
      fetchData(); // Re-fetch data when page is refreshed
    };

    const edgemanBatchUploadingStatus = ref<any>({});
    const isTerminalVisible = ref(false);
    const selectedTerminalEmIp = ref<string>("");
    const terminalTitle = ref<string>("DAS Terminal");
    const terminalWsUrl = ref<string>("");

    const handleBatchUpload = () => {
      isModalVisible.value = true;
    };

    const handleOpenTerminal = () => {
      terminalTitle.value = "DAS Terminal";
      const wsHost = new URL(
        environment.MONITORING_URL || "http://localhost:3001"
      ).host;
      terminalWsUrl.value = wsHost;
      isTerminalVisible.value = true;
    };

    const handleTerminalClose = () => {
      isTerminalVisible.value = false;
      selectedTerminalEmIp.value = "";
    };

    const getChunksStatusByUploadId = async () => {
      const data = await Promise.all(
        uploadIds.value.map((uploadId) =>
          fetchChunksStatusByEdgemanIp(uploadId)
        )
      );

      if (data[0].length === 0) {
        console.log("no data found for the upload Id");
        return;
      }

      // need to update emuploading states.
      const uploadingEms = data[0].filter(
        (emData: any) => emData.is_batch_uploading === true
      );

      data[0].forEach((emData: any) => {
        edgemanBatchUploadingStatus.value[emData.ip as string] =
          emData.is_batch_uploading;
      });
      console.log(
        "updated edgemanBatchUploadingStatus",
        edgemanBatchUploadingStatus.value,
        uploadingEms
      );

      if (uploadingEms.length === 0) {
        clearInterval(interval.value);
        isBatchUploadingStarted.value = false;
        uploadIds.value = [];
      }
    };

    const uploadIds = ref<string[]>([]);

    const fetchData = async () => {
      const response = await getMonitorData();

      if (response.data) {
        const parsedData = response.data;
        console.log(parsedData);

        parsedData.forEach((item: any) => {
          edgemanBatchUploadingStatus.value[item.ip as string] =
            item.is_batch_uploading;
          if (
            edgemanBatchUploadingStatus.value[item.ip as string] === true &&
            !uploadIds.value?.includes(item.upload_id)
          ) {
            uploadIds.value.push(item.upload_id);
          }
        });

        // polling for true values.
        if (uploadIds.value.length > 0) {
          interval.value = setInterval(() => {
            getChunksStatusByUploadId();
          }, 10000);
        }

        emDataSet.value = parsedData
          .map((item: any) => {
            const ip = item.ip;
            const hostType = determineHostType(item);
            const meta = { [ip]: item.meta };
            return {
              host_type: hostType,
              ip: ip,
              meta: meta,
              isbatchuploading: item.is_batch_uploading,
              is_connected: "disconnected",
            };
          })
          .filter(Boolean);

        console.log("emdataset after the page loads", emDataSet.value);

        const edgemanDataObject = Object.fromEntries(
          parsedData.map((edgeman: any) => {
            const edgemanIp = edgeman.ip;
            return [
              edgemanIp,
              {
                ...(edgemanData.value[edgemanIp] || {}),
                network: edgeman.meta?.network || {},
                platforms: edgeman.meta?.platforms || {},
                devices: edgeman.meta?.devices || {},
                isbatchuploading: edgeman.isbatchuploading,
                is_connected: "disconnected",
                host_type: edgeman.host_type,
              },
            ];
          })
        );

        edgemanData.value = edgemanDataObject;

        if (!activeKey.value && emDataSet.value.length > 0) {
          activeKey.value = emDataSet.value[0].host_type;
        }

        const edgemanIps = parsedData.map((eachEdgeman: any) => eachEdgeman.ip);

        subscribedEmIds.value.forEach((edgemanIp) => {
          if (!edgemanIps.includes(edgemanIp)) {
            socketService.leaveRooms([`instrument/apc/edgeman/${edgemanIp}`]);
            subscribedEmIds.value.delete(edgemanIp);
            // Clear timeout for removed EdgeMan
            if (edgemanTimeouts.has(edgemanIp)) {
              clearTimeout(edgemanTimeouts.get(edgemanIp));
              edgemanTimeouts.delete(edgemanIp);
            }
            lastHeartbeats.delete(edgemanIp);
          }
        });

        edgemanIps.forEach((edgemanIp: any) => {
          if (edgemanIp !== "notification") {
            if (!subscribedEmIds.value.has(edgemanIp)) {
              socketService.subscribeToRooms([
                `instrument/apc/edgeman/${edgemanIp}`,
              ]);
              subscribedEmIds.value.add(edgemanIp);
            }
          }
        });
      }
      isPageLoading.value = false;
    };

    const isSuperMicro = computed(() => {
      return activeKey.value === "Supermicro";
    });

    const deviceStats = computed(() => ({
      totalEdgeman: filteredData.value.length,
      connectedDevices: connectedDevicesCount.value,
      disconnectedDevices: disconnectedDevicesCount.value,
    }));

    const hostTypes = computed(() => {
      const uniqueHosts = new Set(
        emDataSet.value.map((item: any) => item.host_type)
      );
      return Array.from(uniqueHosts);
    });

    const onTabChange = (key: string | number) => {
      activeKey.value = key.toString();
    };

    const filteredData = computed(() => {
      return emDataSet.value.filter(
        (item: any) => item.host_type === activeKey.value
      );
    });

    const subscribeToAllEms = (batchIps: any) => {
      console.log("reached subscribeToAllEms", batchIps);
      if (batchIps.length === 0) return;
      batchIps.forEach((ip: any) => {
        socketService.subscribeToRooms(
          `instrument/apc/edgeman/upload/status/${ip}`
        );
      });
      console.log("subscribed all batchIps");
    };

    const handleLoading = (batchIps: any) => {
      // handleBatchUploadLoading
      selectedBatchIps.value = batchIps;
      batchEmsUploading.value = batchIps;

      isBatchUploadingStarted.value = true;
      subscribeToAllEms(selectedBatchIps.value);
      fetchData();
      console.log("crossed handle loading");
    };

    const handleUploadId = (response: any) => {
      console.log("data from the handleUploadId emits", response);
      uploadId.value = response.data.uploadId;
    };

    const determineHostType = (data: any) => {
      return data.host_type || "Supermicro";
    };

    const subscribeToDynamicTopics = () => {
      socketService.subscribeToRooms(["instrument/apc/edgeman/+"]);

      socketService.addEventListener("connect", () => {
        console.log("Socket Connected");
      });

      socketService.addEventListener("disconnect", () => {
        console.log("Socket Disconnected");
      });

      socketService.addEventListener("error", (error: any) => {
        console.error("Socket Error:", error);
      });

      socketService.handleEdgemanMessage((data: any) => {
        const topic = data.topic;
        data = data.msg;

        if (typeof data === "string") data = JSON.parse(data);
        const edgemanIp = data?.edgemanIp;
        const emData = data?.emData;

        if (!edgemanIp || !emData) return;

        const now = Date.now();
        lastHeartbeats.set(edgemanIp, now);

        // Clear existing timeout for this EdgeMan
        if (edgemanTimeouts.has(edgemanIp)) {
          clearTimeout(edgemanTimeouts.get(edgemanIp));
        }

        // Set new timeout - if no message in 5 seconds, mark as disconnected
        const TIMEOUT = 5000;
        const timeoutId = setTimeout(() => {
          console.log(
            `EdgeMan ${edgemanIp} heartbeat timeout - marking as disconnected`
          );
          if (edgemanData.value[edgemanIp]) {
            edgemanData.value[edgemanIp].is_connected = "disconnected";
            updateEdgemanData();
          }
          edgemanTimeouts.delete(edgemanIp);
          lastHeartbeats.delete(edgemanIp);
        }, TIMEOUT);

        edgemanTimeouts.set(edgemanIp, timeoutId);

        const hardwareName = emData?.network?.hardwareName || "Supermicro";

        const currentIp = edgemanData.value[edgemanIp] || {};

        if (
          isBatchUploadingStarted.value &&
          topic.includes(`instrument/apc/edgeman/upload/status/`)
        ) {
          const newData = {
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
            // newData.meta.message = `File ${newData.meta.fileName} uploaded successfully into ${edgemanIp}`;
            newData.meta.message = t("monitorPage.fileUploaded successfully", {
              fileName: newData.meta.fileName,
              ip: edgemanIp,
            })
              .replace("{{fileName}}", newData.meta.fileName)
              .replace("{{ip}}", edgemanIp);
          } else if (newData?.meta?.status === "failed") {
            // newData.meta.message = `Error in uploading File ${newData.meta.fileName} into ${edgemanIp}`;
            newData.meta.message = t("monitorPage.fileUploading error", {
              fileName: newData.meta.fileName,
              ip: edgemanIp,
            })
              .replace("{{fileName}}", newData.meta.fileName)
              .replace("{{ip}}", edgemanIp);
          }
          message[newData?.meta?.status === "completed" ? "success" : "error"](
            newData?.meta?.message
          );

          socketService.leaveRooms(
            `instrument/apc/edgeman/upload/status/${edgemanIp}`
          );
          edgemanBatchUploadingStatus.value[edgemanIp] = false;
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
          socketService.leaveRooms(
            `instrument/apc/edgeman/control/status/${edgemanIp}`
          );
          return;
        }

        edgemanData.value = {
          ...edgemanData.value,
          [edgemanIp]: {
            ...currentIp,
            wifi_ip: emData.wifi_ip,
            network: JSON.parse(JSON.stringify(emData.network || {})),
            platforms: emData.platforms || {},
            devices: emData.devices || {},
            isbatchuploading: edgemanBatchUploadingStatus.value[edgemanIp],
            is_connected: "connected",
            host_type: hardwareName,
          },
        };
        updateEdgemanData();
        const customEvent = new CustomEvent("edgeman-updated", {
          detail: { ip: edgemanIp },
        });
        window.dispatchEvent(customEvent);
      });
    };

    const updateEdgemanData = () => {
      const edgemanIps = Object.keys(edgemanData.value);
      emDataSet.value = edgemanIps
        .map((ip) => {
          if (ip === "notification") return null;

          const data = edgemanData.value[ip];
          const hostType = data?.host_type || "Supermicro";

          return {
            host_type: hostType,
            ip: ip,
            wifi_ip: data.wifi_ip || "N/A",
            isbatchuploading: data.isbatchuploading || false,
            meta: { [ip]: data },
            is_connected: data?.is_connected || "disconnected",
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => {
          if (a.is_connected === "connected" && b.is_connected !== "connected")
            return -1;
          if (a.is_connected !== "connected" && b.is_connected === "connected")
            return 1;
          return 0;
        });
    };

    const handleModalClose = () => {
      isModalVisible.value = false;
    };

    const connectedDevicesCount = computed(() => {
      return filteredData.value.filter(
        (item) => item.is_connected === "connected"
      ).length;
    });

    const disconnectedDevicesCount = computed(() => {
      return filteredData.value.filter(
        (item) => item.is_connected === "disconnected"
      ).length;
    });
    const connectedEmIps = computed(() => {
      let arr: any = [];
      filteredData.value.forEach((item: any) => {
        // only sending connected and free emIp's.
        if (
          item.is_connected === "connected" &&
          item.isbatchuploading === false
        ) {
          arr.push(item.ip);
        }
      });
      return arr;
    });

    watch(emDataSet, () => {
      if (!hostTypes.value.includes(activeKey.value)) {
        activeKey.value = hostTypes.value[0] || "";
      }
    });
    const isPageLoading = ref(false);

    onMounted(() => {
      socketService.connectSocket();
      isPageLoading.value = true;
      fetchData();
      subscribeToDynamicTopics();
    });

    onUnmounted(() => {
      // Clear all EdgeMan timeouts
      edgemanTimeouts.forEach((timeout) => clearTimeout(timeout));
      edgemanTimeouts.clear();
      socketService.disconnectSocket();
    });

    return {
      activeKey,
      hostTypes,
      isPageLoading,
      handleUploadId,
      handleBatchUpload,
      handleModalClose,
      isModalVisible,
      filteredData,
      deviceStats,
      deviceStatsColumns,
      refreshMonitorPage,
      connectedEmIps,
      onTabChange,
      handleLoading,
      edgemanData,
      isBatchUploadingStarted,
      isRestartModelVisible,
      handleRestartModalClose,
      handleServiceRestart,
      selectedServiceType,
      handleRestartTypeUpload,
      InfoCommentsData,
      isSuperMicro,
      t,
      isTerminalVisible,
      selectedTerminalEmIp,
      terminalTitle,
      terminalWsUrl,
      handleOpenTerminal,
      handleTerminalClose,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.monitor-view {
  padding: 6px;
  background-color: white;
  min-height: 90vh;
}

.empty-text {
  text-align: center;
  font-size: 1rem;
}

:deep(.ant-empty-description) {
  visibility: hidden;
  margin-bottom: 0px;
}

:deep(.ant-empty-footer) {
  margin-top: 0px;
}

.empty-page {
  margin: 15vh auto;
}

.button-container {
  display: flex;
  align-items: center;
  gap: 0px 10px;
}

.header-div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.layout {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 3;
}

.refreshIcon {
  font-size: 14px;
  cursor: pointer;
  margin-top: 4px;
  margin-right: 10px;
  transition: color 0.3s;
}

.refreshIcon:hover {
  color: #1890ff;
}

.host-tabs :deep(.ant-tabs-nav) {
  margin: 0;
}

.host-tabs :deep(.ant-tabs-tab) {
  font-size: 14px;
  padding: 8px 16px;
}

.stats-container {
  display: flex;
  flex-direction: column;
}

.deviceStatsRow {
  padding-left: 0;
}

.sampleStatsContainer {
  display: flex;
  flex-direction: row;
}

.sampleStatsPair {
  display: flex;
  margin: 5px 35px 5px 0;
  width: 30%; /* Two columns layout */
  padding: 10px 5px;
  border-bottom: 1px solid #e8e8e8;
  justify-content: space-between;
}

.sampleStatsKey {
  width: 270px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: lighter;
  font-style: normal;
  color: rgba(0, 0, 0, 0.65);
}

.sampleStatsValue {
  text-align: right;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #606060;
  text-align: end;
}
.headerName {
  margin-top: 1rem;
  display: inline-block;
}
.upload-btn,
.service-restart-btn,
.terminal-btn {
  margin-top: 1rem !important;
  width: 180px;
  margin-right: 0px;
}
.tabHeaderWithReload {
  padding: 10px;
}
</style>
