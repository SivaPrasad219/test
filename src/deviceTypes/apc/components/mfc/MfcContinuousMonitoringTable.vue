<template>
  <div class="monitoring-table-container">
    <div class="table-header">
      <h3 class="table-title">
        <ClockCircleOutlined class="monitoring-icon" />
        {{
          translateLabel(
            "mfgPage",
            "Continuous Monitoring Sample Points - Management Review"
          )
        }}
      </h3>
      <div class="sample-info">
        {{ totalSamples }} {{ translateLabel("mfgPage", "total samples") }}
        <!-- • {{ newSamples }} new samples -->
      </div>
    </div>

    <div class="table-controls">
      <div class="filters-row">
        <div class="action-buttons">
          <a-button
            type="primary"
            size="small"
            class="acknowledge-btn"
            :disabled="!selectedRowKeys || selectedRowKeys.length === 0"
            @click="handleAcknowledgeSelected"
          >
            <template #icon>
              <CheckOutlined />
            </template>
            {{ translateLabel("mfgPage", "Acknowledge Selected") }}
          </a-button>
          <a-tooltip :title="translateLabel('mfgPage', `${allUnackedTooltip}`)">
            <a-button
              type="default"
              size="small"
              :class="['all-unacked-btn', { active: isAllUnackedActive }]"
              @click="fetchAllUnacked"
            >
              {{ translateLabel("mfgPage", "All Unacked") }}
            </a-button>
          </a-tooltip>
          <a-tooltip
            :title="translateLabel('mfgPage', `${selectUnackedTooltip}`)"
          >
            <a-button
              type="default"
              size="small"
              class="select-unacked-btn"
              :disabled="isSelectUnackedDisabled"
              @click="selectAllUnacked"
            >
              {{
                translateLabel(
                  "mfgPage",
                  `${
                    areAllUnackedSelected
                      ? "Unselect Unacked"
                      : "Select Unacked"
                  }`
                )
              }}
            </a-button>
          </a-tooltip>
        </div>
        <div class="filters-fields">
          <a-select
            :value="selectedSortBy"
            @update:value="$emit('update:selected-sort-by', $event)"
            placeholder="Newest First"
            size="small"
            :getPopupContainer="(triggerNode : any) => triggerNode.parentElement"
          >
            <a-select-option value="newest">{{
              translateLabel("mfgPage", "Newest First")
            }}</a-select-option>
            <a-select-option value="oldest">{{
              translateLabel("mfgPage", "Oldest First")
            }}</a-select-option>
          </a-select>
          <a-select
            :value="selectedSampleFilter"
            @update:value="$emit('update:selected-sample-filter', $event)"
            size="small"
            style="width: 160px"
            :getPopupContainer="(triggerNode : any) => triggerNode.parentElement"
          >
            <a-select-option
              value="meta.input.id"
              :title="translateLabel('mfgPage', 'TEXT ID')"
              >{{ translateLabel("mfgPage", "TEXT ID") }}</a-select-option
            >
            <a-select-option
              value="id"
              :title="translateLabel('mfgPage', 'SAMPLE POINT')"
              >{{ translateLabel("mfgPage", "SAMPLE POINT") }}</a-select-option
            >
            <a-select-option
              value="meta.input.worklistid"
              :title="translateLabel('mfgPage', 'WORKLIST ID')"
              >{{ translateLabel("mfgPage", "WORKLIST ID") }}</a-select-option
            >
            <a-select-option
              value="meta.input.limssampleid"
              :title="translateLabel('mfgPage', 'LIMS SAMPLE #')"
              >{{ translateLabel("mfgPage", "LIMS SAMPLE") }}#</a-select-option
            >
            <a-select-option
              value="asset_id"
              :title="translateLabel('mfgPage', 'ASSET')"
              >{{ translateLabel("mfgPage", "ASSET") }}</a-select-option
            >
            <a-select-option
              value="status"
              :title="translateLabel('mfgPage', 'STATUS')"
              >{{ translateLabel("mfgPage", "STATUS") }}</a-select-option
            >
            <a-select-option
              value="data.data.cumulative_data['0.5μm']"
              :title="`0.5µM ${translateLabel('mfgPage', 'COUNT')}`"
              >0.5µM {{ translateLabel("mfgPage", "COUNT") }}</a-select-option
            >
            <a-select-option
              value="data.data.cumulative_data['5.0μm']"
              :title="`5.0µM ${translateLabel('mfgPage', 'COUNT')}`"
              >5.0µM {{ translateLabel("mfgPage", "COUNT") }}</a-select-option
            >
          </a-select>

          <a-input
            :value="searchQuery"
            @update:value="$emit('update:search-query', $event)"
            :placeholder="translateLabel('mfgPage', 'Search samples')"
            size="small"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
            <template #suffix>
              <CloseCircleOutlined
                v-if="searchQuery"
                @click="clearSearch"
                style="cursor: pointer; color: #bfbfbf"
              />
            </template>
          </a-input>
        </div>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="props.samples"
      :pagination="paginationConfig"
      :row-selection="rowSelection"
      :row-key="(record: MonitoringRecord) => record.id"
      :scroll="{ x: 1330, y: 400 }"
      :loading="props.loading"
      class="monitoring-table"
      size="small"
      :customRow="customRow"
    >
      <!-- <template #headerCell="{ column }">
        <span>{{ column.title }}</span>
      </template> -->

      <template #headerCell="{ column }">
        <span class="column-title">
          <span>{{ translateLabel("mfgPage", `${column.title}`) }}</span>

          <!-- <a-popover
            trigger="hover"
            placement="topLeft"
            :overlayInnerStyle="{ padding: '10px' }"
            v-if="infoCommentsPop?.mfg['Management Review']?.[column.title]"
          >
            <template #content>
              <div style="color: black; max-width: 350px">
                {{ infoCommentsPop?.mfg["Management Review"]?.[column.title] }}
              </div>
            </template>

            <InfoCircleOutlined class="info-circle-icon" />
          </a-popover> -->
        </span>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'sampleId'">
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
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag
            :color="getStatusColor(record.status)"
            @click="showModal([record])"
            :bordered="false"
            style="cursor: pointer"
          >
            {{ record.status }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'count05mm'">
          <span v-if="record.status === 'IN PROGRESS'" class="measuring-text">
            Measuring...
          </span>
          <span
            v-else-if="
              record.count05mm !== null && record.count05mm !== undefined
            "
            class="count-value"
            :style="{ color: getCountColor(record.id, '0.5μm') }"
            >{{ record.count05mm }}</span
          >
          <span v-else></span>
        </template>
        <template v-else-if="column.dataIndex === 'count50mm'">
          <span v-if="record.status === 'IN PROGRESS'" class="measuring-text">
            Measuring...
          </span>
          <span
            v-else-if="
              record.count50mm !== null && record.count50mm !== undefined
            "
            class="count-value"
            :style="{ color: getCountColor(record.id, '5.0μm') }"
            >{{ record.count50mm }}</span
          >
          <span v-else></span>
        </template>
        <template v-else-if="column.dataIndex === 'asset'">
          <a-tooltip :title="record.asset">
            <span class="cell-with-ellipsis">{{ record.asset }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.dataIndex === 'dateTime'">
          <a-tooltip :title="record.dateTime">
            <span class="cell-with-ellipsis">{{ record.dateTime }}</span>
          </a-tooltip>
        </template>
        <template v-else>
          {{ record[column.dataIndex] }}
        </template>
      </template>
    </a-table>

    <SampleDetailsModal
      v-if="modalVisible"
      :visible="modalVisible"
      :selectedRecords="selectedRecords"
      @update:visible="handleModalVisibilityChange"
      @mfg-confirm-success="handlePostConfirmationSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from "vue";
import {
  ClockCircleOutlined,
  CheckOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons-vue";
import SampleDetailsModal from "./MfcSampleDetailsModel.vue";
import moment from "moment-timezone";
import { translateLabel } from "@/common/utils";
import infoComments from "@/common/constants.json";

interface MonitoringRecord {
  id: string;
  sampleId: string;
  samplePoint: string;
  worklistId: string;
  limsSampleId: string;
  asset: string;
  status: string;
  dateTime: string;
  count05mm: number | null;
  count50mm: number | null;
  program?: string;
}

interface Props {
  samples: MonitoringRecord[];
  originalData?: any; // Original API response data
  totalSamples: number;
  newSamples: number;
  selectedSampleFilter?: string;
  selectedSortBy?: string;
  searchQuery?: string;
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
}

const props = defineProps<Props>();
const modalVisible = ref(false);
const selectedRecords = ref<any[]>([]);
const selectedRowKeys = ref<string[]>([]);
const pageSize = ref(props.pageSize || 5);
const currentPage = ref(props.currentPage || 1);
const isAllUnackedActive = ref(false);
const infoCommentsPop = ref(infoComments);

// Define statuses that allow checkbox selection
const selectableStatuses = [
  "Completed",
  "Aborted",
  "Suspended",
  "External interrupt",
  "Failed",
  "External Sample",
  "Force Drop",
  "Synced",
];

// Check if a row can be selected based on its status and other conditions
const isRowSelectable = (record: MonitoringRecord) => {
  if (!record.status) return false;

  // For specific statuses, disable checkbox if comment exists
  const statusesToCheckComment = [
    "ABORTED",
    "FORCE DROP",
    "SUSPENDED",
    "FAILED",
  ];
  if (statusesToCheckComment.includes(record.status.toUpperCase())) {
    const originalRecord = props.originalData?.find(
      (r: any) => r.id == record.id
    );
    if (originalRecord?.details?.comment) {
      return false;
    }
  }

  return selectableStatuses.includes(record.status);
};

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (selectedKeys: string[], selectedRows: any) => {
    selectedRowKeys.value = selectedKeys;
    selectedRecords.value = selectedRows; // Update selectedRecords with the selected rows
  },
  fixed: "left",
  columnWidth: 40,
  getCheckboxProps: (record: MonitoringRecord) => ({
    disabled: !isRowSelectable(record),
  }),
}));

