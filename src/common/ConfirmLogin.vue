<template>
  <div class="confirmLogin">
    <a-row :gutter="16">
      <a-col :span="12">
        <div class="confirmComment">
          <a-form-item :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
            <label>{{ translateRecordsAsPerLanguage("Comment(s)") }}</label>
            <a-textarea
              v-model:value="comment"
              :placeholder="
                localData.status !== 'In-Progress'
                  ? commentPlaceholderText()
                  : 'In-Progress'
              "
              :auto-size="{ minRows: 5, maxRows: 5 }"
              class="commentBox"
              :disabled="
                isCommentDisabled ||
                userRole !== 'operator' ||
                localData.source === 'JMAPI'
              "
            />
          </a-form-item>
        </div>
      </a-col>
      <a-col :span="12" class="formConfirm">
        <a-form
          :model="formModel"
          ref="loginForm"
          v-if="
            !isCommentDisabled &&
            userRole === 'operator' &&
            localData.source !== 'JMAPI'
          "
          :layout="formLayout"
          :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }"
          @keydown.enter.prevent="handleConfirm"
        >
          <a-form-item
            v-for="field in fields"
            :key="field.id"
            :label="translateRecordsAsPerLanguage(field.labelKey)"
            :colon="false"
            :required="field.required"
            :validateStatus="field.validateStatus"
            :help="field.errorMsg"
          >
            <a-input
              v-if="field.type === 'password'"
              v-model:value="formModel[field.id]"
              :readonly="field.readonly"
              class="login-input"
              :placeholder="translateRecordsAsPerLanguage(field.labelKey)"
              @input="updateFormModel(field.id, $event.target.value)"
              :type="passwordVisible ? 'text' : 'password'"
            >
              <template #prefix>
                <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
              </template>
              <template #suffix>
                <EyeOutlined
                  v-if="passwordVisible"
                  @click="togglePasswordVisibility"
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }"
                />
                <EyeInvisibleOutlined
                  v-else
                  @click="togglePasswordVisibility"
                  :style="{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.25)' }"
                />
              </template>
            </a-input>

            <a-input
              v-else
              v-model:value="formModel[field.id]"
              :readonly="field.readonly"
              class="login-input"
              :placeholder="translateRecordsAsPerLanguage(field.labelKey)"
              @input="updateFormModel(field.id, $event.target.value)"
            >
              <template #prefix>
                <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
              </template>
            </a-input>
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>
    <div class="btns-back-confirm">
      <a-row>
        <a-col :span="12">
          <a-form-item class="back-button-item">
            <a-button class="back-form-button" type="primary" @click="goBack">
              {{ translateRecordsAsPerLanguage("Back") }}
            </a-button>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item class="confirm-button-item">
            <a-button
              v-if="
                !isCommentDisabled &&
                userRole === 'operator' &&
                localData.source !== 'JMAPI'
              "
              class="confirm-form-button"
              type="primary"
              @click="handleConfirm"
              @keydown.enter.prevent="handleConfirm"
              :loading="confirmLoader"
              :disabled="isConfirmDisabled"
            >
              {{ translateRecordsAsPerLanguage("Confirm") }}
            </a-button>
          </a-form-item>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
import {
  esignConfirmLogin,
  externalSampleConfirm,
  confirmatationTaskResult,
} from "../services/apiService";
import {
  ref,
  computed,
  defineEmits,
  defineProps,
  watch,
  onMounted,
  reactive,
  nextTick,
  onUnmounted,
} from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Field {
  id: string;
  labelKey: string;
  type: string;
  readonly?: boolean;
  required: any;
  rules: { messageKey: string; trigger: string }[];
  validateStatus: any;
  errorMsg: any;
}

const passwordVisible = ref(false);

const confirmLoader = ref(false);
const comment: any = ref<string>("");
const emits = defineEmits(["back", "confirmed"]);

const formModel: any = reactive({
  username: "",
  password: "",
});

// Simplified visibility change handler
const togglePasswordVisibility = () => {
  console.log("lock function calling", passwordVisible.value);
  passwordVisible.value = !passwordVisible.value;
};
const formLayout = "horizontal";

const translateRecordsAsPerLanguage = (recordDataVariable: any) => {
  // console.log("recordDataVariablerecordDataVariable", recordDataVariable);
  return t(`commonData.${recordDataVariable}`, recordDataVariable);
};

const fields = ref<Field[]>([
  {
    id: "username",
    labelKey: "username",
    type: "text",
    required: true,
    rules: [
      {
        messageKey: "Please Input Username",
        trigger: "blur",
      },
    ],
    validateStatus: "",
    errorMsg: "",
  },
  {
    id: "password",
    labelKey: "password",
    type: "password",
    required: true,
    rules: [
      {
        messageKey: "Please Input Password",
        trigger: "blur",
      },
    ],
    validateStatus: "",
    errorMsg: "",
  },
]);

const props = defineProps<{
  data: {
    comment: any;
    id: number;
    job_id: number;
    task_result_job_id: number;
    details: { message: string | { message: string } } | null;
    taskResultStatus: string;
    status: string;
    task_id: number;
  };
}>();

