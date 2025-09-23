<template>
  <a-layout style="height: 100%">
    <a-layout-sider
      v-model:collapsed="isCollapsed"
      :trigger="null"
      :width="160"
      style="
        padding-top: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #30373f;
      "
    >
      <LogoComponent
        v-if="logoDetails"
        :isCollapsed="isCollapsed"
        :logoDetails="logoDetails"
      />
      <LogoComponent
        v-if="logoDetails"
        :isCollapsed="false"
        :logoDetails="avatarDetails"
      />
      <div class="userName" v-if="!isCollapsed">
        <label>{{ loggedUser }}</label>
      </div>
      <div class="roleName" v-if="!isCollapsed">
        <label>{{
          loggedRole.charAt(0).toUpperCase() + loggedRole.slice(1).toLowerCase()
        }}</label>
      </div>
      <SideMenu :isCollapsed="isCollapsed" :tasks="sideMenuTasks"></SideMenu>
      <div class="sider-footer">
        <FooterComponent
          v-if="footerDetails"
          :footerDetails="footerDetails"
          :isCollapsed="isCollapsed"
        />
      </div>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="headerBar">
        <div class="menuIcon" @click="toggleCollapsed">
          <MenuUnfoldOutlined v-if="isCollapsed" class="menu-icon" />
          <MenuFoldOutlined v-else class="menu-icon" />
        </div>
        <div class="headerBarRight">
          <span>
            {{ translateLabel("commonData", "Select Language") }}
            <a-select
              :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              v-model:value="locale"
              style="width: 120px"
              @change="changeLocale"
            >
              <a-select-option value="en">
                <a-tooltip title="English">
                  <span>English</span>
                </a-tooltip>
              </a-select-option>
              <a-select-option value="ja">
                <a-tooltip title="Japanese">
                  <span>日本語</span>
                </a-tooltip>
              </a-select-option>
              <a-select-option value="zhCN">
                <a-tooltip title="Chinese (Simplified)">
                  <span>中文（简体）</span>
                </a-tooltip>
              </a-select-option>
              <a-select-option value="koKR">
                <a-tooltip title="Korean">
                  <span>한국인</span>
                </a-tooltip>
              </a-select-option>
              <!-- <a-select-option value="te">
                <a-tooltip title="Telugu">
                  <span>తెలుగు</span>
                </a-tooltip>
              </a-select-option> -->
              <!-- <a-select-option value="hiIN">
                <a-tooltip title="Hindi">
                  <span>हिन्दी</span>
                </a-tooltip>
              </a-select-option> -->
            </a-select>
          </span>
          <div>
            <a-badge
              :count="notificationCount"
              color="red"
              title="Notifications"
              class="notification-badge"
            >
              <BellOutlined
                style="font-size: 16px; cursor: pointer; padding-top: 5px"
                @click="navigateToNotification"
              />
            </a-badge>
          </div>
          <div class="logoutHeader">
            <span
              @click="handleLogout"
              style="cursor: pointer; display: flex; align-items: center"
            >
              <span class="logout-text" v-if="logoutDetails?.text">
                {{ translateLabel("commonData", logoutDetails.text) }}</span
              >
              <LogoutOutlined class="logout-icon" />
            </span>
          </div>
        </div>
      </a-layout-header>
      <a-layout-content class="mainLayout">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  watch,
  onUnmounted,
} from "vue";
import LogoComponent from "../components/LogoComponent.vue";
import SideMenu from "../components/SidemenuComponent.vue";
import FooterComponent from "../components/FooterComponent.vue";
import { useStore } from "vuex";
import operatorData from "@/mockdata/operator.json";
import adminData from "@/mockdata/admin.json";
import menuSuperAdmin from "@/mockdata/menuSuperAdmin.json";
import { logout, getNotificationsCounts } from "@/services/apiService";
import deviceMockData from "@/mockdata/deviceDetailsData.json";
import { fetchDataFromAPI } from "@/services/apiService";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  BellOutlined,
} from "@ant-design/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { translateLabel } from "@/common/utils";
import { notification } from "ant-design-vue";
import eventBus from "@/services/eventBus";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";

