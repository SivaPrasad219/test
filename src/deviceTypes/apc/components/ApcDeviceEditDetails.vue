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
                  :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
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

                <p
                  v-if="isTimezoneError"
                  style="color: red; font-size: 12px; margin-top: 4px"
                >
                  {{ timezoneErrorMessage }}
                </p>
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
                <span v-if="device.create_timestamp">{{
                  device.create_timestamp
                }}</span>
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
                :label="translateLabel('devicePage', 'Last Calibration Date')"
                :span="2"
              >
                {{ getFormattedTime(device?.info?.last_calibration_date) }}
              </a-descriptions-item>
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Next Calibration Date')"
                :span="2"
              >
                {{ getFormattedTime(device?.info?.next_calibration_date) }}
              </a-descriptions-item>
              <a-descriptions-item
                :label="translateLabel('devicePage', 'Firmware')"
                :span="2"
              >
                {{ device?.info?.firmware?.version }}
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
            <div class="image-container">
              <div v-if="!renderedImage" class="no-image">No Image</div>
              <img
                v-else
                id="myimage"
                class="devicePic"
                :src="renderedImage"
                alt="Device Image"
              />
              <div class="upload-overlay">
                <a-upload
                  :show-upload-list="false"
                  :before-upload="beforeUpload"
                  :custom-request="handleImageUpload"
                  accept="image/jpeg,image/png"
                >
                  <span class="upload-button">
                    <template v-if="renderedImage">
                      <EditOutlined />
                      Edit Image
                    </template>
                    <template v-else>
                      <UploadOutlined />
                      Upload Image
                    </template>
                  </span>
                </a-upload>
              </div>
            </div>
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
import { getFormattedTime } from "@/common/utils";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { apcApiServices } from "../services/apcService";
import { getSitesByActive, getDevicePictureById } from "@/services/apiService";
import { SocketService } from "@/services/socketService";
import { processHeartbeat, translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";
import { environment } from "@/environment/environment";
import { compareAssetTime } from "@/common/utils";
import { UploadOutlined, EditOutlined } from "@ant-design/icons-vue";

const route = useRoute();
const router = useRouter();
const apcService = new apcApiServices();
const isUpdateDisabled = ref(true);
const deviceId = ref(route.params.id as string);
const isLoadingOne = ref(false);
const isSpinning = ref(true);
const isUploading = ref(false);
const form: any = reactive({
  deviceNameInput: "",
  deviceLocation: "",
  selectedSite: null,
});
const { t } = useI18n();
const patchDeviceData = ref<any | null>(null);
const device = ref<any>(null);
const devicePicture = ref<any>(null);
const isOHTableLoading = ref(false);
const renderedImage = ref<any>(null);
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

const handleSiteChange = (siteOption: string) => {
  const siteOptionSelect = allSites.value.find(
    (each: any) => each.name === siteOption
  );
  form.selectedSite = siteOptionSelect || null;
  console.log("::: form.selectedSite", form.selectedSite);
  if (siteOptionSelect) {
    isUpdateDisabled.value = true; // Ensure it remains disabled
    // enableUpdateButton();
    // form.deviceLocation = "";
  }
  device.value = { ...device.value };
};

const fetchDeviceDetailsById = async () => {
  isSpinning.value = true;
  try {
    const response = await apcService.getDeviceDetailsById(deviceId.value);
    console.log(":: response device details ::", response.data[0]);

    const deviceData = response.data?.[0];
    if (!deviceData) {
      router.push("/not-found");
      return;
    }

    // Check both conditions
    const isActiveDevice = deviceData.is_active === true;
    const isConnected = deviceData.connection_status === "Connected";

    if (!isActiveDevice || !isConnected) {
      navigateToDevices();
      return;
    }

    // Set values only if valid
    device.value = deviceData;
    patchDeviceData.value = deviceData;
    meta.value = deviceData.meta;

    initialDeviceLocation.value = deviceData.meta?.location || "";
    form.deviceNameInput = deviceData.name;
    form.deviceLocation = deviceData.meta?.location;

    const siteId = +deviceData.site_id;
    const selectedSite = allSites.value.find((site: any) => site.id === siteId);
    if (selectedSite) {
      form.selectedSite = selectedSite;
    }

    console.log(":::::::formData", form, response);
    console.log(":::::::formDataMeta", deviceData.meta);
    isSpinning.value = false;

    if (deviceData?.picture_id) {
      await fetchPictureById(deviceData.picture_id);
    } else {
      renderedImage.value = null;
    }

    if (
      deviceData.asset_id &&
      subscribedDeviceId.value !== deviceData.asset_id
    ) {
      if (subscribedDeviceId.value) {
        socketService.leaveRooms([
          `instrument/apc/${subscribedDeviceId.value}/heartbeats/basic`,
        ]);
      }
      socketService.subscribeToRooms([
        `instrument/apc/${deviceData.asset_id}/heartbeats/basic`,
      ]);
      subscribedDeviceId.value = deviceData.asset_id;
    }
  } catch (error) {
    console.error("getDeviceDetailsByIdError", error);
    isSpinning.value = false;
  }
};

const selectedSiteTimezone = computed(() => {
  return form.selectedSite ? form.selectedSite.name : null;
});

const enableUpdateButton = () => {
  isTimezoneError.value = false;
  timezoneErrorMessage.value = "";
  isUpdateDisabled.value = false;
};

const disableUpdateButton = () => {
  isTimezoneError.value = true;
  timezoneErrorMessage.value =
    "Instrument time is out of sync with the selected site.";
  isUpdateDisabled.value = true;
};

const isTimezoneError = ref(false);
const timezoneErrorMessage = ref("");

const handleLocationInputChange = (value: string) => {
  form.deviceLocation = value;

  if (value !== initialDeviceLocation.value && !isTimezoneError.value) {
    enableUpdateButton();
  } else {
    isUpdateDisabled.value = true;
  }
};

const hasChanges = computed(() => {
  const currentData = {
    location: (form.deviceLocation || "").trim(),
    site: form.selectedSite ? +form.selectedSite?.id : null,
  };
  const originalData = {
    location: (patchDeviceData.value?.meta?.location || "").trim(),
    site: patchDeviceData.value ? +patchDeviceData.value?.site_id : null,
  };
  return JSON.stringify(currentData) === JSON.stringify(originalData);
});

const handleImageUpload = async ({ file }: { file: File }) => {
  isUploading.value = true;
  try {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      renderedImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Build payload based on table columns
    const fileNameParts = file.name.split(".");
    const originalImageName =
      fileNameParts.slice(0, -1).join(".") || "Unnamed Image";
    const suffix = fileNameParts.length > 1 ? fileNameParts.pop() : "png";

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const hexString = Array.from(uint8Array)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const byteaData = `\\x${hexString}`;
    const imageSize = file.size.toString();

    const formData: any = {
      name: originalImageName,
      suffix: suffix,
      original_image: byteaData,
      original_image_size: imageSize,
      low_definition_image: byteaData,
      low_definition_image_size: imageSize,
      medium_definition_image: byteaData,
      medium_definition_image_size: imageSize,
    };

    console.log("Uploading picture, device:", device.value);

    const method = device.value.picture_id ? "PATCH" : "POST";
    const pictureId = device.value.picture_id ?? null; // make sure it’s number or null

    const response = await apcService.uploadDevicePicture(
      formData,
      method,
      pictureId
    );

    if (response && response.status === "success") {
      const uploadedPictureId = response.data.picture_id; // ✅ correct nested access
      message.success(
        response.data.message ||
          t(
            "commonData.Image uploaded successfully",
            "Image uploaded successfully"
          )
      );

      // Update device details with new picture_id
      await apcService.updateDeviceDetailsById(
        { picture_id: uploadedPictureId },
        deviceId.value
      );

      // Refresh image preview
      await fetchPictureById(uploadedPictureId);
    } else {
      throw new Error(response.data?.message || "Upload failed");
    }
  } catch (error: any) {
    console.error("Image upload error:", error.message);
    if (device.value.picture_id) {
      await fetchPictureById(device.value.picture_id);
    } else {
      renderedImage.value = null;
    }
    message.error(
      error.message ||
        t("commonData.Failed to upload image", "Failed to upload image")
    );
  } finally {
    isUploading.value = false;
  }
};

const beforeUpload = (file: File) => {
  const isImage = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isImage) {
    message.error(
      t(
        "commonData.Only JPG/PNG files are allowed",
        "Only JPG/PNG files are allowed"
      )
    );
  }
  if (!isLt2M) {
    message.error(
      t(
        "commonData.Image must be smaller than 2MB",
        "Image must be smaller than 2MB"
      )
    );
  }
  return isImage && isLt2M;
};

