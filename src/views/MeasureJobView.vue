<template>
  <div class="measure-job-view">
    <a-steps direction="vertical" :current="currentStep">
      <a-step title="Step 1">
        <template #description>
          <a-card class="card">
            <SelectInstrumentComponent
              @instrumentSelected="onInstrumentSelected"
            />
            <div class="actions">
              <a-button
                v-if="currentStep < 1"
                type="primary"
                @click="nextStep"
                :disabled="!isDeviceSelected"
                >Next</a-button
              >
            </div>
          </a-card>
        </template>
      </a-step>
      <a-step title="Step 2">
        <template #description>
          <a-card class="card" v-if="currentStep === 1">
            <SelectSampleHpComponent
              v-if="selectedAssetId"
              :selectedAssetId="selectedAssetId ? selectedAssetId : null"
              @currentStep="resetToStepZero"
            />
            <div class="actions">
              <a-button v-if="currentStep > 0" @click="prevStep"
                >Previous</a-button
              >
            </div>
          </a-card>
        </template>
      </a-step>
    </a-steps>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SelectInstrumentComponent from "../components/SelectInstrumentComponent.vue";
import SelectSampleHpComponent from "../components/SelectSampleComponent.vue";

const currentStep = ref(0);
const selectedInstrument = ref(null);
const isDeviceSelected = ref(false);
let selectedAssetId = ref(null);

const onInstrumentSelected = (instrument: any) => {
  selectedInstrument.value = instrument;
  console.log("onInstrumentSelected", selectedInstrument.value);
  if (selectedInstrument.value) {
    isDeviceSelected.value = true;
    selectedAssetId = selectedInstrument;
  } else {
    isDeviceSelected.value = false;
  }
};

const resetToStepZero = () => {
  currentStep.value = 0;
};

const nextStep = () => {
  currentStep.value += 1;
};

const prevStep = () => {
  currentStep.value -= 1;
};
</script>

<style scoped>
.actions {
  /* margin-top: 24px; */
  text-align: left;
}
</style>
