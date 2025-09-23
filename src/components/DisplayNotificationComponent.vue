<template>
  <div class="notification-list-container">
    <!-- Header block Top Controls-->
    <div class="notification-controls">
      <div style="display: flex; align-items: center; gap: 10px">
        <a-checkbox
          v-model:checked="isAllCheckedOnPage"
          @change="toggleAllOnPage"
        />

        <!-- <CaretDownOutlined style="font-size: 16px" /> -->
        <ReloadOutlined
          style="font-size: 16px; cursor: pointer"
          @click="handleRefresh"
        />
      </div>
      <a-button
        type="primary"
        @click="markAllSelectedAsRead"
        :disabled="!selectedNotificationIds.length"
      >
        {{ translateLabel("notificationPage", "Mark All Read") }}
      </a-button>
    </div>

    <!-- Notification List with Pagination -->
    <a-list
      class="notification-list"
      item-layout="horizontal"
      :data-source="notificationData"
      :loading="isNotificationDataLoading"
      :locale="{ emptyText: 'No data available' }"
      :pagination="{
        current: notificationPages.currentPage,
        pageSize: 10,
        total: notificationPages.totalCount,
        showSizeChanger: false,
        onChange: handlePageChange,
      }"
    >
      <template #renderItem="{ item }">
        <a-list-item
          :class="{ 'highlighted-item': selectedItem === item }"
          @click="openModal(item)"
        >
          <!-- checkbox -->
          <template v-if="showCheckboxes">
            <a-checkbox
              style="margin-right: 12px"
              :checked="
                selectedNotificationIds.includes(item.notification___.id)
              "
              @change="(e: any) => toggleItemSelection(item.notification___.id, e.target.checked)"
              @click.stop
            />
          </template>

          <!-- :description="`Message: ${item.notification.message}`" -->
          <a-list-item-meta
            :description="`${translateLabel(
              'notificationPage',
              'Instrument Name'
            )}: ${
              item?.notification___?.meta?.asset_name
                ? item?.notification___?.meta?.asset_name
                : '-'
            }, ${translateLabel('notificationPage', 'Serial #')} : ${
              item?.notification___?.meta?.asset_id
                ? item?.notification___?.meta?.asset_id
                : '-'
            }`"
          >
            <template #title>
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <!-- Left-aligned Title with Ellipsis on Overflow -->

                <div
                  :style="{
                    color: !item.is_read ? '#1677ff' : '',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth:
                      'calc(100% - 150px)' /* Adjust according to available space */,
                  }"
                >
                  <p style="margin-bottom: 0">
                    {{ item?.notification___?.title }}
                  </p>

                  <!-- <p>Serial # 	 {{ item?.notification?.meta?.asset_id }}</p> -->
                </div>

                <!-- Right-aligned Created Time -->
                <div style="color: rgba(0, 0, 0, 0.45); font-size: 12px">
                  {{ translateLabel("notificationPage", "Timestamp") }}:
                  {{
                    convertAndFormatTimeUtc(
                      item.notification___.created_date,
                      item.notification___?.meta?.site?.site_timezone ||
                        timeZone
                    )
                  }}
                </div>
              </div>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>

    <!-- Modal -->
    <a-modal
      v-model:open="isModalVisible"
      @ok="closeModal"
      @cancel="closeModal"
      ok-text="Mark as Read"
      cancel-text="Ignore"
      :footer="null"
      :maskClosable="false"
      class="notification-modal"
    >
      <template #title>
        <div style="margin-bottom: 0">
          <div class="recordTitle">
            <div>
              {{ translateLabel("notificationPage", "Notification Details") }}
            </div>
          </div>
        </div>
      </template>
      <hr />

      <div class="notification-modal-content">
        <p>
          <b> {{ translateLabel("notificationPage", "ID") }}: </b>
          {{ selectedNotification?.notification___.id }}
          <img
            src="@/assets/icons/data.png"
            alt="data"
            @click="
              handleDataImageClick(
                selectedNotification?.notification___?.meta?.task_result_id
              )
            "
            class="notification-data-icon"
            v-if="selectedNotification?.notification___?.meta?.task_result_id"
            title="View data"
          />
        </p>
        <p>
          <b> {{ translateLabel("notificationPage", "Instrument Name") }}: </b>
          {{ selectedNotification?.notification___?.meta?.asset_name || "-" }}
        </p>
        <p>
          <b> {{ translateLabel("notificationPage", "Serial #") }}: </b>
          {{ selectedNotification?.notification___?.meta?.asset_id || "-" }}
        </p>
        <p>
          <b> {{ translateLabel("notificationPage", "Category") }}: </b>
          {{
            toCamelCase(
              notificationCategories[
                selectedNotification?.notification___?.category_id
              ]?.name as string
            )
          }}
        </p>
        <p>
          <b>{{ translateLabel("notificationPage", "Title") }}: </b>
          {{ selectedNotification?.notification___.title }}
        </p>
        <p>
          <b> {{ translateLabel("notificationPage", "Message") }}: </b>
          {{ selectedNotification?.notification___.message }}
        </p>
        <p>
          <b> {{ translateLabel("notificationPage", "Timestamp") }}: </b>
          {{
            selectedNotification?.notification___?.created_date
              ? convertAndFormatTimeUtc(
                  selectedNotification.notification___.created_date,
                  selectedNotification.notification___.meta?.site
                    ?.site_timezone || timeZone
                )
              : ""
          }}
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  PropType,
} from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import {
  putNotifications,
  // readBulkNotifications,
  getApcTaskResultsById,
} from "../services/apiService";
import eventBus from "@/services/eventBus";
import { ReloadOutlined } from "@ant-design/icons-vue";

import { convertAndFormatTimeUtc } from "@/common/utils";
import { useRouter } from "vue-router";
import { translateLabel } from "@/common/utils";

export default defineComponent({
  name: "NotificationList",
  props: {
    data: {
      type: Array,
      required: true,
    },
    pageNation: {
      type: Object as PropType<{
        currentPage: number;
        count: number;
        totalCount: number;
      }>,
      required: true,
    },
    categories: {
      type: Array,
      required: true,
    },
    loader: {
      type: Boolean,
      required: true,
    },
  },

  components: {
    ReloadOutlined,
  },

  setup(props, { emit }) {
    const router = useRouter();
    const store = useStore();
    const notificationData = ref([...props.data]);
    const notificationPages = ref({ ...props.pageNation });
    const notificationCategories = ref([...props.categories]);

    console.log(
      "::::: Notification data from parent",
      notificationData.value,
      notificationPages.value
    );

    const isNotificationDataLoading = computed(() => props.loader);
    const timeZone = localStorage.getItem("timeZone") || "";

    const selectedItem = ref({});
    const showCheckboxes = ref(false);

    const route = useRoute();

    // Watch for changes in props.data and update notificationData
    watch(
      () => props.data,
      (newData) => {
        notificationData.value = [...newData];
      },
      { immediate: true, deep: true }
    );

    watch(
      () => props.pageNation,
      (newPageNation) => {
        notificationPages.value = { ...newPageNation };

        if (pagination?.value) {
          pagination.value.current = newPageNation?.currentPage ?? 1;
        }
        if (isAllCheckedOnPage?.value) {
          toggleAllOnPage();
        }
      },
      { immediate: true, deep: true }
    );

    // Pagination configuration
    const pagination = ref({
      current: props.pageNation.currentPage, // Initialize with parent's current page
      pageSize: 10, // Number of items per page
    });

    // Update pagination when props change
    watch(
      () => [props.data, props.pageNation],
      () => {
        pagination.value.current = props.pageNation.currentPage; // Reset to parent's current page
      },
      { immediate: true }
    );

    const paginationConfig = computed(() => ({
      current: pagination.value.current,
      pageSize: pagination.value.pageSize,
      total: notificationPages.value.totalCount, // Use total count from parent
      showSizeChanger: false,
      showQuickJumper: false,
      position: "bottom",
      onChange: (page: number) => {
        pagination.value.current = page;

        // Reset checkbox UI state
        isAllCheckedOnPage.value = false;
        showCheckboxes.value = false;

        // Remove any selected IDs from the current page
        const currentPageIds = notificationData.value
          .slice(
            (page - 1) * pagination.value.pageSize,
            page * pagination.value.pageSize
          )
          .map((item: any) => item.notification___.id);

        selectedNotificationIds.value = selectedNotificationIds.value.filter(
          (id) => !currentPageIds.includes(id)
        );

        // Emit page change to parent
        handlePageChange(page);
      },
    }));

    const handleTabChange = () => {
      isAllCheckedOnPage.value = false;
      showCheckboxes.value = false;
    };

    const toggleItemSelection = (id: number, checked: boolean) => {
      if (checked) {
        if (!selectedNotificationIds.value.includes(id)) {
          selectedNotificationIds.value.push(id);
        }
      } else {
        selectedNotificationIds.value = selectedNotificationIds.value.filter(
          (selectedId) => selectedId !== id
        );
      }
    };

    const toCamelCase = (value: string): string => {
      if (!value) return "";
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    const isModalVisible = ref(false);
    const selectedNotification = ref<any | null>(null);

    const openModal = async (notification: { notification_id: number }) => {
      const notificationId = notification?.notification_id;
      selectedItem.value = notification;

      const foundNotification = notificationData.value.find(
        (notification: any) =>
          notification?.notification___?.id === notificationId
      );

      if (foundNotification) {
        selectedNotification.value = foundNotification;
        console.log(
          "selectedNotificationselectedNotification",
          selectedNotification.value
        );
        isModalVisible.value = true;

        const updateData = [{ notification_id: notificationId, is_read: true }];

        try {
          await putNotifications(updateData);
          if (selectedNotification.value) {
            selectedNotification.value.is_read = true;
          }
          // eventBus.emit("notificationUpdate", {});
        } catch (error) {
          console.error("Error updating notification:", error);
        }
      } else {
        console.warn(`Notification with ID ${notificationId} not found.`);
      }
    };

    const handlePageChange = (page: number) => {
      emit("pagination-change", page); // Let parent handle API fetch & prop update
    };

    const closeModal = async () => {
      if (selectedNotification.value) {
        try {
          isModalVisible.value = false;
          selectedNotification.value = null;
          selectedItem.value = {};

          router.replace({
            path: router.currentRoute.value.path,
            query: {
              ...router.currentRoute.value.query,
              notificationId: undefined,
            },
          });
        } catch (error) {
          console.error("Error updating notification", error);
        }
      }
    };

    const selectDeviceType = (deviceType: { name: any; id: string }) => {
      let deviceTypeName;
      if (deviceType) {
        if (deviceType.name === "smartplate") {
          deviceTypeName = "hp";
        } else {
          deviceTypeName = deviceType.name;
        }
        localStorage.setItem("deviceTypeId", deviceType.id);
        localStorage.setItem("deviceTypeName", deviceTypeName);
        store.dispatch("setDeviceTypeId", deviceType.id);
        store.dispatch("setDeviceTypeName", deviceTypeName);
      }
    };

    const handleDataImageClick = async (taskResultId: any) => {
      const taskResult = await getApcTaskResultsById(taskResultId);
      try {
        if (
          taskResult.data &&
          taskResult.data[0] &&
          taskResult.data[0]?.meta?.asset_info
        ) {
          const deviceTypeName = taskResult.data[0]?.meta?.asset_info?.info
            ?.types[0]?.name
            ? taskResult.data[0]?.meta?.asset_info?.info?.types[0]?.name.toLowerCase()
            : undefined;
          const deviceTypeId =
            taskResult.data[0]?.meta?.asset_info?.asset_type_id;

          if (deviceTypeName && deviceTypeId) {
            selectDeviceType({ name: deviceTypeName, id: deviceTypeId });
            router.push({
              path: "/apc/data",
              query: { task_result_id: taskResultId },
            });
          }
        }
      } catch (error) {
        console.log("error while redirecting", error);
      }
    };

    const selectedNotificationIds = ref<number[]>([]);
    const isAllCheckedOnPage = ref(false);

    const isAnyCheckboxVisible = computed(
      () => selectedNotificationIds.value.length > 0 || isAllCheckedOnPage.value
    );

    const toggleAllOnPage = () => {
      // const currentPageData = notificationData.value.slice(
      //   (pagination.value.current - 1) * pagination.value.pageSize,
      //   pagination.value.current * pagination.value.pageSize
      // );

      const currentPageData = notificationData.value;

      console.log(
        "currentPageDatacurrentPageData",
        currentPageData,
        isAllCheckedOnPage.value
      );

      if (isAllCheckedOnPage.value) {
        showCheckboxes.value = true;
        const idsToAdd = currentPageData.map(
          (item: any) => item.notification___.id
        );
        selectedNotificationIds.value = Array.from(
          new Set([...selectedNotificationIds.value, ...idsToAdd])
        );
      } else {
        showCheckboxes.value = false;
        const idsToRemove = currentPageData.map(
          (item: any) => item.notification___.id
        );
        selectedNotificationIds.value = selectedNotificationIds.value.filter(
          (id) => !idsToRemove.includes(id)
        );
      }
    };

    const toggleSingleCheckbox = (id: number) => {
      if (selectedNotificationIds.value.includes(id)) {
        selectedNotificationIds.value = selectedNotificationIds.value.filter(
          (_id) => _id !== id
        );
      } else {
        selectedNotificationIds.value.push(id);
      }
    };

    const paginatedData = computed(() => {
      const start = (pagination.value.current - 1) * pagination.value.pageSize;
      const end = start + pagination.value.pageSize;
      return notificationData.value.slice(start, end);
    });

    const markAllSelectedAsRead = async () => {
      if (!selectedNotificationIds.value.length) return;

      const updateData = selectedNotificationIds.value.map((id: number) => ({
        notification_id: id,
        is_read: true,
      }));

      try {
        await putNotifications(updateData);
        notificationData.value = notificationData.value.map((item: any) => {
          if (selectedNotificationIds.value.includes(item.notification___.id)) {
            return { ...item, is_read: true };
          }
          return item;
        });

        selectedNotificationIds.value = [];
        isAllCheckedOnPage.value = false;
        showCheckboxes.value = false;

        eventBus.emit("notificationUpdate", {});
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    };

    const handleRefresh = () => {
      isAllCheckedOnPage.value = false;
      selectedNotificationIds.value = [];
      showCheckboxes.value = false;
      pagination.value.current = 1;
      emit("refresh");
    };

    const tryOpenModal = (id: number) => {
      if (!id || !notificationData.value) return false;

      const found = notificationData.value.find(
        (notification: any) => notification?.notification___?.id === id
      );
      if (found) {
        openModal({ notification_id: id });
        return true;
      }
      return false;
    };

    onMounted(() => {
      const id = route.query.notificationId;
      if (!id) return;

      const numericId = Number(id);

      if (tryOpenModal(numericId)) return;

      const stopWatch = watch(
        () => notificationData.value,
        (data) => {
          if (data && data.length > 0 && tryOpenModal(numericId)) {
            stopWatch();
          }
        },
        { immediate: true, deep: true }
      );
    });

    watch(
      [() => route.query.notificationId, () => notificationData.value],
      ([id, data]) => {
        const numericId = Number(id);

        if (!numericId || !Array.isArray(data) || data.length === 0) {
          return;
        }

        const didOpen = tryOpenModal(numericId);

        if (!didOpen) {
          console.warn(
            `No match found in notificationData for id: ${numericId}`
          );
        }
      },
      {
        immediate: true,
        deep: true,
      }
    );

    watch(
      () => props.data,
      (newVal) => {
        notificationData.value = [...newVal];
      },
      { immediate: true, deep: true }
    );

    return {
      notificationData,
      notificationCategories,
      isModalVisible,
      selectedNotification,
      openModal,
      closeModal,
      paginationConfig,
      convertAndFormatTimeUtc,
      timeZone,
      isNotificationDataLoading,
      handleDataImageClick,
      selectedItem,
      toCamelCase,
      toggleSingleCheckbox,
      isAnyCheckboxVisible,
      toggleAllOnPage,
      markAllSelectedAsRead,
      isAllCheckedOnPage,
      toggleItemSelection,
      paginatedData,
      showCheckboxes,
      selectedNotificationIds,
      handleRefresh,
      handleTabChange,
      notificationPages,
      handlePageChange,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.notification-list {
  background-color: #f0f0f0;
  padding: 20px;
  cursor: pointer; /* Add a pointer cursor for better UX */
}
.notification-list .ant-list-item:hover {
  background-color: #e6f7ff; /* Highlight the item on hover */
}
.notification-data-icon {
  float: right;
  clear: both;
  cursor: pointer;
  width: 18px;
}
.highlighted-item {
  background-color: #f0f8ff; /* Light blue background */
  transition: background-color 0.3s ease; /* Smooth transition */
}
.notification-controls {
  background-color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ant-modal.notification-modal .recordTitle {
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: left;
  height: 48px;
  color: black;
  font-size: 18px;
  padding-left: 0px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
}

.notification-modal .ant-modal-content {
  font-family: Montserrat-Regular, sans-serif;
  padding: 0 24px 24px !important;
  border-radius: 3px !important;
}
.notification-modal-content {
  padding-top: 24px;
}

.notification-list-container .ant-spin-container {
  max-height: calc(100vh - 230px);
  overflow-y: auto;
}
</style>
