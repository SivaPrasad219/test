<template>
  <div class="card-container">
    <a-row :gutter="[16, 16]">
      <a-col
        v-for="(
          { ip, meta, host_type, is_connected, isbatchuploading, wifi_ip },
          index
        ) in filteredDataComputed"
        :key="index"
        :span="8"
        class="card-col"
      >
        <a-card
          :loading="loading"
          :class="getStatusColor(is_connected)"
          hoverable
          @click="$router.push({ path: `/monitoring/${ip}` })"
        >
          <a-spin
            v-if="isbatchuploading"
            :spinning="isbatchuploading"
            size="small"
            class="card-loader"
            tip=""
          >
            <template #indicator>
              <div class="custom-spinner">
                <a-button
                  :loading="isbatchuploading"
                  :disbaled="isbatchuploading"
                  >{{ t("monitorPage.Uploading", "Uploading") }}</a-button
                >
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
                <div class="spinner-dot"></div>
              </div>
            </template>
          </a-spin>
          <template #title> {{ host_type }} - {{ ip }} </template>
          <div class="card-content">
            <p>
              <strong>{{ t("monitorPage.Wifi IP", "Wifi IP") }} :</strong>
              <a-popover trigger="hover" placement="topLeft">
                <template #content>
                  <div style="color: black; max-width: 300px">
                    {{
                      t(
                        "monitorPage.WiFi IP address of the EdgeManager if connected wirelessly",
                        "WiFi IP address of the EdgeManager if connected wirelessly."
                      )
                    }}
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
              {{ wifi_ip || t("monitorPage.N/A", "N/A") }}
            </p>
            <p>
              <strong>{{ t("monitorPage.Platforms", "Platforms") }}:</strong>
              <a-popover trigger="hover" placement="topLeft">
                <template #content>
                  <div style="color: black; max-width: 300px">
                    {{
                      t(
                        "monitorPage.Platforms running on this EdgeManager and their connection status",
                        "Platforms running on this EdgeManager and their connection status."
                      )
                    }}
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
            </p>
            <div class="platforms-row">
              <span
                v-for="key in Object.keys(meta[ip]?.platforms).slice(0, 3)"
                :key="key"
                :class="[
                  'platform-item',
                  is_connected === 'connected' &&
                  meta[ip]?.platforms[key]?.mqttConnected
                    ? 'connected'
                    : 'disconnected',
                ]"
              >
                {{ key }}
              </span>
              <span v-if="Object.keys(meta[ip]?.platforms).length > 3"
                >...</span
              >
            </div>

            <div class="card-content">
              <p>
                <strong
                  >{{ t("monitorPage.Instruments", "Instruments") }}:</strong
                >
                <a-popover trigger="hover" placement="topLeft">
                  <template #content>
                    <div style="color: black; max-width: 300px">
                      {{
                        t(
                          "monitorPage.List of instruments connected to this EdgeManager and their operational status",
                          "List of instruments connected to this EdgeManager and their operational status."
                        )
                      }}
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
              </p>
              <div class="platforms-row">
                <span
                  v-for="(device, key) in Object.keys(meta[ip]?.devices).slice(
                    0,
                    3
                  )"
                  :key="key"
                  :class="[
                    'platform-item',
                    'device-item',
                    (device as any)?.status === 'connected' &&
                    is_connected === 'connected'
                      ? 'connected'
                      : 'disconnected',
                  ]"
                >
                  {{ device }}
                </span>
                <span v-if="Object.keys(meta[ip]?.devices).length > 3"
                  >...</span
                >
              </div>
            </div>

            <p>
              <strong>{{ t("monitorPage.Disk Info", "Disk Info") }}:</strong>
              <a-popover trigger="hover" placement="topLeft">
                <template #content>
                  <div style="color: black; max-width: 300px">
                    {{
                      t(
                        "monitorPage.Storage information including total disk space, available free space, and percentage of free space remaining",
                        "Storage information including total disk space, available free space, and percentage of free space remaining."
                      )
                    }}
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
            </p>
            <p>
              {{ t("monitorPage.Total Disk", "Total Disk") }}:
              {{ meta[ip].network?.totalDisk || t("monitorPage.N/A", "N/A") }}
            </p>
            <p>
              {{ t("monitorPage.Free Disk", "Free Disk") }}:
              {{ meta[ip].network?.freeDisk || t("monitorPage.N/A", "N/A") }}
            </p>
            <p>
              {{ t("monitorPage.Free Disk Percent", "Free Disk Percent") }}:
              {{
                meta[ip].network?.freeDiskPercent || t("monitorPage.N/A", "N/A")
              }}
            </p>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  h,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { Row, Col, Card, Badge } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
