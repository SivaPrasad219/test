<template>
  <div>
    <div class="data-container">
      <div class="data-section">
        <h2>Measurement Data</h2>
        <div v-if="measurementDataKeys.length > 0">
          <div
            v-for="(key, index) in measurementDataKeys"
            :key="index"
            class="data-item"
          >
            <div v-if="key !== 'cumulativedata' && key !== 'differentialdata'">
              <p>
                <strong
                  >{{ mockTaskResultData.measurmentData[key].title }}:</strong
                >
                {{ mockTaskResultData.measurmentData[key].dataIndex }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="data-section">
        <h2>Data Details</h2>
        <div class="data-details">
          <div class="data-subsection">
            <h3>Cumulative Data</h3>
            <div v-if="mockTaskResultData.measurmentData.cumulativedata">
              <div
                v-for="(subItem, index) in mockTaskResultData.measurmentData
                  .cumulativedata"
                :key="index"
              >
                <p v-for="(value, subKey) in subItem" :key="subKey">
                  <strong>{{ subKey }}:</strong> {{ value }}
                </p>
              </div>
            </div>
          </div>
          <div class="data-subsection">
            <h3>Differential Data</h3>
            <div v-if="mockTaskResultData.measurmentData.differentialdata">
              <div
                v-for="(subItem, index) in mockTaskResultData.measurmentData
                  .differentialdata"
                :key="index"
              >
                <p v-for="(value, subKey) in subItem" :key="subKey">
                  <strong>{{ subKey }}:</strong> {{ value }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-container">
      <div class="data-section">
        <h2>Instrument Data</h2>
        <div
          v-for="(item, key) in mockTaskResultData.instrumentData"
          :key="key"
          class="data-item"
        >
          <p>
            <strong>{{ item.title }}:</strong> {{ item.dataIndex }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import mockTaskResultData from "./mockTaskResultData.json";

export default defineComponent({
  setup() {
    onMounted(async () => {
      console.log("::::::::::::mockTaskResultData", mockTaskResultData);
    });

    const measurementDataKeys = Object.keys(
      mockTaskResultData.measurmentData
    ).filter((key) => key !== "cumulativedata" && key !== "differentialdata");

    return {
      mockTaskResultData,
      measurementDataKeys,
    };
  },
});
</script>

<style scoped>
h1,
h2,
h3 {
  margin: 0.5em 0;
}

p {
  margin: 0.2em 0;
}

.data-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.data-section {
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.data-item {
  margin-bottom: 10px;
}

.data-details {
  display: flex;
  justify-content: space-between;
}

.data-subsection {
  flex: 1;
  margin-right: 10px;
}

.data-subsection:last-child {
  margin-right: 0;
}
</style>
