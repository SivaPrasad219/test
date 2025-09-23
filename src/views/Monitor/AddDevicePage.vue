<template>
  <div class="add-details-page">
    <a-spin
      :spinning="isLoading"
      :tip="
        t(
          'monitorPage.Loading add instrument page',
          'Loading add instrument page'
        )
      "
    >
      <div class="header">
        <h2 v-if="!isUpdating" class="form-title">
          {{
            t(
              "monitorPage.Add New Instrument Configuration",
              "Add New Instrument Configuration"
            )
          }}
        </h2>
        <h2 v-else class="form-title">
          {{
            t(
              "monitorPage.Edit Instrument Configuration",
              "Edit Instrument Configuration"
            )
          }}
        </h2>
        <a-button
          type="primary"
          class="back-button"
          @click="$router.push(`/monitoring/${selectedEdgemanIP}`)"
        >
          {{ t("monitorPage.Back", "Back") }}
        </a-button>
      </div>
      <div class="add-device-form">
        <div>
          <div class="form-content">
            <a-form
              :model="formState"
              name="basic"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 16 }"
              labelAlign="right"
              autocomplete="off"
              :style="{ marginBottom: '8px' }"
            >
              <a-form-item
                :label="t('monitorPage.Name', 'Name')"
                class="form-items"
                name="name"
                :rules="[
                  {
                    required: true,
                    message: t(
                      'monitorPage.Please enter instrument name!',
                      'Please enter instrument name!'
                    ),
                  },
                ]"
              >
                <a-input
                  v-model:value="formState.name"
                  :disabled="isUpdating"
                  :placeholder="
                    t(
                      'monitorPage.Enter your instrument name here',
                      'Enter your instrument name here'
                    )
                  "
                />
              </a-form-item>

              <a-form-item
                :label="t('monitorPage.Description', 'Description')"
                name="description"
              >
                <a-textarea
                  v-model:value="formState.description"
                  :placeholder="
                    t(
                      'monitorPage.Enter a detailed description here',
                      'Enter a detailed description here'
                    )
                  "
                />
              </a-form-item>

              <a-form-item
                :label="t('monitorPage.Env Variables', 'Env Variables')"
              >
                <a-button
                  class="device-env-button"
                  @click="handleEnvVariablesShow"
                >
                  {{ t("monitorPage.Show", "Show") }}
                </a-button>
              </a-form-item>

              <a-form-item :label="t('monitorPage.Logs', 'Logs')">
                <div class="logs-size-div">{{ logsize }} KB</div>
              </a-form-item>

              <a-form-item
                :label="t('monitorPage.Version', 'Version')"
                name="version"
                :placeholder="
                  t('monitorPage.Enter a Version', 'Enter a Version')
                "
                :rules="[
                  {
                    required: true,
                    message: t(
                      'monitorPage.Please select a version!',
                      'Please select a version!'
                    ),
                  },
                ]"
              >
                <a-select
                  v-model:value="formState.version"
                  :disabled="isUpdating"
                  :placeholder="
                    t(
                      'monitorPage.Please select a version',
                      'Please select a version'
                    )
                  "
                  :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                >
                  <a-select-option
                    v-for="option in availableVersions"
                    :key="option"
                    :value="option"
                    >{{ option }}</a-select-option
                  >
                </a-select>
              </a-form-item>

              <a-form-item
                :label="t('monitorPage.Type', 'Type')"
                name="type"
                v-if="(selectedVersion as string)?.trim().length > 0"
                :rules="[
                  {
                    required: true,
                    message: t(
                      'monitorPage.Please select a type!',
                      'Please select a type!'
                    ),
                  },
                ]"
              >
                <a-select
                  v-model:value="formState.type"
                  :disabled="isUpdating"
                  :placeholder="
                    t(
                      'monitorPage.Please select a instrument type',
                      'Please select a instrument type'
                    )
                  "
                  :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                >
                  <a-select-option
                    v-for="option in availableTypes"
                    :key="option"
                    :value="option"
                    >{{ option }}</a-select-option
                  >
                </a-select>
              </a-form-item>

              <a-form-item
                :label="t('monitorPage.Model', 'Model')"
                name="model"
                v-if="(selectedType as string)?.trim().length > 0"
                :rules="[
                  {
                    required: true,
                    message: t(
                      'monitorPage.Please select a model!',
                      'Please select a model!'
                    ),
                  },
                ]"
              >
                <a-select
                  v-model:value="formState.model"
                  :disabled="isUpdating"
                  :placeholder="
                    t(
                      'monitorPage.Please select a instrument model',
                      'Please select a instrument model'
                    )
                  "
                  :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                >
                  <a-select-option
                    v-for="option in availableModels"
                    :key="option"
                    :value="option"
                    >{{ option }}</a-select-option
                  >
                </a-select>
              </a-form-item>
            </a-form>

            <div class="buttons-container">
              <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                <a-button @click="handlePageReset" class="reset-button">{{
                  t("monitorPage.Reset", "Reset")
                }}</a-button>
              </a-form-item>
              <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                <a-button
                  class="submit-button"
                  type="primary"
                  :disabled="
                    !isAllFieldsValid || (isUpdating && !isFormChanged)
                  "
                  html-type="submit"
                  :loading="isSubmitting"
                  @click="handleSubmit"
                >
                  {{ t("monitorPage.Submit", "Submit") }}
                </a-button>
              </a-form-item>
            </div>
          </div>
        </div>

        <div class="options-content">
          <div
            v-if="(selectedModel as string).trim().length > 0"
            class="config-form"
          >
            <h3 class="section-title">
              {{ t("monitorPage.Standard Options", "Standard Options") }}
            </h3>
            <a-row :gutter="[8, 4]">
              <a-col :span="12" v-for="opt in standardOptions" :key="opt.key">
                <a-row type="flex" class="field-row">
                  <a-col :span="11">
                    <a-form-item>
                      <span class="custom-label">{{
                        opt.key.split("_").join(" ")
                      }}</span>
                    </a-form-item>
                  </a-col>
                  <a-col :span="1">
                    <span class="colon">:</span>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item>
                      <a-input
                        v-model:value="formState[opt.key]"
                        :placeholder="`Enter ${opt.key}`"
                        @input="opt.value.default = $event.target.value"
                        class="custom-input"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-col>
            </a-row>
          </div>

          <a-button
            v-if="(selectedModel as string).trim().length > 0"
            class="toggle-options-button"
            @click="toggleAdvancedOptions"
            >{{
              showAdvancedOptions
                ? t("monitorPage.Hide", "Hide")
                : t("monitorPage.Show", "Show")
            }}
            {{ t("monitorPage.Advanced Options", "Advanced Options") }}
          </a-button>

          <div v-if="showAdvancedOptions" class="config-form">
            <h3 class="section-title">
              {{ t("monitorPage.Advanced Options", "Advanced Options") }}
            </h3>
            <a-row :gutter="[8, 4]">
              <a-col :span="12" v-for="opt in OptionsShowInUi" :key="opt.key">
                <a-row type="flex" class="field-row">
                  <a-col :span="11">
                    <a-form-item>
                      <span class="custom-label">{{
                        opt.key.split("_").join(" ")
                      }}</span>
                    </a-form-item>
                  </a-col>
                  <a-col :span="1">
                    <span class="colon">:</span>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item>
                      <a-input
                        v-model:value="formState[opt.key]"
                        :placeholder="`Enter ${opt.key}`"
                        @input="opt.value.default = $event.target.value"
                        class="custom-input"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-col>
            </a-row>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
