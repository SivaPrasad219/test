<template>
  <a-result
    status="403"
    title="403"
    sub-title="Sorry, you are not authorized to access this page."
  >
    <template #extra>
      <a-button type="primary" @click="backToHome">Back Home</a-button>
    </template>
  </a-result>
</template>

<script>
import router from "@/router";

export default {
  name: "AccessDeniedComponent",
  methods: {
    backToHome() {
      router.push("/devicetype");
    },
  },
};
</script>

<style scoped>
/* Add any styles for Access Denied page */
</style>
