import { App, Plugin } from "vue";
import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import router from "@/router";
// import { useStore } from "vuex";
import { sessionLogout } from "@/services/apiService";

// Create an Axios instance
const $axios: AxiosInstance = axios.create({
  // Other Axios configurations...
});

// const store = useStore();

// const checkTokenExpiration = async () => {
//   const decodedToken = localStorage.getItem("DecodedToken");
//   if (decodedToken) {
//     const parseDecodedToken = JSON.parse(decodedToken);
//     const currentTime = Date.now() / 1000; // Convert to Unix timestamp (seconds)
//     console.log("parseDecodedToken", parseDecodedToken, currentTime);
//     if (parseDecodedToken.exp < currentTime) {
//       console.log("axios revoke");
//       const token = localStorage.getItem("Token");
//       if (token) {
//         await sessionLogout({ token: token });
//       }
//       localStorage.clear();
//       router.push("/login");
//     }
//   }
// };

// Add a request interceptor
$axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ensure headers object exists
    config.headers = config.headers || {};

    // Retrieve the token from local storage
    const token = localStorage.getItem("Token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Retrieve the decoded token from local storage
    const decodedToken = localStorage.getItem("DecodedToken");
    if (decodedToken) {
      const parseDecodedToken = JSON.parse(decodedToken);
      const customerCode = parseDecodedToken.customer_code;
      const userId = parseInt(parseDecodedToken.user_id);
      if (customerCode) {
        config.headers["X-Client-Id"] = customerCode;
        config.headers["X-User-Id"] = userId;
      }
    }

    // Check if exportType is present in params
    if (config.params && config.params.exportType) {
      config.responseType = "blob"; // Set the response type to 'blob' if exportType is present
    }

    // You can modify the config before sending the request
    //console.log("Request interceptor:", config);
    return config;
  },
  (error) => {
    // Handle request errors
    //console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
$axios.interceptors.response.use(
  async (response: AxiosResponse) => {
    // You can modify the response data
    //console.log("Response interceptor:", response.data);
    return response;
  },
  async (error) => {
    // Handle response errors
    console.error("Response interceptor error:", error);
    const errorMessage = error.response?.data?.message || error.response?.data;
    let clientKeyPrefix = "";
    const decodedToken = localStorage.getItem("DecodedToken");
    if (decodedToken) {
      const token = JSON.parse(decodedToken);
      clientKeyPrefix = `/${token.client_key}`;
      console.log("decodedToken", JSON.parse(decodedToken));
    }
    if (errorMessage === "Access denied. Token expired.") {
      const token = localStorage.getItem("Token");
      if (token) {
        await sessionLogout({ token: token });
      }
      localStorage.clear();
      router.push(`${clientKeyPrefix}/login`);
    } else if (errorMessage === "Token already revoked") {
      localStorage.clear();
      window.location.href = `${clientKeyPrefix}/login`;
    } else if (errorMessage === "User Not found") {
      localStorage.clear();
      window.location.href = `${clientKeyPrefix}/login`;
    }

    return Promise.reject(error);
  }
);

const axiosPlugin: Plugin = {
  install(app: App) {
    // Make $axios available globally
    app.config.globalProperties.$axios = $axios;
  },
};

export { $axios }; // Export $axios instance
export default axiosPlugin;
