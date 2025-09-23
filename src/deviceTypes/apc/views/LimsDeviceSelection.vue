<template>
  <div class="lims-samples-view">
    <div
      style="
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 15px;
      "
    >
      <h1>{{ translateLabel("dataPage", "Choose Instrument") }}</h1>
      <a-button type="primary" @click="backToLims">{{
        translateLabel("devicePage", "Back")
      }}</a-button>
    </div>
    <SelectInstrumentComponent @instrumentSelected="onInstrumentSelected" />
    <a-modal
      v-model:open="isDeviceSelected"
      :loading="isStartLoading"
      @ok="handleOk"
      @cancel="handleModalClose"
      :cancelText="cancelText"
      width="1000px"
    >
      <a-descriptions
        :title="translateLabel('commonData', 'Instrument And Sample Details')"
        bordered
        :column="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 2 }"
      >
        <a-descriptions-item
          :label="translateLabel('commonData', 'Instrument Name')"
          >{{ selectedInstrument.name }}</a-descriptions-item
        >
        <a-descriptions-item
          :label="translateLabel('commonData', 'Serial #')"
          >{{ selectedInstrument.asset_id }}</a-descriptions-item
        >
        <a-descriptions-item
          :label="translateLabel('commonData', 'Sample Type')"
          >{{ analysisResponse?.meta?.sample_type }}</a-descriptions-item
        >
        <a-descriptions-item
          :label="translateLabel('commonData', 'Sample Volume')"
        >
          {{ analysisResponse?.sample_input?.volume }}
          {{
            analysisResponse?.sample_input?.volume_units?.short
          }}</a-descriptions-item
        >
        <a-descriptions-item :label="translateLabel('commonData', 'LIMS')">{{
          analysisResponse?.source
        }}</a-descriptions-item>
        <a-descriptions-item
          :label="translateLabel('commonData', 'Created By')"
          >{{ analysisResponse?.meta?.author }}</a-descriptions-item
        >
        <a-descriptions-item :label="translateLabel('commonData', 'Created')">{{
          formatMeasureTime(analysisResponse?.created_date, timeZone)
        }}</a-descriptions-item>
        <a-descriptions-item :label="translateLabel('commonData', 'LIMS ID')">{{
          analysisResponse?.lims_id
        }}</a-descriptions-item>
      </a-descriptions>

      <!-- Custom Footer -->
      <template #footer>
        <a-button key="cancel" @click="handleModalClose">
          {{ cancelText }}
        </a-button>
        <a-button
          key="ok"
          type="primary"
          @click="handleOk"
          :loading="isStartLoading"
          :disabled="
            startBtnDisabled ||
            selectedInstrument.actionStatus === 'In-Progress'
          "
        >
          {{ okText }}
        </a-button>
      </template>
    </a-modal>
    <!-- New E-Signature Modal -->
    <a-modal
      v-model:open="esignModalVisible"
      @ok="handleSampleStart"
      :title="`E-Signature needed for ${okText}`"
      @cancel="handleEsignCancel"
    >
      <a-form
        ref="formRef"
        :model="esignformData"
        :layout="formLayout"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        @submit.prevent="handleSampleStart"
        @keydown.enter.prevent="handleSampleStart"
        class="formConfirm"
      >
        <a-form-item
          :label="translateLabel('devicePage', 'Username')"
          name="username"
          :rules="[
            {
              required: true,
              message: translateLabel(
                'devicePage',
                'Please input your username!'
              ),
            },
          ]"
        >
          <a-input
            v-model:value="esignformData.username"
            :placeholder="translateLabel('devicePage', 'Enter your username')"
          >
            <template #prefix>
              <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          :label="translateLabel('devicePage', 'Password')"
          name="password"
          :rules="[
            {
              required: true,
              message: translateLabel(
                'devicePage',
                'Please input your password!'
              ),
            },
          ]"
        >
          <a-input
            :type="passwordVisible ? 'text' : 'password'"
            v-model:value="esignformData.password"
            :placeholder="translateLabel('devicePage', 'Enter your password')"
          >
            <template #prefix>
              <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
            <template #suffix>
              <a @click="togglePasswordVisibility">
                <EyeOutlined
                  v-if="passwordVisible"
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }"
                />
                <EyeInvisibleOutlined
                  v-else
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.25)' }"
                />
              </a>
            </template>
          </a-input>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="handleEsignCancel">
          {{ translateLabel("devicePage", "Cancel") }}
        </a-button>
        <a-button
          type="primary"
          @click="handleSampleStart"
          :disabled="
            !isFormValid || selectedInstrument.actionStatus === 'In-Progress'
          "
          :loading="isVerifyingSignature"
        >
          {{ translateLabel("devicePage", "Verify Signature & Start") }}
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatMeasureTime } from "@/common/utils";
import { translateLabel } from "@/common/utils";
import {
  fetchDataFromAPI,
  getLimsSamplesById,
} from "../../../services/apiService";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
import Ajv, { KeywordDefinition } from "ajv";
import { apcApiServices } from "../services/apcService";
import SelectInstrumentComponent from "../components/ApcSelectInstrumentComponent.vue";
import { esignConfirmLogin } from "@/services/apiService";
import { useStore } from "vuex";
import { message } from "ant-design-vue";
import eventBus from "@/services/eventBus";
import { useI18n } from "vue-i18n";

