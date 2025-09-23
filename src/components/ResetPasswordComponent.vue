<template>
  <div class="reset-password-container">
    <a-form @submit="handleSubmit">
      <!-- Old Password Input -->
      <a-form-item>
        <a-input-password
          v-model="form.oldPassword"
          :placeholder="translateLabel('commonData', 'Old Password')"
          prefix-icon="LockOutlined"
          @input="clearError('oldPassword', $event.target.value)"
        >
          <template #prefix>
            <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
          </template>
        </a-input-password>
        <p v-if="errors.oldPassword" class="input-error">
          {{ translateLabel("commonData", errors.oldPassword) }}
        </p>
      </a-form-item>

      <!-- New Password Input with Regex Validation -->
      <a-form-item>
        <a-input-password
          v-model="form.newPassword"
          :placeholder="translateLabel('commonData', 'New Password')"
          prefix-icon="LockOutlined"
          @input="validateNewPassword($event.target.value)"
        >
          <template #prefix>
            <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
          </template>
        </a-input-password>
        <p v-if="errors.newPassword" class="input-error">
          {{ translateLabel("commonData", errors.newPassword) }}
        </p>
      </a-form-item>

      <!-- Confirm New Password Input -->
      <a-form-item>
        <a-input-password
          v-model="form.confirmPassword"
          :placeholder="translateLabel('commonData', 'Confirm New Password')"
          prefix-icon="LockOutlined"
          @input="clearError('confirmPassword', $event.target.value)"
        >
          <template #prefix>
            <LockOutlined style="color: rgba(0, 0, 0, 0.25)" />
          </template>
        </a-input-password>
        <p v-if="errors.confirmPassword" class="input-error">
          {{ translateLabel("commonData", errors.confirmPassword) }}
        </p>
      </a-form-item>

      <!-- Submit Button -->
      <a-button
        type="primary"
        html-type="submit"
        :loading="isLoading"
        style="width: 100%"
      >
        {{ translateLabel("commonData", "Reset Password") }}
      </a-button>
    </a-form>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { message } from "ant-design-vue";
import { LockOutlined } from "@ant-design/icons-vue";
import { updateUserById } from "../services/apiService";
import { translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";
interface FormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default defineComponent({
  components: {
    LockOutlined,
  },
  props: {
    userId: {
      type: Number,
      required: true,
    },
    oldPassword: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const form = ref<FormState>({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    const { t } = useI18n();
    const errors = ref<{ [key: string]: string }>({});
    const isLoading = ref(false);

    const clearError = (field: keyof FormState, value: string) => {
      form.value[field] = value;
      errors.value[field] = "";
    };

    const validateNewPassword = (value: string) => {
      form.value.newPassword = value;
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,20}$/;

      if (!value) {
        errors.value.newPassword = "New Password is required";
      } else if (value.length < 8) {
        errors.value.newPassword =
          "Password must be at least 8 characters long";
      } else if (value.length >= 20) {
        errors.value.newPassword = "Password must not exceed 20 characters";
      } else if (!passwordRegex.test(value)) {
        errors.value.newPassword =
          "Password must contain at least one lowercase, one uppercase, one digit, and any special character";
      } else {
        errors.value.newPassword = "";
      }
    };

    const handleSubmit = async (event: Event) => {
      event.preventDefault();

      if (!form.value.oldPassword) {
        errors.value.oldPassword = "Old Password is required";
        return;
      }
      if (!form.value.newPassword) {
        errors.value.newPassword = "New Password is required";
        return;
      }
      if (!form.value.confirmPassword) {
        errors.value.confirmPassword = "Confirm New Password is required";
        return;
      }
      if (form.value.newPassword !== form.value.confirmPassword) {
        errors.value.confirmPassword = "Passwords do not match";
        return;
      }
      if (form.value.oldPassword !== props.oldPassword) {
        errors.value.oldPassword = "Old Password mismatch";
        return;
      }

      isLoading.value = true;
      try {
        const payload = {
          is_default_password: false,
          password: form.value.confirmPassword,
        };

        const response = await updateUserById(Number(props.userId), payload);

        message.success(
          t(
            "commonData.Password Has Been Reset Successfully",
            "Password Has Been Reset Successfully"
          )
        );

        if (response) {
          form.value.oldPassword = "";
          form.value.newPassword = "";
          form.value.confirmPassword = "";
          emit("close-reset-password");
          localStorage.clear();
        }
      } catch (error: any) {
        const apiMessage =
          error?.response?.data?.message ||
          error?.message ||
          t("commonData.Failed to reset password", "Failed to reset password");

        message.error(apiMessage);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      form,
      errors,
      isLoading,
      clearError,
      validateNewPassword,
      handleSubmit,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.reset-password-container {
  max-width: 400px;
  margin: 50px auto;
}

.input-error {
  color: red;
  font-size: 12px;
  margin-bottom: -12px;
  margin-top: 6px;
}
.form-item {
  margin-bottom: 0px;
}
</style>
