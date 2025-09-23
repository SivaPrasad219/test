import { $axios } from "@/boot/axios"; // Import the $axios instance
import axios from "axios";
import { environment } from "@/environment/environment";
import router from "@/router";
// import { useI18n } from "vue-i18n";
import i18n from "@/i18n";

import { message } from "ant-design-vue";
const PM_API_URL = environment.PM_API_URL;
const UM_API_URL = environment.UM_API_URL;
const JM_API_URL = environment.JM_API_URL;
// const DB_API_URL = environment.DB_API_URL;
const MONITORING_API_URL = environment.MONITORING_API_URL;
let clientKeyPrefix = "";
const decodedToken = localStorage.getItem("DecodedToken");
if (decodedToken) {
  const token = JSON.parse(decodedToken);
  clientKeyPrefix = `/${token.client_key}`;
  console.log("decodedToken", JSON.parse(decodedToken));
}

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
interface AuthResp {
  messag: string;
  access_token: string;
  refresh_token: string;
  access_token_validity: number;
}

function getAuthHeaders() {
  const token = localStorage.getItem("Token");
  const decodedToken = JSON.parse(localStorage.getItem("DecodedToken") || "{}");
  const clientId = decodedToken.customer_code;
  const userId = decodedToken.user_id;

  return {
    Authorization: `Bearer ${token}`,
    "X-Client-Id": clientId,
    "X-User-Id": userId,
  };
}

