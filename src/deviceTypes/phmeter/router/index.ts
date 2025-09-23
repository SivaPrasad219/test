import { RouteRecordRaw } from "vue-router";
import LimsSamplesView from "../views/LimsSamplesView.vue";
import LimsEditorJobView from "@/views/LimsEditorJobView.vue";
import PhmeterMeasurePageJobView from "../views/PhmeterMeasurePageJobView.vue";
import PhmeterDeviceJobView from "../views/PhmeterDeviceJobView.vue";
import LimsDeviceSelection from "../views/LimsDeviceSelection.vue";
import PhmeterDataPageJobView from "../views/PhmeterDataPageJobView.vue";
import PhmeterAuditPageJobView from "../views/PhmeterAuditPageJobView.vue";
import PhmeterDeviceEditDetails from "../components/PhmeterDeviceEditDetails.vue";
import PhmeterOtherSamplePageJobView from "../views/PhmeterOtherSamplePageJobView.vue";

const phmeterRoutes: RouteRecordRaw[] = [
  {
    path: "/phmeter/instrument",
    component: PhmeterDeviceJobView,
  },
  {
    path: "/phmeter/instrument/device/:id",
    component: PhmeterDeviceEditDetails,
  },
  {
    path: "/phmeter/data",
    component: PhmeterDataPageJobView,
  },
  {
    path: "/phmeter/audit",
    component: PhmeterAuditPageJobView,
  },
  {
    path: "/phmeter/other-sample",
    component: PhmeterOtherSamplePageJobView,
  },
  {
    path: "/phmeter/lims-editor/:id",
    component: LimsEditorJobView,
  },
  {
    path: "/phmeter/measure",
    component: PhmeterMeasurePageJobView,
  },
  {
    path: "/phmeter/lims",
    component: LimsSamplesView,
  },
  {
    path: "/phmeter/lims/:id",
    component: LimsDeviceSelection,
  },
];
export default phmeterRoutes;
