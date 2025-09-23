<template>
  <div>
    <ApcSearchComponent
      :shouldReset="shouldReset"
      @update:shouldReset="shouldReset = $event"
      :dropdownOptions="auditDropdownOptions"
      @search="performSearch"
      @reset="resetSearchComponent"
      @exportType="exportDataByType"
      :isExportTypeLoading="isExportTypeLoading"
      class="search-component"
    />
    <a-table
      :columns="columns"
      :data-source="tableData"
      class="custom-table data-table"
      :loading="isLoading"
      :pagination="false"
      size="middle"
    >
      <template #headerCell="{ column }">
        <span>
          <ReloadOutlined
            v-if="column.title === localizedTitles.event"
            class="refreshIcon"
            @click="refreshAuditPage"
          />
          {{ t(`auditPage.${column.title}`, `${column.title}`) }}
          <a-popover trigger="hover" placement="topLeft">
            <template #content>
              <template
                v-if="typeof InfoCommentsData.audit[column.title] === 'string'"
              >
                <div class="popover-content">
                  {{
                    t(
                      `constantsTranslate.${
                        InfoCommentsData.audit[column.title]
                      }`
                    )
                  }}
                </div>
              </template>
              <template v-else-if="column.title === localizedTitles.event">
                <div class="scrollable-content">
                  <a-table
                    :data-source="InfoCommentsData.audit?.Event?.data"
                    :size="'small'"
                    :pagination="false"
                    :scroll="{ y: 250 }"
                  >
                    <a-table-column
                      :title="translateLabel('auditPage', 'Type of Event')"
                      dataIndex="name"
                      key="name"
                    />
                    <a-table-column
                      :title="
                        translateLabel('auditPage', 'When the event occur')
                      "
                      dataIndex="value"
                      key="value"
                    />
                    <a-table-column
                      :title="translateLabel('auditPage', 'Sample type')"
                      dataIndex="type"
                      key="type"
                    />
                    <template #bodyCell="{ column, record }">
                      <span v-if="column.dataIndex === 'name'">
                        {{ translateLabel("constantsTranslate", record.name) }}
                      </span>
                      <span v-else-if="column.dataIndex === 'value'">{{
                        translateLabel("constantsTranslate", record.value)
                      }}</span>
                      <span v-else-if="column.dataIndex === 'type'">{{
                        translateLabel("constantsTranslate", record.type)
                      }}</span>
                    </template>
                  </a-table>
                </div>
              </template>
              <template v-else-if="column.title === localizedTitles.source">
                <a-list
                  size="middle"
                  bordered
                  :data-source="InfoCommentsData.data.Source.data"
                  style="max-width: 500px; max-height: 300px; overflow-y: auto"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <div class="flex-container">
                        <span
                          style="color: black; font-weight: bold; width: 35%"
                          >{{
                            t(`constantsTranslate.${item.name}`, `${item.name}`)
                          }}
                          -</span
                        >
                        <span style="width: 65%">{{
                          t(`constantsTranslate.${item.value}`, `${item.value}`)
                        }}</span>
                      </div>
                    </a-list-item>
                  </template>
                  <template #header>
                    <div style="color: black; font-weight: bold">
                      {{
                        t(
                          `constantsTranslate.${InfoCommentsData.data.Source.head}`,
                          `${InfoCommentsData.data.Source.head}`
                        )
                      }}
                    </div>
                  </template>
                </a-list>
              </template>
            </template>
            <InfoCircleOutlined />
          </a-popover>
        </span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.title === localizedTitles.eventDetails">
          <a-typography-text
            :style="{ width: '150px' }"
            :ellipsis="{ tooltip: record[column.dataIndex] }"
            :content="record[column.dataIndex]"
          />
        </template>
        <template v-else-if="column.title === localizedTitles.continuousRunId">
          {{ record?.meta?.cr_id }}
        </template>
        <template v-else>
          {{ record[column.dataIndex] }}
        </template>
      </template>
      <template #emptyText>
        <div class="no-data-available">
          {{ translateLabel("dataPage", "No data available") }}
        </div>
      </template>
    </a-table>
    <a-row class="light-gray-bg py-2">
      <a-col :span="24" class="text-right">
        <a-pagination
          v-model:current="currentPage"
          :total="paginationDetails"
          @change="handlePageChange"
          :show-size-changer="false"
          :defaultPageSize="10"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import infoComments from "@/common/constants.json";
