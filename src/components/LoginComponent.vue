<template>
  <div class="formParent">
    <div class="logo">
      <img
        v-if="clientKey === 'L3674F=G'"
        src="../assets/labware-logo.png"
        alt=""
      />
      <img v-else src="../assets/phizzle-logo.png" alt="" />
    </div>
    <div class="formContainer">
      <h1 class="loginName">Digital Air</h1>
      <a-form class="login-form" :form="form" v-if="!isResetPasswordVisible">
        <a-form-item
          v-for="field in sortedVisibleFields"
          :key="field.id"
          class="form-item"
        >
          <template #default>
            <template
              v-if="
                field.type === 'input' ||
                field.type === 'text' ||
                field.type === 'email'
              "
            >
              <a-input
                v-model="formModel[field.id]"
                :type="field.type"
                :readonly="field.read_only"
                class="login-input"
                :placeholder="translateLabel('commonData', field.label)"
                @input="updateFormModel(field.id, $event.target.value)"
                :status="
                  field.id === 'username' && usernameError ? 'error' : ''
                "
              >
                <template #prefix>
                  <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
                </template>
              </a-input>
              <p
                v-if="field.id === 'username' && usernameError"
                class="inputError"
              >
                {{ usernameError }}
              </p>
            </template>
            <template v-else-if="field.type === 'password'">
              <a-input-password
                v-model="formModel[field.id]"
                :readonly="field.read_only"
                class="login-input"
                :placeholder="translateLabel('commonData', field.label)"
                @input="updateFormModel(field.id, $event.target.value)"
                :status="passwordError ? 'error' : ''"
              >
                <template #prefix>
                  <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
                </template>
              </a-input-password>
              <p v-if="passwordError" class="inputError">
                {{ passwordError }}
              </p>
            </template>
            <template v-else-if="field.type === 'select'">
              <a-select
                v-model="formModel[field.id]"
                class="login-input"
                :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              >
                <a-select-option
                  v-for="option in field.options"
                  :key="option.key"
                  :value="option.key"
                  :default-selected="option.key === field.default"
                  >{{ option.value }}</a-select-option
                >
              </a-select>
            </template>
          </template>
        </a-form-item>
        <a-select
          :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
          v-model:value="selectedLanguage"
          style="width: 100%; margin-bottom: 20px"
          placeholder="Select Language"
          @change="changeLocale"
        >
          <a-select-option value="en">
            <a-tooltip title="English">
              <span>English</span>
            </a-tooltip>
          </a-select-option>
          <a-select-option value="ja">
            <a-tooltip title="Japanese">
              <span>日本語</span>
            </a-tooltip>
          </a-select-option>
          <a-select-option value="zhCN">
            <a-tooltip title="Chinese (Simplified)">
              <span>中文（简体）</span>
            </a-tooltip>
          </a-select-option>
          <a-select-option value="koKR">
            <a-tooltip title="Korean">
              <span>한국인</span>
            </a-tooltip>
          </a-select-option>
          <!-- <a-select-option value="te">
            <a-tooltip title="Telugu">
              <span>తెలుగు</span>
            </a-tooltip>
          </a-select-option> -->
          <!-- <a-select-option value="hiIN">
            <a-tooltip title="Hindi">
              <span>हिन्दी</span>
            </a-tooltip>
          </a-select-option> -->
        </a-select>
        <div class="forgot">
          <p style="cursor: pointer" @click="showNotification">
            {{ translateLabel("commonData", forgotLabel) }}
          </p>
        </div>

        <a-button
          class="login-form-button"
          type="primary"
          html-type="submit"
          :loading="isLoading"
          @click="handleSubmit(formModel)"
        >
          {{ t("commonData.Login", "Login") }}
        </a-button>
      </a-form>
      <h4
        v-if="isSessionExpired"
        style="text-align: center; margin-bottom: 10px; color: red"
      >
        {{ t("commonData.Session Expired", "Session Expired") }}
      </h4>
      <ResetPasswordComponent
        v-if="isResetPasswordVisible"
        :userId="userIdFlag"
        :oldPassword="formModel.password"
        @close-reset-password="handleCloseResetPassword"
      />
      <h4 class="footer-details">© {{ currentYear }} Phizzle, Inc.</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import router from "@/router";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";