const fetchPictureById = async (id: any) => {
  try {
    const pictureResponse = await getDevicePictureById(id);
    devicePicture.value = pictureResponse.data;
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
    renderedImage.value = null;
  }
};

const connectionText = computed(() => {
  if (
    device.value.connection_status?.toLowerCase() === "ready for use" ||
    device.value.connection_status?.toLowerCase() === "idle"
  ) {
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
  router.push("/apc/instrument");
};

const editDeviceDetails = async () => {
  isLoadingOne.value = true;
  let updateDevicePayload: any = {
    name: form.deviceNameInput,
    meta: {},
    site_id: +form.selectedSite.id || "",
  };
  updateDevicePayload.meta = { ...meta.value, isDeviceSync: true };
  if (updateDevicePayload.meta.location) {
    updateDevicePayload.meta.location = form.deviceLocation
      ? form.deviceLocation.trim()
      : form.deviceLocation;
  } else {
    updateDevicePayload.meta["location"] = form.deviceLocation
      ? form.deviceLocation.trim()
      : form.deviceLocation;
  }
  let comments = "";
  const ActualSelectedSite: any = allSites.value.find(
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
      router.push("/apc/instrument");
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
    assets.value = response?.data;
    assets.value.forEach((eachAsset: any) => {
      console.log("eachAssetData::::::::", eachAsset);
    });
    totalRecords.value = response?.pagination.totalCount;
  } catch (error) {
    console.log("fetchDeviceOperationHistory", error);
  }
  isOHTableLoading.value = false;
};

const handleSocketMessage = (incomingHeartbeat: any) => {
  const processedHeartbeat = processHeartbeat(incomingHeartbeat.msg);
  if (processedHeartbeat.basic.asset_id === device.value?.asset_id) {
    const assetTimeObj = processedHeartbeat.basic.asset_time;
    const siteTimezone = form.selectedSite?.site_timezone;
    const isTimeValid = compareAssetTime(assetTimeObj, siteTimezone);

    if (isTimeValid) {
      enableUpdateButton();
    } else {
      disableUpdateButton();
    }
    device.value = {
      ...device.value,
      connection_status: processedHeartbeat.basic?.status,
    };
  } else {
    console.log("Asset ID mismatch");
  }
};

socketService.handleMessage(handleSocketMessage);

onUnmounted(() => {
  if (subscribedDeviceId.value) {
    socketService.leaveRooms([
      `instrument/apc/${subscribedDeviceId.value}/heartbeats/basic`,
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

<style scoped>
.image-container {
  position: relative;
  width: 300px;
  height: 200px;
  overflow: hidden;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  font-weight: bold;
  color: #666;
}

.devicePic {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  background-color: #fff;
}
.upload-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-button {
  color: white;
  cursor: pointer;
  padding: 4px 8px;
}
</style>