import {
  getMonitorDataByIp,
  fetchVersionTypeModelByEmIp,
  fetchDeviceOptionsByVersion,
  addDevice,
  getAllDevicesData,
  getLogSizeByDeviceName,
} from "@/services/apiService";
// deviceList api,
type FormState = {
  name: string;
  description: string;
  version: string | null;
  type: string | null;
  model: string | null;
  [key: string]: string | null;
};
const isInitializing = ref(false);
const initialFormState = ref<FormState | null>(null);
const logsize = ref(0.0);
const availableVersions = ref<any[]>([]);
const selectedVersion = ref<string | null>("");
const availableTypes = ref<string[]>([]);
const selectedType = ref<string | null>("");
const availableModels = ref<string[]>([]);
const selectedModel = ref<string | null>("");
const standardOptions = ref<{ key: string; value: any }[]>([]);
const advancedOptions = ref<{ key: string; value: any }[]>([]);
const OptionsShowInUi = ref<{ key: string; value: any }[]>([]);
const formState = ref<FormState>({
  name: "",
  description: "",
  version: null,
  type: null,
  model: null,
});
const socketService = new SocketService(`${environment.MONITORING_URL}`, "ms");
const showAdvancedOptions = ref(false);
const deviceOptions = ref<Record<string, any>>();
const isAllFieldsValid = ref(false);
const route = useRoute();
const router = useRouter();
const selectedEdgemanIP = route.params.edgemanIp as string;
const versionTypeModelData = ref(null);