import { getSiteById, login } from "@/services/apiService";
import loginData from "../mockdata/login.json";
import { getTaskFields } from "@/common/utils";
import { useStore } from "vuex";
import { jwtDecode } from "jwt-decode";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import ResetPasswordComponent from "./ResetPasswordComponent.vue";
import { environment } from "@/environment/environment";
import { translateLabel } from "@/common/utils";
interface Field {
  id: string;
  type: string;
  label: string;
  is_visible: boolean;
  read_only: boolean;
  options?: { key: string; value: string }[];
  default?: string;
  sequence: number;
}
const currentYear = new Date().getFullYear();
const form = ref<any>(null);
const formModel = reactive<{ [key: string]: any }>({});
const visibleFields = ref<Field[]>([]);
const userIdFlag = ref<any>(null);
const isLoading = ref(false);
const isResetPasswordVisible = ref(false);
const route = useRoute();
const { locale, t } = useI18n();
const selectedLanguage = ref<any>("en");
const forgotLabel = ref("Forgot Password?");
const isSessionExpired = computed(
  () => route.query.isSessionExpired === "true"
);
const loggedRole = ref<string>("");
const usernameError = ref("");
const passwordError = ref("");
const store = useStore();
const clientKey: any = ref((route.params.clientKey as string) || "");
const updateFormModel = (field: string, value: any) => {
  formModel[field] = value;
  validateField(field, value);
};

const validateField = (field: string, value: any) => {
  switch (field) {
    case "username":
      usernameError.value = value
        ? ""
        : t(
            "commonData.Please input your username!",
            "Please input your username!"
          );
      break;
    case "password":
      passwordError.value = value
        ? ""
        : t(
            "commonData.Please input your password!",
            "Please input your password!"
          );
      break;
  }
};

const changeLocale = (value: string) => {
  console.log("locale.value", value);
  selectedLanguage.value = value;
  locale.value = value;
  store.dispatch("setLocale", value);
  localStorage.setItem("language", value);
  if (usernameError.value.length) {
    validateField("username", formModel.username);
  }

  if (passwordError.value.length) {
    validateField("password", formModel.password);
  }
};

const fetchWorkflowData = async () => {
  try {
    const workflowData: {
      workflow: { id: number; name: string; jobs: any[] };
    } = loginData;
    const jobs = workflowData.workflow.jobs;
    const allFields: any[] = [];
    for (const job of jobs) {
      for (const task of job.tasks) {
        if (task.fields) {
          allFields.push(...task.fields);
        } else if (task.tasks) {
          const nestedFields = getTaskFields(task.tasks);
          if (nestedFields.length > 0) {
            allFields.push(...nestedFields);
          }
        }
      }
    }
    visibleFields.value = allFields.filter((field: Field) => field.is_visible);
    initializeFormModel();
  } catch (error) {
    console.error("Error fetching workflow data:", error);
  }
};

const initializeFormModel = () => {
  for (const field of visibleFields.value) {
    formModel[field.id] =
      field.type === "select" && field.options
        ? field.default || field.options[0].key
        : "";
  }
  console.log("Initialized formModel:", formModel);
};

const showNotification = () => {
  message.info(
    t(
      "commonData.For Username & Password Resets contact your site administrator"
    )
  );
};

const handleSubmit = async (formModel: any) => {
  validateField("username", formModel.username);
  validateField("password", formModel.password);
  if (!formModel.username && !formModel.password) {
    message.error(
      t(
        "commonData.Username and Password are required",
        "Username and Password are required"
      )
    );
    return;
  }
  if (usernameError.value || passwordError.value) {
    return;
  }
  // clientCode

  console.log("Client Code:", clientKey.value);

  isLoading.value = true;
  const formData = { ...formModel };
  formData.auth_method = "db";
  formData.client_key = clientKey.value;

  try {
    const response = await login(formData);
    console.log("Response:", response);
    if (response.access_token) {
      const decodedToken: any = jwtDecode(response.access_token);
      decodedToken["client_key"] = clientKey.value;
      loggedRole.value = decodedToken.role || "";
      console.log("decoded", decodedToken);
      localStorage.setItem("Token", response.access_token);
      localStorage.setItem("DecodedToken", JSON.stringify(decodedToken));
      store.dispatch("saveToken", response.access_token);
      store.dispatch("saveDecodedToken", decodedToken);
      store.dispatch("setIsLoggedIn", true);
      console.log(
        "decodedToken.is_default_password",
        decodedToken.is_default_password
      );
      if (
        !decodedToken.is_default_password &&
        clientKey.value === environment.MASTER_ID
      ) {
        message.success(t("commonData.Welcome", "Welcome"));
        router.push("/clients");
      } else if (
        !decodedToken.is_default_password &&
        clientKey.value !== environment.MASTER_ID
      ) {
        try {
          const siteById = await getSiteById(decodedToken.site_id);
          console.log("siteById:", siteById);
          localStorage.setItem("timeZone", siteById.data.site_timezone);
        } catch (err) {
          console.log("error getting all sites");
        }
        message.success(t("commonData.Welcome", "Welcome"));

        if (loggedRole.value === "super-admin") {
          router.push("/clients");
        } else {
          router.push("/devicetype");
        }
      } else {
        userIdFlag.value = decodedToken.user_id;
        isResetPasswordVisible.value = true;
      }
    }
  } catch (error: any) {
    console.log("Error:", error);
    if (error?.message === "User does not exist.") {
      forgotLabel.value = "Forgot Username?";
    } else {
      forgotLabel.value = "Forgot Password?";
    }
  } finally {
    isLoading.value = false;
  }
};

