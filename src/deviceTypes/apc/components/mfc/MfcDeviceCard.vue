<template>
  <a-card class="device-card" size="small">
    <template #title>
      <div class="card-header">
        <div class="device-info">
          <a-tag class="device-id" :bordered="false" color="green">{{
            deviceId
          }}</a-tag>
          <span class="device-name">{{ program }}</span>
        </div>
        <!-- <a-badge :text="controlBadge" color="blue" class="control-badge" /> -->
        <div class="control-badge-wrapper">
          <a-button
            type="primary"
            ghost
            shape="round"
            class="control-badge"
            size="small"
          >
            {{ controlBadge }}
          </a-button>
          <a-dropdown :trigger="['hover']" placement="bottomRight">
            <a-button type="text" size="small" class="dots-button">
              <template #icon>
                <MoreOutlined />
              </template>
            </a-button>
            <template #overlay>
              <a-menu @click="handleMenuClick">
                <a-menu-item disabled key="stop">
                  {{ translateLabel("mfgPage", "Stop") }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
      <div class="device-model">
        <span>{{ deviceName }}</span>
      </div>
      <div class="device-location">
        <EnvironmentOutlined />
        <span>{{ location }}</span>
      </div>
    </template>

    <div class="monitoring-panel">
      <div class="panel-content">
        <div class="metrics-grid-row">
          <div class="metric-item">
            <span class="metric-value">
              {{ deviceName }} {{ translateLabel("mfgPage", "Monitor") }}
            </span>
            <span class="metric-label">{{ formattedTime }}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">
              {{ translateLabel("mfgPage", "Status") }}:
            </span>
            <span class="metric-value">{{ sampleData.status }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">
              {{ translateLabel("mfgPage", "Volume") }}:
            </span>
            <span class="metric-value">{{ sampleData.volume }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">
              {{ translateLabel("mfgPage", "Samples") }}:
            </span>
            <span class="metric-value">{{ sampleData.samples }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">
              {{ translateLabel("mfgPage", "Elapsed") }}:
            </span>
            <span class="metric-value">{{ sampleData.elapsed }}</span>
          </div>
        </div>

        <div
          v-if="sampleData.output?.data?.cumulative_data"
          class="divider"
        ></div>

        <div
          v-if="sampleData.output?.data?.cumulative_data"
          class="metrics-grid-row"
        >
          <div
            v-for="[key, value] in Object.entries(
              sampleData.output.data.cumulative_data
            )"
            :key="key"
            class="metric-item"
          >
            <span class="metric-label">{{ key }}</span>
            <span class="metric-value">{{
              (value || 0).toLocaleString()
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { EnvironmentOutlined, MoreOutlined } from "@ant-design/icons-vue";
import { computed } from "vue";
import { translateLabel } from "@/common/utils";

interface SampleData {
  status: string;
  volume: string;
  samples: number;
  elapsed: string;
  output: any;
}

interface DeviceCardProps {
  deviceName: string;
  deviceId: string;
  location: string;
  controlBadge: string;
  sampleData: SampleData;
  program: string;
  assetTime: string;
}

// eslint-disable-next-line no-undef
const props = defineProps<DeviceCardProps>();

// Format ISO timestamp to HH:MM:SS
const formattedTime = computed(() => {
  if (!props.assetTime || props.assetTime === "-") {
    return "--:--:--";
  }
  try {
    const date = new Date(props.assetTime);
    return date.toTimeString().split(" ")[0]; // Gets HH:MM:SS part
  } catch {
    return "--:--:--";
  }
});

const handleMenuClick = ({ key }: { key: string }) => {
  if (key === "stop") {
    console.log("stop message");
  }
};
</script>

<style scoped>
.device-card {
  border-top: 3px solid #1677ff;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.device-card :deep(.ant-card-head) {
  padding: 0 8px 12px 8px;
  min-height: auto;
}

.device-card :deep(.ant-card-body) {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
}

.device-info {
  display: flex;
  flex-direction: column;
  padding-top: 12px;
}

.device-name {
  font-size: 11px;
  font-weight: 600;
  color: #484c55;
  line-height: 1.2;
  margin: 4px 0 0 0;
}

.device-id {
  width: fit-content;
  margin-bottom: 4px;
  font-size: 10px;
}

.control-badge-wrapper {
  position: relative;
  display: inline-block;
  padding-top: 10px;
  margin-right: 12px;
}

.control-badge {
  font-size: 10px;
  line-height: 1.8;
  font-weight: 700;
}
.control-badge:hover {
  cursor: default;
}

.dots-button {
  position: absolute;
  top: 2px;
  right: -12px;
  padding: 0;
  width: 20px;
  height: 20px;
  min-width: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dots-button:hover {
  background: white;
}

.dots-button :deep(.anticon) {
  font-size: 12px;
  color: #666;
}

.dots-button:hover :deep(.anticon) {
  color: #1890ff;
}

/* .control-badge :deep(.ant-badge-status-text) {
  font-size: 11px;
  margin-left: 4px;
} */

.device-model {
  font-size: 11px;
  color: #bdbec1;
  margin: 4px 0;
  line-height: 1.2;
  font-weight: 400;
}
.device-location {
  font-size: 11px;
  color: #1677ff;
  margin: 4px 0;
  line-height: 1.2;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
}

.monitoring-panel {
  background-color: #000000;
  border-radius: 10px;
  padding: 10px 8px;
  margin-top: 0;
  min-height: 133px;
}

.panel-content {
  font-family: "Courier New", Courier, monospace;
  font-size: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.divider {
  height: 1px;
  background-color: #333;
  margin: 8px 0;
}

.metrics-grid-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metrics-grid-row .metric-item {
  width: 100%;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.metric-label {
  color: #dadada;
  font-weight: normal;
  font-size: 10px;
  line-height: 1.2;
  text-align: left;
  flex-shrink: 0;
}

.metric-value {
  color: #00ff00;
  font-weight: 600;
  font-size: 10px;
  line-height: 1.3;
  white-space: nowrap;
  text-align: right;
}

/* Responsive adjustments for very small cards */
@media (max-width: 350px) {
  .device-card {
    max-width: 100%;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .metric-label {
    font-size: 8px;
  }

  .metric-value {
    font-size: 9px;
  }

  .device-name {
    font-size: 11px;
  }

  .device-id {
    font-size: 10px;
  }

  .monitoring-panel {
    padding: 10px 8px;
  }
}
</style>
