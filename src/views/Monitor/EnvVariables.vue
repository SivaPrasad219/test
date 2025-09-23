<template>
  <div>
    <pre>{{ parsedData }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router";
import { ref, onMounted } from "vue";
import { addDevice } from "@/services/apiService";

const route = useRoute();
const parsedData = ref({});
const selectedEdgemanIP = route.query.emIp as string;
console.log(route);
const selectedDeviceName = ref(route.params.deviceName);

const getEnv = async () => {
  const payload = {
    deviceName: selectedDeviceName.value,
    requestType: "getDeviceEnv",
  };
  const response = await addDevice(selectedEdgemanIP, payload);
  parsedData.value = response.env.env;
  console.log("deviceEnv", response);
};

onMounted(() => {
  // Retrieve and parse the data from the query param
  //   if (route.query.data) {
  //     parsedData.value = JSON.parse(route.query.data as string);
  //   }
  getEnv();
});
</script>

<style scoped>
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
}
</style>
