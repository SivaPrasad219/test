<template>
  <a-modal
    v-model:open="isVisible"
    @ok="handleOk"
    @keydown.enter.prevent="handleOk"
    @cancel="handleCancel"
    :ok-button-props="{
      disabled: isButtonDisabled,
      loading: isLoading,
    }"
    :bodyStyle="{ padding: '0 !important' }"
  >
    <!-- Custom Title Slot -->
    <template #title>
      <a-tooltip :title="translatedTitle">
        <div class="header-title ellipsis">
          {{ truncatedTitle }}
        </div>
      </a-tooltip>
      <a-divider style="margin: 8px 0" />
    </template>

    <!-- Form Content -->
    <div class="formConfirm">
      <a-form
        ref="formRef"
        :model="formData"
        :layout="formLayout"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item
          :label="translateLabel('commonData', 'Username')"
          name="user"
          :rules="[
            {
              required: true,
              message: translateLabel(
                'commonData',
                'Please input your username!'
              ),
            },
          ]"
        >
          <a-input
            v-model:value="formData.user"
            :placeholder="translateLabel('commonData', 'Enter your username')"
          >
            <template #prefix>
              <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          :label="translateLabel('commonData', 'Password')"
          name="password"
          :rules="[
            {
              required: true,
              message: translateLabel(
                'commonData',
                'Please input your password!'
              ),
            },
          ]"
        >
          <a-input
            :type="passwordVisible ? 'text' : 'password'"
            v-model:value="formData.password"
            :placeholder="translateLabel('commonData', 'Enter your password')"
          >
            <template #prefix>
              <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
            <!-- Eye icon to toggle password visibility -->
            <template #suffix>
              <a @click="togglePasswordVisibility">
                <EyeOutlined
                  v-if="passwordVisible"
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }"
                />
                <EyeInvisibleOutlined
                  v-else
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.25)' }"
                />
              </a>
            </template>
          </a-input>
        </a-form-item>
      </a-form>
    </div>

    <!-- Custom Footer Slot -->
    <template #footer>
      <a-divider style="margin: 16px 0" />
      <div class="footer-content">
        <a-button @click="handleCancel">{{
          translateLabel("commonData", "Cancel")
        }}</a-button>
        <a-button
          type="primary"
          :loading="isLoading"
          @click="handleOk"
          @keydown.enter.prevent="handleOk"
          :disabled="isButtonDisabled"
        >
          {{
            translateLabel(
              "commonData",
              `Verify Signature & ${esignData.action}`
            )
          }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script lang="ts">
import { useI18n } from "vue-i18n";
import {
  defineComponent,
  reactive,
  toRefs,
  computed,
  ref,
  watch,
  nextTick,
  onUnmounted,
  onMounted,
} from "vue";
import {
  Modal,
  Form,
  Input,
  Divider,
  Button,
  message,
  Tooltip,
} from "ant-design-vue";
import {
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
import { translateLabel } from "@/common/utils";
import type { FormInstance } from "ant-design-vue";

import {
  sampleAbort,
  sampleForceDrop,
  esignConfirmLogin,
  stopContinuousMonitoring,
} from "../services/apiService";
export default defineComponent({
  components: {
    AModal: Modal,
    AForm: Form,
    AFormItem: Form.Item,
    AInput: Input,
    ADivider: Divider,
    AButton: Button,
    ATooltip: Tooltip,
    LockOutlined,
    UserOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
  },
  props: {
    open: {
      type: Boolean,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },

  setup(props, { emit }) {
    const { t } = useI18n();

    // Define translatedTitle at the top level using t directly
    const translatedTitle = ref("");
    const updateTranslatedTitle = () => {
      translatedTitle.value = t(
        `commonData.E-Signature Needed to Confirm ${esignData.value.action} for ${esignData.value.sampleType}`
      );
    };

    const formData = reactive({
      user: "",
      password: "",
    });

    const isLoading = ref(false);

    const esignData = ref(props.data);

    console.log(":::: data from the parent component ::", esignData.value);

    const { open } = toRefs(props);
    const decodedTokenString = localStorage.getItem("DecodedToken");
    const formRef = ref<FormInstance | null>(null);
    let userName = "";
    const enterKeyHandler = (event: any) => {
      if (event.key === "Enter") {
        handleOk();
      }
    };
    if (decodedTokenString) {
      const decodedToken = JSON.parse(decodedTokenString);
      userName = decodedToken.username;
    }

    const isFormValid = computed(() => {
      return formData.user.length > 0 && formData.password.length > 0;
    });

    const truncatedTitle = computed(() => {
      return translatedTitle.value.length > 45
        ? translatedTitle.value.slice(0, 45) + "..."
        : translatedTitle.value;
    });

    const passwordVisible = ref(false);

    const togglePasswordVisibility = () => {
      //console.log("lock function calling", passwordVisible.value);
      passwordVisible.value = !passwordVisible.value;
    };

    // Computed property to determine if the button should be disabled
    const isButtonDisabled = computed(() => {
      const {
        action,
        isSampling,
        connectionStatus,
        jobId,
        activeJobId,
        isRecurringJob,
      } = esignData.value || {};

      if (!isFormValid.value) return true;
      if (!isSampling && jobId === null && !isRecurringJob) return true;

      if (action === "Abort" && activeJobId !== null) {
        return false;
      } else if (
        action === "Force Drop" &&
        connectionStatus === "disconnected" &&
        isSampling
      ) {
        return false;
      } else if (
        action === "Sample Stop" &&
        connectionStatus !== "disconnected" &&
        isSampling
      ) {
        return false;
      }
      return true;
    });

    const handleOk = async () => {
      isLoading.value = true;

      const esignFormData = {
        username: formData.user,
        password: formData.password,
        asset_type_id: esignData.value?.meta?.sample_data?.asset_type_id,
        task_result_id: esignData.value?.taskResultId,
        devicename: esignData.value?.meta?.sample_data?.asset_name,
      };

      if (userName.toLowerCase() !== formData.user.toLowerCase()) {
        message.error(
          `${t(
            "commonData.Authentication failed for",
            "Authentication failed for "
          )} "${userName}"`
        );
        isLoading.value = false;
        return;
      }

      try {
        const loginResult = await esignConfirmLogin(esignFormData);
        if (loginResult) {
          const action = esignData.value?.action;

          let result;
          if (action === "Sample Stop") {
            //payload for Continuous-Monitoring stop
            const payload = {
              source: "IN-HOUSE",
              asset_id: esignData.value?.asset_id,
              asset_name: esignData.value?.meta?.sample_data?.asset_name,
              job_id: esignData.value?.jobId,
              asset_type: esignData.value?.asset__asset_type___name,
              asset_type_id: esignData.value?.meta?.sample_data?.asset_type_id,
              task_id: esignData.value?.taskId,
            };

            try {
              result = await stopContinuousMonitoring(payload);
              if (result) {
                message.success(
                  t(
                    "commonData['Stop Executed Successfully.']",
                    "Stop Executed Successfully."
                  )
                );
              }
            } catch (error: any) {
              if (error.response?.data?.error) {
                message.error(error.response.data.error);
              } else {
                message.error(
                  t(
                    "commonData.Failed to stop continuous sample",
                    "Failed to stop continuous sample"
                  )
                );
              }
              throw error; // Re-throw to be caught by outer catch
            }
          } else {
            // Full payload for Abort / Force Drop
            const payload: Record<string, any> = {
              message: action,
              task_id: esignData.value?.taskId,
              job_id: esignData.value?.jobId,
              asset_type_id: esignData.value?.asset_type_id,
              asset_id: esignData.value?.asset_id,
              asset_name: esignData.value?.info?.name,
              source: "IN-HOUSE",
            };

            const abortActions = [
              "Abort Sample Interval",
              "Abort Continuous Sample",
              "Abort Continuous Flush",
            ];

            if (abortActions.includes(esignData.value?.sampleActionType)) {
              delete payload.task_id;
            }

            if (action === "Abort") {
              try {
                result = await sampleAbort(payload);
                if (result) {
                  message.success(
                    t(
                      "commonData['Abort Executed Successfully.']",
                      "Abort Executed Successfully."
                    )
                  );
                }
              } catch (error: any) {
                if (error.response?.data?.error) {
                  message.error(error.response.data.error);
                } else {
                  message.error(
                    t(
                      "commonData.Failed to abort sample",
                      "Failed to abort sample"
                    )
                  );
                }
                throw error; // Re-throw to be caught by outer catch
              }
            } else if (action === "Force Drop") {
              try {
                result = await sampleForceDrop(payload);
                if (result) {
                  message.success(
                    t(
                      "commonData['Force Drop Executed Successfully.']",
                      "Force Drop Executed Successfully."
                    )
                  );
                }
              } catch (error: any) {
                if (error.response?.data?.error) {
                  message.error(error.response.data.error);
                } else {
                  message.error(
                    t(
                      "commonData.Failed to force drop sample",
                      "Failed to force drop sample"
                    )
                  );
                }
                throw error; // Re-throw to be caught by outer catch
              }
            }
          }

          emit("submit", esignFormData);
          emit("update:open", false);
          formData.user = "";
          formData.password = "";
        } else {
          message.error(
            `${t(
              "commonData.Authentication failed for",
              `Authentication failed for ${userName}`
            )} "${userName}"`
          );
        }
      } catch (error: any) {
        console.log(":::::error", error);

        // Extract API error message (prefer message, then meta.message, then error)
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Authentication failed. Please try again.";

        if (
          !["Sample Stop", "Abort", "Force Drop"].includes(
            esignData.value?.action
          )
        ) {
          message.error(apiMessage);
        } else {
          message.error(apiMessage);
        }
      } finally {
        isLoading.value = false;
      }
    };

    const handleCancel = async () => {
      formData.user = "";
      formData.password = "";
      formRef.value?.clearValidate(); // Clear validation errors
      passwordVisible.value = false; // Reset eye icon visibility

      await nextTick(); // Wait for DOM update
      emit("update:open", false); // Close the modal
    };

    watch(open, (newVal) => {
      if (newVal) {
        formData.user = "";
        formData.password = "";
        isLoading.value = false;
      }
    });
    watch(open, async (newVal) => {
      if (!newVal) {
        await nextTick();
        formData.user = "";
        formData.password = "";
        isLoading.value = false;
        formRef.value = null;
        passwordVisible.value = false;

        console.log("formRef", formRef.value);
        if (formRef.value) {
          (formRef.value as FormInstance).resetFields(); // only call if formRef is defined
          (formRef.value as FormInstance).clearValidate();
        }
      }
    });

    onMounted(() => {
      document.addEventListener("keydown", enterKeyHandler);
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", enterKeyHandler);
    });

    // Initialize and update translatedTitle when esignData changes
    watch(
      () => esignData.value,
      () => {
        updateTranslatedTitle();
      },
      { deep: true, immediate: true }
    );

    watch(
      () => props.data,
      (newVal) => {
        esignData.value = newVal.value;
        // console.log("esignData updated:", esignData.value);
      },
      { deep: true, immediate: true }
    );
    onUnmounted(() => {
      // Reset password visibility when component is unmounted
      passwordVisible.value = false;
      console.log("Component unmounted: Password visibility reset");
    });

    const formLayout = "horizontal";

    return {
      formData,
      formRef,
      isVisible: open,
      handleOk,
      handleCancel,
      formLayout,
      isFormValid,
      isLoading,
      isButtonDisabled,
      translateLabel,
      togglePasswordVisibility,
      passwordVisible,
      LockOutlined,
      UserOutlined,
      EyeOutlined,
      EyeInvisibleOutlined,
      esignData,
      translatedTitle,
      truncatedTitle,
      updateTranslatedTitle,
    };
  },
});
</script>

<style scoped>
.custom-form-item {
  display: flex;
  align-items: center;
}

.footer-details {
  text-align: center;
}

.custom-input {
  flex: 1;
  margin-left: 8px;
}

.formConfirm {
  align-content: center;
  margin-top: 22px;
}

.ant-modal-root .ant-modal-wrap .ant-modal .ant-modal-content {
  padding: 0 !important;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* Adjust width as needed */
  display: inline-block;
}
</style>
