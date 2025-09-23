<template>
  <div class="measurePopUpData">
    <div class="measureData">
      <h1 class="measure-heading">
        {{ translateLabel("dataPage", "Measurement Data") }}
      </h1>
      <div>
        <a-row :gutter="16">
          <a-col :span="16">
            <div class="measureInfo">
              <a-table
                :dataSource="
                  measureData.length
                    ? measureData
                    : [
                        {
                          label: `${translateLabel(
                            'dataPage',
                            'No data available'
                          )}`,
                          value: '',
                        },
                      ]
                "
                :columns="measureColumns"
                :showHeader="false"
                size="small"
                :pagination="false"
                style="padding: 8px"
              >
                <template #bodyCell="{ column, record }">
                  <span v-if="column.dataIndex === 'label'">
                    {{ record.label }}
                  </span>
                  <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
              </a-table>
            </div>
          </a-col>

          <!-- <a-col :span="9">
            <div class="sampleInfo">
              <a-table
                :dataSource="
                  measureInfoData.length
                    ? measureInfoData
                    : [{ label: 'No Data Available', value: '' }]
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
          </a-col> -->
        </a-row>
      </div>
    </div>

    <div class="assetInfo">
      <div class="assetData">
        <h1 class="measure-heading">Instrument Data</h1>
        <div>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-table
                :dataSource="
                  assetDataLeft.length
                    ? assetDataLeft
                    : [
                        {
                          label: `${translateLabel(
                            'dataPage',
                            'No data available'
                          )}`,
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
          </a-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted } from "vue";
import { getValueByDataIndexKey } from "@/common/utils";
import { useI18n } from "vue-i18n";

interface DataObject {
  actualData?: {
    status?: string;
    data?: {
      start_time?: string;
      end_time?: string;
      volume?: number;
      volume_units?: {
        short?: string;
      };
      location?: string;
      [key: string]: any;
    };
    meta?: {
      sample_type?: string;
      operator?: string;
    };
    [key: string]: any;
  };
  volume_range?: any;
  data?: any;
  id?: string;
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
  };
}

interface TableData {
  key: any;
  label: any;
  value: any;
}

interface MeasureInfoData extends TableData {
  boldLabel?: boolean;
}

export default defineComponent({
  name: "ApcMeasurePopUpRecordData",
  props: {
    data: {
      type: Object as () => DataObject,
      required: true,
    },
  },
  setup(props) {
    const { data } = toRefs(props);
    const measureTaskData = ref<DataObject | undefined>();
    const taskData = ref<any | undefined>();

    const measureData = ref<TableData[]>([]);
    const measureColumns = [
      { dataIndex: "label", key: "label" },
      { dataIndex: "value", key: "value" },
    ];

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
    const { t } = useI18n();
    const translateLabel = (page: string, keyvalue: string) => {
      return t(`${page}.${keyvalue}`, `${keyvalue}`);
    };
    const updateData = () => {
      const taskDataObj = taskData.value || {};
      const measureTaskObj = measureTaskData.value || {};
      console.log("::::::::::::;taskDataObj", taskDataObj);
      console.log(
        ":::::::::::::measureTaskObj",
        getValueByDataIndexKey(measureTaskObj, "data.data.start_time")
      );
      const differentialData = {};
      console.log("measureTaskData.value1", measureTaskData.value);
      console.log("::::::differentialData", differentialData);
      if (measureTaskData.value?.data) {
        measureData.value = Object.entries(measureTaskData.value?.data).map(
          ([key, value]: [any, any]) => {
            return { key, value: value !== null ? value : "-", label: key };
          }
        );
      } else {
        measureData.value = [
          {
            key: "date_time",
            label: "Sampled Date",
            value: getValueByDataIndexKey(measureTaskObj, "date_time") || "-",
          },
          {
            key: "alarmed",
            label: "Alarmed",
            value: getValueByDataIndexKey(measureTaskObj, "alarmed"),
          },
          {
            key: "flow",
            label: "Flow",
            value: getValueByDataIndexKey(measureTaskObj, "flow"),
          },
          {
            key: "flow_status",
            label: "Flow Status",
            value: getValueByDataIndexKey(measureTaskObj, "flow_status"),
          },
          {
            key: "laser_status",
            label: "Laser Status",
            value: getValueByDataIndexKey(measureTaskObj, "laser_status"),
          },
          {
            key: "unit_id",
            label: "Unit ID",
            value: getValueByDataIndexKey(measureTaskObj, "unit_id"),
          },
          {
            key: "user_id",
            label: "User ID",
            value: getValueByDataIndexKey(measureTaskObj, "user_id"),
          },
          {
            key: "program_name",
            label: "Program Name",
            value: getValueByDataIndexKey(measureTaskObj, "program_name"),
          },
          {
            key: "location_id",
            label: "Location ID",
            value: getValueByDataIndexKey(measureTaskObj, "location_id"),
          },
          {
            key: "sample_volume",
            label: "Sample Volume",
            value: getValueByDataIndexKey(measureTaskObj, "sample_volume"),
          },
          {
            key: "run_number",
            label: "Run Number",
            value: getValueByDataIndexKey(measureTaskObj, "run_number"),
          },
        ];
      }

      assetDataLeft.value = [
        {
          key: "device_name",
          label: "Instrument Name",
          value: getValueByDataIndexKey(measureTaskObj, "device_name"),
        },
      ];

      assetDataRight.value = [
        {
          key: "firmware",
          label: "Firmware",
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "data.data.device_info.Firmware"
            )?.replace(/^V/, "") || "-",
        },
        {
          key: "site_name",
          label: "Site Name",
          value:
            getValueByDataIndexKey(
              measureTaskObj,
              "meta.asset_info.site_info.name"
            ) || "-",
        },
      ];

      const shouldLabelBeBold = (label: string): boolean => {
        return label === "Cumulative Data" || label === "Differential Data";
      };

      const measureInfoDataTmp = (() => {
        const differentialDataMapped = Array.isArray(differentialData)
          ? differentialData.map((item: any, index: any) => ({
              key: `differential-${index}`,
              label: item.key,
              value: item.value,
            }))
          : [];

        console.log("differentialDataMapped1", differentialDataMapped);
        const dataToDisplay = [
          { label: "Differential Data", items: differentialDataMapped },
        ];

        const result: any[] = [];
        dataToDisplay.forEach(({ label, items }) => {
          result.push({
            key: `${label.replace(/\s+/g, "-").toLowerCase()}-label`,
            label,
          });
          if (items.length === 0) {
            result.push({
              key: `${label.replace(/\s+/g, "-").toLowerCase()}-no-data`,
              label: translateLabel("dataPage", "No data available"),
              value: "",
            });
          } else {
            result.push(...items);
          }
        });

        return result.map((item) => ({
          ...item,
          boldLabel: shouldLabelBeBold(item.label),
        }));
      })();

      measureInfoData.value = measureInfoDataTmp;
    };

    const isSpecialLabel = (label: any) => {
      return label === "Cumulative Data" || label === "Differential Data";
    };

    onMounted(async () => {
      measureTaskData.value = data.value;

      console.log("::::::::measureTaskData.value", measureTaskData.value);
      updateData();
    });

    watch(
      () => props.data,
      (newValue) => {
        measureTaskData.value = newValue;
        console.log(
          "::::::::measureTaskData.value:::::::::::",
          measureTaskData.value
        );
        updateData();
      },
      { deep: true }
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
      translateLabel,
    };
  },
});
</script>

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
</style>