const localData: any = ref({ ...props.data });

const goBack = () => {
  console.log("Clicked the back btn");
  comment.value = "";
  console.log("back button clicked", formModel);

  Object.keys(formModel).forEach((key) => {
    formModel[key] = "";
  });

  fields.value.forEach((field) => {
    field.validateStatus = "";
    field.errorMsg = "";
  });

  emits("back");
};

const decodedTokenString = localStorage.getItem("DecodedToken");
let userName = "";
let userRole = "";
if (decodedTokenString) {
  const decodedToken = JSON.parse(decodedTokenString);
  userRole = decodedToken.role;
  userName = decodedToken.username;
  console.log("userName::::::::", userName, userRole);
}
console.log("#LocalData:::", localData.value);

const handleConfirm = async () => {
  confirmLoader.value = true;
  console.log("Comment:", comment.value);
  console.log(":::::::::::Prodata", localData.value);

  if (formModel.username.toLowerCase() !== userName.toLowerCase()) {
    message.error(
      translateRecordsAsPerLanguage(`Authentication failed for `) +
        ` "${userName}"`
    );
    confirmLoader.value = false;
    return;
  }

  try {
    const jobId = localData.value.job_id
      ? localData.value.job_id
      : localData.value.task_result_job_id
      ? localData.value.task_result_job_id
      : null;

    const taskResultId = localData.value.id
      ? localData.value.id
      : localData.value.task_result_task_id
      ? localData.value.task_result_task_id
      : null;

    const sampleType = localData.value.meta?.sample_type;
    const recordDeviceName = localData.value.meta?.asset_info?.name;

    let formData: any = {
      username: formModel?.username,
      password: formModel?.password,
      devicename: recordDeviceName,
    };

    console.log("::::::localData.value :::::", localData.value, formData);

    if (sampleType === "Sample-Single" || sampleType === "Flush-Single") {
      formData.task_result_id = taskResultId;
    } else if (
      sampleType === "Sample-Continuous Run" ||
      sampleType === "Flush-Continuous Run"
    ) {
      formData.job_id = jobId;
      formData.task_result_id = taskResultId;
    }

    console.log("#Form Data:::", formData);
    try {
      await esignConfirmLogin(formData);
    } catch (error: any) {
      console.error("Authentication failed:", error);

      if (error?.response?.status === 400) {
        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.data?.[0]?.meta?.message ||
          "Invalid request";

        message.error(translateRecordsAsPerLanguage(apiMessage));
      } else {
        message.error(
          translateRecordsAsPerLanguage("Authentication failed for") +
            ` "${userName}"`
        );
      }

      confirmLoader.value = false;
      return;
    }

    let payload = {};
    if (jobId) {
      const sampleSource = localData.value.meta?.source;

      const payload = {
        comment: comment.value,
        job_id: jobId,
        task_result_id: taskResultId,
        devicename: recordDeviceName,
        source: sampleSource,
      };

      try {
        const response = await confirmatationTaskResult(payload);

        if (response.result === "Confirm sucessfull") {
          console.log("Test Result is Confirmed");
          comment.value = "";
          Object.keys(formModel).forEach((key) => {
            formModel[key] = "";
          });
          message.success(
            translateRecordsAsPerLanguage("Test Result is Confirmed")
          );
          emits("back");
          emits("confirmed");
          resetForm();
        } else {
          console.error(
            "Confirmation failed:",
            response.reason || response.statusText
          );
          message.error(
            translateRecordsAsPerLanguage(
              response.reason || "Confirmation failed"
            )
          );
          // resetForm();
        }
      } catch (error: any) {
        console.error("Error confirming task result:", error);
        const reason =
          error?.response?.data?.reason ||
          error?.response?.data?.error ||
          error?.message ||
          "An unexpected error occurred while confirming the task result.";

        message.error(translateRecordsAsPerLanguage(reason));
        // resetForm();
      }
    } else {
      payload = {
        comment: comment.value,
        status: "Reviewed",
      };
      try {
        const response = await externalSampleConfirm(
          payload,
          localData.value.id
        );
        if (response) {
          emits("back");
          emits("confirmed");
          resetForm();
          comment.value = "";
          Object.keys(formModel).forEach((key) => {
            formModel[key] = "";
          });
          message.success(
            translateRecordsAsPerLanguage("Test Result is Confirmed")
          );
        }
      } catch (error) {
        console.error("Error confirming external sample:", error.message);
        message.error(
          translateRecordsAsPerLanguage("Current Sample is already reviewed")
        );
        emits("back");
        emits("confirmed");
        resetForm();
      }
    }
  } catch (error: any) {
    console.error("Error confirming:", error.message);
  } finally {
    confirmLoader.value = false;
  }
};
const resetForm = () => {
  console.log("Resetting form");

  // Reset form model
  Object.keys(formModel).forEach((key) => {
    formModel[key] = "";
  });

  // Reset password visibility
  passwordVisible.value = false;

  console.log(
    "Password visibility reset in resetFunction:",
    passwordVisible.value
  );

  // Reset field validations
  fields.value.forEach((field) => {
    field.validateStatus = "";
    field.errorMsg = "";
  });
};
// before e-sign show placeholder only for some statuses which have e-sign form.
const isCommentDisabled = computed(() => {
  const details = localData.value.details;
  const status = localData.value.status;
  console.log("::::::status", status);
  // to disable verification for these status
  if (
    [
      "In-Progress",
      "Reviewed",
      "New",
      "In-Progress Disconnected",
      "Force Dropping",
    ].includes(status)
  ) {
    return true;
  }

  return details && Object.prototype.hasOwnProperty.call(details, "comment");
});
console.log("outside to this", isCommentDisabled.value);
// for placeholder in commentbox.
console.log("localData", localData.value);
const commentPlaceholderText = () => {
  // after verification comment need to show.
  if (isCommentDisabled.value) {
    console.log("going to this", isCommentDisabled.value);
    return comment?.value;
  } else {
    console.log("going to this", isCommentDisabled.value);
    if (userRole === "operator") {
      return translateRecordsAsPerLanguage("Enter your comment here");
    }
  }
};

