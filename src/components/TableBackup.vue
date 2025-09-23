<template>
  <a-table
    :columns="tableColumns"
    :data-source="dataSource"
    :pagination="false"
    :row-key="getRowKey"
    :customRow="customRow"
    @row-click="handleRowClick"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from "vue";
import { Table } from "ant-design-vue";

interface TableColumn {
  title: string;
  dataIndex: string;
  isVisible: boolean;
}

interface TableRow {
  [key: string]: any;
}

export default defineComponent({
  name: "TableComponent",
  components: {
    "a-table": Table,
  },
  props: {
    tableColumns: {
      type: Array as PropType<TableColumn[]>,
      required: true,
    },
    data: {
      type: Array as PropType<TableRow[]>,
      required: true,
    },
    showCheckbox: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const columns = ref(props.tableColumns);
    const dataSource = ref(props.data);
    const selectedRow = ref<TableRow | null>(null);

    watch(
      () => props.tableColumns,
      (newValue) => {
        columns.value = newValue;
      }
    );

    watch(
      () => props.data,
      (newValue) => {
        dataSource.value = newValue;
      }
    );

    const handleRowClick = (row: TableRow) => {
      if (selectedRow.value === row) {
        selectedRow.value = null;
      } else {
        selectedRow.value = row;
      }
      emit("selectedTableRecord", selectedRow.value);
    };

    const getRowKey = (record: TableRow) => {
      return record.id;
    };

    const customRow = (record: any) => {
      return {
        onClick: (event: any) => {
          console.log(event);
          handleRowClick(record);
        },
      };
    };

    return {
      columns,
      dataSource,
      handleRowClick,
      getRowKey,
      customRow,
    };
  },
});
</script>
