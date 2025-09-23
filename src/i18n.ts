import { createI18n } from "vue-i18n";
// import { useStore } from "vuex";

// English
import enDataPage from "./locales/en/dataPage.json";
import enCommonData from "./locales/en/common.json";
import enDevicePage from "./locales/en/devicePage.json";
import enAuditPage from "./locales/en/auditPage.json";
import enMonitorPage from "./locales/en/monitorPage.json";
import enConstantsTranslate from "./locales/en/constantsTranslate.json";
import enMfgPage from "./locales/en/mfgPage.json";
import enNotificationPage from "./locales/en/notificationPage.json";

// Japanese
import jaDataPage from "./locales/ja/dataPage.json";
import jaCommonData from "./locales/ja/common.json";
import jaDevicePage from "./locales/ja/devicePage.json";
import jaAuditPage from "./locales/ja/auditPage.json";
import jaMonitorPage from "./locales/ja/monitorPage.json";
import jaConstantsTranslate from "./locales/ja/constantsTranslate.json";
import jaMfgPage from "./locales/ja/mfgPage.json";
import jaNotificationPage from "./locales/ja/notificationPage.json";

// Telugu
import teDataPage from "./locales/te/dataPage.json";
import teCommonData from "./locales/te/common.json";
import teDevicePage from "./locales/te/devicePage.json";
import teAuditPage from "./locales/te/auditPage.json";
import teMonitorPage from "./locales/te/monitorPage.json";
import teConstantsTranslate from "./locales/te/constantsTranslate.json";
import teMfgPage from "./locales/te/mfgPage.json";
import teNotificationPage from "./locales/te/notificationPage.json";

// Chinese(Simplified)
import zhCNDataPage from "./locales/zhCN/dataPage.json";
import zhCNCommonData from "./locales/zhCN/common.json";
import zhCNDevicePage from "./locales/zhCN/devicePage.json";
import zhCNAuditPage from "./locales/zhCN/auditPage.json";
import zhCNMonitorPage from "./locales/zhCN/monitorPage.json";
import zhCNConstantsTranslate from "./locales/zhCN/constantsTranslate.json";
import zhMfgPage from "./locales/zhCN/mfgPage.json";
import zhNotificationPage from "./locales/zhCN/notificationPage.json";

// Korean
import koKRDataPage from "./locales/koKR/dataPage.json";
import koKRCommonData from "./locales/koKR/common.json";
import koKRDevicePage from "./locales/koKR/devicePage.json";
import koKRAuditPage from "./locales/koKR/auditPage.json";
import koKRMonitorPage from "./locales/koKR/monitorPage.json";
import koKRConstantsTranslate from "./locales/koKR/constantsTranslate.json";
import koKRMfgPage from "./locales/koKR/mfgPage.json";
import koKRNotificationPage from "./locales/koKR/notificationPage.json";

// Hindi
import hiINDataPage from "./locales/hiIN/dataPage.json";
import hiINCommonData from "./locales/hiIN/common.json";
import hiINDevicePage from "./locales/hiIN/devicePage.json";
import hiINAuditPage from "./locales/hiIN/auditPage.json";
import hiINMonitorPage from "./locales/hiIN/monitorPage.json";
import hiINConstantsTranslate from "./locales/hiIN/constantsTranslate.json";
import hiINDMfgPage from "./locales/hiIN/mfgPage.json";
import hiINNotificationPage from "./locales/hiIN/notificationPage.json";

// const store = useStore();
const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: {
      dataPage: enDataPage,
      commonData: enCommonData,
      devicePage: enDevicePage,
      auditPage: enAuditPage,
      monitorPage: enMonitorPage,
      constantsTranslate: enConstantsTranslate,
      mfgPage: enMfgPage,
      notificationPage: enNotificationPage,
    },
    ja: {
      dataPage: jaDataPage,
      commonData: jaCommonData,
      devicePage: jaDevicePage,
      auditPage: jaAuditPage,
      monitorPage: jaMonitorPage,
      constantsTranslate: jaConstantsTranslate,
      mfgPage: jaMfgPage,
      notificationPage: jaNotificationPage,
    },
    te: {
      dataPage: teDataPage,
      commonData: teCommonData,
      devicePage: teDevicePage,
      auditPage: teAuditPage,
      monitorPage: teMonitorPage,
      constantsTranslate: teConstantsTranslate,
      mfgPage: teMfgPage,
      notificationPage: teNotificationPage,
    },
    zhCN: {
      dataPage: zhCNDataPage,
      commonData: zhCNCommonData,
      devicePage: zhCNDevicePage,
      auditPage: zhCNAuditPage,
      monitorPage: zhCNMonitorPage,
      constantsTranslate: zhCNConstantsTranslate,
      mfgPage: zhMfgPage,
      notificationPage: zhNotificationPage,
    },
    koKR: {
      dataPage: koKRDataPage,
      commonData: koKRCommonData,
      devicePage: koKRDevicePage,
      auditPage: koKRAuditPage,
      monitorPage: koKRMonitorPage,
      constantsTranslate: koKRConstantsTranslate,
      mfgPage: koKRMfgPage,
      notificationPage: koKRNotificationPage,
    },
    hiIN: {
      dataPage: hiINDataPage,
      commonData: hiINCommonData,
      devicePage: hiINDevicePage,
      auditPage: hiINAuditPage,
      monitorPage: hiINMonitorPage,
      constantsTranslate: hiINConstantsTranslate,
      mfgPage: hiINDMfgPage,
      notificationPage: hiINNotificationPage,
    },
  },
});
export default i18n;