console.log(":::::: row selection", rowSelection.value);

// Computed property for All Unacked button tooltip
const allUnackedTooltip = computed(() => {
  return isAllUnackedActive.value
    ? "Click to remove filter and show all samples"
    : "Click to show only unacknowledged samples (Completed, Aborted, Suspended, etc)";
});

// Get all unacknowledged records in current page
const unackedRecords = computed(() => {
  return props.samples.filter((sample) => isRowSelectable(sample));
});

// Check if all unacked records on current page are selected
const areAllUnackedSelected = computed(() => {
  if (unackedRecords.value.length === 0) return false;
  return unackedRecords.value.every((record) =>
    selectedRowKeys.value.includes(record.id)
  );
});

// Button should be disabled only when there are no unacked records
const isSelectUnackedDisabled = computed(() => {
  return unackedRecords.value.length === 0;
});

// Tooltip for Select Unacked button
const selectUnackedTooltip = computed(() => {
  if (unackedRecords.value.length === 0) {
    return "No unacknowledged records on this page";
  }
  return areAllUnackedSelected.value
    ? "Click to unselect all unacknowledged records on this page"
    : "Click to select all unacknowledged records on this page";
});

// eslint-disable-next-line no-undef
const emit = defineEmits<{
  "update:selected-sample-filter": [value: string];
  "update:selected-sort-by": [value: string];
  "update:search-query": [value: string];
  "pagination-change": [page: number, pageSize: number];
  "update:mfg-table-header": [value: { field: string; header: string }[]];
  "mfg-data-confirm": any;
  "fetch-all-unacked": [statusFilter: string];
  "modal-visible-change": [value: boolean];
}>();

