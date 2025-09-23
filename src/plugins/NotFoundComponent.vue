<template>
  <div
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
    "
  >
    <a-result
      status="404"
      title="Sorry, the page you visited does not exist."
      sub-title="Please provide valid client key (or) valid path"
    >
    </a-result>
  </div>
</template>

<script>
import router from "@/router";

export default {
  name: "NotFoundComponent",
};
</script>

<style scoped>
/* Add any styles for Access Denied page */
</style>
