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

const apcRoutes: RouteRecordRaw[] = [
  {
    path: "/ams/instrument",
    component: ApcDeviceJobView,
  },
  {
    path: "/ams/instrument/device/:id",
    component: ApcDeviceEditDetails,
  },
  {
    path: "/ams/data",
    component: ApcDataPageJobView,
  },
  {
    path: "/ams/audit",
    component: ApcAuditPageJobView,
  },
  {
    path: "/ams/other-sample",
    component: ApcOtherSamplePageJobView,
  },
  {
    path: "/ams/lims-editor/:id",
    component: LimsEditorJobView,
  },
  {
    path: "/ams/measure",
    component: ApcMeasurePageJobView,
  },
  {
    path: "/ams/lims",
    component: LimsSamplesView,
  },
  {
    path: "/ams/lims/:id",
    component: LimsDeviceSelection,
  },
];
export default apcRoutes;