// Handle modal visibility changes (both close and open)
const handleModalVisibilityChange = (visible: boolean) => {
  const wasVisible = modalVisible.value;
  modalVisible.value = visible;

  // If modal was open and now closed, always refresh both tables
  if (wasVisible && !visible) {
    console.log("Modal closed - refreshing both tables");
    emit("mfg-data-confirm");
  }
};

const handlePostConfirmationSuccess = async () => {
  // Handle post-confirmation logic
  console.log("MFG Confirmation Success - refreshing both tables");

  // Clear selected rows before reloading data
  selectedRowKeys.value = [];
  selectedRecords.value = [];

  // Close the modal
  modalVisible.value = false;

  // Emit event to parent to refresh both tables
  emit("mfg-data-confirm");
};

const customRow = (record: MonitoringRecord) => {
  return {
    onClick: () => {
      showModal([record]);
    },
    class: "clickable-row",
  };
};

const columns = [
  {
    title: "TEXT ID",
    dataIndex: "sampleId",
    key: "sampleId",
    width: 120,
  },
  {
    title: "SAMPLE POINT",
    dataIndex: "samplePoint",
    key: "samplePoint",
    width: 150,
  },
  {
    title: "WORKLIST ID",
    dataIndex: "worklistId",
    key: "worklistId",
    width: 120,
  },
  {
    title: "LIMS SAMPLE #",
    dataIndex: "limsSampleId",
    key: "limsSampleId",
    width: 130,
  },
  {
    title: "ASSET",
    dataIndex: "asset",
    key: "asset",
    width: 150,
  },
  {
    title: "STATUS",
    dataIndex: "status",
    key: "status",
    width: 120,
  },
  {
    title: "DATE & TIME",
    dataIndex: "dateTime",
    key: "dateTime",
    width: 180,
  },
  {
    title: "0.5µM COUNT",
    dataIndex: "count05mm",
    key: "count05mm",
    width: 130,
  },
  {
    title: "5.0µM COUNT",
    dataIndex: "count50mm",
    key: "count50mm",
    width: 130,
  },
];