interface TaskItem {
  id: number;
  name: string;
  type: string;
  items?: { name: string; url: string }[];
  details?: {
    imagePath?: string;
    altText?: string;
    link?: string;
    text?: string;
    actionType?: string;
    targetUrl?: string;
    copyrightText?: string;
  };
}
interface DeviceView {
  name: string;
  tasks: any[];
}
export default defineComponent({
  components: {
    LogoComponent,
    SideMenu,
    FooterComponent,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    BellOutlined,
  },
  setup() {
    const { locale, t } = useI18n();
    // const currentLocale = ref(locale.value);
    const logoDetails = ref<any>({ imagePath: "", altText: "" });
    const avatarDetails = ref<any>({ imagePath: "", altText: "" });
    const footerDetails = ref<any>({ versionText: "", copyrightText: "" });
    const logoutDetails = ref<any>({ text: "", targetUrl: "" });
    const sideMenuTasks = ref<TaskItem[]>([]);
    const isCollapsed = ref(false);
    const store = useStore();
    const decodedToken = localStorage.getItem("DecodedToken");
    const storedToken = decodedToken ? JSON.parse(decodedToken) : {};
    const loggedUser = storedToken.username;
    const loggedRole = storedToken.role;
    console.log("::::::::::loggedUser", loggedUser);
    const userRole = storedToken.role;
    const notificationCount = ref(0);
    console.log(":::::::::::Role", userRole);
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);
    const deviceTypeName = computed(() => store.getters.getDeviceTypeName);
    const currentLocale = computed(() => store.getters.getLocale);
    const router = useRouter();
    const routeValue = ref(0);
    const clientKey = ref("");
    const socketService = new SocketService(
      `${environment.MONITORING_URL}`,
      "ms"
    );
    socketService.connectSocket();
    const socketConnected = ref(false);
    const deviceView = ref<DeviceView>({
      name: deviceMockData.name,
      tasks: deviceMockData.jobs[0].tasks,
    });
    const subscribedDeviceIds = ref<Set<string>>(new Set());

    console.log(":: deviceView ::", deviceView.value);

    let clientKeyPrefix = "";
    if (decodedToken) {
      const token = JSON.parse(decodedToken);
      clientKeyPrefix = `/${token.client_key}`;
      clientKey.value = token.client_key;
      console.log("decodedToken", JSON.parse(decodedToken));
    }

    socketService.handleMessage((incomingHeartbeat: any) => {
      console.log("incomingHeartbeat", incomingHeartbeat);
      handleSocketMessage(incomingHeartbeat);
    });

    watch(currentLocale, (newCurrentLocale, oldCurrentLocale) => {
      console.log("newCurrentLocale", newCurrentLocale, oldCurrentLocale);
      locale.value = newCurrentLocale;
    });

    const fetchNotificationCount = async () => {
      try {
        const response = await getNotificationsCounts();

        if (response && typeof response.data.unread_count === "number") {
          notificationCount.value = response.data.unread_count; // Assign only the relevant data
          console.log("::: Success ::: Notification Count:", response);
        } else {
          console.warn("::: Warning ::: Unexpected response format:", response);
        }
      } catch (e) {
        console.error("Error fetching notification count:", e);
      }
    };

    const fetchData = async (taskData: any) => {
      if (taskData.type === "renderTable" && taskData.table?.api) {
        const params: Record<string, any> = {
          orderBy: taskData.table.defaultOrderBy,
          asset_type_id: 1,
          strict: "no",
        };

        //console.log("searchkey and searchTerm", searchKey, searchTerm);
        //console.log("params for fetch data", params);

        const response = await fetchDataFromAPI(
          taskData?.table.api.url,
          "GET",
          params
        );

        const deviceIds = response.data.map((device: any) => device.asset_id);
        const filteredDeviceIds = deviceIds.filter(
          (deviceId: string | undefined) => deviceId
        );

        // Unsubscribe from devices that are no longer in the filtered list
        subscribedDeviceIds.value.forEach((deviceId) => {
          if (!filteredDeviceIds.includes(deviceId)) {
            // socketService.leaveRooms([
            //   `instrument/apc/${deviceId}/heartbeats/basic`,
            // ]);
            socketService.leaveRooms([
              `instrument/apc/${deviceId}/notification`,
            ]);
            subscribedDeviceIds.value.delete(deviceId);
          }
        });

        // Subscribe to new devices in the filtered list
        filteredDeviceIds.forEach((asset_id: any) => {
          if (!subscribedDeviceIds.value.has(asset_id)) {
            // socketService.subscribeToRooms([
            //   `instrument/apc/${asset_id}/heartbeats/basic`,
            // ]);
            socketService.subscribeToRooms([
              `instrument/apc/${asset_id}/notification`,
            ]);
            subscribedDeviceIds.value.add(asset_id);
          }
        });
      }
    };

    const handleNofificationOnEmit = () => {
      console.log(":: handleNofificationOnEmit ::");
      fetchNotificationCount();
    };
    // Socket message handler
    const handleSocketMessage = (message: any) => {
      console.log("Received socket message:", message);

      // Display notification
      setTimeout(() => {
        notification.info({
          message: `${t(
            "notificationPage.New Notification",
            "New Notification"
          )}`,
          description:
            message?.msg?.message || "You have received a new notification.",
          placement: "topRight",
          duration: 5,
          onClick: () => {
            console.log("Notification clicked. ID:", message?.msg?.id);
            router.push({
              path: "/notification",
              query: { notificationId: message?.msg?.id },
            });
          },
        });

        eventBus.emit("notificationUpdate", message);
      }, 3000);

      console.log("after eventBus.emit");
      fetchNotificationCount();
    };

    // Lifecycle hooks
    onMounted(async () => {
      fetchSideMenuData(userRole);
      await fetchNotificationCount();
      // Fetch table task
      const tableTask = deviceView.value?.tasks?.find(
        (task: any) => task.type === "renderTable"
      );
      if (tableTask) {
        await fetchData(tableTask);
      }

      // Add WebSocket listener
      // socketService.addEventListener("message", handleSocketMessage);
      socketConnected.value = true; // Update state to reactive

      eventBus.on("notificationUpdate", handleNofificationOnEmit);
    });
    onUnmounted(() => {
      // Unsubscribe from all rooms
      subscribedDeviceIds.value.forEach((deviceId: any) => {
        console.log(deviceId);
        // socketService.leaveRooms([
        //   `instrument/apc/${deviceId}/heartbeats/basic`,
        // ]);
        socketService.leaveRooms([`instrument/apc/${deviceId}/notification`]);
      });
      subscribedDeviceIds.value.clear();
      // socketService.removeEventListener("message", handleSocketMessage);
    });

    const fetchSideMenuData = (role: string) => {
      console.log(menuSuperAdmin);
      let userData;
      if (role === "administrator") {
        userData = adminData;
      } else if (role === "super-admin") {
        userData = menuSuperAdmin;
      } else {
        userData = operatorData;
      }

      console.log("#Menu Roles:::::", role);
      sideMenuTasks.value = userData.jobs[0].tasks.filter((task: any) => {
        if (task.type === "renderMenu") {
          if (role === "auditor" || role === "tester") {
            task.items = task.items.filter(
              (item: any) => item.name !== "Measure" && item.name !== "Lims"
            );
          }
          return true;
        }
        return false;
      });
      console.log("deviceTypeId", deviceTypeId.value); // if it contains rendermenu opens. if not then on home. default
      // console.log("updates 0", deviceTypeId.value, routeValue.value);
      if (deviceTypeId.value || routeValue.value) {
        const updatedRoutesMenu = sideMenuTasks.value.map((menu: any) => {
          const updatedRoutes = menu.items.map((item: any) => {
            return {
              ...item,
              url: item.url.replace("apc", deviceTypeName.value),
            };
          });
          return { ...menu, items: updatedRoutes };
        });
        sideMenuTasks.value = updatedRoutesMenu;
      } else {
        const updatedMenuData = sideMenuTasks.value.map((menu: any) => {
          const filteredItems = menu.items.filter((item: any) => {
            if (role === "super-admin") {
              return item.url === "/clients";
            } else if (role === "administrator") {
              return (
                item.url === "/devicetype" ||
                item.url === "/manage" ||
                item.url === "/monitoring" ||
                item.url === "/notification"
              );
            } else {
              return item.url === "/devicetype" || item.url === "/notification";
            }
          });
          return { ...menu, items: filteredItems };
        });
        // final return if no devicetype.
        sideMenuTasks.value = updatedMenuData;
        console.log(":: sideMenuTasks.value ::", sideMenuTasks.value);
      }

      // Render logo task
      const renderLogoTask = userData.jobs[0].tasks.find(
        (task: any) => task.type === "renderLogo"
      );
      if (renderLogoTask && renderLogoTask.details) {
        logoDetails.value = {
          imagePath: renderLogoTask.details.imagePath,
          altText: renderLogoTask.details.altText,
        };

        // labware logo
        if (clientKey.value === "L3674F=G") {
          console.log("clientKey.value", clientKey.value);
          logoDetails.value = {
            imagePath: "labware-logo.png",
            altText: "Labware",
          };
        }
      }

      // Render avatar task
      const renderAvatarTask = userData.jobs[0].tasks.find(
        (task: any) => task.type === "renderAvatar"
      );
      if (renderAvatarTask && renderAvatarTask.details) {
        avatarDetails.value = {
          imagePath: renderAvatarTask.details.imagePath,
          altText: renderAvatarTask.details.altText,
        };
      }

      // Render footer task
      const footerTask = userData.jobs[0].tasks.find(
        (task: any) => task.type === "renderFooter"
      );
      if (footerTask && footerTask.details) {
        footerDetails.value = {
          versionText: footerTask.details.versionText,
          copyrightText: footerTask.details.copyrightText,
        };
      }

      // Render logout task
      const logoutTask = userData.jobs[0].tasks.find(
        (task: any) => task.type === "action"
      );
      if (logoutTask && logoutTask.details) {
        logoutDetails.value = {
          text: logoutTask.details.text,
          targetUrl: `${clientKeyPrefix}${logoutTask.details.targetUrl}`,
        };
        console.log("::::::::::::logoutDetails", logoutDetails.value);
      }
    };

    const toggleCollapsed = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    const navigateToNotification = () => {
      router.push("/notification");
    };

    const handleLogout = () => {
      console.log("logout button clicked");
      const token: string | null = localStorage.getItem("Token");
      if (token) {
        console.log("Logging out with token:", token);
        logout({ token: token });
      }
    };

    const changeLocale = (value: string) => {
      console.log("locale.value", value, currentLocale);
      store.dispatch("setLocale", value);
      localStorage.setItem("language", value);
    };
    console.log("routeValue", routeValue.value);

    const route = useRoute();

    watch(
      () => route.path,
      (newPath) => {
        routeValue.value = newPath.includes("apc") === false ? 0 : 1;
        fetchSideMenuData(userRole);
      }
    );

    watch(deviceTypeId, (newDeviceTypeId, oldDeviceTypeId) => {
      console.log(
        "watchForDeviceTypeIdcalled::",
        newDeviceTypeId,
        oldDeviceTypeId
      );
      fetchSideMenuData(userRole);
    });

    return {
      route,
      isCollapsed,
      routeValue,
      sideMenuTasks,
      logoDetails,
      avatarDetails,
      footerDetails,
      loggedUser,
      loggedRole,
      logoutDetails,
      MenuUnfoldOutlined,
      MenuFoldOutlined,
      toggleCollapsed,
      handleLogout,
      changeLocale,
      currentLocale,
      locale,
      translateLabel,
      notificationCount,
      navigateToNotification,
      handleSocketMessage,
      fetchNotificationCount,
    };
  },
});
</script>

