<template>
  <div>
    <a-row>
      <a-col :span="12">
        <a-icon type="manage-assets-black" style="height: 35px" />
        <h3 style="display: inline-block; font-weight: normal">
          {{ translateLabel("devicePage", "Instrument Details") }}
        </h3>
      </a-col>
      <a-col :span="12" style="text-align: right">
        <a-button type="primary" @click="navigateToDevices">{{
          translateLabel("devicePage", "Back")
        }}</a-button>
      </a-col>
    </a-row>
    <br />
    <div>
      <a-spin :spinning="isSpinning">
        <a-card>
          <a-row justify="space-between">
            <a-col :span="6">
              <div>
                <div style="font-weight: 600; margin-bottom: 10px">
                  {{ translateLabel("devicePage", "Instrument Name") }}
                  <span class="required" style="color: red">*</span>
                </div>
                <div>
                  <a-input
                    v-model:value="form.deviceNameInput"
                    :readonly="true"
                    :disabled="true"
                    :placeholder="
                      translateLabel('devicePage', 'Enter Instrument Name')
                    "
                    @change="handleInputChange"
                  />
                </div>
              </div>
            </a-col>
            <a-col :span="6">
              <div>
                <div
                  class="label"
                  style="font-weight: 600; margin-bottom: 10px"
                >
                  {{ translateLabel("devicePage", "Location") }}
                </div>
                <div>
                  <a-input
                    v-model:value="form.deviceLocation"
                    :disabled="!form.selectedSite"
                    @input="handleLocationInputChange($event.target.value)"
                    :placeholder="translateLabel('devicePage', 'Location')"
                    :status="locationError ? 'error' : ''"
                  />
                  <div
                    v-if="locationError"
                    style="color: #ff4d4f; font-size: 14px"
                  >
                    {{ locationError }}
                  </div>
                </div>
              </div>
            </a-col>
            <a-col :span="6">
              <div>
                <div
                  class="label"
                  style="font-weight: 600; margin-bottom: 10px"
                >
                  {{ translateLabel("devicePage", "Site Name") }}
                  <span class="required" style="color: red">*</span>
                </div>
                <a-select
                  v-model:value="selectedSiteTimezone"
                  :placeholder="
                    translateLabel('devicePage', 'Select Site Name')
                  "
                  :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
                  style="width: 100%"
                  @change="handleSiteChange"
                >
                  <a-select-option
                    v-for="site in allSites"
                    :key="site.id"
                    :value="site.name"
                  >
                    {{ site.name }}
                  </a-select-option>
                </a-select>
              </div>
            </a-col>
          </a-row>
        </a-card>
      </a-spin>
    </div>
    <br />
    <a-row>
      <a-col :span="16">
        <div class="ActionBtns">
          <div>
            <div style="text-align: left">
              <a-button
                type="primary"
                :loading="isLoadingOne"
                :disabled="
                  isUpdateDisabled || hasChanges || locationError !== ''
                "
                @click="editDeviceDetails"
              >
                {{ translateLabel("devicePage", "Update Instrument") }}
              </a-button>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <div v-if="device" style="margin-top: 20px">
      <a-card>
        <a-row :gutter="32">
          <a-col
            :xs="16"
            :sm="16"
            :md="16"
            :lg="16"
            :xl="16"
            class="gutter-row block"
            :span="16"
          >
            <a-descriptions
              :title="translateLabel('devicePage', 'Instrument Info')"
              bordered
            >
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Model')"
                :span="2"
                >{{ device?.asset__asset_model___name }}</a-descriptions-item
              >
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Serial Number')"
                :span="2"
                >{{ device?.asset_id }}</a-descriptions-item
              >
              <a-descriptions-item
                v-if="device?.gateway_ip"
                :label="translateLabel('devicePage', 'GatewayIP')"
                :span="1"
                >{{ device?.gateway_ip }}</a-descriptions-item
              >
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Onboarded Time')"
                :span="2"
              >
                <!-- {{ device.discover_timestamp }} -->
                <span v-if="device.create_timestamp">{{
                  device.create_timestamp
                }}</span>
              </a-descriptions-item>
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Last Calibration Date')"
                :span="2"
              >
                {{ lastCalibrationTime(device?.info?.calibration?.last) }}
              </a-descriptions-item>

              <a-descriptions-item
                :label="translateLabel('devicePage', 'Connection Status')"
                :span="2"
              >
                <a-badge
                  :color="
                    device?.connection_status?.toLowerCase() ===
                      'disconnected' ||
                    (device?.connection_status?.toLowerCase() ===
                      'inactivated' &&
                      device?.status?.toLowerCase() === 'disabled')
                      ? 'red'
                      : 'green'
                  "
                  :status="
                    device.connection_status?.toLowerCase() === 'connected' ||
                    device.connection_status?.toLowerCase() === 'ready for use'
                      ? 'processing'
                      : 'default'
                  "
                  :text="connectionText"
                />
              </a-descriptions-item>

              <a-descriptions-item
                :label="translateLabel('devicePage', 'Location')"
                :span="2"
                >{{ device?.meta?.location }}</a-descriptions-item
              >
            </a-descriptions>
          </a-col>
          <a-col
            :xs="8"
            :sm="8"
            :md="8"
            :lg="8"
            :xl="8"
            style="display: flex; justify-content: center; align-items: center"
          >
            <div
              v-if="!renderedImage"
              style="
                text-align: center;
                font-weight: bold;
                width: 100%;
                min-height: 200px;
              "
            >
              <a-empty :description="null" />
            </div>
            <img
              v-if="renderedImage && device.device_type !== 'pH Meter'"
              id="myimage"
              class="devicePic"
              :src="renderedImage"
              alt="Particle Counter"
              style="width: 300px; min-height: 200px"
            />
          </a-col>
        </a-row>
      </a-card>
    </div>

    <div style="margin-top: 30px">
      <h3 style="margin-bottom: 15px">
        {{ translateLabel("devicePage", "Instrument Operation History") }}
      </h3>

      <a-table
        :data-source="assets"
        :columns="columns"
        :pagination="false"
        size="middle"
        class="custom-table"
        :loading="isOHTableLoading"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="
              column.title === translateLabel('devicePage', 'Event Details')
            "
          >
            <a-typography-text
              :style="{ width: '150px' }"
              :ellipsis="{ tooltip: record[column.dataIndex] }"
              :content="record[column.dataIndex]"
            />
          </template>
        </template>
      </a-table>

      <a-row class="light-gray-bg py-2">
        <a-col :span="24" class="text-right">
          <a-pagination
            v-model:current="pageIndex"
            :total="totalRecords || '10'"
            @change="handlePageChange"
            :show-size-changer="false"
            :defaultPageSize="10"
          />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { lastCalibrationTime } from "@/common/utils";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { apcApiServices } from "../services/apcService";
