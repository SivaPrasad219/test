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
          :disabled="startBtnDisabled"
        >
          {{ okText }}
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
import Ajv, { KeywordDefinition } from "ajv";
const ajv = new Ajv({ allErrors: true, strict: false });
import { apcApiServices } from "../services/apcService";
import SelectInstrumentComponent from "../components/ApcSelectInstrumentComponent.vue";
import { useStore } from "vuex";
import { message } from "ant-design-vue";
import eventBus from "@/services/eventBus";
import { useI18n } from "vue-i18n";
// Refs
const apcService = new apcApiServices();
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
const xUnitKeyword: KeywordDefinition = {
  keyword: "x_unit",
  type: "string",
  validate: () => true,
  errors: false,
};

// Define the custom keyword for unit short
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

ajv.addKeyword(xNiceNameKeyword);

ajv.addKeyword(xUnitKeyword);
ajv.addKeyword(xUnitShortKeyword);

const labelKeyword: KeywordDefinition = {
  keyword: "label",
  type: "string",
  validate: () => true,
  metaSchema: {
    type: "string",
  },
};

ajv.addKeyword(labelKeyword);
const onInstrumentSelected = (instrument: any) => {
  selectedInstrument.value = instrument;
  isDeviceSelected.value = !!selectedInstrument.value;
};

const okText = computed(() =>
  analysisResponse.value?.meta?.sample_type.includes("Flush")
    ? t("commonData.Start Flush", "Start Flush")
    : t("commonData.Start Sample", "Start Sample")
);
const cancelText = computed(() => t("commonData.Cancel", "Cancel"));

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
  ajv.addKeyword("useDefaults", true);

  const valid = validate(data);
  console.log("Validation result:", valid);

  if (valid) {
    return true;
  } else {
    console.error("Validation errors:", validate.errors);
    return false;
  }
};

// Updated handleOk function
const handleOk = async (e: MouseEvent) => {
  isStartLoading.value = true;
  startBtnDisabled.value = true;
  console.log("analysisResponse.value", analysisResponse.value.meta, e);
  console.log("payLoad.value", analysisResponse.value);

  let payload = {
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
    try {
      console.log("Final Payload:", payload);
      let isSampleStartedOnDevice = await apcService.getApcLimsSampleById(
        payload.lims_sample_id
      );
      if (isSampleStartedOnDevice.data[0].status === "New") {
        const response = await apcService.createApcJob(payload);
        console.log("createApcJob response:", response);

        if (response) {
          message.success(response?.msg);
          isStartLoading.value = false;
          router.push("/ams/measure");
        }
      } else {
        message.error(t("commonData.Sample is already running."));
      }
    } catch (error) {
      isStartLoading.value = false;
      startBtnDisabled.value = false;
      console.error("createApcJob error:", error);
    }
  } else {
    isStartLoading.value = false;
    startBtnDisabled.value = false;
    message.error(
      t(
        "commonData.Please choose another instrument which supports the sample/flush input data"
      )
    );
  }
};

const backToLims = () => {
  router.push("/ams/lims");
};

const handleModalClose = () => {
  isDeviceSelected.value = false;
};

const fetchData = async (id: string) => {
  try {
    const response = await getLimsSamplesById(id);
    console.log("responseLimsSampleById", response);
    analysisResponse.value = response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const resetComponentState = () => {
  eventBus.emit("clearChekboxAndMoveToStep1");
};

onMounted(() => {
  store.dispatch("setCurrentStep", 0);
  fetchData(recordId.value);
});

watch(isDeviceSelected, (newValue) => {
  if (!newValue) {
    resetComponentState();
  }
});
</script>

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
