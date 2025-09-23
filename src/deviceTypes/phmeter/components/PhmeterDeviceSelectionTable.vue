<template>
  <a-table
    :columns="displayedTableColumns"
    :data-source="data"
    :row-key="rowKey"
    :pagination="false"
    :loading="isLoading"
    size="middle"
    class="selectedInstrument custom-table"
  >
  </a-table>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  h,
  computed,
  PropType,
  onMounted,
  onUnmounted,
} from "vue";
import { Checkbox, Table } from "ant-design-vue";
import { ColumnType } from "ant-design-vue/es/table/interface";
import eventBus from "@/services/eventBus";
import { useStore } from "vuex";
import ColumnTitle from "./ColumnTitle.vue";

export default defineComponent({
  name: "ApcDeviceSelectionTable",
  components: {
    "a-table": Table,
  },
  props: {
    tableColumns: {
      type: Array as PropType<ColumnType<any>[]>,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    rowKey: {
      type: String,
      default: "id",
    },
    displayCheckbox: {
      type: Boolean,
      required: false,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["selectedTableRecord"],
  setup(props, { emit }) {
    const store = useStore();
    const currentStep = computed(() => store.getters.getCurrentStep);
    const selectedRowKey = ref<any | null>(null);

    const getStatusCellStyle = (connectionStatus: any) => {
      const baseStyle = {
        "border-radius": "15px",
        width: "130px",
        height: "25px",
        "text-align": "center",
        "line-height": "25px",
      };

      switch (connectionStatus) {
        case "connected":
          return {
            ...baseStyle,
            backgroundColor: "#94e498",
            text: "Ready for Use",
          };
        case "running":
          return {
            ...baseStyle,
            backgroundColor: "#94d2de",
            text: "In-Use",
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

    const displayedTableColumns = computed(() => {
      const { tableColumns, rowKey, displayCheckbox } = props;

      const columns = tableColumns.map((column) => {
        if (column.dataIndex === "connection_status") {
          return {
            ...column,
            width: column.width,
            title: () => h(ColumnTitle, { column }),
            customRender: ({ text }: any) => {
              const statusText =
                text.toLowerCase() === "running"
                  ? "In-Use"
                  : text.toLowerCase() === "connected"
                  ? "Ready for Use"
                  : text;
              return h(
                "div",
                { style: getStatusCellStyle(text.toLowerCase()) },
                statusText
              );
            },
          };
        }
        return {
          ...column,
          width: column.width,
          title: () => h(ColumnTitle, { column }),
        };
      });

      if (displayCheckbox) {
        columns.unshift({
          title: () =>
            h(ColumnTitle, {
              column: { title: "Check", dataIndex: "check", page: "measure" },
            }),
          customRender: ({ record }: any) => {
            const isSelected = record[rowKey] === selectedRowKey.value;
            const isRunning = record.connection_status === "running";
            const isDisconnected = record.connection_status === "Disconnected";
            const isCurrentStepTwo = currentStep.value === 1;
            const checkboxClass =
              isRunning || isCurrentStepTwo ? "disabledCheckbox" : "";
            return h(Checkbox, {
              checked: isSelected,
              disabled: isRunning || isCurrentStepTwo || isDisconnected,
              class: checkboxClass,
              onChange: (e) => handleCheckboxChange(e, record[rowKey], record),
            });
          },
          width: `8%`,
        });
      }

      return columns;
    });

    const handleCheckboxChange = (e: any, key: any, record: any) => {
      const checked = e.target.checked;
      selectedRowKey.value = checked ? key : null;
      emit("selectedTableRecord", checked ? record.asset_id : null);
    };

    onMounted(() => {
      eventBus.on("clearChekboxAndMoveToStep1", handleSampleStarted);
    });

    onUnmounted(() => {
      eventBus.off("clearChekboxAndMoveToStep1", handleSampleStarted);
    });

    const handleSampleStarted = () => {
      selectedRowKey.value = null;
    };

    return {
      displayedTableColumns,
    };
  },
});
</script>

<style scoped>
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
</style>
