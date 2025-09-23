import { RouteRecordRaw } from "vue-router";
import LimsSamplesView from "../views/LimsSamplesView.vue";
import LimsEditorJobView from "@/views/LimsEditorJobView.vue";
import ApcMeasurePageJobView from "../views/ApcMeasurePageJobView.vue";
import ApcDeviceJobView from "../views/ApcDeviceJobView.vue";
import LimsDeviceSelection from "../views/LimsDeviceSelection.vue";
import ApcDataPageJobView from "../views/ApcDataPageJobView.vue";
import ApcAuditPageJobView from "../views/ApcAuditPageJobView.vue";
import ApcDeviceEditDetails from "../components/ApcDeviceEditDetails.vue";
import ApcOtherSamplePageJobView from "../views/ApcOtherSamplePageJobView.vue";
import ApcMfcMonitoringView from "../views/ApcMfcMonitoringView.vue";

const apcRoutes: RouteRecordRaw[] = [
  {
    path: "/apc/instrument",
    component: ApcDeviceJobView,
  },
  {
    path: "/apc/instrument/device/:id",
    component: ApcDeviceEditDetails,
  },
  {
    path: "/apc/data",
    component: ApcDataPageJobView,
  },
  {
    path: "/apc/audit",
    component: ApcAuditPageJobView,
  },
  {
    path: "/apc/other-sample",
    component: ApcOtherSamplePageJobView,
  },
  {
    path: "/apc/lims-editor/:id",
    component: LimsEditorJobView,
  },
  {
    path: "/apc/measure",
    component: ApcMeasurePageJobView,
  },
  {
    path: "/apc/mfg-monitoring",
    component: ApcMfcMonitoringView,
  },
  {
    path: "/apc/lims",
    component: LimsSamplesView,
  },
  {
    path: "/apc/lims/:id",
    component: LimsDeviceSelection,
  },
];
export default apcRoutes;
