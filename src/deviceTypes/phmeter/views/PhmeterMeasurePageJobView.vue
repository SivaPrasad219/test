<template>
  <div class="measure-job-view">
    <a-steps direction="vertical" :current="currentStep">
      <a-step
        :title="translateLabel('devicePage', 'Step 1 - Instrument Selection')"
      >
        <template #description>
          <div class="step1-select-instrument">
            <a-card class="card">
              <SelectInstrumentComponent
                @instrumentSelected="onInstrumentSelected"
              />
              <div
                v-if="currentStep < 1"
                class="actions"
                style="margin-top: -40px"
              >
                <a-button
                  v-if="currentStep < 1"
                  type="primary"
                  @click="nextStep"
                  :disabled="
                    !isDeviceSelected ||
                    selectedAssetData.connection_status === 'disconnected'
                  "
                  >{{ translateLabel("devicePage", "Next") }}</a-button
                >
              </div>
            </a-card>
          </div>
        </template>
      </a-step>
      <a-step
        :title="translateLabel('devicePage', 'Step 2 - Instrument Operation')"
      >
        <template #description>
          <div class="selectCard" v-if="currentStep === 1">
            <SelectSampleApcComponent
              v-if="selectedAssetData"
              :selectedAssetData="selectedAssetData ? selectedAssetData : null"
              @currentStep="resetToStepZero"
              @prevStep="prevStep"
            />
            <div
              class="actions"
              style="padding-left: 12px; padding-bottom: 12px"
            >
              <a-button
                v-if="currentStep > 0"
                @click="prevStep"
                class="previous-btn"
                >{{ translateLabel("devicePage", "Previous") }}</a-button
              >
            </div>
          </div>
        </template>
      </a-step>
    </a-steps>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import SelectInstrumentComponent from "../components/PhmeterSelectInstrumentComponent.vue";
import SelectSampleApcComponent from "../components/PhmeterSelectSampleComponent.vue";
import eventBus from "@/services/eventBus";
import { useStore } from "vuex";
import { translateLabel } from "@/common/utils";

export default defineComponent({
  components: {
    SelectInstrumentComponent,
    SelectSampleApcComponent,
  },
  setup() {
    const store = useStore();
    const currentStep = ref(0);
    const selectedInstrument = ref<any>(null);
    const isDeviceSelected = ref(false);
    const selectedAssetData = ref<any>(null);

    const onInstrumentSelected = (instrument: any) => {
      selectedInstrument.value = instrument;
      console.log("onInstrumentSelected", selectedInstrument.value);
      if (selectedInstrument.value) {
        isDeviceSelected.value = true;
        selectedAssetData.value = selectedInstrument.value;
      } else {
        isDeviceSelected.value = false;
      }
    };

    const resetToStepZero = () => {
      currentStep.value = 0;
      store.dispatch("setCurrentStep", currentStep.value);
    };

    const nextStep = () => {
      currentStep.value += 1;
      store.dispatch("setCurrentStep", currentStep.value);
    };

    const prevStep = () => {
      currentStep.value -= 1;
      store.dispatch("setCurrentStep", currentStep.value);
      if (currentStep.value == 0) {
        eventBus.emit("clearChekboxAndMoveToStep1");
        selectedInstrument.value = null;
        isDeviceSelected.value = false;
      }
    };
    onMounted(() => {
      store.dispatch("setCurrentStep", currentStep.value);
    });

    return {
      currentStep,
      selectedInstrument,
      isDeviceSelected,
      selectedAssetData,
      onInstrumentSelected,
      resetToStepZero,
      nextStep,
      prevStep,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.actions {
  text-align: left;
  background-color: white;
}
</style>
