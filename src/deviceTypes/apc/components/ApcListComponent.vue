<template>
  <a-list :data-source="sortedList" :grid="{ gutter: 16, column: numColumns }">
    <template #renderItem="{ item, index }">
      <a-list-item :key="index" class="dynamic-list-item">
        <div style="display: flex; justify-content: space-between">
          <span style="max-width: 50%; font-weight: 600">{{ item.label }}</span>
          <span style="max-width: 50%; text-align: right">{{
            getValue(item.value)
          }}</span>
        </div>
      </a-list-item>
    </template>
  </a-list>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import { List } from "ant-design-vue";

interface ConfigItem {
  label: string;
  value: string;
  order: number;
}

export default defineComponent({
  name: "ApcListComponent",
  components: {
    "a-list": List.List,
    "a-list-item": List.Item,
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    listConfig: {
      type: Array as PropType<ConfigItem[]>,
      required: true,
    },
    numColumns: {
      type: Number,
      default: 2,
    },
  },
  setup(props) {
    const data = ref(props.data);
    const listConfig = ref<ConfigItem[]>(props.listConfig);

    const sortedList = computed(() => {
      return [...listConfig.value].sort((a, b) => a.order - b.order);
    });

    const getValue = (keyPath: string): any => {
      console.log("keyPath", keyPath);
      if (keyPath.includes(".")) {
        const keys = keyPath.split(".");
        let value: any = data.value;
        for (const key of keys) {
          if (value && key in value) {
            value = value[key];
          } else {
            return "";
          }
        }
        return value;
      } else {
        const value = data.value[keyPath];
        return value !== undefined && value !== null ? value : "";
      }
    };

    return {
      sortedList,
      getValue,
    };
  },
});
</script>

<style>
.dynamic-list-item {
  border-block-end: 1px solid rgba(5, 5, 5, 0.06) !important;
}
</style>