const handleCloseResetPassword = () => {
  isResetPasswordVisible.value = false;
  // Clear username and password fields
  formModel.username = "";
  formModel.password = "";
};

const validateDecodedToken = (clientKey: string) => {
  const tokenString = localStorage.getItem("DecodedToken");

  if (!tokenString) {
    console.log("No DecodedToken found in localStorage.");
    return false;
  }

  try {
    const decodedToken = JSON.parse(tokenString);

    // Check if client_key matches
    if (decodedToken.client_key !== clientKey) {
      console.log("client_key does NOT match route.params.clientKey");
      return false;
    }

    console.log("client_key matches route.params.clientKey");

    // Check if token is expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < currentTimestamp) {
      console.log("Token has expired!");
      return false;
    }

    console.log("Token is still valid.");
    return true;
  } catch (error) {
    console.error("Error parsing DecodedToken:", error);
    return false;
  }
};
const checkClientKeyFromURL = () => {
  try {
    const storedToken = localStorage.getItem("DecodedToken");
    if (!storedToken) return;

    const parsedToken = JSON.parse(storedToken);
    const clientKeyFromToken = parsedToken?.client_key;

    // Extract path segment after base domain
    const currentPathSegment = window.location.pathname.split("/")[1]; // e.g., "cGh6aW90"

    if (clientKeyFromToken === currentPathSegment) {
      console.log(
        "client_key matches URL segment — redirecting to /devicetype"
      );
      router.push("/devicetype");
    }
  } catch (error) {
    console.error("Error in checkClientKeyFromURL:", error);
  }
};

onMounted(() => {
  fetchWorkflowData();

  if (validateDecodedToken(clientKey)) {
    console.log("valied token exist");
    router.push("/devicetype");
  }

  checkClientKeyFromURL();
});

const sortedVisibleFields = computed(() =>
  visibleFields.value.slice().sort((a, b) => a.sequence - b.sequence)
);
</script>

<style lang="css">
.login-input {
  flex: 1;
}

.login-form {
  max-width: 80%;
  margin: 35px auto;
}

.login-form-button {
  width: 100%;
  background-color: #1890ff;
}

.inputError {
  text-align: left;
  color: red;
  margin-bottom: 0px;
  margin-top: 3px;
  margin-left: 6px;
}

.logo {
  text-align: center;
  height: 10%;
  background-color: #436c79;
  padding: 2%;
}
.logo img {
  width: 200px;
  height: 75px;
  object-fit: contain;
}

.formContainer {
  border: 1px solid #e8e8e8;
  width: 402px;
  padding-top: 10px;
  background-color: white;
  margin-top: 12em;
  padding: 24px;
  position: absolute;
  left: 50%;
  top: 30%;
  transform: translate(-50%, -50%);
}

.forgot {
  font-size: 13px !important;
  display: flex;
  justify-content: flex-end;
  width: 100%;
  color: #4bbceb;
}
.footer-details {
  align-items: center;
  text-align: center;
  font-size: 13px;
}
.loginName {
  text-align: center;
}

@media only screen and (max-width: 768px) {
  /* Tab View */
  .login-form {
    max-width: 70%;
  }

  .formContainer {
    width: 90%;
    margin-top: 10%;
  }
}

@media only screen and (max-width: 480px) {
  /* Mobile View */
  .login-form {
    max-width: 80%;
    margin: 30px auto;
  }

  .formContainer {
    width: 100%;
    margin-top: 15%;
  }
}
</style>
