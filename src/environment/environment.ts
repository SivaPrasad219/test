const baseURL = window.location.origin;

export const environment = {
  production: process.env.VUE_APP_PRODUCTION === "production",
  PM_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_PM_API_URL}`
      : process.env.VUE_APP_PM_API_URL,
  UM_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_UM_API_URL}`
      : process.env.VUE_APP_UM_API_URL,
  JM_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_JM_API_URL}`
      : process.env.VUE_APP_JM_API_URL,
  MONITORING_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_MONITORING_API_URL}`
      : process.env.VUE_APP_MONITORING_API_URL,
  LIMS_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_LIMS_API_URL}`
      : process.env.VUE_APP_LIMS_API_URL,
  SOCKET_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_SOCKET_URL}`
      : process.env.VUE_APP_SOCKET_URL,
  MONITORING_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_MONITORING_URL}`
      : process.env.VUE_APP_MONITORING_URL,
  DB_API_URL:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_DB_API_URL}`
      : process.env.VUE_APP_DB_API_URL,
  MASTER_ID:
    process.env.VUE_APP_PRODUCTION === "production"
      ? `${baseURL}${process.env.VUE_APP_MASTER_ID}`
      : process.env.VUE_APP_MASTER_ID,
};