export default defineComponent({
  name: "EdgemanCards",
  components: {
    ARow: Row,
    ACol: Col,
    ACard: Card,
    InfoCircleOutlined,
    // ABadge: Badge,
  },
  props: {
    filteredData: {
      type: Array as () => any[],
      required: true,
    },
  },

  setup(props) {
    const { t } = useI18n();
    const loading = ref<boolean>(false);
    const modalVisible = ref<boolean>(false);
    const selectedEdgeman = ref<any | null>(null);
    const selectedEdgemanIP = ref("");

    const filteredDataComputed = computed(() => props.filteredData);
    type Device = {
      handlerRunning: boolean;
      agentRunning: boolean;
      [key: string]: any;
    };

    const openModal = (edgeman: any, ip: string) => {
      // console.log("ipDevice", ip);
      const sortedPlatforms = Object.entries(
        edgeman.platforms as Record<string, Device>
      ).sort(([, a], [, b]) => {
        const aStatus = a.mqttConnected ? 1 : 0;
        const bStatus = b.mqttConnected ? 1 : 0;
        return bStatus - aStatus;
      });
      const sortedDevices = Object.entries(
        edgeman.devices as Record<string, Device>
      ).sort(([, a], [, b]) => {
        const aStatus = a.handlerRunning && a.agentRunning ? 1 : 0;
        const bStatus = b.handlerRunning && b.agentRunning ? 1 : 0;
        return bStatus - aStatus;
      });
      const sortedDeviceObj = Object.fromEntries(sortedDevices);
      const sortedPlatformsObj = Object.fromEntries(sortedPlatforms);
      selectedEdgeman.value = {
        ...edgeman,
        devices: sortedDeviceObj,
        platforms: sortedPlatformsObj,
      };
      selectedEdgemanIP.value = ip;

      modalVisible.value = true;
      console.log("Opening modal with data:", selectedEdgeman.value);
    };

    const closeModal = () => {
      modalVisible.value = false;
      selectedEdgeman.value = null;
      selectedEdgemanIP.value = "";
      console.log("Modal closed");
    };

    const renderTitle = (
      hostType: string,
      ip: string,
      is_connected: string
    ) => {
      return h("div", { class: "title-with-badge" }, [
        h("span", `${hostType}: ${ip}`),
        h(Badge, {
          status: is_connected === "connected" ? "success" : "error",
        }),
      ]);
    };

    const getStatusColor = (status: any) => {
      return status === "connected"
        ? "server-card title-green"
        : "server-card title-red";
    };

    // In EdgemanCard.vue setup function
    const updateEdgemanModal = (ip: any) => {
      if (selectedEdgemanIP.value === ip && modalVisible.value) {
        // If the modal is open and showing this IP, update the data
        const updatedData = filteredDataComputed.value.find(
          (item) => item.ip === ip
        )?.meta[ip];
        if (updatedData) {
          selectedEdgeman.value = { ...updatedData };
        }
      }
    };

    // Add a watch to detect changes in the filteredData prop
    watch(
      () => props.filteredData,
      () => {
        if (modalVisible.value && selectedEdgemanIP.value) {
          updateEdgemanModal(selectedEdgemanIP.value);
        }
      },
      { deep: true }
    );

    onMounted(() => {
      window.addEventListener("edgeman-updated", (event: any) => {
        if (
          event.detail &&
          event.detail.ip === selectedEdgemanIP.value &&
          modalVisible.value
        ) {
          updateEdgemanModal(event.detail.ip);
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener("edgeman-updated", (event: any) => {
        // Need to provide the same handler function reference to properly remove
        if (
          event.detail &&
          event.detail.ip === selectedEdgemanIP.value &&
          modalVisible.value
        ) {
          updateEdgemanModal(event.detail.ip);
        }
      });
    });

    return {
      filteredDataComputed,
      loading,
      modalVisible,
      selectedEdgeman,
      selectedEdgemanIP,
      openModal,
      closeModal,
      renderTitle,
      getStatusColor,
      t,
    };
  },
});
</script>

<style scoped>
.card-container {
  padding: 15px 0px;
  background: white;
}

.card-loader {
  position: absolute;
  top: 20px;
  right: 120px;
  /* top: 12px;
  right: 12px; */
  z-index: 10;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 6px;
}

.card-loader :deep(.ant-spin-text) {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.custom-spinner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.spinner-dot {
  width: 6px;
  height: 6px;
  background-color: #ffffff;
  border-radius: 50%;
  animation: bounce 0.6s infinite alternate;
}

.spinner-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.spinner-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  to {
    transform: translateY(-4px);
  }
}

.card-col {
  display: flex;
}

.server-card {
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.server-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px);
}

.title-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platforms-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-item {
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.device-item {
  cursor: pointer;
  transition: background-color 0.3s;
}

.device-item.connected {
  background-color: #f0f2f5; /* Light green for connected devices */
  /* color: #155724; */
}

.device-item.disconnected {
  background-color: #f0f2f5; /* Light red for disconnected devices */
  /* color: #721c24; */
}

.device-item:hover {
  opacity: 0.8;
}

.card-content p {
  margin: 8px 0;
}

/* .title-green {
  background: #6fb788;
}
.title-red {
  background: #b76f6f;
} */
.title-green ::v-deep(.ant-card-head) {
  background-color: #6fb788;
  color: white;
}

.title-red ::v-deep(.ant-card-head) {
  background-color: #b76f6f;
  color: white;
}
</style>
