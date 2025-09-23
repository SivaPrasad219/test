<template>
  <div class="search-form">
    <a-row>
      <a-col :span="15">
        <a-row :gutter="24">
          <a-col :span="10">
            <a-form-item
              :label="translateLabel('commonData', 'Select By')"
              :colon="false"
            >
              <a-select
                v-model:value="selectedKey"
                style="width: 85%"
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
          <a-col :span="14">
            <template v-if="isTimeRelated">
              <!-- Range Picker -->
              <a-form-item
                :label="translateLabel('commonData', 'Value')"
                :colon="false"
              >
                <a-range-picker
                  v-model:value="selectedDateRange"
                  style="width: 90%"
                  :show-time="{ format: 'HH:mm:ss' }"
                  format="YYYY-MM-DD HH:mm:ss"
                  :placeholder="[
                    translateLabel('commonData', 'Search Time From'),
                    translateLabel('commonData', 'Search Time To'),
                  ]"
                  @change="handleDateChange"
                />
              </a-form-item>
              <!-- Timezone Dropdown -->
              <a-form-item
                :label="translateLabel('commonData', 'Timezone')"
                :colon="false"
                :rules="timeZoneRules"
              >
                <a-select
                  v-model:value="selectedTimeZone"
                  style="width: 50%"
                  class="custom-input"
                  show-search
                  allowClear
                  :placeholder="translateLabel('commonData', 'Select Timezone')"
                  :filterOption="filterOption"
                  @change="handleTimeZoneChange"
                >
                  <a-select-option
                    v-for="site in sites"
                    :key="site.timezone"
                    :value="site.timezone"
                  >
                    {{ site.timezoneAbb }} ({{ site.timezone }})
                  </a-select-option>
                </a-select>
              </a-form-item>
            </template>

            <template v-else>
              <!-- Search Input -->
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
            </template>
          </a-col>
        </a-row>
      </a-col>
      <a-col :span="7">
        <a-row justify="end">
          <a-col :span="16">
            <a-form-item style="text-align: right; width: 90% !important">
              <a-button
                type="primary"
                @click="searchHandler"
                class="custom-button search-button"
                :disabled="validationStatus === 'error' || isSearchQueryEmpty"
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
          <a-col :span="8">
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
import {
  defineComponent,
  ref,
  computed,
  PropType,
  watch,
  onMounted,
  Ref,
} from "vue";
import { Select, Input, Button, Dropdown, Menu, message } from "ant-design-vue";
import { EllipsisOutlined } from "@ant-design/icons-vue";
import { translateLabel, getAllTimeZones } from "@/common/utils";
import { useI18n } from "vue-i18n";
import moment from "moment-timezone";
// import { getSitesByActive } from "@/services/apiService";
interface Option {
  label: any;
  value: any;
}

type SelectValue = string | number | (string | number)[];

