<template style="height: 100%">
  <router-view />
</template>
<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from "vue";
import { useActivityTracker } from "./composables/useActivityTracker";
import { useStore } from "vuex";

import { sessionLogout } from "./services/apiService";

export default defineComponent({
  name: "App",
  setup() {
    const { lastActive } = useActivityTracker();
    const logoutTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const store = useStore();
    const isLoggedIn = computed(() => store.getters.getIsLoggedIn);
    const logoutUser = () => {
      console.log("User logged out due to inactivity");
      const token = localStorage.getItem("Token");
      sessionLogout({ token: token });
    };

    const checkInactivity = () => {
      const now = Date.now();
      const userIdealTime = 30 * 60 * 1000;
      if (now - lastActive.value > userIdealTime) {
        logoutUser();
      }
    };

    const resetLogoutTimer = () => {
      if (logoutTimer.value) {
        clearTimeout(logoutTimer.value);
      }
      logoutTimer.value = setTimeout(checkInactivity, 30 * 60 * 1000);
    };

    watch(lastActive, resetLogoutTimer);
    watch(isLoggedIn, () => {
      if (isLoggedIn.value) {
        resetLogoutTimer();
      } else {
        if (logoutTimer.value) {
          clearTimeout(logoutTimer.value);
        }
      }
    });
    onMounted(() => {
      if (isLoggedIn.value) {
        resetLogoutTimer();
      }
    });

    return {};
  },
});
</script>
<style lang="scss">
nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