// Initialize services and AJV
const ajv = new Ajv({ allErrors: true, strict: false });
const apcService = new apcApiServices();
const formLayout = "horizontal";

// Refs
const isDeviceSelected = ref(false);
const selectedInstrument = ref<any>(null);
const sampleData = ref<any>(null);
const analysisRequestResponse = ref<any>(null);
const analysisResponse = ref<any>(null);
const store = useStore();
const deviceTypeId = computed(() => store.getters.getDeviceTypeId);
const route = useRoute();
const isStartLoading = ref(false);
const timeZone = ref("UTC");
const recordId = ref(route.params.id as string);
const router = useRouter();
const startBtnDisabled = ref(false);
const { t } = useI18n();

// E-Signature modal variables
const esignModalVisible = ref(false);
const passwordVisible = ref(false);
const isVerifyingSignature = ref(false);
const formRef = ref();
const esignformData = ref({
  username: "",
  password: "",
});

// AJV Custom Keywords
const xUnitKeyword: KeywordDefinition = {
  keyword: "x_unit",
  type: "string",
  validate: () => true,
  errors: false,
};

const xUnitShortKeyword: KeywordDefinition = {
  keyword: "x_unit_short",
  type: "string",
  validate: () => true,
  errors: false,
};

const xNiceNameKeyword: KeywordDefinition = {
  keyword: "x_nice_name",
  type: "string",
  validate: () => true,
  errors: false,
};

const labelKeyword: KeywordDefinition = {
  keyword: "label",
  type: "string",
  validate: () => true,
  metaSchema: { type: "string" },
};
const decodedTokenString = localStorage.getItem("DecodedToken");
let loggedInUsername = "";

if (decodedTokenString) {
  const decodedToken = JSON.parse(decodedTokenString);

  loggedInUsername = decodedToken.username;
}

ajv.addKeyword(xNiceNameKeyword);
ajv.addKeyword(xUnitKeyword);
ajv.addKeyword(xUnitShortKeyword);
ajv.addKeyword(labelKeyword);

// Computed properties
const okText = computed(() =>
  analysisResponse.value?.meta?.sample_type.includes("Flush")
    ? t("commonData.Start Flush", "Start Flush")
    : t("commonData.Start Sample", "Start Sample")
);

const cancelText = computed(() => t("commonData.Cancel", "Cancel"));

const isFormValid = computed(
  () =>
    esignformData.value.username.trim() !== "" &&
    esignformData.value.password.trim() !== ""
);

// Methods
const onInstrumentSelected = (instrument: any) => {
  selectedInstrument.value = instrument;
  isDeviceSelected.value = !!selectedInstrument.value;
};

const validateSample = async (assetID: any, payload: any) => {
  const response = await apcService.getApcAssetIdTaskDefinitions(assetID);
  console.log("response::::", response, payload);

  const inputProperties = response?.input?.properties;
  const delayTimeExists = inputProperties?.delay_time !== undefined;

  const data: any = {};

  if (delayTimeExists) {
    if (payload.params.delay_time === "") {
      data.delay_time = payload.params.delay_time;
    } else if (
      payload.params.delay_time >= inputProperties.delay_time.minimum &&
      payload.params.delay_time <= inputProperties.delay_time.maximum
    ) {
      data.delay_time = payload.params.delay_time;
    } else {
      console.error(
        `Invalid delay_time: Must be between ${inputProperties.delay_time.minimum} and ${inputProperties.delay_time.maximum}`
      );
      return false;
    }
  } else {
    if (
      payload.params.delay_time !== undefined &&
      payload.params.delay_time !== ""
    ) {
      console.error(
        "Invalid delay_time: delay_time is not part of the schema and has a value other than empty string."
      );
      return false;
    }
    if (payload.params.delay_time === "") {
      data.delay_time = payload.params.delay_time;
    }
  }

  if (payload.params.volume) {
    data.volume = {
      value: payload.params.volume.value,
      unit: payload.params.volume.unit,
    };
  }

  console.log("Validation Data:", data);
  console.log("Expected Schema:", response?.input);

  const validate = ajv.compile(response?.input);
  if (!ajv.getKeyword("useDefaults")) {
    console.log("Adding useDefaults keyword");
    ajv.addKeyword("useDefaults", true);
  }

  const valid = validate(data);
  console.log("Validation result:", valid);

  if (valid) {
    return true;
  } else {
    console.error("Validation errors:", validate.errors);
    return false;
  }
};