import ApcSearchComponent from "../components/ApcSearchComponent.vue";
import { onMounted, ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import apcAuditJson from "../config/apcAuditPageJob.json";
import {
  formatISODate,
  generateExportTypeParams,
  translateLabel,
} from "@/common/utils";
import exportFile from "../../../services/exportFile";
import { apcApiServices } from "../services/apcService";
const { t, locale, messages: localeMessages } = useI18n();
const { auditsPageHeaders, searchKeyMapping } = apcAuditJson;
interface InfoComments {
  [key: string]: any;
}
import { Typography } from "ant-design-vue";

const { Text } = Typography;
const apcService = new apcApiServices();
const tableData = ref([]);
const storedResponse = ref();
const isLoading = ref<any>(null);
const InfoCommentsData: InfoComments = infoComments;
const exportDataType = ref<string>("");
const currentPage = ref<number>(1);
const isExportTypeLoading = ref(false);
const paginationDetails = ref(10);
const shouldReset = ref(false);

const localizedTitles = computed(() => ({
  event: "Event",
  deviceName: "Instrument Name",
  sampleId: "Sample ID",
  user: "User",
  sampleType: "Sample Type",
  source: "Source",
  continuousRunId: "Continuous Run ID",
  timestamp: "Timestamp",
  eventDetails: "Event Details",
}));
const columns = computed(() => [
  { title: localizedTitles.value.event, dataIndex: "event_type" },
  {
    title: localizedTitles.value.deviceName,
    dataIndex: "asset_name",
  },
  { title: localizedTitles.value.user, dataIndex: "operator" },
  { title: localizedTitles.value.sampleId, dataIndex: "task_result_id" },
  {
    title: localizedTitles.value.continuousRunId,
    dataIndex: "meta.cr_id",
  },
  { title: localizedTitles.value.source, dataIndex: "source" },
  {
    title: localizedTitles.value.timestamp,
    dataIndex: "operation_timestamp",
  },
  { title: localizedTitles.value.eventDetails, dataIndex: "comments" },
]);

const dropdownOptions = ref(apcAuditJson.dropdownOptions);
const auditDropdownOptions = computed(() => {
  return dropdownOptions.value.map((eachColumn: any) => {
    return {
      ...eachColumn,
      label: eachColumn.label,
    };
  });
});

// const InfoCommentsData = computed(() => {
//   return infoComments;
// });

let selectedKey: any | null = null;
let selectedValue: any | null = null;

const processFetchData = (response: any) => {
  storedResponse.value = response;
  let { data = [], pagination = {} } = response || {};
  paginationDetails.value = pagination.totalCount;

  // const userTimeZone = localStorage.getItem("timeZone");
  data = data.map((item: any) => {
    let translateEventType = { ...item };
    columns.value.forEach((column: any) => {
      // console.log("column.dataIndex", column.dataIndex);
      if (column.dataIndex === "event_type") {
        translateEventType[column.dataIndex] = t(
          `auditPage.${translateEventType[column.dataIndex]}`,
          `${translateEventType[column.dataIndex]}`
        );
      }
    });
    return translateEventType;
  });

  tableData.value = data;
};

const findTranslationKey = (translatedValue: string) => {
  const currentLocale = locale.value;
  let namespace = "auditPage";
  const translations = (localeMessages.value as Record<string, any>)[
    currentLocale
  ]?.[namespace];

  if (translations) {
    const foundKey = Object.keys(translations).find(
      (key) => translations[key] === translatedValue
    );
    return foundKey ? `${foundKey}` : translatedValue;
  }
  return translatedValue;
};

const performSearch = async (values: {
  selectedKey: string;
  searchQuery: string;
}) => {
  isLoading.value = true;
  selectedKey = values.selectedKey;
  selectedValue = values.searchQuery;
  if (selectedKey === "event_type") {
    console.log(":::::event_type---selectedValue", selectedValue);
    selectedValue = findTranslationKey(selectedValue);
    console.log(":::::event_type---selectedValue after ", selectedValue);
  }
  currentPage.value = 1;
  let params = {
    to_show: true,
    orderBy: "id",
    limit: 10,
    page: currentPage.value,
  };
  try {
    if (!["task_id", "meta.cr_id"].includes(selectedKey)) {
      params.strict = "no";
    }
    if (selectedKey && selectedValue) {
      params[selectedKey] = selectedValue.trim();
    }
    const response = await apcService.getAuditEvents(params);
    processFetchData(response);
  } catch (error: any) {
    console.error(
      translateLabel("auditPage", "Error performing search") + ":",
      error.message
    );
  } finally {
    isLoading.value = false;
  }
};

const exportDataByType = async (dataType: string) => {
  isExportTypeLoading.value = true;
  const limit = 2000;
  const params = {
    to_show: true,
    orderBy: "id",
    locale: locale.value,
    limit,
  };
  if (!["task_id", "meta.cr_id"].includes(selectedKey)) {
    params.strict = "no";
  }
  if (selectedKey && selectedValue) {
    params[selectedKey] = selectedValue;
  }
  exportDataType.value = dataType;
  const exportParams = generateExportTypeParams(
    selectedKey,
    selectedValue,
    dataType,
    auditsPageHeaders
  );
  exportParams.fileName = "Audit";
  const auditParams = { ...params, ...exportParams };
  console.log("exportParams", auditParams);
  try {
    const data = await apcService.getAuditEvents(auditParams);
    exportFile(data, "audit_page", dataType);
  } catch (error) {
    console.error(
      translateLabel("auditPage", "Error exporting data") + ":",
      error
    );
  } finally {
    isLoading.value = false;
    isExportTypeLoading.value = false;
    if (paginationDetails.value > limit) {
      const messageText = t("auditPage.ExportMessage", {
        total: paginationDetails.value,
        limit: limit,
      });

      message.info(messageText);
    }
  }
};

watch(locale, () => {
  // Re-fetch data or process it again when the language changes.
  processFetchData(storedResponse.value);
});

const handlePageChange = async (page: number) => {
  isLoading.value = true;
  currentPage.value = page;
  let params = {
    to_show: true,
    orderBy: "id",
    limit: 10,
    page: page,
  };
  try {
    if (!["task_id", "meta.cr_id"].includes(selectedKey)) {
      params.strict = "no";
    }
    if (selectedKey && selectedValue) {
      params[selectedKey] = selectedValue;
    }
    const response = await apcService.getAuditEvents(params);

    processFetchData(response);
  } catch (error: any) {
    console.error(
      translateLabel("auditPage", "Error handling page change") + ":",
      error.message
    );
  } finally {
    isLoading.value = false;
  }
};

const refreshAuditPage = async () => {
  currentPage.value = 1;
  shouldReset.value = true;

  fetchData(currentPage.value);
};

const fetchData = async (page: number) => {
  isLoading.value = true;
  const params = {
    to_show: true,
    orderBy: "id",
    limit: 10,
    page: page,
  };
  try {
    if (selectedKey && selectedValue) {
      params[selectedKey] = selectedValue;
    }
    const response = await apcService.getAuditEvents(params);
    processFetchData(response);
    shouldReset.value = false;
  } catch (error) {
    console.error(
      translateLabel("auditPage", "Error fetching data") + ":",
      error
    );
  } finally {
    isLoading.value = false;
    shouldReset.value = false;
  }
};

const resetSearchComponent = async () => {
  selectedKey = null;
  selectedValue = null;
  currentPage.value = 1;
  isLoading.value = true;
  const params = {
    to_show: true,
    orderBy: "id",
    limit: 10,
    page: currentPage.value,
  };
  try {
    const response = await apcService.getAuditEvents(params);
    processFetchData(response);
  } catch (error: any) {
    console.error(
      translateLabel("auditPage", "Error resetting search") + ":",
      error
    );
  } finally {
    isLoading.value = false;
  }
};

function convertTimestamps(
  sample: any,
  timeZone: any,
  ...timeProperties: string[]
) {
  timeProperties.forEach((prop) => {
    try {
      if (sample[prop]) {
        let timezone = sample?.meta?.site_info?.site_timezone || "UTC";
        sample[prop] = formatISODate(sample[prop], timezone);
      }
    } catch (error) {
      console.error(`Error converting timestamp for property ${prop}:`, error);
    }
  });
}
const getTranslatedInfoData = (data: any) => {
  return translateLabel("constantsTranslate", data);
};

onMounted(async () => {
  fetchData(currentPage.value);
});
</script>

<style scoped>
.popover-content {
  color: black;
  max-width: 350px;
}
.scrollable-content {
  width: 500px;
  height: 300px;
}
.search-component {
  margin-bottom: 20px;
}
.data-table {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}
</style>