const MfgTableHeader = columns.map((col) => ({
  field: col.dataIndex,
  header: col.title,
}));

const paginationConfig = computed(() => ({
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: number[]) =>
    `${range[0]}-${range[1]} of ${total} items`,
  current: currentPage.value,
  pageSize: pageSize.value,
  pageSizeOptions: ["5", "10", "20", "50"],
  total: props.totalSamples,
  onShowSizeChange: (_current: number, size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
    emit("pagination-change", 1, size);
  },
  onChange: (page: number, size: number) => {
    currentPage.value = page;
    emit("pagination-change", page, size);
  },
}));

// Handle acknowledge selected button click
const handleAcknowledgeSelected = () => {
  // Get the complete original records for selected samples
  const selectedOriginalRecords = props.originalData
    ? props.originalData.filter((record: any) =>
        selectedRowKeys.value.includes(record.id)
      )
    : [];

  console.log(
    "Selected complete records to acknowledge:",
    selectedOriginalRecords
  );
  console.log("Number of selected records:", selectedOriginalRecords.length);
  showModal(selectedOriginalRecords);
  // Also log the transformed data for reference

  console.log("props", props.samples);

  const selectedSamples = props.samples.filter((sample) =>
    selectedRowKeys.value.includes(sample.id)
  );
  console.log("Transformed samples (for UI display):", selectedSamples);
};

// Clear search function
const clearSearch = () => {
  emit("update:search-query", "");
};

// Fetch all unacknowledged records
const fetchAllUnacked = () => {
  // Toggle the active state
  isAllUnackedActive.value = !isAllUnackedActive.value;

  if (isAllUnackedActive.value) {
    // If searching by status, show all statuses comma-separated in search box
    if (props.selectedSampleFilter === "status") {
      emit("update:search-query", selectableStatuses.join(", "));
    }
    // If activating, send the selectable statuses
    const statusFilter = selectableStatuses.join(",");
    emit("fetch-all-unacked", statusFilter);
  } else {
    // If deactivating and status filter is selected, clear the search
    if (props.selectedSampleFilter === "status") {
      emit("update:search-query", "");
    }
    // If deactivating, clear the filter
    emit("fetch-all-unacked", "");
  }
};