interface TimeZone {
  timezone: string;
  timezoneAbb: string;
}
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
    shouldReset: {
      type: Boolean,
    },
  },
  emits: ["search", "reset", "exportType"],

  setup(props, { emit }) {
    const selectedKey = ref<SelectValue>(
      props.dropdownOptions.length > 0 ? props.dropdownOptions[0].value : ""
    );
    const trimmedSearchQuery = computed(() => searchQuery.value.trim());
    const { t } = useI18n();
    const searchQuery = ref<string>("");
    const validationStatus = ref<"" | "error">("");
    const validationMessage = ref<string>("");
    const sites = ref<TimeZone[]>([]);
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
    // const selectedDateRange = ref([]);
    const selectedDateRange: Ref<(Date | null)[]> = ref([]);
    const selectedTimeZone = ref<any | undefined>();
    const handleDateChange = (value: any) => {
      if (value && value.length === 2) {
        const [start, end] = value;
        const formattedStart = moment(start.toString()).format(
          "YYYY-MM-DD HH:mm:ss"
        );
        const formattedEnd = moment(end).format("YYYY-MM-DD HH:mm:ss");
        console.log("Start Date:", start, "End Date:", end);
        console.log("Start Date:", formattedStart, "End Date:", formattedEnd);
      }
    };

    const timeZoneRules = computed(() => [
      {
        required: true,
        message: translateLabel("commonData", "Timezone is required"),
      },
    ]);

    const isSearchQueryEmpty = computed(() => {
      // Condition 1: Check if input field has a value > 0 (search query filled)
      const isSearchQueryFilled = (searchQuery.value || "").trim().length > 0;

      // Condition 2: Check if date range is complete and timezone is selected
      const isDateRangeComplete =
        selectedDateRange.value &&
        selectedDateRange.value.length === 2 &&
        selectedDateRange.value.every(
          (date) => moment(date).isValid() // Check if both start and end dates are valid Moment objects
        );

      const isTimeZoneSelected =
        (selectedTimeZone.value || "").trim().length > 0;

      const isDateFilterComplete = isDateRangeComplete && isTimeZoneSelected;

      console.log("isSearchQueryFilled:", isSearchQueryFilled);
      console.log("isDateRangeComplete:", isDateRangeComplete);
      console.log("isTimeZoneSelected:", isTimeZoneSelected);
      console.log("isDateFilterComplete:", isDateFilterComplete);

      // The buttons are enabled if either the input field has a value or the date filter is complete
      return !(isSearchQueryFilled || isDateFilterComplete);
    });

    // Computed property to check if the selected key is time-related

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
        let searchedQuery;
        if (trimmedSearchQuery.value) {
          searchedQuery = trimmedSearchQuery.value;
        } else {
          if (selectedDateRange.value.length === 2) {
            const [start, end] = selectedDateRange.value;
            // Parse start and end dates
            if (start && end) {
              let starttime = start.toString();
              let endtime = end.toString();
              let timeFrom = moment(starttime)
                .tz(selectedTimeZone.value)
                .format("YYYY-MM-DD HH:mm:ssZ"); // Start date
              let timeTo = moment(endtime)
                .tz(selectedTimeZone.value)
                .format("YYYY-MM-DD HH:mm:ssZ"); // End date
              console.log("Final INIT start time", timeFrom);
              console.log("Final INIT end time", timeTo);
              console.log(
                "Final start time",
                moment.utc(timeFrom).format("YYYY-MM-DD HH:mm:ssZ")
              );
              console.log(
                "Final end time",
                moment.utc(timeTo).format("YYYY-MM-DD HH:mm:ssZ")
              );

              // Prepare search query
              searchedQuery = JSON.stringify([
                selectedTimeZone.value,
                moment.utc(timeFrom).format("YYYY-MM-DD HH:mm:ssZ"),
                moment.utc(timeTo).format("YYYY-MM-DD HH:mm:ssZ"),
              ]);
            }
            console.log("Searched Query:", searchedQuery);
          } else {
            console.error("Invalid date range selected!");
          }
        }
        console.log("searchedQuerysearchedQuerysearchedQuery", searchedQuery);
        emit("search", {
          selectedKey: selectedKey.value,
          searchQuery: searchedQuery,
        });
        console.log(
          "Selected Key from the searck component",
          selectedKey.value
        );
      }
    };
    const resetHandler = () => {
      const defaultKey =
        props.dropdownOptions.length > 0 ? props.dropdownOptions[0].value : "";
      selectedKey.value = defaultKey;

      // Set isTimeRelated based on default key
      const isTime = timeRelatedTitles.includes(String(defaultKey));
      isTimeRelated.value = isTime;

      // Reset form fields based on type
      if (isTime) {
        selectedDateRange.value = []; // Clear date range
        selectedTimeZone.value = "";
      } else {
        searchQuery.value = ""; // Clear text input
      }

      // Reset validation
      validationStatus.value = "";
      validationMessage.value = "";

      emit("reset");
    };

    watch(
      () => props.shouldReset,
      (newValue: any) => {
        console.log("Reset triggered in child component", newValue);
        resetHandler();
      }
    );

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
    const timeRelatedTitles = [
      "Timestamp",
      "measure_start_time",
      "measure_end_time",
      "operation_timestamp",
    ];
    const isTimeRelated = ref(
      timeRelatedTitles.includes(String(selectedKey.value))
    );

    const fetchSites = async () => {
      try {
        const response = getAllTimeZones();
        sites.value = response;
        console.log("timezones value", response);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };

    const handleSelectChange = (value: any) => {
      console.log("Selected value:", value);

      const isTime = timeRelatedTitles.includes(value);
      isTimeRelated.value = isTime;
      selectedKey.value = value;

      if (isTime) {
        selectedDateRange.value = []; // Clear date range
        selectedTimeZone.value = "";
        fetchSites(); // If needed
      } else {
        searchQuery.value = ""; // Clear text input
      }

      validationStatus.value = "";
      validationMessage.value = "";
    };

    const handleTimeZoneChange = (value: any) => {
      console.log("Selected TimeZone value:", selectedTimeZone);
      console.log("start date Received TimeZone value:", value);
    };
    const convertFormattedTimeToUTC = (
      formattedTime: any,
      sourceTimeZone: any
    ) => {
      console.log("formattedTime", formattedTime, sourceTimeZone);

      // Validate the input formattedTime
      if (!formattedTime || typeof formattedTime !== "string") {
        return ""; // Return an empty string if formattedTime is invalid
      }

      // Validate the sourceTimeZone
      if (
        typeof sourceTimeZone !== "string" ||
        !moment.tz.zone(sourceTimeZone)
      ) {
        return ""; // Return an empty string if sourceTimeZone is invalid
      }

      // Parse the formatted time string
      const parsedTime = moment.tz(
        formattedTime,
        "MMM DD, YYYY, hh:mm:ss A (z)",
        sourceTimeZone
      );

      if (!parsedTime.isValid()) {
        return ""; // Return an empty string if the time string is invalid
      }

      // Convert the time to UTC and format as ISO 8601
      const utcTime = parsedTime.utc().format("YYYY-MM-DD HH:mm:ssZ");
      console.log("Converted UTC time:", utcTime);

      return utcTime;
    };

    const filterOption = (input: string, option: any) => {
      const value = (option?.value || "").toString().toLowerCase();
      const label = (option?.children || "").toString().toLowerCase();
      const searchText = input.toLowerCase();

      return value.includes(searchText) || label.includes(searchText);
    };

    onMounted(() => {
      fetchSites();
    });

    watch(
      () => props.dropdownOptions,
      (newOptions) => {
        exportType.value = { label: "Export CSV", value: "csv" };

        if (newOptions.length > 0) {
          selectedKey.value = newOptions[0].value;

          // Reset states
          searchQuery.value = "";
          selectedDateRange.value = [];
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
      timeZoneRules,
      isSearchQueryEmpty,
      validationStatus,
      validationMessage,
      validateInput,
      handleSelectChange,
      translateLabel,
      selectedDateRange,
      handleDateChange,
      isTimeRelated,
      fetchSites,
      handleTimeZoneChange,
      convertFormattedTimeToUTC,
      selectedTimeZone,
      sites,
      filterOption,
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

::v-deep .ant-row {
  flex-flow: nowrap !important;
}
</style>