const isConfirmDisabled = computed(() => {
  return fields.value.some((field) => {
    return field.required && formModel[field.id] === "";
  });
});

const updateFormModel = (field: any, value: any) => {
  console.log("form is updating");
  formModel[field] = value;
  const fieldObject = fields.value.find((f) => f.id === field);
  console.log("field object", fieldObject);
  if (fieldObject) {
    const rule = fieldObject.rules.find((r) => r.required);
    console.log("rules ", fieldObject.rules);

    if (fieldObject.rules) {
      fieldObject.validateStatus = value.length > 0 ? "success" : "error";
      fieldObject.errorMsg =
        value.length > 0
          ? ""
          : `${translateRecordsAsPerLanguage(fieldObject.rules[0].messageKey)}`;

      console.log(fieldObject.rules);

      console.log("rules value", fieldObject.errorMsg);
    }
  }
};

// const extractMessage = (
//   details: { message: string | { message: string } } | null
// ) => {
//   if (details && typeof details.message === "object") {
//     return details.message.message;
//   }
//   return details ? details.message : "";
// };
const extractComment = (data: { comment: string | null } | null) => {
  // If data is present and contains a valid comment, return the comment
  return data?.comment ?? ""; // Use an empty string if there's no comment
};

watch(
  () => props.data,
  (newPropsData) => {
    console.log("newPropsData::", newPropsData);

    // Update localData with the new data
    localData.value = { ...newPropsData };

    if (newPropsData?.status === "Reviewed") {
      if (newPropsData?.details) {
        comment.value = extractComment(newPropsData.details);
      } else {
        comment.value = newPropsData.details?.comment || "";
      }

      console.log("Status is Reviewed: Comment updated");
    } else {
      comment.value = newPropsData.details?.comment || "";
    }
    Object.keys(formModel).forEach((key) => {
      formModel[key] = "";
    });

    fields.value.forEach((field) => {
      field.validateStatus = "";
      field.errorMsg = "";
    });
    passwordVisible.value = false;
    nextTick(() => {
      passwordVisible.value = false;
      console.log(
        "Password visibility changed in watcher:",
        passwordVisible.value
      );
      resetForm();
    });
  },
  { deep: true }
);

// Add explicit watch for passwordVisible
// Add explicit watch for debugging
watch(
  props.data,
  (newValue) => {
    passwordVisible.value = false;
    console.log("Password visibility changed:", newValue);
    resetForm();
  },
  { immediate: true }
);

onMounted(() => {
  if (props.data) {
    localData.value = { ...props.data };
    console.log("::::::::localData.value", localData.value);

    if (props.data?.status === "Reviewed") {
      if (props.data?.details) {
        comment.value = extractComment(props.data.details);
      } else {
        comment.value = props.data?.details?.comment || "";
      }
    } else {
      comment.value = props.data?.details?.comment || "";
    }
    Object.keys(formModel).forEach((key) => {
      formModel[key] = "";
    });

    fields.value.forEach((field) => {
      field.validateStatus = "";
      field.errorMsg = "";
    });
    passwordVisible.value = false;
    resetForm();
  }
});

onUnmounted(() => {
  // Reset password visibility when component is unmounted
  passwordVisible.value = false;
  console.log("Component unmounted: Password visibility reset");
});
</script>

<style scoped>
.confirmComment label {
  font-size: 16px;
  text-align: left;
  display: flex;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 500;
  margin-bottom: 10px;
}
.loginConfirm {
  padding-left: 24px;
}

.commentBox {
  width: 100%;
  height: 90px;
}

.login-input {
  width: 100%;
}
.ant-form {
  text-align: left;
}
.btns-back-confirm {
  padding: 10px 0;
}

.confirm-form-button,
.back-form-button {
  border-radius: 4px;
}

.confirm-button-item {
  text-align: end;
}

.back-button-item {
  text-align: start;
}
.formConfirm {
  align-content: center;
  margin-top: 22px;
}
</style>
