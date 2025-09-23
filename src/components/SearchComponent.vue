<template>
  <div class="search-form">
    <a-row>
      <a-col :span="12">
        <a-row>
          <a-col :span="10">
            <a-form-item
              :label="translateLabel('commonData', 'Select By')"
              :colon="false"
            >
              <a-select
                v-model:value="selectedKey"
                style="width: 95%"
                :placeholder="translateLabel('commonData', 'Select an option')"
                :getPopupContainer="(triggerNode) => triggerNode.parentElement"
                class="custom-input"
                @change="handleSelectChange"
              >
                <a-select-option
                  v-for="option in dropdownOptions"
                  :key="option.value"
                  :value="option.value"
                  class="custom-input"
                >
                  {{ translateLabel("commonData", option.label) }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              :label="translateLabel('commonData', 'Value')"
              :colon="false"
              style="flex-flow: nowrap"
              :validate-status="validationStatus"
              :help="validationMessage"
            >
              <a-input
                v-model:value="searchQuery"
                style="width: 95%; margin-left: 10px"
                :placeholder="
                  translateLabel('commonData', 'Enter search value')
                "
                class="custom-input"
                @keyup.enter="searchHandler"
                @input="validateInput"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-col>
      <a-col :span="10">
        <a-row justify="space-between">
          <a-col :span="14">
            <a-form-item>
              <a-button
                type="primary"
                @click="searchHandler"
                style="margin-left: 10px"
                class="custom-button search-button"
                :disabled="isSearchQueryEmpty || validationStatus === 'error'"
              >
                {{ translateLabel("commonData", "Search") }}
              </a-button>
              <a-button
                type="primary"
                @click="resetHandler"
                style="margin-left: 10px"
                danger
                class="custom-button reset-button"
                :disabled="isSearchQueryEmpty"
              >
                {{ translateLabel("commonData", "Reset") }}
              </a-button>
            </a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item style="text-align: right">
              <a-button-group>
                <a-button
                  @click="handleExportTypeClick(exportType)"
                  class="custom-button"
                  :loading="isExportTypeLoading"
                  :disabled="isExportTypeLoading"
                >
                  {{ translateLabel("commonData", exportType.label) }}
                </a-button>
                <a-dropdown
                  placement="bottomRight"
                  trigger="click"
                  :getPopupContainer="(trigger : any) => trigger.parentNode"
                >
                  <a-button class="custom-button">
                    <EllipsisOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu style="text-align: start">
                      <a-menu-item
                        v-for="type in exportTypes"
                        :key="type.value"
                        @click="updateExportType(type)"
                        :disabled="isExportTypeLoading"
                        style="width: 110px"
                      >
                        {{ translateLabel("commonData", type.label) }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-button-group>
            </a-form-item>
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from "vue";
import { Select, Input, Button, Dropdown, Menu, message } from "ant-design-vue";
import { EllipsisOutlined } from "@ant-design/icons-vue";
import { translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";
interface Option {
  label: any;
  value: any;
}

type SelectValue = string | number | (string | number)[];

export default defineComponent({
  name: "ApcSearchComponent",
  components: {
    "a-select": Select,
    "a-select-option": Select.Option,
    "a-input": Input,
    "a-button": Button,
    "a-dropdown": Dropdown,
    "a-menu": Menu,
    "a-menu-item": Menu.Item,
    EllipsisOutlined,
  },
  props: {
    dropdownOptions: {
      type: Array as PropType<Option[]>,
      required: true,
    },
    reset: {
      type: Boolean,
      default: false,
    },
    isExportTypeLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["search", "reset", "exportType"],

  setup(props, { emit }) {
    const { t } = useI18n();
    const selectedKey = ref<SelectValue>(
      props.dropdownOptions.length > 0 ? props.dropdownOptions[0].value : ""
    );
    const trimmedSearchQuery = computed(() => searchQuery.value.trim());

    const searchQuery = ref<string>("");
    const validationStatus = ref<"" | "error">("");
    const validationMessage = ref<string>("");
    const exportType = ref<Option>({
      label: translateLabel("commonData", "Export CSV"),
      value: "csv",
    });
    const exportTypes = computed(() => [
      { label: "Export CSV", value: "csv" },
      { label: "Export PDF", value: "pdf" },
      { label: "Export JSON", value: "json" },
      { label: "Export XLS", value: "xls" },
    ]);

    const isSearchQueryEmpty = computed(
      () => searchQuery.value.trim().length === 0
    );

    const validateInput = () => {
      const illegalCharacterRegex = /[%\\]/; // Checks for `%` or `\`

      if (illegalCharacterRegex.test(trimmedSearchQuery.value)) {
        message.error(t("commonData.Illegal input", "Illegal input"));
        validationStatus.value = "error";
        validationMessage.value = "";
      } else {
        validationStatus.value = "";
        validationMessage.value = "";
      }
    };

    const searchHandler = () => {
      if (validationStatus.value !== "error" && !isSearchQueryEmpty.value) {
        emit("search", {
          selectedKey: selectedKey.value,
          searchQuery: trimmedSearchQuery.value,
        });
      }
    };

    const resetHandler = () => {
      selectedKey.value =
        props.dropdownOptions.length > 0 ? props.dropdownOptions[0].value : "";
      searchQuery.value = "";
      validationStatus.value = "";
      validationMessage.value = "";
      emit("reset");
    };

    const handleExportTypeClick = (type: Option) => {
      exportType.value = type;
      console.log("Selected export type:", exportType.value);
      emit("exportType", type.value);
    };

    const updateExportType = (type: Option) => {
      exportType.value = type;
      handleExportTypeClick(type);
    };

    watch(trimmedSearchQuery, (newVal, oldVal) => {
      if (newVal === "" && oldVal !== "") {
        emit("reset");
      }
    });

    const handleSelectChange = (value: SelectValue) => {
      console.log("Selected value:", value);
      if (searchQuery.value !== "") {
        searchQuery.value = "";
      }
    };

    watch(
      () => props.dropdownOptions,
      (newOptions) => {
        exportType.value = { label: "Export CSV", value: "csv" };
        if (newOptions.length > 0) {
          selectedKey.value = newOptions[0].value;
          searchQuery.value = "";
        } else {
          selectedKey.value = "";
        }
      },
      { immediate: true }
    );

    return {
      selectedKey,
      searchQuery,
      exportType,
      exportTypes,
      searchHandler,
      resetHandler,
      handleExportTypeClick,
      updateExportType,
      isSearchQueryEmpty,
      validationStatus,
      validationMessage,
      validateInput,
      handleSelectChange,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.custom-input {
  border-radius: 3px;
}

.search-form .ant-form-item {
  margin-bottom: 10px;
}

.custom-button {
  border-radius: 3px;
}

.search-button[disabled] {
  background-color: rgba(149, 190, 251, 1);
  border-color: rgba(149, 190, 251, 1);
  color: #fff;
}

.reset-button[disabled] {
  background-color: rgba(255, 167, 162, 1);
  border-color: rgba(255, 167, 162, 1);
  color: #fff;
}
</style>