const handleOk = () => {
  esignModalVisible.value = true; // Open e-signature modal instead of directly processing
};

const handleSampleStart = async () => {
  try {
    isVerifyingSignature.value = true;
    console.log("Username:", esignformData.value.username);
    console.log("Password:", esignformData.value.password);

    const response = await esignConfirmLogin(esignformData.value);

    // Assuming loggedInUsername comes from esignformData or store
    const loggedInUsername = esignformData.value.username;

    if (!response) {
      message.error(
        `${t(
          "commonData.Authentication failed for",
          "Authentication failed for"
        )} "${loggedInUsername}"`
      );
      return "";
    }

    // Prepare payload only if login succeeds
    const payload = {
      job_def_id: 1,
      sample_type: analysisResponse.value?.meta?.sample_type,
      asset_type_id: JSON.parse(deviceTypeId.value),
      source: "LIMS",
      lims_sample_id: analysisResponse.value.id,
      asset_id: selectedInstrument.value.asset_id,
      session_id: analysisResponse.value?.meta?.analysis_request_id,
      params: {
        delay_time:
          analysisResponse.value?.meta?.sample_input?.delay_time &&
          analysisResponse.value?.meta?.sample_input?.delay_time.trim() !== ""
            ? JSON.parse(analysisResponse.value?.meta?.sample_input?.delay_time)
            : undefined,
        volume:
          analysisResponse.value?.meta?.sample_input?.volume &&
          analysisResponse.value?.meta?.sample_input?.volume.trim() !== ""
            ? {
                value: JSON.parse(
                  analysisResponse.value?.meta?.sample_input?.volume
                ),
                unit: analysisResponse.value?.meta?.sample_input?.volume_units
                  ?.short,
              }
            : undefined,
      },
    };

    const isValid = await validateSample(
      selectedInstrument.value.asset_id,
      payload
    );

    if (isValid) {
      isStartLoading.value = true;
      startBtnDisabled.value = true;

      let isSampleStartedOnDevice = await apcService.getApcLimsSampleById(
        payload.lims_sample_id
      );
      if (isSampleStartedOnDevice.data[0].status === "New") {
        const jobResponse = await apcService.createApcJob(payload);
        if (jobResponse) {
          message.success(jobResponse?.msg);
          esignModalVisible.value = false;
          isDeviceSelected.value = false;
          router.push("/apc/measure");
        }
      } else {
        message.error(
          t(
            "commonData.The selected sample is already running and cannot be started again.",
            "The selected sample is already running and cannot be started again."
          )
        );
      }
    } else {
      message.error(
        t(
          "commonData.Please choose another instrument which supports the sample/flush input data"
        )
      );
    }
  } catch (error) {
    console.error("Error in handleSampleStart:", error);
    message.error(
      `${t(
        "commonData.Authentication failed for",
        "Authentication failed for"
      )} "${loggedInUsername}"`
    );
    return "";
  } finally {
    isVerifyingSignature.value = false;
    isStartLoading.value = false;
    startBtnDisabled.value = false;
    // esignformData.value = { username: "", password: "" }; // Reset form
  }
};
const handleEsignCancel = () => {
  esignModalVisible.value = false;
  esignformData.value = { username: "", password: "" }; // Reset form
};

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const backToLims = () => {
  router.push("/apc/lims");
};

const handleModalClose = () => {
  isDeviceSelected.value = false;
};

const fetchData = async (id: string) => {
  try {
    const response = await getLimsSamplesById(id);
    if (!response) {
      router.push("/not-found");
      return;
    }
    if (response.data.status === "Reviewed") {
      router.push("/apc/lims");
      return;
    }
    analysisResponse.value = response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const resetComponentState = () => {
  eventBus.emit("clearChekboxAndMoveToStep1");
};

// Lifecycle hooks
onMounted(() => {
  store.dispatch("setCurrentStep", 0);
  fetchData(recordId.value);
});

// Watchers
watch(isDeviceSelected, (newValue) => {
  if (!newValue) {
    resetComponentState();
  }
});
</script>

<style scoped>
.formConfirm {
  margin-top: 20px;
}
</style>

<style scoped>
.lims-samples-view {
  padding: 20px;
  background-color: white;
}

.lims-samples-view h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.lims-samples-view p {
  font-size: 18px;
}

.lims-samples-view h2 {
  margin-top: 20px;
  font-size: 20px;
}
</style>
