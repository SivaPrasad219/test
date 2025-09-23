<template>
  <div class="measurePopUpData">
    <div class="measureData">
      <h1
        class="measure-heading"
        style="display: inline-block; margin-right: 1rem"
      >
        {{ translateLabel("Measurement Data") }}
      </h1>
      <a-button-group>
        <a-button
          :loading="isExportTypeLoading"
          :disabled="isExportTypeLoading"
          @click="handleExportClick"
        >
          {{ t(`commonData.${selectedExportType}`) }}
        </a-button>
        <a-dropdown
          placement="bottomRight"
          trigger="click"
          :getPopupContainer="(trigger: any) => trigger.parentNode"
        >
          <a-button class="custom-button">
            <EllipsisOutlined />
          </a-button>
          <template #overlay>
            <a-menu style="text-align: start; width: 120px">
              <a-menu-item
                v-for="type in exportTypes"
                :key="type.value"
                @click="handleExportTypeSelection(type)"
              >
                {{ t(`commonData.${type.label}`, `${type.label}`) }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-button-group>
      <div>
        <a-typography-text
          type="danger"
          style="color: #e89b96"
          v-if="data?.status === 'Failed'"
          ><ExclamationCircleOutlined />
          {{ data?.details?.message }}</a-typography-text
        >
      </div>

      <div>
        <a-row :gutter="16">
          <a-col :span="15">
            <div class="measureInfo">
              <a-table
                :dataSource="filteredMeasureData"
                :columns="measureColumns"
                :showHeader="false"
                size="small"
                :pagination="false"
                style="padding: 8px"
              >
                <template #bodyCell="{ column, record }">
                  <span v-if="column.dataIndex === 'label' && record.label">
                    <template v-if="record.key === 'advanced_options'">
                      <a
                        @click="toggleAdvancedOptions"
                        style="
                          cursor: pointer;
                          font-weight: bold;
                          display: flex;
                          align-items: center;
                          white-space: nowrap;
                        "
                      >
                        {{ record.label }}
                        <DownOutlined
                          v-if="shouldShowAdvancedOptions"
                          style="margin-left: 5px"
                        />
                        <UpOutlined v-else style="margin-left: 5px" />
                      </a>
                    </template>
                    <template v-else>
                      <span style="font-weight: bold">{{ record.label }}</span>
                    </template>
                  </span>
                  <span v-else-if="record.key === 'flow_limits'">
                    <ul style="list-style-type: none; padding: 0">
                      <li
                        v-for="(value, key) in record[column.dataIndex]"
                        :key="key"
                      >
                        <strong style="color: black"
                          >{{ String(key).replace(/_/g, " ") }} :</strong
                        >
                        <span>{{ value }}</span>
                      </li>
                    </ul>
                  </span>
                  <span v-else-if="record.key === 'counts'">
                    <ul class="counts-ul">
                      <li
                        v-for="(value, key) in record[column.dataIndex]"
                        :key="key"
                        style="
                          flex: 0 0 calc(50% - 0.5rem);
                          box-sizing: border-box;
                        "
                      >
                        <strong style="color: black">{{ key }} :</strong>
                        <div>alarm limit - {{ value.alarm_limit }}</div>
                        <div>warning limit - {{ value.warning_limit }}</div>
                      </li>
                    </ul>
                  </span>
                  <span v-else-if="nonRequiredKeys.includes(record.key)">
                    {{ record[column.dataIndex] || "-" }}
                  </span>
                  <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
              </a-table>
            </div>
          </a-col>

          <a-col :span="9">
            <div class="sampleInfo">
              <a-table
                v-if="measureInfoData.length"
                :dataSource="
                  measureInfoData.length
                    ? measureInfoData
                    : [
                        {
                          label: translateLabel('Not available'),
                          value: '',
                        },
                      ]
                "
                :columns="measureInfoColumns"
                :showHeader="false"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <span v-if="column.dataIndex === 'label'">
                    <template v-if="isSpecialLabel(record.label)">
                      <h3 style="color: rgba(0, 0, 0, 0.85)">
                        {{ record.label }}
                      </h3>
                    </template>
                    <template v-else>
                      {{ record.label }}
                    </template>
                  </span>
                  <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
              </a-table>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <div class="assetInfo">
      <div class="assetData">
        <h1 class="measure-heading">{{ translateLabel("Instrument Data") }}</h1>
        <div>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-table
                :dataSource="
                  assetDataLeft.length
                    ? assetDataLeft
                    : [
                        {
                          label: translateLabel('Not available'),
                          value: '',
                        },
                      ]
                "
                :columns="assetColumnsLeft"
                :showHeader="false"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <span v-if="column.dataIndex === 'label'">
                    {{ record.label }}
                  </span>
                  <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
              </a-table>
            </a-col>
            <a-col :span="12">
              <a-table
                :dataSource="
                  assetDataRight.length
                    ? assetDataRight
                    : [
                        {
                          label: translateLabel('Not available'),
                          value: '',
                        },
                      ]
                "
                :columns="assetColumnsRight"
                :showHeader="false"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <span v-if="column.dataIndex === 'label'">
                    {{ record.label }}
                  </span>
                  <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
              </a-table>
            </a-col>
          </a-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  toRefs,
  ref,
  watch,
  onMounted,
  computed,
  nextTick,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  EllipsisOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons-vue";
import { getValueByDataIndexKey, formatTimeToSeconds } from "@/common/utils";
import exportFile from "@/services/exportFile";
import { apcApiServices } from "../services/apcService";
interface TimeObject {
  dst?: string;
  time?: string; // ISO format timestamp
  zone?: string;
  offset?: string;
}

interface DataObject {
  data?: {
    status?: string;
    measure_start_time?: string;
    measure_end_time?: string;
    data?: {
      start_time?: TimeObject;
      end_time?: TimeObject;
      volume?: number;
      volume_units?: {
        short?: string;
      };
      location?: string;
      notes?: string;
      [key: string]: any;
    };
    meta?: {
      sample_type?: string;
      sample_type_label?: string;
      operator?: string;
    };
    [key: string]: any;
  };
  id?: string;
  lims_id?: string;
  lims_sample_id?: string;
  meta?: {
    nice_name?: string;
    asert_name?: string;
    firmware?: string;
    site_name?: string;
    serial_number?: string;
    asset_info?: {
      name?: string;
      firmware_version?: string;
      site_info?: {
        name?: string;
        site_timezone?: string;
      };
      model_info?: {
        name?: string;
      };
    };
    input?: {
      count_limits?: object;
      flow_limits?: object;
      location?: object;
      notes?: string;
    };
  };
  task_def___schema?: any;
  task_id?: string;
  filename?: string;
}

interface TableData {
  key: string;
  label: string;
  value: any;
}

interface MeasureInfoData extends TableData {
  boldLabel?: boolean;
}

export default defineComponent({
  name: "ApcMeasurePopUpRecordData",
  components: {
    EllipsisOutlined,
    ExclamationCircleOutlined,
    DownOutlined,
    UpOutlined,
  },
  props: {
    data: {
      type: Object as () => DataObject,
      required: true,
    },
  },
  setup(props) {
    const { t, locale } = useI18n();
    const { data } = toRefs(props);
    const apcService = new apcApiServices();
    const showAdvancedOptions = ref(false);

    const measureTaskData = ref<any | undefined>();
    // const measureTaskDefData = computed(() => {
    //   const base = measureTaskData.value?.task_def___schema?.meta?.properties
    //     ?.input || {
    //     properties: {},
    //     required: [],
    //   };

    //   return {
    //     ...base,
    //     properties: {
    //       ...base.properties,
    //       notes: {
    //         type: "string",
    //         default: "",
    //         x_nice_name: "Notes",
    //       },
    //     },
    //   };
    // });

    const measureTaskDefData = computed(
      () =>
        measureTaskData.value?.task_def___schema?.meta?.properties.input || {}
    );
    const dataPageHeader: any = ref([]);
    // const taskData = ref<any | undefined>();
    const isExportTypeLoading = ref(false);

    const allowedModels = ["climit-1070", "climit-1054", "CI-1070"];

    // Method to check if model is in the array
    const isModelInArray = (model: any) => {
      return allowedModels.includes(model);
    };
    const measureData = ref<TableData[]>([]);
    const measureColumns = [
      { dataIndex: "label", key: "label" },
      { dataIndex: "value", key: "value" },
    ];
    const exportTypes = computed(() => [
      { label: "Export CSV", value: "csv" },
      { label: "Export PDF", value: "pdf" },
      { label: "Export JSON", value: "json" },
      { label: "Export XLS", value: "xls" },
    ]);

    const assetDataLeft = ref<TableData[]>([]);
    const assetColumnsLeft = [
      { dataIndex: "label", key: "label" },
      { dataIndex: "value", key: "value" },
    ];

    const assetDataRight = ref<TableData[]>([]);
    const assetColumnsRight = [
      { dataIndex: "label", key: "label" },
      { dataIndex: "value", key: "value" },
    ];

    const measureInfoData = ref<MeasureInfoData[]>([]);
    const measureInfoColumns = [
      { dataIndex: "label", key: "label" },
      { dataIndex: "value", key: "value" },
    ];

    const formatVolume = (
      volume: { unit: string; value: any } | null
    ): string => {
      // Check if the volume object is null or value is null
      if (!volume || volume.value == null) {
        return "-";
      }

      // Destructure value and unit from the volume object
      const { value, unit } = volume;

      // If value is null or cannot be converted to a number, return "-"
      if (isNaN(parseFloat(value))) {
        return "-";
      }

      const parsedVolume = parseFloat(value);

      // If parsed volume is 0 or not a number, return "0" followed by the unit
      if (parsedVolume === 0) {
        return `0 ${unit}`;
      }

      // Check if the parsed volume is an integer
      if (Number.isInteger(parsedVolume)) {
        return `${parsedVolume} ${unit}`;
      }

      // If not an integer, round to 1 decimal place
      return `${parsedVolume.toFixed(1)} ${unit}`;
    };

    // const formatDate = (dateString: string): string => {
    //   if (!dateString || dateString === "-") {
    //     return "-";
    //   }
    //   const date = new Date(dateString);
    //   const options: Intl.DateTimeFormatOptions = {
    //     year: "numeric",
    //     month: "short",
    //     day: "numeric",
    //   };
    //   return date.toLocaleDateString("en-US", options);
    // };

    const translateLabel = (key: string) => {
      // console.log(
      //   "`dataPage.${key}`",
      //   `dataPage.${key}`,
      //   t(`dataPage.${key}`, key)
      // );
      return t(`dataPage.${key}`, key);
    };
    const formatDate = (dateString: string): string => {
      if (!dateString || dateString === "-") {
        return "-";
      }
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return date.toLocaleDateString("en-US", options);
    };

    const requiredKeys = computed(() => {
      const schema = measureTaskDefData.value;
      return Array.isArray(schema.required) ? schema.required : [];
    });

    const nonRequiredKeys = computed(() => {
      const schema = measureTaskDefData.value;
      const allKeys = Object.keys(schema.properties || {});
      const required = Array.isArray(schema.required) ? schema.required : [];
      return allKeys.filter((key) => !required.includes(key));
    });

    // Add this computed property to determine if Advanced Options button should be shown
    const shouldShowAdvancedOptions = computed(() => {
      if (!measureTaskData.value?.meta?.input) return false;

      const inputKeys = Object.keys(measureTaskData.value.meta.input);
      const hasNonRequiredFields = inputKeys.some(
        (key) =>
          nonRequiredKeys.value.includes(key) &&
          measureTaskData.value.meta.input[key] !== undefined
      );

      return hasNonRequiredFields;
    });

    console.log(
      ":::::shouldShowAdvancedOptions",
      shouldShowAdvancedOptions.value,
      requiredKeys.value,
      nonRequiredKeys.value
    );
    const updateData = () => {
      const measureTaskObj = measureTaskData.value || {};

      // Ensure meta.input exists and notes is initialized
      if (!measureTaskObj.meta) measureTaskObj.meta = {};
      if (!measureTaskObj.meta.input) measureTaskObj.meta.input = {};
      if (!("notes" in measureTaskObj.meta.input))
        // measureTaskObj.meta.input.notes = "";

        console.log(":::::measureTaskObj", measureTaskObj);

      // Retrieve data
      const sampleCumulativeData = getValueByDataIndexKey(
        measureTaskObj,
        "data.data.cumulative_data"
      );
      const sampleDifferentialData = getValueByDataIndexKey(
        measureTaskObj,
        "data.data.differential_data"
      );

      // Define allowed keys and labels
      const inputKeyLabels: Record<string, string> = {
        id: translateLabel("Text ID"),
        limssampleid: translateLabel("LIMS Sample #"),
        worklistid: translateLabel("Worklist ID"),
        program: translateLabel("Program"),
        location: translateLabel("Location"),
        notes: translateLabel("Notes"),
        count_limits: translateLabel("Count Limits"),
        flow_limits: translateLabel("Flow Limits"),
      };

      // Initialize measureData with fixed fields
      measureData.value = [
        {
          key: "status",
          label: translateLabel("Sample Status"),
          value:
            translateLabel(
              getValueByDataIndexKey(measureTaskObj, "status") || "-"
            ) || "-",
        },
        {
          key: "nice_name",
          label: translateLabel("Sample Type"),
          value:
            getValueByDataIndexKey(measureTaskObj, "meta.sample_type_label") ||
            "-",
        },
      ];

      // Add input fields in schema order
      if (measureTaskObj?.meta?.input) {
        const inputKeys = Object.keys(
          measureTaskDefData.value?.properties || {}
        );

        const existingInputKeys = Object.keys(measureTaskObj.meta.input);

        // Filter out "volume"
        const filteredKeys = inputKeys.filter(
          (key) => existingInputKeys.includes(key) && key !== "volume"
        );

        filteredKeys.forEach((key) => {
          const isRequired = requiredKeys.value.includes(key);
          if (isRequired || !showAdvancedOptions.value) {
            measureData.value.push({
              key,
              label: inputKeyLabels[key] || key,
              value: measureTaskObj.meta.input[key] ?? "-",
            });
          }
        });

        console.log("filteredKeys ::::", filteredKeys);
      }

      // Add fixed fields after input fields
      measureData.value.push(
        {
          key: "volume",
          label: translateLabel("Volume"),
          value: formatVolume({
            unit: getValueByDataIndexKey(
              measureTaskObj,
              "data.data.volume.unit"
            ),
            value: getValueByDataIndexKey(
              measureTaskObj,
              "data.data.volume.value"
            ),
          }),
        },
        {
          key: "period",
          label: translateLabel("Period"),
          value:
            formatTimeToSeconds(
              getValueByDataIndexKey(measureTaskObj, "data.data.period")
            ) || "-",
        },
        {
          key: "measure_start_time",
          label: translateLabel("Measure Start Time"),
          value:
            getValueByDataIndexKey(measureTaskObj, "measure_start_time") || "-",
        },
        {
          key: "measure_end_time",
          label: translateLabel("Measure End Time"),
          value:
            getValueByDataIndexKey(measureTaskObj, "measure_end_time") || "-",
        },
        {
          key: "operator",
          label: translateLabel("User"),
          value: getValueByDataIndexKey(measureTaskObj, "meta.operator") || "-",
        },
        {
          key: "sample_id",
          label: translateLabel("Sample ID"),
          value: getValueByDataIndexKey(measureTaskObj, "id") || "-",
        }
      );

      console.log(
        ":::: shouldShowAdvancedOptions",
        shouldShowAdvancedOptions.value
      );

      // Handle non-required fields in Advanced Options
      if (shouldShowAdvancedOptions.value && measureTaskObj?.meta?.input) {
        const inputKeys = Object.keys(
          measureTaskDefData.value?.properties || {}
        );

        const nonRequiredInputKeys = inputKeys.filter(
          (key) =>
            nonRequiredKeys.value.includes(key) &&
            key in measureTaskObj.meta.input
        );

        if (nonRequiredInputKeys.length > 0) {
          // Insert Advanced Options row AFTER Sample ID
          const sampleIdIndex = measureData.value.findIndex(
            (item) => item.key === "sample_id"
          );
          const triggerIndex =
            sampleIdIndex !== -1 ? sampleIdIndex + 1 : measureData.value.length;

          if (
            !measureData.value.some((item) => item.key === "advanced_options")
          ) {
            measureData.value.splice(triggerIndex, 0, {
              key: "advanced_options",
              label: translateLabel("Advanced Options"),
              value: "",
            });
          }

          // Remove old non-required fields to prevent duplicates
          measureData.value = measureData.value.filter(
            (item) => !nonRequiredKeys.value.includes(item.key)
          );

          // Only add children if expanded
          if (showAdvancedOptions.value) {
            const advancedOptionsIndex = measureData.value.findIndex(
              (item) => item.key === "advanced_options"
            );

            if (advancedOptionsIndex !== -1) {
              const additionalFields = nonRequiredInputKeys.map((key) => {
                const schema =
                  measureTaskDefData.value?.properties?.[key] || {};
                return {
                  key,
                  label: schema.x_nice_name || inputKeyLabels[key] || key,
                  value: measureTaskObj.meta.input[key] ?? schema.default ?? "",
                };
              });

              // Only include "notes" if it's part of schema + non-required keys
              if (
                nonRequiredKeys.value.includes("notes") &&
                "notes" in (measureTaskDefData.value?.properties || {})
              ) {
                if (!additionalFields.some((f) => f.key === "notes")) {
                  additionalFields.push({
                    key: "notes",
                    label:
                      measureTaskDefData.value?.properties?.notes
                        ?.x_nice_name || translateLabel("Notes"),
                    value:
                      measureTaskObj.meta.input.notes ??
                      measureTaskDefData.value?.properties?.notes?.default ??
                      "",
                  });
                }
              }

              measureData.value.splice(
                advancedOptionsIndex + 1,
                0,
                ...additionalFields
              );
            }
          }
        }
      }

      // Handle current_cr_index (if applicable)
      if (
        measureTaskObj?.meta?.current_cr_index != null &&
        Array.isArray(measureTaskObj.meta.input)
      ) {
        const currentIndex = measureTaskObj.meta.current_cr_index;
        measureTaskObj.meta.input = measureTaskObj.meta.input[currentIndex];
      }

      console.log("Show Advanced Options?", showAdvancedOptions.value);

      // Format asset data (left)
      assetDataLeft.value = [
        {
          key: "model_name",
          label: translateLabel("Model"),
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "meta.asset_info.model_info.name"
            ) || "-",
        },
        {
          key: "serial",
          label: translateLabel("Serial #"),
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "meta.asset_info.asset_id"
            ) || "-",
        },
        {
          key: "last_calibration_date",
          label: translateLabel("Last Calibration Date"),
          value:
            formatDate(
              getValueByDataIndexKey(
                measureTaskObj,
                "meta.asset_info.info.last_calibration_date"
              )
            ) || "-",
        },
        {
          key: "next_calibration_date",
          label: translateLabel("Next Calibration Date"),
          value:
            formatDate(
              getValueByDataIndexKey(
                measureTaskObj,
                "meta.asset_info.info.next_calibration_date"
              )
            ) || "-",
        },
      ];

      // Format asset data (right)
      assetDataRight.value = [
        {
          key: "firmware",
          label: translateLabel("Firmware"),
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "meta.asset_info.info.firmware.version"
            ) || "-",
        },
        {
          key: "site_name",
          label: translateLabel("Site Name"),
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "meta.asset_info.site_info.name"
            ) || "-",
        },
      ];

      // Format measure info data
      const shouldLabelBeBold = (label: string): boolean =>
        [
          translateLabel("Cumulative Data"),
          translateLabel("Differential Data"),
        ].includes(label);

      const measureInfoDataTmp = (() => {
        const cumulativeDataMapped =
          sampleCumulativeData &&
          typeof sampleCumulativeData === "object" &&
          !Array.isArray(sampleCumulativeData)
            ? Object.entries(sampleCumulativeData).map(
                ([key, value], index) => ({
                  key: `cumulative-${index}`,
                  label: key,
                  value: value ?? "-",
                })
              )
            : [];

        const differentialDataMapped = Array.isArray(sampleDifferentialData)
          ? sampleDifferentialData.map((item, index) => ({
              key: `differential-${index}`,
              label: Object.keys(item)[0] || `Item ${index}`,
              value: Object.values(item)[0] ?? "-",
            }))
          : [];

        const dataToDisplay = [
          ...(cumulativeDataMapped.length > 0
            ? [
                {
                  label: translateLabel("Cumulative Data"),
                  items: cumulativeDataMapped,
                },
              ]
            : []),
          ...(differentialDataMapped.length > 0
            ? [
                {
                  label: translateLabel("Differential Data"),
                  items: differentialDataMapped,
                },
              ]
            : []),
        ];

        const result: any = [];
        dataToDisplay.forEach(({ label, items }) => {
          result.push({
            key: `${label}-label`,
            label,
            boldLabel: shouldLabelBeBold(label),
          });
          if (items.length === 0) {
            result.push({
              key: `${label}-no-data`,
              label: translateLabel("Not available"),
              value: "",
            });
          } else {
            result.push(...items);
          }
        });

        return result;
      })();

      measureInfoData.value = measureInfoDataTmp;

      // Update dataPageHeader for count_limits and flow_limits
      dataPageHeader.value = dataPageHeader.value.filter(
        (item: any) => !["count_limits", "flow_limits"].includes(item.field)
      );
      if (measureTaskObj?.meta?.input?.count_limits) {
        dataPageHeader.value.splice(7, 0, {
          field: "count_limits",
          header: translateLabel("Count Limits"),
        });
      }
      if (measureTaskObj?.meta?.input?.flow_limits) {
        dataPageHeader.value.splice(8, 0, {
          field: "flow_limits",
          header: translateLabel("Flow Limits"),
        });
      }
    };

    const isSpecialLabel = (label: string) => {
      return (
        label === translateLabel("Cumulative Data") ||
        label === translateLabel("Differential Data")
      );
    };

    const selectedExportType = ref(exportTypes.value[0].label);

    const handleExportTypeSelection = (type: {
      label: string;
      value: string;
    }) => {
      selectedExportType.value = type.label;
      downloadExportType(type.value);
    };

    const handleExportClick = () => {
      const selectedType = exportTypes.value.find(
        (type) => type.label === selectedExportType.value
      );
      if (selectedType) {
        downloadExportType(selectedType.value);
      }
    };

    const downloadExportType = async (type: string) => {
      //console.log(type);
      console.log("::::::data.value", data.value);
      isExportTypeLoading.value = true;
      let params: any = {};

      if (data.value) {
        if (data.value.task_id) {
          params.task_id = data.value.task_id;
        } else if (data.value.lims_id) {
          params.lims_id = data.value.lims_id;
        }

        params.to_show = true;
        params.is_asset_result = true;
        params.locale = locale.value;
        params.strict = "no";
        params.exportType = type;
        params.tableHeaders = JSON.stringify(dataPageHeader.value);
        params.fileName = measureTaskData.value?.filename || "Data Exporter";

        //console.log(":::::paramsdata", params);

        try {
          const response = data.value.task_id
            ? await apcService.getTasksData(params)
            : await apcService.getLimsTasksData(params);
          //console.log(":::::responseLims", response);
          exportFile(response, "data_exporter", type);
        } catch (error) {
          console.error("Export failed:", error);
        } finally {
          isExportTypeLoading.value = false;
        }
      } else {
        isExportTypeLoading.value = false;
      }
    };

    const dataPageHeaders = () => {
      return [
        { header: "Sample Status", field: "status" },
        {
          header: "Sample Type",
          field: "meta.sample_type_label",
        },
        { field: "volume", header: "Volume" },
        { field: "meta.input.id", header: "Text ID" },
        {
          header: "Program",
          field: "meta.input.program",
        },
        { field: "meta.input.worklistid", header: "Worklist ID" },
        { field: "meta.input.limssampleid", header: "LIMS Sample #" },

        {
          header: "Location",
          field: "meta.input.location",
        },
        {
          header: "Notes",
          field: "meta.input.notes",
        },
        { field: "period", header: "Period" },

        {
          header: "Measure Start Time",
          field: "measure_start_time",
        },
        {
          header: "Measure End Time",
          field: "measure_end_time",
        },
        { header: "Sample ID", field: "id" },
        { field: "cumulative", header: "Cumulative Data" },
        { field: "differential", header: "Differential Data" },
        { field: "model_name", header: "Model" },

        { field: "serial_number", header: "Serial #" },
        { field: "last_calibration_date", header: "Last Calibration Date" },
        { field: "next_calibration_date", header: "Next Calibration Date" },
        { field: "firmware_version", header: "Firmware" },
        { field: "site_name", header: "Site Name" },
        {
          header: "Instrument Name",
          field: "meta.asset_info.name",
        },
        // { header: "", field: "user" },

        { header: "Source", field: "meta.source" },
        {
          header: "Continuous Run ID",
          field: "meta.cr_id",
        },

        { field: "operator", header: "User" },

        { field: "comments", header: "Comment(s)" },
      ];
    };

    // const shouldShowAdvancedOptions = computed(() => {
    //   return nonRequiredKeys.value.some((nonReqKey) => {
    //     return measureData.value.some((item) =>
    //       item.label?.toLowerCase()?.includes(nonReqKey.toLowerCase())
    //     );
    //   });
    // });

    // Computed property to filter data based on advanced options visibility
    // const filteredMeasureData = computed(() => {
    //   if (showAdvancedOptions.value) {
    //     return measureData.value;
    //   }

    //   return measureData.value.filter(
    //     (item) => !nonRequiredKeys.value.includes(item.key)
    //   );
    // });

    const filteredMeasureData = computed(() => {
      if (showAdvancedOptions.value) {
        return measureData.value;
      }
      return measureData.value.filter(
        (item) => !["counts", "flow_limits"].includes(item.key)
      );
    });

    const toggleAdvancedOptions = () => {
      showAdvancedOptions.value = !showAdvancedOptions.value;
      updateData(); // Re-run updateData to add/remove nonRequiredKeys
    };
    onMounted(async () => {
      selectedExportType.value = "Export CSV";

      measureTaskData.value = data.value;
      await nextTick();

      console.log("::::: MeasureTaskData", measureTaskDefData.value);
      console.log(
        "::::: requried and no requried keys",
        requiredKeys.value,
        nonRequiredKeys.value
      );

      dataPageHeader.value = dataPageHeaders();
      updateData();
    });

    watch(
      () => props.data,
      (newValue) => {
        measureTaskData.value = newValue;
        updateData();
      },
      { deep: true }
    );

    const flag = ref(true);
    console.log("calls out for everytime");
    watch(
      () => props.data.id,
      (newValue) => {
        if (newValue != props.data.id) {
          flag.value = true;
        }
        if (flag.value) {
          selectedExportType.value = "Export CSV";
          console.log("loading selectedExportType 1", selectedExportType.value);
          flag.value = false;
        }

        console.log("loading flag", flag.value);
      }
    );

    return {
      measureData,
      measureColumns,
      assetDataLeft,
      assetColumnsLeft,
      assetDataRight,
      assetColumnsRight,
      measureInfoData,
      measureInfoColumns,
      isSpecialLabel,
      exportTypes,
      downloadExportType,
      dataPageHeaders,
      translateLabel,
      handleExportTypeSelection,
      selectedExportType,
      isExportTypeLoading,
      handleExportClick,
      filteredMeasureData,
      showAdvancedOptions,
      toggleAdvancedOptions,
      isModelInArray,
      nonRequiredKeys,
      requiredKeys,
      shouldShowAdvancedOptions,
      t,
    };
  },
});
</script>
<style scoped>
::v-deep(tr[data-row-key="counts"] td) {
  vertical-align: baseline !important;
}
::v-deep(tr[data-row-key="flow_limits"] td) {
  vertical-align: baseline !important;
}

.counts-ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>

<style>
.measurePopUpData,
.measurePopUpData .ant-table tr td {
  font-family: Montserrat-Regular, Montserrat, sans-serif;
}

.measurePopUpData .ant-table {
  color: rgba(0, 0, 0, 0.65);
}
.measurePopUpData .measure-heading {
  font-size: 21px;
  font-weight: 500;
  margin-top: 15px;
}
.label-link {
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.arrow {
  margin-left: 5px;
}

.label-bold {
  font-weight: bold;
}
</style>