const subscribedTopic = `instrument/apc/edgeman/${selectedEdgemanIP}`;

const lastHeartbeat = ref<number | null>(null);
const HEARTBEAT_TIMEOUT = 5000;
const edgemanData: any = ref(null);

const isSubmitting = ref(false);
const isUpdating = route.params.action === "editInstrument";
const selectedDeviceName = ref("");
const envData = ref();
const isFormChanged = ref(false);
console.log("isUpdating", isUpdating);

const handleEnvVariablesShow = async () => {
  await getEnv();
  if (!envData.value) {
    console.error("error in fetching env data");
  }
  router.push({
    path: `/monitoring/device/${selectedDeviceName.value}/env`,
    query: { emIp: selectedEdgemanIP }, // Passing data as query param
  });
};

function isValidName() {
  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  return nameRegex.test(formState.value.name);
}

const isFieldNeedToHide = (opt: any) => {
  return opt.key.split("_")[0] !== "MQ";
};

const validateFields = (newVal: any) => {
  // remove special characters, except underscore and -

  isAllFieldsValid.value =
    newVal.name?.trim() !== "" &&
    newVal.version?.trim() &&
    newVal.type?.trim() &&
    newVal.model?.trim();
};

const isLoading = ref(true);

const validateDeviceOptions = (options: any) => {
  const errors: any[] = [];
  for (const key in deviceOptions.value) {
    const schemaField = deviceOptions.value[key];
    let value = options[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== deviceOptions.value[key].type) {
      if (deviceOptions.value[key].type === "string") {
        options[key] = value.toString();
      } else if (deviceOptions.value[key].type === "number") {
        options[key] = value.toInteger();
      } else if (schemaField.enum && !schemaField.enum.includes(value)) {
        errors.push(
          `${key} has invalid value "${value}". Allowed values: ${schemaField.enum.join(
            ", "
          )}`
        );
        message.error(
          `${key} has invalid value "${value}". Allowed values: ${schemaField.enum.join(
            ", "
          )}`
        );
        return [];
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors?.join("; ")}`);
  }

  return options;
};

const handleSubmit = async () => {
  try {
    isSubmitting.value = true;
    if (!isValidName()) {
      message.error(
        t(
          "monitorPage.Please enter only alphanumeric characters, underscores for the Name",
          "Please enter only alphanumeric characters, underscores for the Name"
        )
      );
      isSubmitting.value = false;
      return;
    }
    await new Promise((res) => setTimeout(res, 3000));

    if (!edgemanData.value) {
      message.error(
        t(
          "monitorPage.EM disconnected: try again after sometime",
          "EM disconnected: try again after sometime"
        )
      );
      isSubmitting.value = false;
      return;
    }
    const { name, description, version, type, model, ...deviceOptions } =
      formState.value;
    if (validateDeviceOptions(deviceOptions).length === 0) {
      isSubmitting.value = false;
      return;
    }
    const payload = {
      description: description,
      name: name,
      version: version,
      type: type,
      model: model,
      env: validateDeviceOptions(deviceOptions),
      requestType: "addDevice",
    };
    if (isUpdating) {
      payload.requestType = "updateDevice";
    }

    if (
      Object.keys(edgemanData.value?.meta?.devices).includes(
        formState.value.name
      ) &&
      !isUpdating
    ) {
      message.error(
        t(
          `monitorPage.Instrument with instrumentName name is already exists`,
          "Instrument with instrumentName name is already exists"
        ).replace("instrumentName", formState.value.name)
      );
      isSubmitting.value = false;
      return;
    }

    const response = await addDevice(selectedEdgemanIP, payload);

    if (response) {
      if (isUpdating) {
        message.success(
          t(
            `monitorPage.Instrument with instrumentName updated successfully`,
            "Instrument with instrumentName updated successfully"
          ).replace("instrumentName", formState.value.name)
        );
      } else {
        message.success(
          t(
            `monitorPage.Instrument with instrumentName added successfully`,
            "Instrument with instrumentName added successfully"
          ).replace("instrumentName", formState.value.name)
        );
      }
    }
    isSubmitting.value = false;
    handleBack();
  } catch (error) {
    if (isUpdating) {
      message.error(
        t(
          "monitorPage.Something went wrong in updating instrument",
          "Something went wrong in updating instrument"
        ) + ` ${formState.value.name}`
      );
    } else {
      message.error(
        t(
          "monitorPage.Something went wrong in adding instrument",
          "Something went wrong in adding instrument"
        ) + ` ${formState.value.name}`
      );
    }

    isSubmitting.value = false;
    console.log(error);
  }
};

const getEnv = async () => {
  const payload = {
    deviceName: selectedDeviceName.value,
    requestType: "getDeviceEnv",
  };
  const response = await addDevice(selectedEdgemanIP, payload);
  envData.value = response.env;
  console.log("deviceEnv", response);
};

const getLogSize = async () => {
  const payload = {
    deviceName: selectedDeviceName.value,
    requestType: "getLogSize",
  };
  const response = await getLogSizeByDeviceName(selectedEdgemanIP, payload);
  console.log("responseresponse", response.logsize);
  logsize.value = parseFloat((response.logsize / 1024).toFixed(3));
};

const getDeviceData = async () => {
  const payload = {
    requestType: "getAllDevices",
  };

  const response = await getAllDevicesData(selectedEdgemanIP, payload);
  console.log("getAllDevices", response);
  const selectedDevice = response.data[selectedDeviceName.value];
  console.log("selectedDevice", selectedDevice);
  Object.keys(selectedDevice).forEach((key) => {
    if (key === "version") selectedVersion.value = selectedDevice.version;
    if (key === "type") selectedType.value = selectedDevice.type;
    if (key === "model") selectedModel.value = selectedDevice.model;

    if (key === "env") {
      Object.keys(selectedDevice.env).forEach((envFields) => {
        formState.value[envFields] = selectedDevice.env[envFields];
      });
    } else {
      formState.value[key] = selectedDevice[key];
    }
  });

  initialFormState.value = JSON.parse(JSON.stringify(formState.value));
};

const handleBack = () => {
  router.push(`/monitoring/${selectedEdgemanIP}`);
};

const handlePageReset = () => {
  formState.value.name = "";
  formState.value.description = "";
  formState.value.version = null;
  formState.value.type = null;
  formState.value.model = null;
};

const resetFieldsBySelectInputChange = (field: string) => {
  if (isInitializing.value) return;
  if (field === "version") {
    formState.value.type = null;
  }
  formState.value.model = null;
  showAdvancedOptions.value = false;
};

const toggleAdvancedOptions = () => {
  if (showAdvancedOptions.value) {
    showAdvancedOptions.value = false;
  } else {
    showAdvancedOptions.value = true;
  }
};
//

const fetchDeviceOptions = async (version: string) => {
  try {
    const payload = {
      requestType: "deviceoptions",
      deviceName: selectedModel.value,
      version: version,
    };
    const response = await fetchDeviceOptionsByVersion(
      selectedEdgemanIP,
      payload
    );
    deviceOptions.value = response.options;
    splitDeviceOptions();
  } catch (error) {
    message.error(
      t(
        "monitorPage.Request timed out, No response received",
        "Request timed out, No response received"
      )
    );
    selectedModel.value = "";
    formState.value.model = null;
    console.error(error);
  }
};

const splitDeviceOptions = async () => {
  if (deviceOptions.value && typeof deviceOptions.value === "object") {
    const options = Object.entries(deviceOptions.value).map(([key, value]) => ({
      key,
      value,
    }));
    standardOptions.value = options.filter(
      (option) => option.value["x-visibility"] === "standard"
    );
    advancedOptions.value = options.filter(
      (option) => option.value["x-visibility"] === "advanced"
    );

    OptionsShowInUi.value = options.filter(
      (option) =>
        option.value["x-visibility"] === "advanced" && isFieldNeedToHide(option)
    );

    standardOptions.value.forEach((opt: any) => {
      formState.value[opt.key] =
        opt.value.default.toString().length > 0 ? opt.value.default : "";
    });

    advancedOptions.value.forEach((opt: any) => {
      formState.value[opt.key] =
        opt.value.default.toString().length > 0 ? opt.value.default : "";
    });
  }
  if (isUpdating) {
    await getDeviceData();
  }
};

let heartbeatCheckInterval: ReturnType<typeof setTimeout> | null = null;

const scheduleHeartbeatCheck = () => {
  // debouncing , reduce this api calls monitor.

  if (heartbeatCheckInterval) {
    clearTimeout(heartbeatCheckInterval);
  }
  // Schedule a check after HEARTBEAT_TIMEOUT
  heartbeatCheckInterval = setTimeout(() => {
    if (
      lastHeartbeat.value &&
      Date.now() - lastHeartbeat.value > HEARTBEAT_TIMEOUT
    ) {
      edgemanData.value = null;
      console.log("No recent heartbeat, falling back to initial data");
    }
  }, HEARTBEAT_TIMEOUT - 1000);
};

const subscribeToDynamicTopics = () => {
  socketService.subscribeToRooms([subscribedTopic]);
  socketService.addEventListener("connect", () =>
    console.log("Socket Connected")
  );
  socketService.addEventListener("disconnect", () => {
    console.log("Socket Disconnected");
    lastHeartbeat.value = null;
    if (heartbeatCheckInterval) {
      clearTimeout(heartbeatCheckInterval);
    }
  });
  socketService.addEventListener("error", (error: any) =>
    console.error("Socket Error:", error)
  );
  socketService.handleEdgemanMessage((data: any) => {
    data = data?.msg;
    if (typeof data === "string") data = JSON.parse(data);

    const edgemanIp = data?.edgemanIp;
    const emData = data?.emData;
    if (!edgemanIp || !emData) {
      console.error("Invalid message data - missing edgemanIp or emData", {
        edgemanIp,
        emData,
      });
      return;
    }
    if (selectedEdgemanIP && edgemanIp !== selectedEdgemanIP) {
      return;
    }

    const hardwareName = emData?.network?.hardwareName || "Supermicro";
    let newData;

    newData = {
      ip: edgemanIp,
      meta: {
        network: JSON.parse(JSON.stringify(emData.network || {})),
        platforms: JSON.parse(JSON.stringify(emData.platforms || {})),
        devices: JSON.parse(JSON.stringify(emData.devices || {})),
        isFileUploading: emData?.isFileUploading,
      },
      host_type: hardwareName,
      is_connected: "connected",
    };
    edgemanData.value = newData;

    lastHeartbeat.value = Date.now(); // Update heartbeat timestamp
    scheduleHeartbeatCheck();
  });
};

const socketConnectionBasedOnTopic = () => {
  socketService.connectSocket();
  socketService.leaveRooms([subscribedTopic]);
  subscribeToDynamicTopics();
};
const isIpExists = async () => {
  const response = await getMonitorDataByIp(selectedEdgemanIP);
  if (response.data.length === 0) {
    router.push("/not-found");
  }
};
const fetchVersionTypeModel = async () => {
  try {
    const payload = {
      requestType: "versiontypemodel",
    };
    const response = await fetchVersionTypeModelByEmIp(
      selectedEdgemanIP,
      payload
    );
    versionTypeModelData.value = response.data || {};
    availableVersions.value =
      Object.keys(versionTypeModelData.value || {}) || [];
  } catch (error) {
    message.error(
      t(
        "monitorPage.Request timed out, No response received",
        "Request timed out, No response received"
      )
    );
    selectedVersion.value = "";
    formState.value.version = null;
    console.error(error);
  }
};

watch(
  () => formState.value,
  (newVal) => {
    console.log("changed made", formState.value);
    validateFields(newVal);
    if (initialFormState.value) {
      isFormChanged.value =
        JSON.stringify(newVal) !== JSON.stringify(initialFormState.value);
    }
  },
  { deep: true }
);

watch(
  () => formState.value.version,
  (newVal: string | null) => {
    console.log(newVal);
    selectedVersion.value = newVal;
    resetFieldsBySelectInputChange("version");
    availableTypes.value = Object.keys(
      versionTypeModelData.value?.[newVal as string] || {}
    );
  }
);

watch(
  () => formState.value.type,
  (newVal: string | null) => {
    console.log("selected new type", newVal);
    resetFieldsBySelectInputChange("type");

    if (formState.value.type === null) selectedType.value = "";
    else selectedType.value = newVal;

    if (selectedVersion.value && newVal) {
      availableModels.value = Object.keys(
        versionTypeModelData.value?.[selectedVersion.value]?.[newVal] || {}
      );
    }
  }
);

watch(
  () => formState.value.model,
  async (newVal: string | null) => {
    console.log("selected new model", newVal);
    if (formState.value.model === null) selectedModel.value = "";
    else selectedModel.value = newVal;
    showAdvancedOptions.value = false;

    if (selectedVersion.value) {
      console.log("reaching here");
      await fetchDeviceOptions(selectedVersion.value);
    }
  }
);

onMounted(async () => {
  await fetchVersionTypeModel();
  isLoading.value = false;
  if (isUpdating) {
    isInitializing.value = true;
    selectedDeviceName.value = route.params.instrumentName as string;
    await getLogSize();
    await getDeviceData();
    isInitializing.value = false;
  }
  isIpExists();
  socketConnectionBasedOnTopic();
});
</script>

<style scoped>
.add-details-page {
  padding: 16px;
  min-height: 90vh;
  background-color: #fff;
  margin: 1rem 0px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-content {
  min-width: 30vw;
  margin-top: 16px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.options-content {
  width: 60vw;
}

.add-device-form {
  gap: 20px;
  display: flex;
  max-width: 1200px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
}

.ant-form .ant-form-item {
  margin-bottom: 4px !important;
}

.ant-input,
.ant-select-selector,
.ant-textarea {
  border-radius: 6px;
  border-color: #d9d9d9;
  transition: border-color 0.3s;
}

.ant-input:focus,
.ant-select-focused .ant-select-selector,
.ant-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ant-select-selection-placeholder {
  color: #999;
  font-style: italic;
}

.custom-label {
  font-size: 11px;
  line-break: anywhere;
  font-weight: bold;
  text-wrap: wrap;
  color: #333;
  text-align: left;
}

.colon {
  text-align: center;
  color: #666;
  padding: 0 8px;
}

.custom-input .ant-input {
  text-align: left;
  border-radius: 6px;
  border-color: #d9d9d9;
  padding: 6px 12px;
}

.custom-input .ant-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.config-form {
  margin-top: 16px;
  background-color: #fff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.field-row {
  align-items: baseline;
}

.field-row .ant-col .ant-form-item {
  margin-bottom: 4px !important;
}

.buttons-container {
  display: flex;
  justify-content: space-evenly;
  margin-top: 16px;
}

.reset-button {
  background-color: #fff;
  border-color: #d9d9d9;
  color: #333;
}

.device-env-button {
  display: flex;
  justify-content: center;
  padding: 4px 10px !important;
  background-color: #c7c7c7;
  border-color: #d9d9d9;
  /* Disable focus and hover effects */
  &:focus,
  &:hover,
  &:active {
    color: #1a1a1a;
    background-color: #c7c7c7 !important;
    border-color: #d9d9d9 !important;
    box-shadow: none !important;
    outline: none !important;
  }
}

.logs-size-div {
  padding-left: 4px;
}

.toggle-options-button {
  margin: 0.4rem auto;
  display: flex;
  justify-content: center;
  background-color: #c7c7c7;
  border-color: #d9d9d9;
  /* Disable focus and hover effects */
  &:focus,
  &:hover,
  &:active {
    color: #1a1a1a;
    background-color: #c7c7c7 !important;
    border-color: #d9d9d9 !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
</style>