import { getSitesByActive } from "@/services/apiService";
import { getDevicePictureById } from "@/services/apiService";
import { SocketService } from "@/services/socketService";
import { processHeartbeat, translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";
import { error } from "ajv/dist/vocabularies/applicator/dependencies";
import { environment } from "@/environment/environment";
const route = useRoute();
const router = useRouter();
const apcService = new apcApiServices();
const isUpdateDisabled = ref(true);
const deviceId = ref(route.params.id as string);
const isLoadingOne = ref(false);
const isSpinning = ref(true);
const form = reactive({
  deviceNameInput: "",
  deviceLocation: "",
  selectedSite: null,
});
const { t } = useI18n();
const patchDeviceData = ref<any | null>(null);
const device = ref<any>(null);
const devicePicture = ref(null);
const isOHTableLoading = ref(false);
const renderedImage = ref(null);
const assets = ref([]);
const totalRecords = ref(0);
const pageIndex = ref(1);
const allSites = ref([]);
const meta = ref({});
const locationError = ref("");
const socketService = new SocketService(`${environment.SOCKET_URL}`, "jm");
socketService.connectSocket();
const subscribedDeviceId = ref<string | null>(null);
const initialDeviceLocation = ref("");
const columns = computed(() => [
  {
    key: "time",
    title: translateLabel("devicePage", "Timestamp"),
    dataIndex: "operation_timestamp",
  },
  {
    key: "event",
    title: translateLabel("devicePage", "Event"),
    dataIndex: "event_type",
  },
  {
    key: "user",
    title: translateLabel("devicePage", "User"),
    dataIndex: "operator",
  },
  {
    key: "comments",
    title: translateLabel("devicePage", "Event Details"),
    dataIndex: "comments",
  },
]);

const fetchDeviceDetailsById = async () => {
  isSpinning.value = true;
  try {
    const response = await apcService.getDeviceDetailsById(deviceId.value);
    if (response.data) {
      const data = response.data[0];
      device.value = data;
      patchDeviceData.value = data;
      initialDeviceLocation.value = data.meta?.location || "";
      const siteId = +data.site_id;
      const selectedSite = allSites.value.find(
        (site: any) => site.id == siteId
      );
      meta.value = data.meta;
      form.deviceNameInput = data.name;
      form.deviceLocation = data.meta?.location;
      if (selectedSite) {
        form.selectedSite = selectedSite;
      }
      console.log(":::::::formData", form, response);
      console.log(":::::::formDataMeta", data.meta);
      isSpinning.value = false;
      if (data.picture_id) fetchPictureById(data.picture_id);

      if (data.asset_id && subscribedDeviceId.value !== data.asset_id) {
        if (subscribedDeviceId.value) {
          socketService.leaveRooms([
            `instrument/ams/${subscribedDeviceId.value}/heartbeats/basic`,
          ]);
        }
        socketService.subscribeToRooms([
          `instrument/ams/${data.asset_id}/heartbeats/basic`,
        ]);
        subscribedDeviceId.value = data.asset_id;
      }
    }
  } catch (error) {
    console.error("getDeviceDetailsByIdError", error);
    isSpinning.value = false;
  }
};

const selectedSiteTimezone = computed(() => {
  return form.selectedSite ? form.selectedSite.name : null;
});

const disableUpdateButton = () => {
  isUpdateDisabled.value = true;
};

const handleSiteChange = (siteOption: string) => {
  // Find the selected site from the list of all sites
  const siteOptionSelect = allSites.value.find(
    (each) => each.name === siteOption
  );

  // Update the selected site in the form
  form.selectedSite = siteOptionSelect || null;

  // Enable or disable the Location input based on the site selection
  if (siteOptionSelect) {
    enableUpdateButton(); // Enable the update button when a site is selected
  } else {
    form.deviceLocation = ""; // Clear the location input if no site is selected
    disableUpdateButton(); // Disable the update button
  }

  // Trigger reactivity updates for the device object
  device.value = { ...device.value };
};

const enableUpdateButton = () => {
  isUpdateDisabled.value = false; // Enables the update button
};

const handleLocationInputChange = (value: string) => {
  // Update the form with the new location value
  form.deviceLocation = value;
  handleInputChange(value);

  // Enable the update button only if the location differs from the initial value
  if (value !== initialDeviceLocation.value) {
    enableUpdateButton();
  } else {
    disableUpdateButton();
  }
};

const hasChanges = computed(() => {
  const currentData = {
    location: (form.deviceLocation || "").trim(), // Default to empty string if undefined
    site: form.selectedSite ? +form.selectedSite?.id : null, // Add check for undefined
  };

  const originalData = {
    location: (patchDeviceData.value?.meta?.location || "").trim(),
    site: patchDeviceData.value ? +patchDeviceData.value?.site_id : null,
  };

  return JSON.stringify(currentData) === JSON.stringify(originalData);
});

const handleInputChange = (value: string) => {
  if (value.trim() === "") {
    locationError.value =
      value === ""
        ? ""
        : t(
            "commonData['Location cannot contain only spaces.']",
            "Location cannot contain only spaces."
          );
    isUpdateDisabled.value = true;
  } else if (/^\s/.test(value)) {
    // Detect leading whitespace
    locationError.value = t(
      "commonData.Leading whitespace is not allowed",
      "Leading whitespace is not allowed"
    );
    isUpdateDisabled.value = true;
  } else {
    locationError.value = "";
    isUpdateDisabled.value = false;
  }
};

const fetchPictureById = async (id: any) => {
  const pictureResponse = await getDevicePictureById(id);
  devicePicture.value = pictureResponse.data;
  try {
    const typedArray = new Uint8Array(
      devicePicture?.value.medium_definition_image.data
    );
    const stringChar = typedArray.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    const base64String = btoa(stringChar);
    renderedImage.value = `data:image/jpg;base64, ${base64String}`;
  } catch (err) {
    console.error(err);
  }
};

const connectionText = computed(() => {
  if (device.value.connection_status?.toLowerCase() === "ready for use") {
    return translateLabel("devicePage", "Connected");
  }

  if (
    device.value.connection_status?.toLowerCase() === "inactivated" &&
    device.value.status?.toLowerCase() === "inactivated"
  ) {
    return translateLabel("devicePage", "Connected");
  }

  if (
    device.value.connection_status?.toLowerCase() === "inactivated" &&
    device.value.status?.toLowerCase() === "disabled"
  ) {
    return translateLabel("devicePage", "Disconnected");
  }

  return translateLabel(
    "devicePage",
    device.value.connection_status || "Unknown"
  );
});

const navigateToDevices = () => {
  router.push("/ams/instrument");
};

const editDeviceDetails = async () => {
  isLoadingOne.value = true;

  // Prepare the update payload with instrument details
  let updateDevicePayload = {
    name: form.deviceNameInput,
    meta: {},
    site_id: +form.selectedSite.id || "",
  };

  updateDevicePayload.meta = { ...meta.value };
  if (updateDevicePayload.meta.location) {
    updateDevicePayload.meta.location = form.deviceLocation
      ? form.deviceLocation.trim()
      : form.deviceLocation;
  } else {
    updateDevicePayload.meta["location"] = form.deviceLocation
      ? form.deviceLocation.trim()
      : form.deviceLocation;
  }

  // Build comments for any changes made
  let comments = "";
  const ActualSelectedSite = allSites.value.find(
    (site: any) => site.id == +patchDeviceData.value?.site_id
  );
  const updatedSelecetedSite = allSites.value.find(
    (site: any) => site.id == +form.selectedSite.id
  );

  if (patchDeviceData.value.meta?.location !== form.deviceLocation) {
    comments += `Location updated from '${patchDeviceData.value.meta?.location}' to '${form.deviceLocation}'`;
  }

  if (ActualSelectedSite?.id !== updatedSelecetedSite?.id) {
    comments += ` Site updated from '${ActualSelectedSite?.name}' to '${updatedSelecetedSite?.name}'`;
  }

  if (comments !== "") {
    updateDevicePayload.meta["comments"] = comments;
  }

  updateDevicePayload.meta = JSON.stringify(updateDevicePayload.meta);

  try {
    console.log("updateDevicePayload", updateDevicePayload);

    const response = await apcService.updateDeviceDetailsById(
      updateDevicePayload,
      deviceId.value
    );

    if (response) {
      message.success(
        `'${patchDeviceData.value?.name}' ${t(
          "commonData.Updated Successfully!"
        )}`
      );
      router.push("/ams/instrument");
    } else {
      message.error(
        t(
          "commonData.Failed to update instrument details",
          "Failed to update instrument details"
        )
      );
    }
  } catch (error: any) {
    if (error.status === 400) {
      message.error(
        t(
          "commonData.Instrument name already exists",
          "Instrument name already exists"
        )
      );
    } else {
      message.error(
        t(
          "commonData.Failed to update instrument details",
          "Failed to update instrument details"
        )
      );
    }
  } finally {
    isLoadingOne.value = false;
  }
};
const disableLocationError = () => {
  locationError.value = null;
};

const fetchTimeZones = async () => {
  try {
    const timeZonesData = await getSitesByActive();
    console.log("timeZonesData::", timeZonesData);
    allSites.value = timeZonesData.data;
    console.log("Fetched Time Zones::::::::", timeZonesData);
  } catch (error) {
    console.error("Failed to fetch time zones:", error);
  }
};

const handlePageChange = async (page: number) => {
  pageIndex.value = page;
  fetchDeviceOperationHistory(pageIndex.value, deviceId.value);
};

const fetchDeviceOperationHistory = async (page: any, id: any) => {
  isOHTableLoading.value = true;
  try {
    const response = await apcService.getAuditEventsByAssetId(page, id);
    console.log("fetchDeviceOperationHistory", response);

    // Assign the response data to assets
    assets.value = response?.data;

    // If needed, process assets without changing the timestamp format
    assets.value.forEach((eachAsset: any) => {
      // Keep operation_timestamp as it is
      // let timezone = eachAsset.meta?.site_info?.site_timezone || null;
      // eachAsset.operation_timestamp = formatISODate(eachAsset.operation_timestamp, timezone);
      console.log("eachAssetData::::::::", eachAsset);
    });

    // Update total record count
    totalRecords.value = response?.pagination.totalCount;
  } catch (error) {
    console.log("fetchDeviceOperationHistory", error);
  }

  isOHTableLoading.value = false;
};

// const formattedDiscoveryTime = computed(() => {
//   if (device.value && device.value.create_timestamp) {
//     const siteTimezone =
//       form.selectedSite?.timezone || device.value.asset__site___timezone;
//     return formatMeasureTime(device.value.create_timestamp, siteTimezone);
//   }
//   return "-";
// });

const handleSocketMessage = (incomingHeartbeat: any) => {
  const processedHeartbeat = processHeartbeat(incomingHeartbeat);
  console.log("#processedHeartbeat:::", processedHeartbeat);
  if (processedHeartbeat.asset_id === device.value?.asset_id) {
    device.value = {
      ...device.value,
      connection_status: processedHeartbeat.basic?.status,
    };
  }
  console.log(":::::Instrument Data:::", device.value);
};

socketService.handleMessage(handleSocketMessage);

onUnmounted(() => {
  if (subscribedDeviceId.value) {
    socketService.leaveRooms([
      `instrument/ams/${subscribedDeviceId.value}/heartbeats/basic`,
    ]);
  }
});

onMounted(async () => {
  console.log("deviceId::;", route.params.id, deviceId.value);
  await fetchTimeZones();
  await fetchDeviceDetailsById();
  await fetchDeviceOperationHistory(pageIndex.value, deviceId.value);
});
</script>
