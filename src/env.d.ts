declare namespace NodeJS {
  interface ProcessEnv {
    VUE_APP_PRODUCTION: string;
    VUE_APP_PM_API_URL: string;
    VUE_APP_JM_API_URL: string;
    VUE_APP_UM_API_URL: string;
    VUE_APP_LIMS_API_URL: string;
    VUE_APP_SOCKET_URL: string;
    VUE_APP_MASTER_ID: string;
    VUE_APP_PROJECT_TYPE: string;
    VUE_APP_MONITORING_API_URL: string;
    VUE_APP_TIME_CONFIGURABLE: string;
  }
}
