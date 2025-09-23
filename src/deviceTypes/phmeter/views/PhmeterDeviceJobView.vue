<template>
  <div class="device-info">
    <a-row :gutter="16">
      <a-col :span="18">
        <a-spin :spinning="isDeviceDetailsLoading">
          <div class="white-bg">
            <div>
              <div class="statisticsLable">
                <div>
                  <span class="headerName">
                    {{ translateLabel("devicePage", "Statistics") }}
                    <ReloadOutlined
                      class="refreshIcon"
                      @click="refreshStatistics"
                    />
                  </span>
                </div>
                <div v-if="lastUpdateMessage">
                  <span class="headerUpdateName"
                    >{{ t("commonData.Updated", "Updated") }}
                    {{ lastUpdateMessage }}</span
                  >
                </div>
              </div>
            </div>
            <div style="width: auto">
              <a-row>
                <a-col :span="4">
                  <div class="device-image">
                    <img
                      class="ImageStatistics"
                      :src="assetImage"
                      alt="No Instrument"
                      v-if="assetImage"
                    />

                    <div class="deviceName">{{ assetName }}</div>
                  </div>
                </a-col>
                <a-col :span="20">
                  <div class="statistics">
                    <div class="StatisticsTable">
                      <a-row>
                        <a-col :span="15">
                          <div
                            class="sampleStatsContainer deviceStatsRow column-55"
                          >
                            <span class="headerName">{{
                              translateLabel("devicePage", "Instrument Details")
                            }}</span>
                            <div
                              v-for="column in statisticsColumns"
                              :key="column.dataIndex"
                            >
                              <div
                                class="sampleStatsPair"
                                v-if="column.dataIndex !== 'id'"
                              >
                                <div class="sampleStatsKey">
                                  {{
                                    t(
                                      `devicePage.${column.title}`,
                                      `${column.title}`
                                    )
                                  }}
                                  <a-popover
                                    v-if="column.title"
                                    trigger="hover"
                                    placement="rightTop"
                                    :overlayStyle="{ width: '300px' }"
                                  >
                                    <template #content>
                                      {{
                                        getCommentInfo(
                                          "statistics",
                                          column.title
                                        )
                                      }}
                                    </template>
                                    <InfoCircleOutlined />
                                  </a-popover>
                                </div>
                                <div class="sampleStatsValue">
                                  {{ getSampleStatsData(column.dataIndex) }}
                                </div>
                              </div>
                              <div
                                class="sampleStatsPair"
                                v-if="column.dataIndex === 'id'"
                              >
                                <div class="sampleStatsKey">
                                  {{
                                    t(
                                      `devicePage.${column.title}`,
                                      `${column.title}`
                                    )
                                  }}
                                  <a-popover
                                    v-if="column.title"
                                    trigger="hover"
                                    placement="rightTop"
                                    :overlayStyle="{ width: '300px' }"
                                  >
                                    <template #content>
                                      {{
                                        getCommentInfo(
                                          "statistics",
                                          column.title
                                        )
                                      }}
                                    </template>
                                    <InfoCircleOutlined />
                                  </a-popover>
                                </div>
                                <div class="sampleStatsValue">
                                  {{ mostRecentSample }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </a-col>
                        <a-col :span="1">
                          <div class="verical-divider"></div>
                        </a-col>
                        <a-col :span="8">
                          <div class="deviceStatsRow column-35">
                            <span class="headerName">{{
                              translateLabel("devicePage", "All Instruments")
                            }}</span>
                            <div
                              v-for="column in allInstrumentsColumns"
                              :key="column.dataIndex"
                            >
                              <div class="sampleStatsPair">
                                <div class="sampleStatsKey">
                                  {{
                                    t(
                                      `devicePage.${column.title}`,
                                      `${column.title}`
                                    )
                                  }}
                                  <a-popover
                                    v-if="column.title"
                                    trigger="hover"
                                    placement="rightTop"
                                    :overlayStyle="{ width: '300px' }"
                                  >
                                    <template #content>
                                      {{
                                        getCommentInfo(
                                          "statistics",
                                          column.title
                                        )
                                      }}
                                    </template>

                                    <InfoCircleOutlined />
                                  </a-popover>
                                </div>
                                <div class="sampleStatsValue">
                                  <!-- {{ getAssetStatsData(column.dataIndex) }} -->
                                  {{
                                    deviceStats[column.dataIndex]
                                      ? deviceStats[column.dataIndex]
                                      : ""
                                  }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </a-col>
                      </a-row>
                    </div>
                  </div>
                </a-col>
              </a-row>
            </div>
          </div>
        </a-spin>
      </a-col>

      <a-col :span="6">
        <div class="white-bg">
          <div class="resources">
            <div class="statisticsLable">
              <h2 class="headerName">
                {{ translateLabel("devicePage", "Resources") }}
                <a-popover trigger="hover" placement="rightTop">
                  <template #content>
                    <a-list
                      size="middle"
                      bordered
                      :data-source="infoCommentsPop.instrument.resources.data"
                      style="
                        max-width: 500px;
                        max-height: 300px;
                        overflow-y: auto;
                      "
                    >
                      <template #renderItem="{ item }">
                        <a-list-item>
                          <div class="flex-container">
                            <span
                              style="
                                color: black;
                                font-weight: bold;
                                width: 35%;
                              "
                              >{{
                                t(
                                  `constantsTranslate['${item.name}']`,
                                  `${item.name}`
                                )
                              }}
                              -
                            </span>
                            <span style="width: 65%">{{
                              t(
                                `constantsTranslate['${item.value}']`,
                                `${item.value}`
                              )
                            }}</span>
                          </div>
                        </a-list-item>
                      </template>
                      <template #header>
                        <div style="color: black; font-weight: bold">
                          {{
                            t(
                              `constantsTranslate['${infoCommentsPop.instrument.resources.head}']`,
                              `${infoCommentsPop.instrument.resources.head}`
                            )
                          }}
                        </div>
                      </template>
                    </a-list>
                  </template>

                  <InfoCircleOutlined :style="{ fontSize: '14px' }" />
                </a-popover>
              </h2>
            </div>

            <ul class="resources-items">
              <li v-for="column in reasourceColumns" :key="column.dataIndex">
                <a v-if="column.link" :href="column.link" target="_blank">
                  {{ column.title }}
                </a>
                <a v-else>
                  {{ column.title }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>

  <div class="instrumentPage">
    <div class="instrumentLable">
      <span class="headerName">{{
        translateLabel("devicePage", "Instruments")
      }}</span>
    </div>
    <div class="searchBar">
      <SearchComponent
        class="measure-search"
        :dropdownOptions="searchDropdownOptions"
        @search="performSearch"
        @reset="shouldResetSearchComponent"
        @exportType="exportDataByType"
        :isExportTypeLoading="isExportTypeLoading"
        style="margin-bottom: 20px"
      />
    </div>
    <div class="custom-table-scroll">
      <a-table
        :columns="filteredColumns"
        :data-source="tableData"
        :pagination="false"
        :locale="customLocale"
        class="custom-table"
        :loading="isLoading"
        size="middle"
        rowKey="id"
        :getPopupContainer="
          (triggerNode) => triggerNode.closest('.ant-table-container')
        "
        :customRow="handleRowClick"
        :rowClassName="rowClassName"
        @change="handleTableChange"
      >
        <template #headerCell="{ column }">
          <span
            >{{ t(`devicePage.${column.title}`, `${column.title}`) }}
            <a-popover trigger="hover" placement="topLeft">
              <template #content>
                <template
                  v-if="
                    typeof infoCommentsPop.instrument[column.title] === 'string'
                  "
                >
                  <div style="color: black; max-width: 350px">
                    {{
                      t(
                        `constantsTranslate['${
                          infoCommentsPop.instrument[column.title]
                        }']`,
                        `${infoCommentsPop.instrument[column.title]}`
                      )
                    }}
                  </div>
                </template>
                <template
                  v-else-if="infoCommentsPop.instrument[column.title]?.data"
                >
                  <a-list
                    size="middle"
                    bordered
                    :data-source="infoCommentsPop.instrument[column.title].data"
                    style="
                      max-width: 500px;
                      max-height: 300px;
                      overflow-y: auto;
                    "
                  >
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <div class="flex-container">
                          <span
                            style="color: black; font-weight: bold; width: 35%"
                          >
                            {{
                              t(
                                `constantsTranslate['${item.name}']`,
                                `${item.name}`
                              )
                            }}
                            -
                          </span>
                          <span style="width: 65%">{{
                            t(
                              `constantsTranslate['${item.value}']`,
                              `${item.value}`
                            )
                          }}</span>
                        </div>
                      </a-list-item>
                    </template>
                    <template #header>
                      <div style="color: black; font-weight: bold">
                        {{
                          t(
                            `constantsTranslate['${
                              infoCommentsPop.instrument[column.title].head
                            }']`,
                            `${infoCommentsPop.instrument[column.title].head}`
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
          <template v-if="column.dataIndex === 'action'">
            <a-switch
              :checked="record.is_active"
              @change="handleSwitchToggle(record, $event)"
              :disabled="
                record.isSampling ||
                (record.connection_status.toLowerCase() === 'disconnected' &&
                  !record.is_active)
              "
              :checked-children="translateLabel('devicePage', 'Active')"
              :un-checked-children="translateLabel('devicePage', 'Inactive')"
              class="custom-switch"
            />
          </template>
          <template v-if="column.dataIndex === 'edit'">
            <a-tooltip>
              <template #title>
                {{
                  record.connection_status !== "running" &&
                  record.connection_status !== "disconnected" &&
                  record.is_active &&
                  !record.isTaskInProgress
                    ? `${t("commonData.Edit Instrument", "Edit Instrument")}`
                    : `${t("commonData.Cannot Edit", "Cannot Edit")}`
                }}
              </template>
              <EditOutlined
                @click="
                  () => {
                    if (
                      record.connection_status === 'connected' &&
                      record.is_active &&
                      !record.isSampling
                    ) {
                      handleEditRecord(record);
                    }
                  }
                "
                :style="{
                  cursor:
                    record.isSampling ||
                    record.connection_status === 'disconnected' ||
                    (record.connection_status === 'connected' &&
                      !record.is_active)
                      ? 'not-allowed'
                      : 'pointer',
                  color:
                    record.isSampling ||
                    record.connection_status === 'disconnected' ||
                    (record.connection_status === 'connected' &&
                      !record.is_active)
                      ? '#D8D8D8'
                      : 'inherit',
                }"
              />
            </a-tooltip>
          </template>

          <template v-if="column.dataIndex === 'connection_status'">
            <a-popover
              v-if="column.title"
              trigger="hover"
              placement="rightTop"
              :overlayStyle="{ maxWidth: '350px' }"
            >
              <!-- Status Display with Ellipsis -->
              <span
                :class="
                  getStatusClass(
                    record,
                    record.isSampling,
                    record.isTaskInProgress,
                    record.isAssetTimeIsMatching
                  )
                "
                class="ellipsis-text"
              >
                {{
                  getStatusDisplayText(
                    record,
                    record.isSampling,
                    record.isTaskInProgress,
                    record.isAssetTimeIsMatching
                  )
                }}
              </span>
              <!-- Popover Content -->
              <template #content>
                <div>
                  <!-- Main Status -->
                  <div style="font-weight: bold; margin-bottom: 5px">
                    {{
                      getStatusDisplayText(
                        record,
                        record.isSampling,
                        record.isTaskInProgress,
                        record.isAssetTimeIsMatching
                      )
                    }}
                  </div>
                  <!-- Additional Device Details -->
                  <div>
                    {{
                      getDevicePopoverStatus(
                        record,
                        record.isSampling,
                        record.isTaskInProgress
                      )
                    }}
                  </div>
                </div>
              </template>
            </a-popover>
          </template>

          <template v-if="column.dataIndex === 'status'">
            <div>
              {{ record.status === "on-boarded" ? "Onboarded" : record.status }}
            </div>
          </template>

          <template v-if="column.dataIndex === 'create_timestamp'">
            <a-tooltip
              :title="record.create_timestamp"
              v-if="record.create_timestamp.length > 35"
            >
              <span class="ellipsis-text">{{
                record.create_timestamp.slice(0, 35) + "..."
              }}</span>
            </a-tooltip>
            <span v-else>{{ record.create_timestamp }}</span>
          </template>
        </template>
        <template #emptyText>
          <div class="no-data-available">
            {{ translateLabel("dataPage", "No data available") }}
          </div>
        </template>
      </a-table>
    </div>
    <a-pagination
      style="text-align: right; margin-top: 15px"
      v-model:current="currentPage"
      :total="paginationTotalCount"
      @change="handlePageChange"
      :show-size-changer="false"
      :defaultPageSize="10"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  reactive,
  h,
  // nextTick,
} from "vue";
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import deviceMockData from "../../../mockdata/deviceDetailsData.json";
import { fetchDataFromAPI, getPictureById } from "../../../services/apiService";
import { SocketService } from "../../../services/socketService";
import { useStore } from "vuex";
import SearchComponent from "../components/PhmeterSearchComponent.vue";
import { environment } from "@/environment/environment";
import {
  formatMeasureTime,
  processHeartbeat,
  compareAssetTime,
} from "@/common/utils";
import { InfoCircleOutlined, EditOutlined } from "@ant-design/icons-vue";
import infoComments from "@/common/constants.json";
import router from "@/router";
import { message, Modal } from "ant-design-vue";
import { apcApiServices } from "../services/apcService";
import { translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";

export default defineComponent({
  components: {
    InfoCircleOutlined,
    ReloadOutlined,
    SearchComponent,
    EditOutlined,
  },
  setup() {
    const state = reactive({
      checked1: true,
      checked2: false,
    });
    interface TaskDetails {
      imagePath?: string;
      altText?: string;
      link?: string;
    }

    interface Column {
      title: string;
      dataIndex: string;
      isVisible?: boolean;
    }

    interface Task {
      id: number;
      name: string;
      type: string;
      title?: string;
      columns?: Column[];
      details?: TaskDetails;
      table?: {
        api: {
          url: string;
          authToken: string;
          clientId: string;
        };
        defaultOrderBy?: string;
        defaultLimit?: number;
        defaultStrict?: string;
        hideCheckBox?: boolean;
      };
      pagination?: {
        totalCount?: number;
      };
      search?: {
        dropdownOptions: any[];
      };
      api?: {
        url: string;
        authToken: string;
        clientId: string;
      };
    }

    interface DeviceView {
      name: string;
      tasks: Task[];
    }
    interface InfoComments {
      [key: string]: any;
    }
    const apcService = new apcApiServices();
    let statisticsTask: Task | undefined;
    let deviceStatisticsTask: Task | undefined;
    const { t, locale } = useI18n();
    const infoCommentsPop: InfoComments = infoComments;
    const isLoading = ref(false);
    const selectedDevice = ref(null);
    const selectedAssetId = ref(null);
    const isExportTypeLoading = ref(false);
    const isActiveFilter = ref<any>(null);
    const mostRecentSample = ref("");
    const userRole = ref("");
    // Track subscribed rooms
    const subscribedDeviceIds = ref<Set<string>>(new Set());

    const deviceView = ref<DeviceView>({
      name: deviceMockData.name,
      tasks: deviceMockData.jobs[0].tasks,
    });

    let assetImage = ref("");

    let assetName = ref("");

    const statisticsColumns = computed(() => [
      {
        title: "Most Recent Sample",
        dataIndex: "id",
      },
      {
        title: "Samples This Week",
        dataIndex: "last_7_days_count",
      },
      {
        title: "Samples This Month",
        dataIndex: "last_1_month_count",
      },
      {
        title: "All Samples Taken",
        dataIndex: "total_count",
      },
    ]);

    const allInstrumentsColumns = computed(() => [
      {
        title: "Total Instruments",
        dataIndex: "total",
      },
      {
        title: "Ready For Use",
        dataIndex: "ready",
      },
      {
        title: "In-Use",
        dataIndex: "inuse",
      },
      {
        title: "Disconnected",
        dataIndex: "disconnected",
      },
    ]);

    const reasourceColumns = computed(() => [
      {
        title: t("devicePage.Support Portal", "Support Portal"),
        dataIndex: "id",
        link: "https://phizzle.atlassian.net/servicedesk/customer/portal/15",
      },
      {
        title: t("devicePage.Documentation", "Documentation"),
        dataIndex: "deviceId",
        link: "https://phizzle.atlassian.net/wiki/spaces/PDAS/overview",
      },
      {
        title: t("devicePage.Tutorials", "Tutorials"),
        dataIndex: "deviceName",
      },
      {
        title: t("devicePage.Release Notes", "Release Notes"),
        dataIndex: "event",
      },
    ]);
    const searchDropdownOptions = computed(() => [
      {
        label: "Instrument Name",
        value: "name",
      },
      {
        label: "Site Name",
        value: "asset__site___name",
      },
      {
        label: "Serial #",
        value: "asset_id",
      },
    ]);

    // const localizedTitles = computed(() => ({
    //   sampleStatus: t("devicePage.Sample Status", "Sample Status"),
    //   deviceName: t("devicePage.Device Name", "Device Name"),
    //   siteName: t("devicePage.Site Name", "Site Name"),
    //   // user: t("devicePage.User", "User"),
    //   serialNumber: t("devicePage.Serial Number", "Serial Number"),
    //   AdminStatus: t("devicePage.Admin Status", "Admin Status"),
    //   lastHeartbeat: t("devicePage.Last Heartbeat", "Last Heartbeat"),
    //   action: t("devicePage.Action", "Action"),
    //   edit: t("devicePage.Edit", "Edit"),
    // }));

    //const selectedStatusFilter = ref<string[]>([]);
    //const selectedActionFilter = ref<string[]>([]);
    const tableColumns = computed(() => [
      {
        title: "Status",
        dataIndex: "connection_status",
        // filters: [
        //   {
        //     text: translateLabel("devicePage", "Ready For Use"),
        //     value: "connected",
        //   },
        //   {
        //     text: translateLabel("devicePage", "Disconnected"),
        //     value: "disconnected",
        //   },
        //   {
        //     text: translateLabel("devicePage", "Inactivated"),
        //     value: "disabled",
        //     // value should be the params value for api call.
        //   },
        //   {
        //     text: translateLabel("devicePage", "In-Use"),
        //     value: "in-Use",
        //   },
        // ],
        // onFilter: (value: string, record: any) => {
        //   //console.log("record", record);
        //   return record.connection_status === value;
        // },
        // filtered: selectedStatusFilter.value.length > 0, // column selected
        // filteredValue: selectedStatusFilter.value,
        //filterMultiple: false,
        width: "150px",
        align: "center",
      },
      {
        title: "Instrument Name",
        dataIndex: "name",
      },
      {
        title: "Site Name",
        dataIndex: "asset__site___name",
      },
      {
        title: "Serial #",
        dataIndex: "asset_id",
      },
      {
        title: "Last Heartbeat",
        dataIndex: "create_timestamp",
      },
      {
        title: "Action",
        dataIndex: "action",
        filters: [
          { text: translateLabel("devicePage", "Active"), value: "active" },
          { text: translateLabel("devicePage", "Inactive"), value: "inactive" },
        ],
        // onFilter: (value: string, record: any) => record.action === value,
        // filtered: selectedActionFilter.value.length > 0, // Highlights filter if selected
        //filteredValue: selectedActionFilter.value, // Reflects the selected value
        filterMultiple: false,
        width: "150px",
        align: "center",
      },

      {
        title: "Edit",
        dataIndex: "edit",
        align: "center",
      },
    ]);

    const selectedTableRecord = ref<Record<string, any>>({});
    const selectedDeviceStatistics = ref<Record<string, any>>({});
    const store = useStore();
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);
    const isSampleDataLoaded = ref(false);
    const isDeviceDataLoaded = ref(false);
    const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");
    const isRenderResources = computed(() => !!renderResources.value);
    const isRenderDeviceImage = computed(() => !!renderDeviceImage.value);
    const tableData = ref<any[]>([]);
    const isDeviceDetailsLoading = ref(false);
    const paginationTotalCount = ref(10);
    const currentPage = ref(1);
    let searchKey: any;
    let searchTerm: any;
    let exportDataType: any;
    const lastUpdateTime = ref<any | null>(null);
    let updateInterval: any | null = null;
    let limitCount = 2000;
    const deviceStats = ref({
      disconnected: "0",
      inuse: "0",
      ready: "0",
      total: "0",
    });
    const hideCheckBox = ref(false);
    socketService.connectSocket();
    const searchKeyMapping = ref<{ [key: string]: string }>({});

    const decodedTokenString = localStorage.getItem("DecodedToken");
    if (decodedTokenString) {
      const decodedToken = JSON.parse(decodedTokenString);
      userRole.value = decodedToken.role;
      console.log("Customer ID::::::::", userRole.value);
    }

    const filteredColumns = computed(() => {
      if (userRole.value !== "administrator") {
        return tableColumns.value.filter(
          (column: { dataIndex: string }) =>
            column.dataIndex !== "action" && column.dataIndex !== "edit"
        );
      }
      return tableColumns.value;
    });

    const customLocale = computed(() => ({
      filterConfirm: t("devicePage.Ok", "OK"),
      filterReset: t("devicePage.Reset", "Reset"),
    }));

    // const handleSelectedStatusFilter = async (
    //   pagination: any,
    //   sorter: any,
    //   filters: any
    // ) => {
    //   console.log("is device ", pagination, sorter, filters);
    //   const selectedFilter = filters["connection_status"] || [];
    //   searchKey = "connection_status";
    //   searchTerm = selectedFilter[0];
    //   selectedStatusFilter.value = selectedFilter;
    //   currentPage.value = 1;

    //   const tableTask = deviceView.value.tasks.find(
    //     (task) => task.type === "renderTable"
    //   );
    //   if (tableTask) {
    //     await fetchData(tableTask);
    //   }
    // };

    const handleSelectedActionFilter = async (
      pagination: any,
      sorters: any,
      filters: any
    ) => {
      console.log("Action Filters Applied:", pagination, sorters, filters);

      const selectedFilter = filters.action?.[0]; // Get the selected filter value
      if (selectedFilter === "active") {
        isActiveFilter.value = true;
      } else if (selectedFilter === "inactive") {
        isActiveFilter.value = false;
      } else {
        isActiveFilter.value = null;
      }

      const tableTask = deviceView.value.tasks.find(
        (task) => task.type === "renderTable"
      );
      console.log("::::::tableTask", tableTask);
      currentPage.value = 1;
      if (tableTask) {
        await fetchData(tableTask);
      }
    };

    const handleTableChange = async (
      pagination: any,
      filters: any,
      sorters: any
    ) => {
      // await handleSelectedStatusFilter(pagination, sorters, filters);
      //console.log("console table data 1", tableData.value);
      handleSelectedActionFilter(pagination, sorters, filters);
      //console.log("console table data 2", tableData.value);
    };

    const handleRowClick = (record: any) => {
      return {
        onClick: async (event: any) => {
          console.log("click row", record, event);
          selectedDevice.value = record?.id;
          selectedAssetId.value = record?.asset_id;
          assetName.value = record?.name;
          fetchPicture(record.picture_id);
          await fetchSampleStatisticsData(statisticsTask!);
        },
      };
    };

    type DeviceState =
      | "connected"
      | "Inactivated"
      | "disconnected"
      | "Disabled"
      | "New"
      | "Ready for Use"
      | "running"
      | "default"
      | "notReadyForUse";

    const getDevicePopoverStatus = (
      record: any,
      isSampling: boolean,
      isTaskInProgress: boolean
    ) => {
      const statusMessages: { [key in DeviceState]: string } = {
        connected: "Instrument is ready to start measurements",
        Inactivated: "Instrument inactivated when it is in connected State",
        disconnected: "Instrument is in disconnected State",
        Disabled: "Instrument inactivated when it is in disconnected State",
        New: "Instrument is ready to get onboarded",
        "Ready for Use": "Instrument is ready to start measurements",
        running: "Instrument is executing measurements",
        notReadyForUse: "Instrument is not available for measurement",
        default: "Unknown State",
      };
      const statusType = () => {
        if (record.connection_status === "disconnected" && !record.is_active) {
          return "Disabled";
        } else if (
          record.connection_status === "connected" &&
          !record.is_active
        ) {
          return "Inactivated";
        } else if (
          record.connection_status === "connected" &&
          (isSampling || isTaskInProgress)
        ) {
          return "running";
        } else if (
          record.connection_status === "connected" &&
          record.isAssetTimeIsMatching === false
        ) {
          return "notReadyForUse";
        } else {
          return record.connection_status;
        }
      };

      const devicePop: DeviceState = statusType();
      return (
        t(`devicePage.${statusMessages[devicePop]}`) ||
        statusMessages["default"]
      );
    };

    const rowClassName = (record: any) => {
      selectedDevice.value == record.id ? "selected-row" : "";
      selectedAssetId.value == record.asset_id ? "selected-row" : "";
      return;
    };

    let deviceDetailsPageHeader: any = [];

    deviceDetailsPageHeader = tableColumns.value
      .filter(
        (column) => column.title !== "Edit" && column.title !== "Last Heartbeat"
      )
      .map((column) => {
        if (column.title === "Action" && userRole.value !== "administrator") {
          return null;
        }

        return {
          field: column.dataIndex,
          header: column.title,
        };
      })
      .filter(Boolean);

    let tableHeaders = JSON.stringify(deviceDetailsPageHeader);
    console.log("deviceDataHeader:::::::", deviceDetailsPageHeader);
    console.log(":::::::userHeaderRole", userRole.value);

    const exportDataByType = async (dataType: any) => {
      isExportTypeLoading.value = true;
      exportDataType = dataType;
      console.log("Export type value:", exportDataType);
      const tableTask = deviceView.value.tasks.find(
        (task: Task) => task.type === "renderTable"
      );
      if (tableTask) {
        await fetchData(tableTask, exportDataType, "instrument_page");
        isExportTypeLoading.value = false;

        if (paginationTotalCount.value > limitCount) {
          const messageText = t("devicePage.ExportMessage", {
            total: paginationTotalCount.value,
            limit: limitCount,
          });

          message.info(messageText);
        }
      }
    };

    const getStatusClass = (
      record: any,
      isSampling: boolean,
      isTaskInProgress: boolean,
      isAssetTimeIsMatching: boolean
    ) => {
      // console.log(
      //   "::::::;Connection_status:::",
      //   record,
      //   "isSampling:",
      //   isSampling,
      //   isTaskInProgress
      // );

      if (!record || !record.connection_status) {
        return "";
      }
      if (
        record.connection_status.toLowerCase() === "Inactivated" &&
        record.is_active === false &&
        record.action.toLowerCase() === "Deactive"
      ) {
        return "status-idle-inactivated";
      }

      if (record.connection_status === "disconnected" && !record.is_active) {
        return "status-disable";
      }
      if (
        record.connection_status === "connected" &&
        isAssetTimeIsMatching === false &&
        record.is_active === true
      ) {
        return "not-ready";
      }
      if (
        (record.connection_status === "running" ||
          record.connection_status === "connected") &&
        (isSampling === true || isTaskInProgress === true)
      ) {
        return "status-running";
      }
      if (record.connection_status.toLowerCase() === "connected") {
        return "status-connected";
      }
      if (record.connection_status.toLowerCase() === "disconnected") {
        return "status-disconnected";
      }

      if (
        record.connection_status.toLowerCase() === "idle" &&
        record.is_active &&
        record.isSampling === false
      ) {
        return "status-idle";
      }

      return "";
    };

    const getStatusDisplayText = (
      record: any,
      isSampling: boolean,
      isTaskInProgress: boolean,
      isAssetTimeIsMatching: boolean
    ) => {
      // console.log(":::::RecorDadata", record);
      if (
        record.connection_status === "connected" &&
        record.is_active === true &&
        isSampling === false &&
        isTaskInProgress === false &&
        isAssetTimeIsMatching === true
      ) {
        return translateLabel("devicePage", "Ready for Use");
      } else if (
        (record.connection_status === "running" ||
          record.connection_status === "connected") &&
        (isSampling === true || isTaskInProgress === true)
      ) {
        return translateLabel("devicePage", "In-Use");
      } else if (
        record.connection_status === "idle" &&
        record.is_active &&
        !isSampling
      ) {
        return "Ready for Use";
      } else if (
        (record.connection_status.toLowerCase() === "connected" ||
          record.connection_status.toLowerCase() === "inactivated") &&
        !record.is_active &&
        (isAssetTimeIsMatching === false || isAssetTimeIsMatching === true)
      ) {
        return translateLabel("devicePage", "Inactivated");
      } else if (
        (record.connection_status === "disconnected" ||
          record.connection_status.toLowerCase() === "inactivated") &&
        !record.is_active &&
        (isAssetTimeIsMatching === false || isAssetTimeIsMatching === true)
      ) {
        return translateLabel("devicePage", "Inactivated");
      } else if (
        record.connection_status === "disconnected" &&
        record.is_active
      ) {
        return translateLabel("devicePage", "Disconnected");
      } else if (
        record.connection_status === "connected" &&
        (isSampling === true ||
          isTaskInProgress === true ||
          isAssetTimeIsMatching === false)
      ) {
        return translateLabel("devicePage", "Not Ready for Use");
      } else {
        return translateLabel("devicePage", record.connection_status);
      }
    };

    const fetchPicture = async (id: string) => {
      try {
        const response = await getPictureById(id);
        if (response) {
          //console.log("Picture Response", response);
          const data = response.data;

          const buffer = data.original_image.data;

          // Convert buffer to base64
          const base64String = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          assetImage.value = `data:image/png;base64,${base64String}`;
        } else {
          assetImage.value = "";
        }
      } catch (error: any) {
        console.log(error);
      }
    };

    const fetchData = async (
      taskData: Task,
      exportType?: string,
      fileName?: string
    ) => {
      isLoading.value = true;
      try {
        if (taskData.type === "renderTable" && taskData.table?.api) {
          const params: Record<string, any> = {
            page: currentPage.value,
            orderBy: taskData.table.defaultOrderBy,
            asset_type_id: deviceTypeId.value,
            strict: "no",
          };

          // if (selectedActionFilter.value.length > 0) {
          //   params["is_active"] = isActiveFilter.value;
          // }

          if (isActiveFilter.value === true || isActiveFilter.value === false) {
            console.log("going inside params");
            params["is_active"] = isActiveFilter.value;
          }
          // if (selectedStatusFilter.value.length > 0) {
          //   // set params for status.
          //   params.connection_status = selectedStatusFilter.value[0];
          // }
          //console.log("selectedstatus filter", selectedStatusFilter.value);
          if (searchKey && searchTerm) {
            params[searchKey] = searchTerm;
          }

          //console.log("searchkey and searchTerm", searchKey, searchTerm);
          console.log("params for fetch data", params);
          if (exportType !== undefined) {
            params.exportType = exportType;
            params.fileName = "Instrument";
            params.tableHeaders = encodeURIComponent(tableHeaders);
            params.locale = locale.value;
            params.limit = limitCount;
            console.log("PageTotalCount:::::", paginationTotalCount.value);

            const searchHeaders: Record<string, any> = [];
            if (searchKey && searchTerm) {
              const searchedKeyFor =
                searchKeyMapping.value[searchKey] || searchKey;
              searchHeaders.push({
                [searchedKeyFor]: searchTerm,
              });
            }
            if (
              isActiveFilter.value === true ||
              isActiveFilter.value === false
            ) {
              searchHeaders.push({
                Action: isActiveFilter.value ? "Active" : "Inactive",
              });
            }
            const searchCSVHeaders = JSON.stringify(searchHeaders);
            console.log("required searchCSVHeaders", searchCSVHeaders);
            params.searchHeaders = encodeURIComponent(searchCSVHeaders);
            console.log("params", params);
            // Remove limit parameter when exporting
            // delete params.limit;
            delete params.page;
          } else {
            params.limit = taskData.table.defaultLimit;
            params.strict = taskData.table.defaultStrict;
          }

          //  console.log("get params", params);

          const response = await fetchDataFromAPI(
            taskData.table.api.url,
            "GET",
            params,
            undefined,
            fileName
          );

          //   console.log("get params data response", response.data);

          if (!exportType) {
            tableData.value = [...response.data];

            //  console.log(" response data after filter::", tableData.value);
            //  console.log("tablevalue after filter", tableData.value);
            paginationTotalCount.value = response.pagination.totalCount;
            selectedDevice.value = response.data[0].id;
            selectedAssetId.value = response.data[0].asset_id;
            assetName.value = response?.data[0]?.name
              ? response?.data[0]?.name
              : "";

            fetchPicture(response?.data[0]?.picture_id);
            statisticsTask = deviceView.value.tasks.find(
              (task) => task.type === "renderSampleStatistics"
            );
            deviceStatisticsTask = deviceView.value.tasks.find(
              (task) => task.type === "renderDeviceStatistics"
            );
            if (statisticsTask) {
              await fetchSampleStatisticsData(statisticsTask);
            }
            if (deviceStatisticsTask) {
              await fetchSampleStatisticsData(deviceStatisticsTask);
            }
            tableData.value.forEach((each) => {
              each.connection_status = "disconnected";
              each.isTaskInProgress = false;
              each.isAssetTimeIsMatching = false;

              if (each.connection_status === "disconnected") {
                each.create_timestamp = "";
              } else {
                each.create_timestamp = formatMeasureTime(
                  each.create_timestamp,
                  each.asset__site___timezone
                );
              }
              if (each.asset__site___name === null) {
                each.create_timestamp = "Site Name Not Assigned";
              }
            });
            const deviceIds = response.data.map(
              (device: any) => device.asset_id
            );
            const filteredDeviceIds = deviceIds.filter(
              (deviceId: string | undefined) => deviceId
            );

            // Unsubscribe from devices that are no longer in the filtered list
            subscribedDeviceIds.value.forEach((deviceId) => {
              if (!filteredDeviceIds.includes(deviceId)) {
                //  console.log("::: socket_url ::", socketService);
                socketService.leaveRooms([
                  `instrument/phmeter/${deviceId}/heartbeats/basic`,
                ]);
                subscribedDeviceIds.value.delete(deviceId);
              }
            });

            // Subscribe to new devices in the filtered list
            filteredDeviceIds.forEach((asset_id: any) => {
              if (!subscribedDeviceIds.value.has(asset_id)) {
                //  console.log("::: socket_url ::", socketService);
                socketService.subscribeToRooms([
                  `instrument/phmeter/${asset_id}/heartbeats/basic`,
                ]);
                subscribedDeviceIds.value.add(asset_id);
              }
            });
          }
        }
        isLoading.value = false;
      } catch (error) {
        console.error("Error fetching data:", error);
        isLoading.value = false;
      }
    };

    const handleSwitchToggle = (record: any, event: any) => {
      console.log(event);
      const action = record.is_active ? "inactivate" : "activate";
      const messageText = record.is_active ? "Inactivated" : "Activated";
      const deviceStatus = record.is_active ? "Inactivated" : "Onboarded";
      const deviceName = record.name;
      const payload = { is_active: !record.is_active, status: deviceStatus };

      Modal.confirm({
        title: `${t("devicePage.Do you want to", "Do you want to")} ${t(
          `devicePage.${action}`,
          `${action}`
        )} "${deviceName}"`,
        icon: h(ExclamationCircleOutlined),
        content: `${t("devicePage.This Action Will", "This Action Will")} ${t(
          `devicePage.${action}`,
          `${action}`
        )} ${t("devicePage.The", "The")}"${deviceName}".`,
        okText: `${t("commonData.Confirm", "Confirm")}`,
        cancelText: `${t("commonData.Cancel", "Cancel")}`,
        async onOk() {
          try {
            const response = await apcService.updateDeviceDetailsById(
              payload,
              record.id
            );
            if (response) {
              message.success(
                `'${deviceName}' ${t(
                  `devicePage.${messageText}`,
                  `${messageText}`
                )} ${t("devicePage.Successfully", "Successfully")}`
              );
            }
            return response;
          } catch (error) {
            console.error("Failed to update device:", error);
            message.error(
              t(
                "commonData.Error updating instrument details",
                "Error updating instrument details"
              )
            );
            return Promise.reject(); // Prevent modal from closing if there's an error
          }
        },
        onCancel() {
          console.log("Cancel");
        },
        // afterClose() {
        //   fetchData(
        //     deviceView.value.tasks.find((task) => task.type === "renderTable")!
        //   );
        // },
      });
    };

    const handleEditRecord = (record: any) => {
      //  console.log("edit row data:", record);
      router.push(`/phmeter/instrument/device/${record.id}`);
    };

    const getCommentInfo = (name: string, columnName: string) => {
      return t(
        `constantsTranslate['${infoCommentsPop.instrument[name][columnName]}']`,
        `${infoCommentsPop.instrument[name][columnName]}`
      );
    };

    const fetchSampleStatisticsData = async (taskData: Task) => {
      isDeviceDetailsLoading.value = true;
      //  console.log (
      //     ":::::::: deviceStatisticsTask before fetchSampleStatisticsData",
      //     taskData
      //   );
      if (
        (taskData?.type === "renderSampleStatistics" ||
          taskData?.type === "renderDeviceStatistics") &&
        taskData.api
      ) {
        const params = {
          page: currentPage.value,
          orderBy: "id",
          limit: 10,
          ...(searchKey && searchTerm
            ? { [searchKey]: searchTerm, strict: "no" }
            : {}),
        };

        let sampleStatisticsUrl = taskData.api.url;
        // let deviceId = selectedDevice.value;
        let assetId = selectedAssetId.value;
        console.log(
          "::: selectedDevice.value",
          selectedDevice.value,
          selectedAssetId.value
        );
        if (taskData.type === "renderSampleStatistics") {
          sampleStatisticsUrl += `?asset_type_id=${deviceTypeId.value}&asset_id=${assetId}`;
        }

        if (
          (selectedTableRecord.value?.id as string | undefined) ||
          (tableData.value[0]?.id as string | undefined)
        ) {
          try {
            const response = await fetchDataFromAPI(
              sampleStatisticsUrl,
              "GET",
              params
            );

            if (taskData.type === "renderSampleStatistics") {
              selectedDeviceStatistics.value = response.data[0];
              mostRecentSample.value = formatSampleTime(
                selectedDeviceStatistics.value
              );
              isSampleDataLoaded.value = true;
            } else {
              deviceStats.value = response.data[0];

              console.log("::::: instrument stats ::::", deviceStats.value);
              isDeviceDataLoaded.value = true;
            }
          } catch (err) {
            handleNoIdAvailable(taskData);
          }
        } else {
          handleNoIdAvailable(taskData);
        }
      }
      isDeviceDetailsLoading.value = false;
    };

    const getRowClassName = () => {
      return "custom-row-color"; // Assign a custom CSS class to all rows
    };

    const handleNoIdAvailable = (taskData: Task) => {
      if (taskData.type === "renderSampleStatistics") {
        isSampleDataLoaded.value = true;
      } else {
        isDeviceDataLoaded.value = true;
      }
    };
    const performSearch = async (values: {
      selectedKey: string | null;
      searchQuery: string;
    }) => {
      searchKey = values.selectedKey !== null ? values.selectedKey : undefined;
      searchTerm = values.searchQuery.trim();

      // // Update searchTerm if it is "Onboarded"
      // if (searchTerm === "Onboarded") {
      //   searchTerm = "Onboarded";
      // }

      currentPage.value = 1;
      await fetchData(
        deviceView.value.tasks.find((task) => task.type === "renderTable")!
      );
    };

    const shouldResetSearchComponent = async () => {
      searchKey = null;
      searchTerm = null;
      currentPage.value = 1;
      await fetchData(
        deviceView.value.tasks.find((task) => task.type === "renderTable")!
      );
      return true; // Indicating the search component should reset
    };

    const handlePageChange = async (page: number) => {
      currentPage.value = page;
      const tableTask = deviceView.value.tasks.find(
        (task) => task.type === "renderTable"
      );
      if (tableTask && tableTask.table) {
        await fetchData(tableTask);
      } else {
        console.error("Table task or table property is undefined");
      }
    };

    // Updated fetchSearchKeys to get data from jsonData
    const fetchSearchKeys = async () => {
      try {
        if (searchDropdownOptions.value) {
          searchKeyMapping.value = searchDropdownOptions.value.reduce(
            (acc: { [key: string]: string }, item: any) => {
              acc[item.value] = item.label;
              return acc;
            },
            {}
          );
        } else {
          console.error("Dropdown options are undefined");
        }
      } catch (error) {
        console.error("Error fetching search keys:", error);
      }
    };

    const renderDeviceImage = computed(() =>
      deviceView.value.tasks.find((task) => task.type === "renderDeviceImage")
    );

    const renderSampleStatistics = computed(() =>
      deviceView.value.tasks.find(
        (task) => task.type === "renderSampleStatistics"
      )
    );

    const renderDeviceStatistics = computed(() =>
      deviceView.value.tasks.find(
        (task) => task.type === "renderDeviceStatistics"
      )
    );

    const renderResources = computed(() =>
      deviceView.value.tasks.find((task) => task.type === "renderResources")
    );

    const deviceTable = computed(() =>
      deviceView.value.tasks.find((task) => task.type === "renderTable")
    );

    const getSampleStatsData = (dataIndex: string): string | number => {
      // console.log(
      //   "selectedDeviceStatistics",
      //   dataIndex,
      //   selectedDeviceStatistics.value
      // );
      try {
        return selectedDeviceStatistics.value[dataIndex] || 0;
      } catch (err) {
        return 0;
      }
    };

    const getAssetStatsData = (dataIndex: string): string | number => {
      try {
        console.log("::::getAssetStatsData", dataIndex);
        return 0;
      } catch (e) {
        return 0;
      }
    };

    const handleSelectedTableRowClick = (record: any) => {
      selectedTableRecord.value = record;
      statisticsTask = deviceView.value.tasks.find(
        (task) => task.type === "renderSampleStatistics"
      );
      deviceStatisticsTask = deviceView.value.tasks.find(
        (task) => task.type === "renderDeviceStatistics"
      );
      fetchSampleStatisticsData(statisticsTask!);
      fetchSampleStatisticsData(deviceStatisticsTask!);
    };

    const refreshStatistics = async () => {
      await fetchSampleStatisticsData(statisticsTask!);
      await fetchSampleStatisticsData(deviceStatisticsTask!);
      lastUpdateTime.value = new Date();
    };

    const lastUpdateMessage = computed(() => {
      if (!lastUpdateTime.value) return "";
      const now = new Date();
      const diff = now.getTime() - lastUpdateTime.value.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) {
        return `${t(
          "commonData.Less than a minute ago",
          "Less than a minute ago"
        )}`;
      } else if (minutes < 60) {
        return `${minutes} ${
          minutes === 1
            ? `${t("commonData.min", "min")}`
            : `${t("commonData.mins", "mins")}`
        } ${t("commonData.ago", "ago")}`;
      } else if (hours < 24) {
        return `${hours} ${
          hours === 1
            ? `${t("commonData.hr", "hr")}`
            : `${t("commonData.hrs", "hrs")}`
        } ${t("commonData.ago", "ago")}`;
      } else {
        return `${days} ${
          days === 1
            ? `${t("commonData.day", "day")}`
            : `${t("commonData.days", "days")}`
        } ${t("commonData.ago", "ago")}`;
      }
    });

    const updateLastUpdateMessage = () => {
      if (lastUpdateTime.value !== null) {
        lastUpdateTime.value = new Date(lastUpdateTime.value.getTime());
      }
    };

    const formatSampleTime = (sampleTime: any): string => {
      const {
        last_sample_by_days,
        last_sample_by_hours,
        last_sample_by_minutes,
        last_sample_by_seconds,
      } = sampleTime;

      const parts: string[] = [];

      if (last_sample_by_days > 0) {
        return `${last_sample_by_days} Day${
          last_sample_by_days > 1 ? "s" : ""
        } Ago`;
      }
      if (last_sample_by_hours > 0) {
        parts.push(
          `${last_sample_by_hours} Hour${last_sample_by_hours > 1 ? "s" : ""}`
        );
      }
      if (last_sample_by_minutes > 0) {
        parts.push(
          `${last_sample_by_minutes} Min${
            last_sample_by_minutes > 1 ? "s" : ""
          }`
        );
      }
      if (last_sample_by_seconds > 0) {
        parts.push(
          `${Math.round(last_sample_by_seconds)} Sec${
            Math.round(last_sample_by_seconds) > 1 ? "s" : ""
          }`
        );
      }

      return parts.length > 0 ? `${parts.join(" ")} Ago` : "-";
    };

    socketService.handleMessage((data: any) => {
      tableData.value.forEach((device: any, index: number) => {
        const deviceHeartbeat = processHeartbeat(data);
        const deviceID = deviceHeartbeat?.basic?.asset_id;
        // console.log("::::::deviceHeartbeat::::", deviceHeartbeat);

        if (deviceID && device.id && deviceID == device.asset_id) {
          try {
            Object.assign(tableData.value[index], {
              // status: deviceHeartbeat?.status,
              connectionStatus: deviceHeartbeat.connectionStatus,
              isSampling: deviceHeartbeat.isSampling,
              actionStatus: deviceHeartbeat.actionStatus,
              sampleType: deviceHeartbeat.sampleType,
              jobId: deviceHeartbeat.jobId,
              taskId: deviceHeartbeat.taskId,
              isTaskInProgress: deviceHeartbeat.isTaskInProgress,
            });
          } catch (e) {
            console.error(
              `Error updating instrument data for instrument id:${device.asset_id}`,
              e
            );
          }

          try {
            // console.log(
            //   "connection status upated",
            //   tableData.value[index].connectionStatus
            // );
            tableData.value[index].connection_status =
              tableData.value[index].connectionStatus;
          } catch (e) {
            console.log("error while updating connection_status");
          }

          // console.log("assert id instrument id matched", deviceID);
          // try {
          //   tableData.value[index].connection_status =
          //     deviceHeartbeat?.basic?.status;
          // } catch (e) {
          //   console.error(
          //     `connection status not updated for instrument id:${device.asset_id}`,
          //     e
          //   );
          // }
          try {
            const assetTimeObj = deviceHeartbeat?.basic?.asset_time;
            const siteTimezone = tableData.value[index].asset__site___timezone;
            const isTimeValid = compareAssetTime(assetTimeObj, siteTimezone);
            if (isTimeValid) {
              tableData.value[index].create_timestamp = formatMeasureTime(
                assetTimeObj.time,
                siteTimezone
              );
              tableData.value[index].isAssetTimeIsMatching = true;
            } else {
              if (userRole.value.toLowerCase() === "administrator") {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please update the site.";
              } else {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please contact the admin.";
              }
              tableData.value[index].isAssetTimeIsMatching = false;
            }
            if (tableData.value[index].asset__site___name === null) {
              tableData.value[index].create_timestamp =
                "Site Name Not Assigned";
            }
          } catch (e) {
            console.error(
              `Discovered time not updated for instrument id ${tableData.value[index].asset_id}`,
              e
            );
          }

          if (deviceHeartbeat.connectionStatus === "disconnected") {
            tableData.value[index].create_timestamp = "";
          }

          try {
            if (tableData.value[index]["interval"]) {
              clearInterval(tableData.value[index]["interval"]);
            }

            tableData.value[index]["timer"] = new Date().getTime();
            tableData.value[index]["interval"] = setInterval(() => {
              // console.log("disconnect time");

              try {
                if (
                  tableData.value[index] &&
                  new Date().getTime() - tableData.value[index]["timer"] >= 3000
                ) {
                  // console.log("disconnect time greater than 3 sec");
                  // tableData.value[index]["status"] = "disconnected";
                  tableData.value[index]["connection_status"] = "disconnected";
                  tableData.value[index].create_timestamp = "";
                  clearInterval(tableData.value[index]["interval"]);
                }
                if (tableData.value[index].asset__site___name === null) {
                  tableData.value[index].create_timestamp =
                    "Site Name Not Assigned";
                }
              } catch (e) {
                // console.log("unable to auto disconnect on no heartbeat");
              }
            }, 1000);
          } catch (e) {
            console.log("error updating disconnect status");
          }

          try {
            if (
              tableData.value[index].create_timestamp &&
              tableData.value[index].isAssetTimeIsMatching
            ) {
              if (userRole.value.toLowerCase() === "administrator") {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please update the site.";
              } else {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please contact the admin.";
              }
              tableData.value[index].isAssetTimeIsMatching = false;
            }
            tableData.value[index].create_timestamp = formatMeasureTime(
              deviceHeartbeat.basic?.asset_time?.time,
              tableData.value[index].asset__site___timezone
            );
          } catch (e) {
            console.error(
              `discovered time not updated for instrument id${device.asset_id}`,
              e
            );
          }
          try {
            const assetTimeObj = deviceHeartbeat?.basic?.asset_time;
            const siteTimezone = tableData.value[index].asset__site___timezone;
            const isTimeValid = compareAssetTime(assetTimeObj, siteTimezone);
            if (isTimeValid) {
              tableData.value[index].create_timestamp = formatMeasureTime(
                assetTimeObj.time,
                siteTimezone
              );
              tableData.value[index].isAssetTimeIsMatching = true;
            } else {
              if (userRole.value.toLowerCase() === "administrator") {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please update the site.";
              } else {
                tableData.value[index].create_timestamp =
                  "Site mapping appears to be incorrect. Please contact the admin.";
              }
              tableData.value[index].isAssetTimeIsMatching = false;
            }
            if (tableData.value[index].asset__site___name === null) {
              tableData.value[index].create_timestamp =
                "Site Name Not Assigned";
            }
          } catch (e) {
            console.error(
              `Discovered time not updated for instrument id ${tableData.value[index].asset_id}`,
              e
            );
          }
          try {
            tableData.value[index].is_cr_running =
              deviceHeartbeat?.is_cr_running;
            // is_cr_running
          } catch (e) {
            console.error(`error while updating cr status`);
          }

          try {
            if (
              deviceHeartbeat?.basic?.status.toLowerCase() === "disconnected"
            ) {
              tableData.value[index].create_timestamp = "";
            }
          } catch (e) {
            console.log("error updating disconnect status");
          }
          // try {
          //   if (tableData.value[index].create_timestamp) {
          //     tableData.value[index].create_timestamp = "Time is out of sync";
          //     tableData.value[index].isAssetTimeIsMatching = false;
          //   }
          // } catch (error) {
          //   console.log("error updating disconnect status", error);
          // }
          try {
            if (tableData.value[index].asset__site___name === null) {
              tableData.value[index].create_timestamp =
                "Site Name Not Assigned";
            }
          } catch (error) {
            console.log("error updating disconnect status", error);
          }
        }
      });
    });

    const isActive = (record: any) => {
      return record.status !== "Onboarded";
    };

    onMounted(async () => {
      isLoading.value = true;
      updateInterval = setInterval(updateLastUpdateMessage, 60000);
      const tableTask = deviceView.value.tasks.find(
        (task) => task.type === "renderTable"
      );
      if (tableTask) {
        await fetchData(tableTask);
        refreshStatistics();
      }
      statisticsTask = deviceView.value.tasks.find(
        (task) => task.type === "renderSampleStatistics"
      );
      deviceStatisticsTask = deviceView.value.tasks.find(
        (task) => task.type === "renderDeviceStatistics"
      );
      if (statisticsTask) {
        await fetchSampleStatisticsData(statisticsTask);
      }
      if (deviceStatisticsTask) {
        await fetchSampleStatisticsData(deviceStatisticsTask);
      }
      await fetchSearchKeys();
      isLoading.value = false;
    });

    onUnmounted(() => {
      // Unsubscribe from all rooms
      subscribedDeviceIds.value.forEach((deviceId) => {
        socketService.leaveRooms([
          `instrument/phmeter/${deviceId}/heartbeats/basic`,
        ]);
      });
      subscribedDeviceIds.value.clear();

      if (updateInterval !== null) {
        clearInterval(updateInterval);
      }
    });

    return {
      deviceView,
      isSampleDataLoaded,
      isDeviceDataLoaded,
      isRenderResources,
      isRenderDeviceImage,
      tableData,
      currentPage,
      getStatusClass,
      getStatusDisplayText,
      performSearch,
      handlePageChange,
      renderDeviceImage,
      renderSampleStatistics,
      renderDeviceStatistics,
      renderResources,

      deviceTable,
      getSampleStatsData,
      handleSelectedTableRowClick,
      refreshStatistics,
      shouldResetSearchComponent,
      hideCheckBox,
      InfoCircleOutlined,
      getCommentInfo,
      infoCommentsPop,
      statisticsColumns,
      reasourceColumns,
      allInstrumentsColumns,
      searchDropdownOptions,
      tableColumns,
      state,
      handleSwitchToggle,
      EditOutlined,
      lastUpdateMessage,
      handleEditRecord,
      exportDataByType,
      isActive,
      getRowClassName,
      isLoading,
      getAssetStatsData,
      deviceStats,
      paginationTotalCount,
      handleRowClick,
      selectedDevice,
      selectedDeviceStatistics,
      mostRecentSample,
      rowClassName,
      isDeviceDetailsLoading,
      assetImage,
      assetName,
      getDevicePopoverStatus,
      isExportTypeLoading,
      translateLabel,
      filteredColumns,
      t,
      handleTableChange,
      // handleSelectedStatusFilter,
      handleSelectedActionFilter,
      customLocale,
    };
  },
});
</script>

<style scoped>
.device-info {
  margin-bottom: 20px;
}

.ImageStatistics {
  width: 100%;
  vertical-align: top;
  margin-top: 20px;
  padding: 10px;
}

.white-bg {
  background-color: #fafafa;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
  height: 100%;
  padding: 15px;
}

.column-55 {
  flex: 55%;
}

.column-50 {
  flex: 50%;
}

.column-35 {
  flex: 35%;
}

.verical-divider {
  height: 210px;
  background-color: rgb(232, 232, 232);
  width: 1px;
  margin: 40px auto 0 auto;
}

.full-width {
  width: 100%;
}

.sampleStatsContainer {
  display: flex;
  flex-direction: column;
}

.sampleStatsPair {
  display: flex;
  margin-bottom: 10px;
  width: 100%;
  padding: 15px 0;
  border-bottom: 1px solid #e8e8e8;
  justify-content: space-between;
}

.sampleStatsKey {
  width: 185px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  align-content: center;
  font-weight: 400;
  font-style: normal;
  color: rgba(0, 0, 0, 0.65);
}

.sampleStatsValue {
  text-align: right;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #606060;
  align-content: center;
  text-align: end;
}

.sampleStatsRow {
  display: inline;
}

.deviceStatsRow {
  display: inline;
}

.verticalLine {
  border-left: 1px solid #e8e8e8;
  margin: 0.5rem;
}

.resources-items {
  list-style: none;
  list-style: none;
  padding-left: 20px;
}

.resources-items li {
  padding: 8px 0;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 400;
  font-style: normal;
}

.resources-items li a {
  font-weight: 400;
}

.ant-switch-checked {
  background-color: #52c41a !important;
  border-color: #52c41a !important;
  width: 79px;
}

.ant-switch {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}
.ant-switch:hover:not(.ant-switch-disabled) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.ant-switch-inner {
  color: white;
}

.instrumentPage {
  background-color: white;
  padding: 15px;
  background-color: #fafafa;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
}

.searchBar {
  margin-top: 10px;
  margin-bottom: 20px;
}

.tbody tr.selected {
  background-color: #e0f8f7 !important;
}

.refreshIcon {
  font-size: 14px;
  color: #00bceb;
}

.statisticsLable {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerName {
  font-family: "Montserrat Light", Montserrat, sans-serif;
  font-weight: 300;
  font-style: normal;
  font-size: 20px;
  margin-right: 10px;
  margin-bottom: 10px;

  display: inline-block;
}

.headerUpdateName {
  font-family: "Montserrat Light", Montserrat, sans-serif;
  font-size: 12px;
  font-weight: 300;
  font-style: normal;
  margin-right: 10px;
  margin-bottom: 10px;
  display: inline-block;
}

.deviceName {
  text-align: center;
  word-break: break-word;
  margin-top: 15px;
}

.StatisticsTable {
  padding: 0 20px;
}

.status-idle,
.status-idle-inactivated,
.status-connected {
  background: #94e498;
  display: flex;
  justify-content: center;
  border-radius: 15px;
  /* width: 130px; */
  padding: 0 10px;
  height: 25px;
  align-items: center;
}

.status-disable {
  background: #c9c9c9;
  display: flex;
  justify-content: center;
  border-radius: 15px;
  /* width: 130px; */
  padding: 0 10px;
  height: 25px;
  align-items: center;
}
.status-running {
  background: #94d2de;
  display: flex;
  justify-content: center;
  border-radius: 15px;
  /* width: 130px; */
  padding: 0 10px;
  height: 25px;
  align-items: center;
}

.status-disconnected {
  background: #e89b96;
  display: flex;
  justify-content: center;
  border-radius: 15px;
  /* width: 70px; */
  padding: 0 10px;
  align-items: center;
}
.not-ready {
  background: #e89b96;
  display: flex;
  justify-content: center;
  border-radius: 15px;
  /* width: 130px; */
  padding: 0 10px;
  height: 25px;
  align-items: center;
}

.ant-table-thead th[data-index="action"] .ant-table-column-title,
.ant-table-thead th[data-index="action"] .ant-table-filter-column {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Target the Action column in the table body */
.ant-table-tbody td[data-index="action"] {
  text-align: center;
}

/* Center the filter dropdown itself */
::v-deep .ant-table-wrapper .ant-table-filter-column {
  display: flex;
  justify-content: center;
}
.ellipsis-text {
  display: inline-block;
  max-width: 150px;
  width: "130px" !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  cursor: default;
  padding: 0 10px;
}
.status-idle-inactivated,
.status-disable,
.not-ready,
.status-running,
.status-connected,
.status-disconnected,
.status-idle {
  width: 130px;
}
.ellipsis-text {
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* .data-class {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
} */
.custom-table-scroll {
  overflow: visible !important;
  position: relative;
}
</style>
