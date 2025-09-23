// composables/useActivityTracker.ts
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";

export function useActivityTracker() {
  const store = useStore();
  const lastActive = ref(Date.now());
  const isLoggedIn = computed(() => store.getters.getIsLoggedIn);
  const updateLastActive = () => {
    lastActive.value = Date.now();
  };
  watch(isLoggedIn, () => {
    console.log("isLoggedIn", isLoggedIn);
    if (isLoggedIn.value) {
      setActivityListeners();
    } else {
      resetActivityListeners();
    }
  });
  const resetActivityListeners = () => {
    console.log("resetActivityListeners");
    document.removeEventListener("mousemove", updateLastActive);
    document.removeEventListener("keydown", updateLastActive);
    document.removeEventListener("click", updateLastActive);
  };

  const setActivityListeners = () => {
    document.addEventListener("mousemove", updateLastActive);
    document.addEventListener("keydown", updateLastActive);
    document.addEventListener("click", updateLastActive);
  };

  onMounted(() => {
    if (isLoggedIn.value) {
      console.log("setActivityListeners");
      setActivityListeners();
    }
  });

  return {
    lastActive,
  };
}