export async function fetchTodos(): Promise<Todo[]> {
  try {
    // Access the base URL from the $axios instance
    const response = await $axios.get("/todos");
    return response.data;
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

export async function login(payload: any): Promise<AuthResp> {
  try {
    const response = await $axios.post(`${UM_API_URL}/api/auth/token`, payload);
    return response.data as AuthResp;
  } catch (error: any) {
    // const { t } = useI18n();
    console.log("Error while logging in", error);
    let errorResponse = error?.response?.data?.message;
    if (
      errorResponse ===
        "Invalid Credentials, Please provide valid credentials" ||
      errorResponse === "User does not exist." ||
      errorResponse === "The user is inactive. Contact your site administrator."
    ) {
      errorResponse = i18n.global.t(
        `commonData['${errorResponse}']` as string,
        errorResponse
      );
    }
    message.error(
      errorResponse ||
        (i18n.global.t("commonData.Login failed") as string, "Login failed")
    );
    throw error.response.data;
  }
}

export async function getTaskResultsWithNotifications(
  categoryId: number,
  page = 1,
  limit = 10,
  modelName?: string,
  notCommented?: boolean
): Promise<any> {
  try {
    const params = new URLSearchParams({
      category_id: categoryId.toString(),
      page: page.toString(),
      limit: limit.toString(),
      strict: "no",
      sample_type: "continuous-sample",
    });

    if (modelName) {
      params.append("meta.asset_info.info.model", modelName);
    }

    if (notCommented) {
      params.append("not_commented", "true");
    }

    const response = await $axios.get(
      `${PM_API_URL}/pm/notification/task-results-with-notifications?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching task results with notifications:`, error);
    throw new Error(
      `Failed to fetch task results with notifications: ${error}`
    );
  }
}

export async function mfgConfirmatationCMSample(payload: any): Promise<any> {
  const decodedToken = JSON.parse(localStorage.getItem("DecodedToken") || "{}");
  try {
    const url = `${JM_API_URL}/jm/confirm-cm-sample`;
    const response = await axios.post(url, payload, {
      headers: {
        ...getAuthHeaders(),
        "x-operator": decodedToken.username,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function getApcTaskResultsById(taskResultId: any): Promise<any> {
  try {
    const url = `${PM_API_URL}/pm/task-result?id=${taskResultId}`;
    const response = await $axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching task results:", error);
    throw error;
  }
}
export async function esignConfirmLogin(payload: any): Promise<AuthResp> {
  try {
    const response = await $axios.post(
      `${UM_API_URL}/api/auth/e-sign`,
      payload
    );
    return response.data as AuthResp;
  } catch (error: any) {
    console.error("Error while logging in", error);
    throw error;
  }
}

export async function stopContinuousMonitoring(payload: any): Promise<any> {
  try {
    const url = `${JM_API_URL}/jm/stop/continuous-sample`;
    const response = await axios.post(url, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function confirmatationTaskResult(payload: any): Promise<any> {
  const decodedToken = JSON.parse(localStorage.getItem("DecodedToken") || "{}");
  try {
    const url = `${JM_API_URL}/jm/confirm`;
    const response = await axios.post(url, payload, {
      headers: {
        ...getAuthHeaders(),
        "x-operator": decodedToken.username,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function createJob(payload: any): Promise<any> {
  try {
    const url = `${JM_API_URL}/jm/api/job`;
    const response = await axios.post(url, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function getTaskData(jobId: string): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/task?job_id=${jobId}`);
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}
export async function getNotifications(
  id: any,
  categoryId: number,
  params: any
): Promise<any> {
  try {
    // Base URL
    let url = `${PM_API_URL}/pm/user-notification?user_id=${id}`;
    if (categoryId && categoryId !== 0) {
      url += `&${categoryId}`;
    }

    // Pass params as query parameters in the axios request
    const response = await $axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error in notifications API:`, error);
    throw new Error(`Failed to get notifications: ${error}`);
  }
}
export async function getNotificationsCounts(): Promise<any> {
  try {
    // http://localhost:3002/api/v1/
    const response = await $axios.get(
      `${PM_API_URL}/pm/user-notification/unread-count`
    );
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}
export async function getCategory(): Promise<any> {
  try {
    // http://localhost:3002/api/v1/
    const response = await $axios.get(`${PM_API_URL}/pm/category`);
    return response.data;
  } catch (error) {
    console.error(`Error in category api:`, error);
    throw new Error(`Failed to get category: ${error}`);
  }
}
// export async function putNotifications(id: number, data: any): Promise<any> {
//   try {
//     // http://localhost:3002/api/v1/
//     const response = await $axios.put(
//       `${DB_API_URL}/db/notification/${id}`,
//       data
//     );
//     return response.data;
//   } catch (error) {
//     console.error(`Error in picture api:`, error);
//     throw new Error(`Failed to get picture: ${error}`);
//   }
// }
export async function putNotifications(data: any): Promise<any> {
  try {
    // http://localhost:3002/api/v1/
    const response = await $axios.patch(
      `${PM_API_URL}/pm/user-notification/bulk-by-notification-id`,
      data
    );
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}

// export async function readBulkNotifications(data: {
//   is_read: boolean;
//   notification_ids: number[];
// }): Promise<any> {
//   try {
//     const response = await $axios.patch(
//       `${DB_API_URL}/db/notification/bulk-update`,
//       data
//     );
//     return response.data;
//   } catch (error) {
//     console.error(`Error in bulk notification update:`, error);
//     throw new Error(`Failed to mark notifications as read: ${error}`);
//   }
// }

export async function getTaskResults(taskId: string): Promise<any> {
  try {
    const response = await $axios.get(
      `${PM_API_URL}/pm/task-result?id=${taskId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}

export async function getAssetIdTaskDefinitions(assetId: string): Promise<any> {
  try {
    const response = await $axios.get(
      `${PM_API_URL}/pm/asset-task-def?assetid=${assetId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}

export async function externalSampleConfirm(
  payload: any,
  id: any
): Promise<any> {
  try {
    const url = `${PM_API_URL}/pm/external-sample/${id}`;
    const response = await axios.patch(url, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function sessionLogout(payload: any): Promise<any> {
  try {
    // console.log(payload);
    payload.auth_method = "db";
    payload.session_expired = true;
    const response = await $axios.post(
      `${UM_API_URL}/api/auth/revoke`,
      payload
    );
    if (response) {
      const decodedToken = localStorage.getItem("DecodedToken");
      const token = JSON.parse(decodedToken as string);
      clientKeyPrefix = `/${token.client_key}`;
      localStorage.clear();
      window.location.href = `${clientKeyPrefix}/login?isSessionExpired=true`;
      router.push({
        path: `${clientKeyPrefix}/login`,
        query: { isSessionExpired: "true" },
      });
    }
    return response;
  } catch (error) {
    console.error("Error while logging out", error);
  }
}

export async function logout(payload: any): Promise<any> {
  try {
    payload.auth_method = "db";
    const response = await $axios.post(
      `${UM_API_URL}/api/auth/revoke`,
      payload
    );
    if (response) {
      console.log("logout::::::");
      const decodedToken = localStorage.getItem("DecodedToken");
      const token = JSON.parse(decodedToken as string);
      clientKeyPrefix = `/${token.client_key}`;
      localStorage.clear();
      window.location.href = `${clientKeyPrefix}/login`;
    }
    return response;
  } catch (error) {
    console.error("Error while logging out", error);
  }
}

export async function getWorkFlows(): Promise<any> {
  try {
    const response = await $axios.get("/mockdata/workflow.json");
    return response.data;
  } catch (error) {
    console.error("Error while getting workflow:", error);
    throw new Error("Failed to get workflow data: " + error);
  }
}

export async function searchAuditEvents(
  page: number,
  orderBy: string,
  limit: number,
  strict: string,
  searchKey?: string,
  searchTerm?: string
): Promise<any> {
  try {
    const params: Record<string, any> = {
      page,
      orderBy,
      limit,
      strict,
    };
    // Add search parameters if provided
    if (searchKey && searchTerm) {
      params[searchKey] = searchTerm;
    }

    const response = await $axios.get(`${PM_API_URL}/pm/audit-event`);

    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch audit events");
  }
}

export async function getDeviceTypes(): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/asset-type`);
    return response.data;
  } catch (error) {
    console.error("Error fetching instrument types:", error);
    throw new Error("Failed to fetch instrument types: " + error);
  }
}

export async function getLimsSamples(
  page: any,
  searchKey: any,
  searchValue: any
): Promise<any> {
  let url;
  url = `${PM_API_URL}/pm/lims-sample?page=${page}&limit=10`;
  if (
    searchKey !== undefined &&
    searchKey !== null &&
    searchValue !== undefined &&
    searchValue !== null
  ) {
    url += `&${searchKey}=${searchValue}`;
  }
  try {
    const response = await $axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error while getting workflow:", error);
  }
}

export async function getLimsSamplesById(id: any): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/lims-sample/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error while getting workflow:", error);
  }
}

export async function getSiteById(id: any): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/site/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching instrument types:", error);
    throw new Error("Failed to fetch instrument types: " + error);
  }
}

export async function getUserById(id: any): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/user?id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching instrument types:", error);
    throw new Error("Failed to fetch instrument types: " + error);
  }
}

export async function getDevicePictureById(id: string): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/picture/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching instrument picture for ID ${id}:`, error);
  }
}

export async function getRoles(): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/role`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching instrument picture for ID :`, error);
    throw new Error(`Failed to fetch instrument picture for ID: ${error}`);
  }
}

export async function getSites(): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/site`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching instrument picture for ID :`, error);
  }
}
export async function getSitesByActive(): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/site?status=ACTIVE`);
    return response.data;
  } catch (error) {
    console.log(`Error fetching instrument picture for ID :`, error);
  }
}

export async function createUser(payload: any): Promise<any> {
  try {
    const response = await $axios.post(`${PM_API_URL}/pm/user`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error creating user:`, error);
    throw error;
  }
}

export async function updateUserById(
  user_id: number,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/user/${user_id}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating user:", error?.response?.data || error);
    // just rethrow the original error so catch in handleSubmit can access response.data
    throw error;
  }
}

export async function fetchDataFromAPI(
  url: string,
  method: string,
  params: Record<string, any>,
  payload?: any,
  fileName?: string // Add fileName parameter
): Promise<any> {
  console.log("fetchDataFromAPI", url);
  try {
    const requestOptions: any = {
      url: `${PM_API_URL}${url}`, // Combine base URL with endpoint
      method,
      params,
    };

    // Check if the request is for file download
    if (params.exportType) {
      requestOptions.responseType = "blob"; // Set response type to blob for file downloads
    }

    if (payload) {
      requestOptions.data = payload;
    }

    const response = await $axios.request(requestOptions);

    if (params.exportType) {
      // Handle file download
      const blob = new Blob([response.data], {
        type: "application/octet-stream",
      });
      const date = new Date().toISOString().slice(0, 19).replace(/[-:]/g, ""); // Format date
      const filename = `${fileName ? fileName : "export"}-${date}.${
        params.exportType
      }`; // Use the passed fileName or fallback to 'export'
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      return { success: true };
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetchDataFromAPI:", error);
    throw new Error("Failed to fetchDataFromAPI");
  }
}

export async function fetchLimsDataFromAPI(
  url: string,
  method: string,
  params: Record<string, any>,

  payload?: any
): Promise<any> {
  console.log("fetchLimsDataFromAPI", url);
  try {
    const requestOptions: any = {
      url,
      method,
      params,
    };
    requestOptions.url = url;
    if (payload) {
      requestOptions.data = payload;
      $axios.defaults.withCredentials = true;
    }
    const response = await $axios.request(requestOptions);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetchLimsDataFromAPI");
  }
}
// let url = this.PM_API_URL + "/api/v1/jm/site";

export async function createSite(payload: any): Promise<any> {
  try {
    const response = await $axios.post(`${PM_API_URL}/pm/site`, payload);
    return response.data;
  } catch (error: any) {
    console.error(`Error creating user:`, error);
    message.error(
      i18n.global.t(
        `commonData['${error?.response?.data.message}']`,
        error?.response?.data.message
      )
    );
    throw new Error(`Failed to create user: ${error}`);
  }
}
// let url = this.PM_API_URL + "/api/v1/pm/site/" + id;

// let url = this.PM_API_URL + `/api/v1/site/jm/${site_id}`;

export async function updateSiteById(
  site_id: number,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/site/${site_id}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error(`Error updating site:`, error);
    if (
      error.response?.data.code === 400 &&
      (error.response?.data.message ===
        "Unable to edit site when user(s) are associated to this site." ||
        error.response?.data.message ===
          "Unable to inactivate site when user(s) are associated to this site." ||
        error.response?.data.message === "Unable to deactivate default site" ||
        error.response?.data.message ===
          "Unable to edit site when the instrument(s) are associated to this site." ||
        error.response?.data.message ===
          "Unable to inactivate site when the instrument(s) are associated to this site." ||
        error.response?.data.message ===
          "Unable to edit site when user(s) and device(s) are associated with this site." ||
        error.response?.data.message ===
          "Unable to inactivate site when user(s) and device(s) are associated with this site.")
    ) {
      const errorMessage = error?.response?.data?.message;
      message.error(
        i18n.global.t(`commonData['${errorMessage}']`, errorMessage)
      );
    } else {
      console.log("Validation failed or API error:", error);
    }
    throw new Error(`Failed to create user: ${error}`);
  }
}

// Function to activate a user
export async function activateUserApi(
  userId: string,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/user/${userId}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error activating user:`, error);
    throw new Error(`Failed to activate user: ${error}`);
  }
}

// Function to deactivate a user
export async function deactivateUserApi(
  userId: string,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/user/${userId}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error deactivating user:`, error);
    throw new Error(`Failed to deactivate user: ${error}`);
  }
}

// Function to activate a user
export async function activateSiteApi(
  site_id: string,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/site/${site_id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error activating user:`, error);
  }
}

// Function to deactivate a user
export async function deactivateSiteApi(
  site_id: string,
  payload: any
): Promise<any> {
  try {
    const response = await $axios.patch(
      `${PM_API_URL}/pm/site/${site_id}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    if (
      error?.response?.data.code === 400 &&
      (error?.response?.data.message ===
        "Unable to edit site when user(s) are associated to this site." ||
        error?.response?.data.message ===
          "Unable to inactivate site when user(s) are associated to this site." ||
        error?.response?.data.message === "Unable to deactivate default site" ||
        error?.response?.data.message ===
          "Unable to inactivate site when the instrument(s) are associated to this site." ||
        error?.response?.data.message ===
          "Unable to edit site when the instrument(s) are associated to this site." ||
        error?.response?.data.message ===
          "Unable to edit site when user(s) and device(s) are associated with this site." ||
        error?.response?.data.message ===
          "Unable to inactivate site when user(s) and device(s) are associated with this site.")
    ) {
      message.error(
        i18n.global.t(
          `commonData['${error?.response?.data.message}']`,
          error?.response?.data.message
        )
      );
    }
  }
}

export async function getPictureById(id: string): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/picture/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error in picture api:`, error);
    throw new Error(`Failed to get picture: ${error}`);
  }
}

// http://localhost:9003/api/v1/jm/abort

export async function sampleAbort(payload: any): Promise<any> {
  try {
    const url = `${JM_API_URL}/jm/abort`;
    const response = await axios.post(url, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function sampleForceDrop(payload: any): Promise<any> {
  try {
    const url = `${JM_API_URL}/jm/force-drop`;
    const response = await axios.post(url, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}

export async function exportAuditForLimsEditor(payload: any) {
  try {
    const url = `${JM_API_URL}/jm/lims-editor-audit`;
    const decodedToken = JSON.parse(
      localStorage.getItem("DecodedToken") || "{}"
    );
    const response = await axios.post(url, payload, {
      headers: {
        ...getAuthHeaders(),
        "x-operator": decodedToken.username,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting job data:", error);
    throw error;
  }
}
// Create New Client From Super-Admin User
export async function createNewClient(payload: any): Promise<any> {
  try {
    const response = await $axios.post(`${PM_API_URL}/pm/add-client`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error in creating new Client api:`, error);
    throw new Error(`Failed to get creating new Client: ${error}`);
  }
}
// get monitor table data
export async function getMonitorData(): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/monitor`);
    return response.data;
  } catch (error) {
    console.error(`Error in monitor api:`, error);
    throw new Error(`Failed to get monitor: ${error}`);
  }
}
export async function getMonitorDataByIp(ip: string): Promise<any> {
  try {
    const response = await $axios.get(`${PM_API_URL}/pm/monitor?ip=${ip}`);
    return response.data;
  } catch (error) {
    console.error(`Error in monitor api:`, error);
    throw new Error(`Failed to get monitor: ${error}`);
  }
}

export async function updateEmDeviceState(ip: string, payload: any) {
  try {
    console.log("MONITORING_API_URL", `${MONITORING_API_URL}`);
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-device-update/${ip}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error in updateEmDeviceState api:`, error);
    throw new Error(`Failed to get updateEmDeviceState: ${error}`);
  }
}

export async function getPollingStatus(ip: string) {
  try {
    const response = await $axios.get(
      `${MONITORING_API_URL}/mm/logs-polling/${ip}/status`
    );
    return response.data;
  } catch (error) {
    console.error(`Error in updateEmDeviceState api:`, error);
    throw new Error(`Failed to get updateEmDeviceState: ${error}`);
  }
}

export async function downloadCompletedLogs(ip: string, deviceName: string) {
  try {
    const response = await $axios.get(
      `${MONITORING_API_URL}/mm/logs-polling/${ip}/download`,
      {
        responseType: "blob",
      }
    );
    if (response) {
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${deviceName}_logs.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      throw new Error("Failed to download logs");
    }
  } catch (error) {
    console.error("Error downloading logs:", error);
  }
}

export async function uploadZipFile(
  ipList: string,
  fileName: string,
  zipBlob: Blob,
  path: string
) {
  const formData = new FormData();
  formData.append("ipList", ipList);
  formData.append("fileName", fileName);
  formData.append("file", zipBlob);
  formData.append("path", path);
  try {
    return await $axios.post(
      `${MONITORING_API_URL}/mm/upload-em-files`,
      formData
    );
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

export async function fetchVersionTypeModelByEmIp(emIp: string, payload: any) {
  try {
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-add-method/${emIp}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error in fetchVersionTypeModel api:", error);
    throw new Error(`Failed to fetch version, type, model ${error}`);
  }
}

export async function fetchDeviceOptionsByVersion(emIp: string, payload: any) {
  try {
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-add-method/${emIp}`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error in fetchDeviceOptionsByVersion api:", error);
    throw new Error(`Failed to fetch device options ${error}`);
  }
}

export async function addDevice(emIp: string, payload: any) {
  try {
    const custom_timeOut = 60000;
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-add-method/${emIp}`,
      payload,
      { timeout: custom_timeOut }
    );

    return response.data;
  } catch (error) {
    console.error("Error in addDevice api:", error);
    throw new Error(`Failed to add device options ${error}`);
  }
}

export const fetchChunksStatusByEdgemanIp = async (uploadId: string) => {
  try {
    console.log(uploadId);
    const response = await $axios.get(
      `${PM_API_URL}/pm/monitor?upload_id=${uploadId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error in fetchChunksStatusByEdgemanIp api:", error);
    throw new Error(`Failed to fetch fetchChunksStatusByEdgemanIp ${error}`);
  }
};

export async function emServiceStart(payload: any) {
  try {
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-service-restart`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error in emServiceStart api:", error);
    throw new Error(`Failed to restart EdgeManager Service  ${error}`);
  }
}

export async function getAllDevicesData(emIp: string, payload: any) {
  try {
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-add-method/${emIp}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error in getAllDevicesData api:", error);
    throw new Error(`Failed to getAllDevicesData ${error}`);
  }
}

export async function getLogSizeByDeviceName(emIp: string, payload: any) {
  try {
    const response = await $axios.post(
      `${MONITORING_API_URL}/mm/em-add-method/${emIp}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error in getLogSizeByDeviceName api:", error);
    throw new Error(`Failed to getLogSizeByDeviceName ${error}`);
  }
}
export { $axios };
