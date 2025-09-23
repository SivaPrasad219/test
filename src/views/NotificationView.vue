<template>
  <a-tabs @change="onTabChange">
    <a-tab-pane v-for="tab in tabs" :key="tab.id">
      <template #tab>
        <span>
          {{ translateLabel("commonData", tab.name) }}

          <a-popover trigger="hover" placement="topLeft">
            <template #content>
              <div style="color: black; max-width: 350px">
                {{ translateLabel("commonData", tab.description) }}
              </div>
            </template>
            <InfoCircleOutlined />
          </a-popover>
        </span>
      </template>
    </a-tab-pane>
  </a-tabs>
  <DisplayNotificationComponent
    ref="childRef"
    v-if="notificationDisplayData && notificationPagination"
    :data="notificationDisplayData"
    :pageNation="notificationPagination"
    :loader="isNotificationDataLoading"
    :categories="tabs"
    @pagination-change="onNotificationPageChange"
    @refresh="() => fetchNotifications(selectedTabId)"
  />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import _ from "lodash";
import { translateLabel } from "@/common/utils";
import { getNotifications, getCategory } from "@/services/apiService";
import DisplayNotificationComponent from "../components/DisplayNotificationComponent.vue"; // Import the common component
import { InfoCircleOutlined } from "@ant-design/icons-vue"; // Icons
import eventBus from "@/services/eventBus";
import { useRoute } from "vue-router";
import debounce from "lodash/debounce";

export default defineComponent({
  name: "NotificationTabs",
  components: {
    DisplayNotificationComponent, // Register the common component
    // BellOutlined,
    InfoCircleOutlined,
  },
  setup() {
    const childRef = ref();
    const route = useRoute();
    // const activeKey = ref("1"); // Reactive reference for active tab
    const notificationContent = ref<any>([]); // Initialize tab2Data as an empty array
    const notificationDisplayData = ref<any>([]);
    const notificationPagination = ref<any>();

    const isNotificationDataLoading = ref<boolean>(false);
    const tabs = ref<any>([
      {
        id: 0,
        // name: "All Notification",
        name: translateLabel("commonData", "All Notifications"),
        description: "Displays all notifications",
        created_date: "",
        last_updated_date: "",
      },
    ]);

    const loggedUserId = ref("");

    const decodedToken = localStorage.getItem("DecodedToken");
    const storedToken = decodedToken ? JSON.parse(decodedToken) : {};
    loggedUserId.value = storedToken.id || "";

    const selectedTabId = ref(0); // Track current tab

    const fetchNotifications = async (categoryId = 0, page?: any) => {
      notificationDisplayData.value = [];
      const params: { [key: string]: any } = {
        limit: 10,
        page: page || 1,
      };
      if (categoryId !== 0) {
        params.notification___category_id = categoryId;
      }
      try {
        isNotificationDataLoading.value = true;
        const response = await getNotifications(
          loggedUserId.value,
          categoryId,
          params
        );

        console.log("Raw notification response:", response);

        isNotificationDataLoading.value = false;

        notificationDisplayData.value = response.data;
        notificationPagination.value = response.pagination;

        console.log(
          "::::: Notification data from ",
          notificationDisplayData.value,
          notificationPagination.value
        );
      } catch (error) {
        notificationDisplayData.value = [];
        isNotificationDataLoading.value = false;
        console.error("Error fetching notifications:", error);
      }
    };
    const fetchCategory = async () => {
      try {
        const response = await getCategory();

        // Normalize response
        const categories = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        if (categories.length > 0) {
          tabs.value = [...tabs.value, ...categories].map((item: any) => ({
            ...item,
            name: _.capitalize(item?.name),
          }));

          console.log("Category data:", tabs.value);
        } else {
          console.warn("Unexpected response format:", response);
        }
      } catch (error) {
        console.error("Error fetching Category:", error);
      }
    };

    const onNotificationPageChange = async (newPage: number) => {
      if (notificationPagination.value) {
        notificationPagination.value.currentPage = newPage;
      }
      await fetchNotifications(selectedTabId.value, newPage); // or pass page if API supports it
    };

    const onTabChange = (key: number) => {
      selectedTabId.value = key;
      fetchNotifications(key, 1);
      childRef.value?.handleTabChange?.();
    };

    // Debounced version of fetchNotifications (2-second delay)
    const debouncedFetchNotifications = debounce(async () => {
      await fetchNotifications();
    }, 300);

    onMounted(async () => {
      await fetchCategory();

      // Always fetch notifications once initially
      await fetchNotifications();

      // Only listen for updates when on notification page
      if (route.path === "/notification") {
        eventBus.on("notificationUpdate", debouncedFetchNotifications);
      }
    });

    onUnmounted(() => {
      if (route.path === "/notification") {
        eventBus.off("notificationUpdate", debouncedFetchNotifications);
      }
    });

    return {
      // activeKey,
      notificationContent,
      onTabChange,
      translateLabel,
      notificationDisplayData,
      fetchNotifications,
      isNotificationDataLoading,
      tabs,
      selectedTabId,
      childRef,
      notificationPagination,
      onNotificationPageChange,
    };
  },
});
</script>

<style scoped>
.a-tabs .a-tab-pane {
  background-color: white;
}
</style>