// Select/Unselect all unacknowledged records
const selectAllUnacked = () => {
  const unackedIds = unackedRecords.value.map((record) => record.id);

  if (areAllUnackedSelected.value) {
    // Unselect all unacked records on this page
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (key) => !unackedIds.includes(key)
    );
  } else {
    // Select all unacked records on this page
    const existingKeys = selectedRowKeys.value;
    const allKeys = existingKeys.concat(unackedIds);
    const uniqueKeys = Array.from(new Set(allKeys));
    selectedRowKeys.value = uniqueKeys;
  }
};

const getStatusColor = (status: string) => {
  // Handle null, undefined, or empty status
  if (!status || status.trim() === "") {
    return "default";
  }

  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "warning";
    case "REVIEWED":
      return "green";
    case "ABORTED":
    case "ABORTING":
    case "SUSPENDED":
    case "FORCE DROPPING":
    case "EXTERNAL INTERRUPT":
    case "FAILED":
    case "EXTERNAL SAMPLE":
    case "FORCE DROP":
      return "red";
    case "NEW":
      return "#c9c9c9";
    case "IN-PROGRESS":
    case "IN PROGRESS":
      return "cyan";
    case "SYNCED":
      return "green";
    default:
      return "default";
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

const showModal = (records: any[]) => {
  if (!props.originalData || !Array.isArray(props.originalData)) {
    console.warn("originalData is not available or not an array.");
    return;
  }

  const fullRecords = records
    .map((r) => {
      const item = props.originalData.find(
        (original: any) => original.id === r.id
      );
      if (!item) return undefined;

      // Safely clone item to avoid direct mutation
      const enriched = JSON.parse(JSON.stringify(item));

      // Inject values into the inner `data` object
      enriched.data = {
        ...enriched.data,
        id: item.notification_id ?? item.id,
        type: "Particles",
        sampleId: item.meta?.input?.id || "-",
        samplePoint: formatSamplePoint(item.id, item.measure_start_time),
        program: item.meta?.input?.program || "-",
        worklistId: item.meta?.input?.worklistid || "-",
        limsSampleId: item.meta?.input?.limssampleid || "-",
      };

      return enriched;
    })
    .filter((item) => item);

  selectedRecords.value = fullRecords;

  console.log("::: Selected full records", fullRecords);
  console.log("::: Original selected records", records);

  modalVisible.value = true;
};

// Reset All Unacked toggle and pagination when other filters change
watch(
  () => [props.selectedSampleFilter, props.selectedSortBy, props.searchQuery],
  () => {
    isAllUnackedActive.value = false;
    currentPage.value = 1;
  }
);

// Clear selections when page changes (samples prop changes)
watch(
  () => props.samples,
  () => {
    selectedRowKeys.value = [];
    selectedRecords.value = [];
  }
);

// Watch for pagination prop changes from parent
watch(
  () => props.currentPage,
  (newPage) => {
    if (newPage !== undefined && newPage !== currentPage.value) {
      currentPage.value = newPage;
    }
  }
);

watch(
  () => props.pageSize,
  (newSize) => {
    if (newSize !== undefined && newSize !== pageSize.value) {
      pageSize.value = newSize;
    }
  }
);

emit("update:mfg-table-header", MfgTableHeader);

// Watch for modal visibility changes
watch(modalVisible, (newValue) => {
  emit("modal-visible-change", newValue);
});

// Helper function to determine count color based on notification state
const getCountColor = (
  recordId: string,
  particleSize: "0.5μm" | "5.0μm"
): string => {
  const originalRecord = props.originalData?.find(
    (r: any) => r.id == recordId // Use loose equality to handle string/number comparison
  );
  if (!originalRecord?.data?.data?.notifications) return "#000000"; // default black

  const alarm = originalRecord.data.data.notifications.alarm?.[particleSize];
  const warning =
    originalRecord.data.data.notifications.warning?.[particleSize];

  if (alarm === true) return "#ff0000"; // red
  if (alarm === false && warning === true) return "#ffa500"; // orange
  return "#000000"; // default black
};
</script>

<style scoped>
.monitoring-table-container {
  background: white;
  border-radius: 8px;
  padding: 16px 16px 10px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.table-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.monitoring-icon {
  color: #1890ff;
}

.sample-info {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  margin-left: 16px;
}

.table-controls {
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  flex-shrink: 0;
}

.filters-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons :deep(.ant-btn) {
  font-size: 10px;
}

.filters-fields {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters-fields :deep(.ant-select) {
  font-size: 10px;
}

.filters-fields :deep(.ant-select-selection-item) {
  font-size: 10px;
}

.filters-fields :deep(.ant-input) {
  font-size: 10px;
}

.filters-fields :deep(.ant-input-prefix) {
  font-size: 10px;
}

.measuring-text {
  color: #1890ff;
  font-style: italic;
}

.count-value {
  font-weight: 500;
}

.monitoring-table {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.monitoring-table :deep(.ant-table-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.monitoring-table :deep(.ant-table) {
  font-size: 11px;
}

/* Checkbox column fixes */
.monitoring-table :deep(.ant-table-selection-column) {
  position: sticky !important;
  left: 0 !important;
  z-index: 3 !important;
}

.monitoring-table :deep(.ant-table-thead .ant-table-selection-column) {
  background: #fafafa !important;
  z-index: 11 !important;
}

.monitoring-table :deep(.ant-table-tbody .ant-table-selection-column) {
  background: white !important;
}

.monitoring-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  white-space: nowrap;
  min-width: 120px;
}

.monitoring-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}

.monitoring-table :deep(.ant-table-tbody > tr > td) {
  white-space: nowrap;
}

.monitoring-table :deep(.ant-pagination) {
  margin-top: 10px;
  margin-bottom: 0;
  padding-top: 10px;
  padding-bottom: 0;
  font-size: 10px;
}

.monitoring-table :deep(.ant-pagination-item) {
  font-size: 10px;
  min-width: 24px;
  height: 24px;
  line-height: 22px;
}

.monitoring-table :deep(.ant-pagination-prev .ant-pagination-item-link),
.monitoring-table :deep(.ant-pagination-next .ant-pagination-item-link) {
  font-size: 10px;
}

.monitoring-table :deep(.ant-pagination-options) {
  font-size: 10px;
}

.monitoring-table :deep(.ant-select-selection-item) {
  font-size: 10px;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-row > * {
    width: 100% !important;
  }

  .action-buttons {
    margin-left: 0;
    margin-top: 12px;
    width: 100%;
    justify-content: center;
  }
}

.monitoring-table :deep(.ant-tag) {
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

.all-unacked-btn {
  background-color: #d38834 !important;
  border-color: #d38834 !important;
  color: white !important;
}

.all-unacked-btn:hover {
  background-color: #b8732a !important;
  border-color: #b8732a !important;
}

.all-unacked-btn.active {
  background-color: #b8732a !important;
  border-color: #b8732a !important;
}

.all-unacked-btn.active:hover {
  background-color: #d38834 !important;
  border-color: #d38834 !important;
}

.select-unacked-btn {
  background-color: #4098b8 !important;
  border-color: #4098b8 !important;
  color: white !important;
}

.select-unacked-btn:hover {
  background-color: #357a9a !important;
  border-color: #357a9a !important;
}

.sample-id-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sample-id-text {
  font-weight: 500;
  color: #333;
  line-height: 1.2;
}

.program-name {
  font-size: 10px;
  color: #999;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

/* Text overflow handling */
.cell-with-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}

.column-title {
  display: flex;
  align-items: center;
}

.info-circle-icon {
  font-size: 12px;
  padding-left: 5px;
}
</style>
