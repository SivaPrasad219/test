// index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import apcRoutes from "../deviceTypes/apc/router";
import amsRoutes from "../deviceTypes/ams/router";
import phmeterRoutes from "../deviceTypes/phmeter/router";
import fullscreenLayout from "../layouts/fullScreenLayout.vue";
import baseLayout from "../layouts/baseLayout.vue";
import LoginComponent from "@/components/LoginComponent.vue";
import AboutView from "@/views/AboutView.vue";
import ManageRecordsSearchableJobView from "@/views/Manage/ManageRecordsSearchableJobView.vue";
import DeviceTypeComponent from "@/deviceTypes/DeviceTypeComponent.vue";
import ManageClientsComponent from "@/views/ManageClientsComponent.vue";
import AccessDeniedComponent from "@/plugins/AccessDeniedComponent.vue";
import NotFoundComponent from "@/plugins/NotFoundComponent.vue";
import { rolePermissions } from "@/common/roles"; // Import role permissions
import NotificationView from "@/views/NotificationView.vue";
import MonitoringView from "../views/Monitor/MonitorView.vue";
import EdgemanDetailsPage from "@/views/Monitor/EdgemanDetailsPage.vue";
import AddDevicePage from "@/views/Monitor/AddDevicePage.vue";
import EnvVariables from "@/views/Monitor/EnvVariables.vue";
let clientKeyPrefix = "";
const decodedToken = localStorage.getItem("DecodedToken");
if (decodedToken) {
  const token = JSON.parse(decodedToken);
  clientKeyPrefix = `/${token.client_key}`;
  console.log("decodedToken", JSON.parse(decodedToken));
}

const routes: RouteRecordRaw[] = [
  { path: "/fullscreenLayout", component: fullscreenLayout },
  { path: "/:clientKey/login", component: LoginComponent },
  { path: "/about", component: AboutView },
  { path: "/", redirect: "/devicetype" },
  { path: "/not-found", component: NotFoundComponent },
  {
    path: "/",
    component: baseLayout,
    children: [
      ...apcRoutes,
      ...amsRoutes,
      ...phmeterRoutes,
      { path: "/clients", component: ManageClientsComponent },
      { path: "/devicetype", component: DeviceTypeComponent },
      { path: "/manage", component: ManageRecordsSearchableJobView },
      { path: "/notification", component: NotificationView },
      { path: "/monitoring", component: MonitoringView },
      { path: "/monitoring/:edgemanIp", component: EdgemanDetailsPage },
      { path: "/monitoring/:edgemanIp/addDevice", component: AddDevicePage },
      { path: "/monitoring/device/:deviceName/env", component: EnvVariables },
      {
        path: "/monitoring/:edgemanIp/:instrumentName/:action",
        component: AddDevicePage,
      },
      { path: "/access-denied", component: AccessDeniedComponent },
    ],
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", component: NotFoundComponent },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const decodedToken = localStorage.getItem("DecodedToken")
    ? JSON.parse(localStorage.getItem("DecodedToken") as string)
    : null;
  const isDefaultPassword = decodedToken
    ? decodedToken.is_default_password
    : true;
  const userRole = decodedToken ? decodedToken.role : "";
  console.log("path:::::", to.path);
  if (requiresAuth && isDefaultPassword) {
    if (to.path === "/devicetype" && !decodedToken) {
      next("/not-found");
    } else {
      clientKeyPrefix = `/${decodedToken.client_key}`;
      next(`${clientKeyPrefix}/login`);
    }
  } else {
    // partial path match check
    const matchedPath = Object.keys(rolePermissions).find((key) =>
      to.path.startsWith(key)
    );
    console.log("matchedPathmatchedPath", matchedPath);
    const requiredRoles = matchedPath
      ? rolePermissions[matchedPath]
      : undefined;
    if (requiresAuth && requiredRoles && !requiredRoles.includes(userRole)) {
      next("/access-denied");
    } else {
      next();
    }
  }
});

export default router;
