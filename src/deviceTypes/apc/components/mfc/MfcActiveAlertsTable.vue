<template>
  <div class="alerts-table-container">
    <div class="table-header">
      <div>
        <h3 class="table-title">
          <ExclamationCircleOutlined class="alert-icon" />
          {{ translateLabel("mfgPage", "Active Alerts") }}
        </h3>
      </div>
    </div>
    <div class="table-actions-buttons">
      <a-button
        type="primary"
        size="small"
        class="acknowledge-btn"
        :disabled="isAcknowledgeDisabled"
        @click="handleAcknowledge"
      >
        <template #icon>
          <CheckOutlined />
        </template>
        {{ translateLabel("mfgPage", "Acknowledge Selected") }}
      </a-button>
      <!-- <a-tooltip :title="allAlertsTooltip"> -->
      <a-tooltip :title="translateLabel('mfgPage', `${allAlertsTooltip}`)">
        <a-button
          type="default"
          size="small"
          :class="['all-alerts-btn', { active: isAllAlertsActive }]"
          @click="fetchAllAlerts"
        >
          {{ translateLabel("mfgPage", "All Alerts") }}
        </a-button>
      </a-tooltip>
    </div>
    <a-table
      :columns="columns"
      :data-source="props.alerts"
      :pagination="paginationConfig"
      :row-selection="rowSelection"
      :row-key="(record: AlertRecord) => record.id"
      :scroll="{ x: 1300, y: 213 }"
      :loading="props.loading"
      class="alerts-table"
      size="small"
      :customRow="customRow"
    >
      <!-- <template #headerCell="{ column }">
        <span>{{ column.title }}</span>
      </template> -->

      <template #headerCell="{ column }">
        <span class="table-col-header">
          <div class="column-title">
            <span>{{ translateLabel("mfgPage", `${column.title}`) }}</span>
          </div>

          <!-- <a-popover
            trigger="hover"
            placement="topLeft"
            :overlayInnerStyle="{ padding: '10px' }"
            v-if="infoCommentsPop?.mfg['Active Alerts']?.[column.title]"
          >
            <template #content>
              <div style="color: black; max-width: 350px">
                {{ infoCommentsPop?.mfg["Active Alerts"]?.[column.title] }}
              </div>
            </template>

            <InfoCircleOutlined class="info-circle-icon" />
          </a-popover> -->
        </span>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <a-tooltip :title="record.type">
            <span class="alert-type cell-with-ellipsis">{{ record.type }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'severity'">
          <a-tag :color="getSeverityColor(record.severity)" :bordered="false">
            {{ record.severity }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-tooltip
            v-if="record.hasComment"
            :title="translateLabel('mfgPage', 'Acked')"
          >
            <CheckOutlined style="color: #52c41a; font-size: 14px" />
          </a-tooltip>
          <span v-else></span>
        </template>
        <template v-else-if="column.dataIndex === 'sampleId'">
          <a-tooltip :title="record.sampleId">
            <span class="cell-with-ellipsis">{{ record.sampleId }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'samplePoint'">
          <div class="sample-point-cell">
            <a-tooltip :title="record.samplePoint">
              <div class="sample-point-text">{{ record.samplePoint }}</div>
            </a-tooltip>
            <a-tooltip :title="record.program || '-'">
              <div class="program-name">{{ record.program || "-" }}</div>
            </a-tooltip>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'worklistId'">
          <a-tooltip :title="record.worklistId">
            <span class="cell-with-ellipsis">{{ record.worklistId }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'limsSampleId'">
          <a-tooltip :title="record.limsSampleId">
            <span class="cell-with-ellipsis">{{ record.limsSampleId }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'asset'">
          <a-tooltip :title="record.asset">
            <span class="cell-with-ellipsis">{{ record.asset }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'message'">
          <a-tooltip :title="record.message">
            <span class="cell-with-ellipsis message-cell">{{
              record.message
            }}</span>
          </a-tooltip>
        </template>
        <template v-else>
          {{ record[column.dataIndex] }}
        </template>
      </template>
    </a-table>

    <!-- Sample Details Modal for acknowledgment -->
    <SampleDetailsModal
      v-if="modalVisible"
      :visible="modalVisible"
      :selectedRecords="selectedModalRecords"
      @update:visible="handleModalVisibilityChange"
      @mfg-confirm-success="handleMfgConfirmSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import moment from "moment-timezone";
import { translateLabel } from "@/common/utils";

import {
  ExclamationCircleOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons-vue";
import SampleDetailsModal from "./MfcSampleDetailsModel.vue";
import infoComments from "@/common/constants.json";

interface AlertRecord {
  id: string;
  type: string;
  sampleId: string;
  samplePoint: string;
  program: string;
  worklistId: string;
  limsSampleId: string;
  asset: string;
  severity: string;
  message: string;
  action?: string;
  is_read?: boolean;
  hasComment?: boolean;
  originalData?: any; // Store the complete original API record
}

interface Props {
  alerts: AlertRecord[];
  loading?: boolean;
  totalAlerts?: number;
  currentPage?: number;
  pageSize?: number;
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>();

// eslint-disable-next-line no-undef
const emit = defineEmits<{
  "pagination-change": [page: number, pageSize: number];
  "alert-confirm-success": [];
  "fetch-all-alerts": [filter: boolean];
}>();
const infoCommentsPop = ref(infoComments);

const columns = [
  {
    title: "TYPE",
    dataIndex: "type",
    key: "type",
    width: 80,
  },
  // {
  //   title: "TEXT ID",
  //   dataIndex: "sampleId",
  //   key: "sampleId",
  //   width: 120,
  // },
  {
    title: "SAMPLE POINT",
    dataIndex: "samplePoint",
    key: "samplePoint",
    width: 150,
  },
  // {
  //   title: "WORKLIST ID",
  //   dataIndex: "worklistId",
  //   key: "worklistId",
  //   width: 120,
  // },
  // {
  //   title: "LIMS SAMPLE #",
  //   dataIndex: "limsSampleId",
  //   key: "limsSampleId",
  //   width: 130,
  // },
  {
    title: "ASSET",
    dataIndex: "asset",
    key: "asset",
    width: 150,
  },
  {
    title: "SEVERITY",
    dataIndex: "severity",
    key: "severity",
    width: 100,
  },
  {
    title: "MESSAGE",
    dataIndex: "message",
    key: "message",
    width: 200,
  },
  {
    title: "ACTION",
    dataIndex: "action",
    key: "action",
    width: 80,
  },
];

const selectedRowKeys = ref<string[]>([]);
const modalVisible = ref(false);
const selectedModalRecords = ref<any[]>([]);
const isAllAlertsActive = ref(false);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (selectedKeys: string[]) => {
    selectedRowKeys.value = selectedKeys;
  },
  fixed: "left",
  columnWidth: 40,
  getCheckboxProps: (record: AlertRecord) => ({
    disabled: record.hasComment === true, // Disable checkbox if hasComment is true
    name: String(record.id), // Convert to string to satisfy prop type requirement
  }),
}));

const paginationConfig = computed(() => ({
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: number[]) =>
    `${range[0]}-${range[1]} of ${total} items`,
  pageSize: props.pageSize || 10,
  current: props.currentPage || 1,
  total: props.totalAlerts || 0,
  pageSizeOptions: ["10", "20", "50", "100"],
  size: "small",
  onChange: (page: number, pageSize: number) => {
    emit("pagination-change", page, pageSize);
  },
  onShowSizeChange: (_current: number, size: number) => {
    emit("pagination-change", 1, size); // Reset to first page when page size changes
  },
}));

const customRow = (record: AlertRecord) => {
  return {
    onClick: () => {
      showModal([record]);
    },
    class: "clickable-row",
  };
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "red";
    case "high":
      return "orange";
    case "medium":
      return "yellow";
    case "low":
      return "green";
    default:
      return "gray";
  }
};

// Computed property to get selected alert records
const selectedRecords = computed(() => {
  return props.alerts.filter((alert) =>
    selectedRowKeys.value.includes(alert.id)
  );
});

// Computed property for acknowledge button disabled state
const isAcknowledgeDisabled = computed(() => {
  return selectedRowKeys.value.length === 0;
});

// Handle acknowledge button click
const handleAcknowledge = () => {
  // Get the complete original records for selected alerts with enrichment
  const originalRecords = selectedRecords.value
    .filter((record) => record.originalData)
    .map((record) => {
      const item = record.originalData;

      return {
        ...item,
        data: {
          ...item.data,
          id: item.notification_id ?? item.id,
          type: "Particles",
          sampleId: item.meta?.input?.id || "-",
          samplePoint: formatSamplePoint(item.id, item.measure_start_time),
          program: item.meta?.input?.program || "-",
          worklistId: item.meta?.input?.worklistid || "-",
          limsSampleId: item.meta?.input?.limssampleid || "-",
        },
      };
    });

  // Show modal with enriched original records
  selectedModalRecords.value = originalRecords;
  modalVisible.value = true;
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
const showModal = (records: any[]) => {
  const originalRecords: any[] = [];

  records.forEach((record) => {
    if (record.originalData) {
      const item = record.originalData;

      const enriched = {
        ...item,
        data: {
          ...item.data,
          id: item.notification_id ?? item.id,
          type: "Particles",
          sampleId: item.meta?.input?.id || "-",
          samplePoint: formatSamplePoint(item.id, item.measure_start_time),
          program: item.meta?.input?.program || "-",
          worklistId: item.meta?.input?.worklistid || "-",
          limsSampleId: item.meta?.input?.limssampleid || "-",
        },
      };

      originalRecords.push(enriched);
    }
  });

  console.log(":::::Modal Open - input records", records);
  console.log("Selected records for acknowledgment:", originalRecords);

  selectedModalRecords.value = originalRecords;
  modalVisible.value = true;
};

// Handle modal visibility changes (both close and open)
const handleModalVisibilityChange = (visible: boolean) => {
  modalVisible.value = visible;

  // Don't emit here anymore - let handleMfgConfirmSuccess handle it for successful confirmation
  // This function now only handles modal visibility state
};

// Handle successful confirmation from modal
const handleMfgConfirmSuccess = () => {
  console.log(
    "Alert confirmation successful - clearing selections and closing modal"
  );

  // Clear selected rows before closing modal
  selectedRowKeys.value = [];

  // Close modal
  modalVisible.value = false;

  // Emit event to parent to refresh both tables
  emit("alert-confirm-success");
};

// Computed property for All Alerts button tooltip
const allAlertsTooltip = computed(() => {
  return isAllAlertsActive.value
    ? "Click to remove filter and show all alerts"
    : "Click to show alerts which are not acked yet";
});

// Handle All Alerts button click
const fetchAllAlerts = () => {
  // Toggle the active state
  isAllAlertsActive.value = !isAllAlertsActive.value;

  // Emit event to parent with the filter state
  emit("fetch-all-alerts", isAllAlertsActive.value);
};

// Clear selections when alerts data changes (e.g., after pagination)
watch(
  () => props.alerts,
  () => {
    selectedRowKeys.value = [];
  }
);
</script>

<style scoped>
.alerts-table-container {
  background: white;
  border-radius: 8px;
  padding: 16px 16px 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.table-actions-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.table-actions-buttons :deep(.ant-btn) {
  font-size: 10px;
}
.table-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-icon {
  color: #ff4d4f;
}

.alert-count {
  margin-left: 8px;
}

.alert-type {
  font-weight: 500;
  text-transform: capitalize;
}

.alerts-table {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.alerts-table :deep(.ant-table-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.alerts-table :deep(.ant-table) {
  font-size: 11px;
}

/* Checkbox column fixes */
.alerts-table :deep(.ant-table-selection-column) {
  position: sticky !important;
  left: 0 !important;
  z-index: 3 !important;
}

.alerts-table :deep(.ant-table-thead .ant-table-selection-column) {
  background: #fafafa !important;
  z-index: 11 !important;
}

.alerts-table :deep(.ant-table-tbody .ant-table-selection-column) {
  background: white !important;
}

.alerts-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}

.alerts-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}

.alerts-table :deep(.ant-table-tbody > tr > td) {
  white-space: nowrap;
}

.alerts-table :deep(.ant-pagination) {
  margin-top: 10px;
  margin-bottom: 0;
  padding-top: 10px;
  padding-bottom: 0;
  font-size: 10px;
}

.alerts-table :deep(.ant-pagination-item) {
  font-size: 10px;
  min-width: 24px;
  height: 24px;
  line-height: 22px;
}

.alerts-table :deep(.ant-pagination-prev .ant-pagination-item-link),
.alerts-table :deep(.ant-pagination-next .ant-pagination-item-link) {
  font-size: 10px;
}

.alerts-table :deep(.ant-pagination-options) {
  font-size: 10px;
}

.alerts-table :deep(.ant-select-selection-item) {
  font-size: 10px;
}

.alerts-table :deep(.ant-tag) {
  font-size: 10px;
}

/* Custom button colors */
.acknowledge-btn {
  background-color: #42a079 !important;
  border-color: #42a079 !important;
  color: white !important;
}

.acknowledge-btn:hover {
  background-color: #378866 !important;
  border-color: #378866 !important;
}

.all-alerts-btn {
  background-color: #d38834 !important;
  border-color: #d38834 !important;
  color: white !important;
}

.all-alerts-btn:hover {
  background-color: #b8732a !important;
  border-color: #b8732a !important;
}

.all-alerts-btn.active {
  background-color: #b8732a !important;
  border-color: #b8732a !important;
}

.all-alerts-btn.active:hover {
  background-color: #d38834 !important;
  border-color: #d38834 !important;
}

/* Text overflow handling */
.cell-with-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}

.alert-type.cell-with-ellipsis {
  max-width: 100px;
}

.message-cell {
  max-width: 280px;
}

.program-name {
  font-size: 10px;
  color: #999;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-col-header {
  display: flex;
  align-items: center;
}

.column-title {
  padding-top: 2px;
}

.info-circle-icon {
  font-size: 12px;
  padding-left: 5px;
}
</style>
