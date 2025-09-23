import { $axios } from "@/boot/axios"; // Import the $axios instance
import { environment } from "../../../environment/environment";
export class apcApiServices {
  PM_API_URL: string;
  JM_API_URL: string;
  UM_API_URL: string;

  constructor() {
    this.PM_API_URL = environment.PM_API_URL;
    this.JM_API_URL = environment.JM_API_URL;
    this.UM_API_URL = environment.UM_API_URL;
  }

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<-------Job Manager API's-------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  createApcJob = async (payload: any) => {
    try {
      const url = `${this.JM_API_URL}/jm/job`;
      const response = await $axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error("Error posting job data:", error);
      throw error;
    }
  };

  uploadDevicePicture = async (
    payload: any,
    method: string,
    pictureId?: number
  ) => {
    try {
      const baseUrl = `${this.PM_API_URL}/pm/picture`;
      const url = pictureId ? `${baseUrl}/${pictureId}` : baseUrl;

      console.log(":::: picturepayload", payload);

      const response = await $axios({
        method,
        url,
        data: payload,
      });

      return response.data;
    } catch (error) {
      console.error("Error posting image data:", error);
      throw error;
    }
  };

  userSamplePreference = async (
    method: string,
    payload?: any,
    preferenceId?: number,
    queryParams?: Record<string, any>
  ) => {
    try {
      const baseUrl = `${this.PM_API_URL}/pm/user-preference`;
      let url = preferenceId ? `${baseUrl}/${preferenceId}` : baseUrl;

      // Add query params if provided
      if (queryParams && Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams(queryParams).toString();
        url += `?${searchParams}`;
      }

      console.log(":::: picturepayload", payload);
      console.log(":::: final URL", url);

      const response = await $axios({
        method,
        url,
        data: payload,
      });

      return response.data;
    } catch (error) {
      console.error("Error posting image data:", error);
      throw error;
    }
  };

  startSampleInterval = async (payload: any) => {
    try {
      const url = `${this.JM_API_URL}/jm/sample-interval`;
      const response = await $axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error("Error posting job data:", error);
      throw error;
    }
  };

  continuousSample = async (payload: any) => {
    try {
      const decodedToken = JSON.parse(
        localStorage.getItem("DecodedToken") || "{}"
      );
      const url = `${this.JM_API_URL}/jm/start/continuous-sample`;
      const response = await $axios.post(url, payload, {
        headers: {
          "x-operator": decodedToken.username,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error posting job data:", error);
      throw error;
    }
  };

  getApcAssetIdTaskDefinitions = async (id: any) => {
    try {
      // const url = `${this.PM_API_URL}/pm/asset-job-def?asset_id=${id}`;
      const url = `${this.JM_API_URL}/jm/asset-supported-samples/${id}`; //localhost:9003/api/v1/jm/asset-samples/TestCl3100-01:02:03:04:05:06
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching asset task definitions:", error);
      throw error;
    }
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<-------User Management API's-------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  submitLimsRecord = async (payload: any) => {
    try {
      const UM_API_URL = process.env.VUE_APP_UM_API_URL;
      const url = `${UM_API_URL}/api/v1/um/updatesenaite`;
      const response = await $axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error("Error posting job data:", error);
      throw error;
    }
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<-------Pharma Api API's-------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  getApcTaskData = async (jobId: string) => {
    try {
      const url = `${this.PM_API_URL}/pm/task?job_id=${jobId}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task data:", error);
      throw error;
    }
  };

  getApcTaskResults = async (taskResultId: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/task-result?id=${taskResultId}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
      throw error;
    }
  };

  getApcTaskIdResults = async (taskId: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/task-result?task_id=${taskId}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
      throw error;
    }
  };
  getApcLimsSampleById = async (LimsSampleId: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/lims-sample?id=${LimsSampleId}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
      throw error;
    }
  };

  getAuditEvents = async (params: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/audit-event`;
      const response = await $axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching audit results:", error);
      throw error;
    }
  };
  getTasksData = async (params: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/task-result`;
      const response = await $axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
      throw error;
    }
  };

  getLimsTasksData = async (params: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/lims-sample`;
      const response = await $axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
      throw error;
    }
  };
  getExternalSampleData = async (params: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/external-sample`;
      const response = await $axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching external-sample results:", error);
      throw error;
    }
  };

  getLimsSampleData = async (params: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/lims-sample`;
      const response = await $axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching lims-sample results:", error);
      throw error;
    }
  };
  getLimsMeasureData = async () => {
    try {
      const url = `${this.PM_API_URL}/pm/task-result?is_asset_result=true&meta.source=LIMS&orderBy=id`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
    }
  };

  getAuditEventsByAssetId = async (currentpage: any, id: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/audit-event?to_show=true&asset_id=${id}&orderBy=id&page=${currentpage}&limit=10`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
    }
  };

  getDeviceDetailsById = async (id: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/asset?id=${id}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
    }
  };
  updateDeviceDetailsById = async (payload: any, id: any) => {
    try {
      const url = `${this.PM_API_URL}/pm/asset/${id}`;
      const response = await $axios.patch(url, payload);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
    }
  };
  resetDevice = async (assetId: string) => {
    try {
      const url = `${this.JM_API_URL}/jm/reset/${assetId}`;
      const response = await $axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching task results:", error);
    }
  };
}