<style scoped>
.userName {
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  color: #ffffff;
  font-weight: bold;
  text-align: center;
}

.roleName {
  color: rgb(144, 147, 152);
  text-align: center;
  padding-top: 8px;
  padding-bottom: 16px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 400;
  font-style: normal;
}

.mainLayout {
  height: 100vh;
  background: #f2f2f2;
  overflow-y: auto;
  padding: 15px;
}

.sider-footer {
  position: fixed;
  left: 0;
  bottom: 1rem;
  color: white;
  text-align: center;
}

.headerBar {
  height: 40px;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 0 #e6e6e6;
  line-height: 40px;
  background: #fff;
  padding: 0 20px;
}
.menu-icon {
  cursor: pointer;
  font-size: large;
}
.logout-text {
  font-size: 15px;
  width: 80%;
  margin-right: 6px;
}
.logout-icon {
  font-size: large;
  cursor: pointer;
}
.logoutHeader {
  display: inline-block;
  width: 28%;
  display: flex;
  align-items: center;
}
.headerBarRight {
  display: flex;
  height: inherit;
  width: 36%;
  justify-content: space-between;
}
.logoutHeader span {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 7px 1px;
}

.logoutHeader span:hover {
  background-color: #e6e6e6 !important;
}
</style>
<style>
.notification-badge.ant-badge .ant-badge-count {
  font-size: 10px;
  margin-top: 5px;
  height: 15px;
  line-height: 15px;
}
.notification-badge {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 4px;
}

.notification-badge:hover {
  background-color: #e6e6e6 !important;
}
</style>
