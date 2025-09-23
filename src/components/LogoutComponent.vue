<template>
  <div class="logout-container" @click="handleLogout">
    <span class="logout-text">{{ logoutDetails.text }}</span>
    <LogoutOutlined class="logout-icon" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import LogoutOutlined from "@ant-design/icons-vue/LogoutOutlined";
import { logout as apiLogout } from "@/services/apiService";

export default defineComponent({
  components: {
    LogoutOutlined,
  },
  props: {
    logoutDetails: {
      type: Object as PropType<{ text: string; targetUrl: string }>,
      required: true,
    },
  },
  setup(props) {
    const handleLogout = () => {
      console.log("logout button clicked");
      const token = localStorage.getItem("Token");
      if (token) {
        apiLogout({ token: token });
      } else {
        console.log("No token found");
      }
    };

    return {
      handleLogout,
      logoutDetails: props.logoutDetails,
    };
  },
});
</script>

<style scoped>
.logout-container {
  display: inline-block;
  float: right;
  cursor: pointer;
  width: 8%;
  display: flex;
  align-items: center;
}
.logout-text {
  margin-right: 6px;
  font-size: 16px;
}
.logout-icon {
  font-size: x-large;
  cursor: pointer;
}
</style>
