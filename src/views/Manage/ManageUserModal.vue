<template>
  <a-modal
    v-model:open="isVisible"
    :title="translateLabel('commonData', modalTitle)"
    @cancel="handleClose"
    @ok="handleSubmit"
    :okText="t('commonData.Submit')"
    :cancelText="t('commonData.Cancel')"
    :confirmLoading="confirmLoading"
    :okButtonProps="{
      disabled: !isFormComplete || !hasChanges || hasError,
    }"
    class="modelUser"
    centered
  >
    <a-form :model="formState" ref="formRef" layout="vertical">
      <a-row :gutter="16">
        <a-col :span="24" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Org Name')"
            name="orgName"
            class="input-margin"
          >
            <a-input
              v-model:value="formState.orgName"
              class="input-field"
              disabled
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            :label="translateLabel('commonData', 'First Name')"
            name="firstName"
            class="input-margin"
            :rules="validationRules.firstName"
          >
            <a-input
              v-model:value="formState.firstName"
              class="input-field"
              @change="handleInputChange('firstName')"
              :placeholder="translateLabel('commonData', 'Enter First Name')"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :label="translateLabel('commonData', 'Last Name')"
            name="lastName"
            class="input-margin"
            :rules="validationRules.lastName"
          >
            <a-input
              v-model:value="formState.lastName"
              class="input-field"
              @change="handleInputChange('lastName')"
              :placeholder="translateLabel('commonData', 'Enter Last Name')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="24" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Email ID')"
            name="email"
            class="input-margin"
            :rules="validationRules.email"
          >
            <a-input
              v-model:value="formState.email"
              class="input-field"
              @change="handleInputChange('email')"
              :placeholder="translateLabel('commonData', 'Enter Email ID')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'User Name')"
            name="username"
            class="input-margin"
            :rules="validationRules.username"
          >
            <a-input
              v-model:value="formState.username"
              class="input-field"
              @change="handleInputChange('username')"
              :disabled="isEditUser"
              :placeholder="translateLabel('commonData', 'Enter User Name')"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Role')"
            name="role"
            class="input-margin"
            :rules="validationRules.role"
          >
            <a-select
              v-model:value="formState.role"
              :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              class="input-field"
              @change="handleRoleChnage"
              :placeholder="translateLabel('commonData', 'Select Role')"
              allowClear
            >
              <a-select-option
                v-for="role in roles"
                :key="role.id"
                :value="role.id"
              >
                {{ roleCaseFormater(role.name) }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Site Name')"
            name="site"
            class="input-margin"
            :rules="validationRules.site"
          >
            <a-select
              v-model:value="formState.site"
              :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              class="input-field"
              @change="handleSiteChnage"
              :placeholder="translateLabel('commonData', 'Select Site Name')"
              allowClear
            >
              <a-select-option
                v-for="site in sites"
                :key="site.id"
                :value="site.id"
              >
                {{ site.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <!-- <a-form-item label="Password" class="input-margin">
            <a-input
              v-model:value="formState.generatedPassword"
              class="input-field"
              disabled
            />
          </a-form-item> -->
          <a-form-item>
            <a-button
              v-if="!generatedPassword"
              class="generatedPassword"
              type="primary"
              @click="generateRandomPassword"
              :loading="generatedPasswordLoading"
            >
              {{
                isNewUser
                  ? `${translateLabel("commonData", "Generate Password")}`
                  : `${translateLabel("commonData", "Generate New Password")}`
              }}
            </a-button>
            <div
              v-if="generatedPassword"
              style="margin-top: 31px; margin-left: 5px; display: flex"
            >
              <a-typography>
                <a-typography-paragraph
                  :copyable="{ text: generatedPassword }"
                  style="padding: 5px; width: fit-content; background: #f5f5f5"
                >
                  {{ generatedPassword }}
                  <template #copyableTooltip="{ copied }">
                    <span v-if="!copied" key="copy-tooltip">{{
                      translateLabel("commonData", "Copy")
                    }}</span>
                    <span v-else key="copied-tooltip">{{
                      translateLabel("commonData", "Copy Success")
                    }}</span>
                  </template>
                </a-typography-paragraph>
              </a-typography>
              <sync-outlined
                :spin="generatedPasswordLoading"
                @click="generateRandomPassword"
                class="passwordRefreshIcon"
                title="refresh"
                style="margin-left: 10px; cursor: pointer; height: fit-content"
              />
            </div>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, Ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
  getRoles,
  getSitesByActive,
  createUser,
  updateUserById,
} from "../../services/apiService";
import { SyncOutlined } from "@ant-design/icons-vue";
import { translateLabel } from "@/common/utils";
import { useI18n } from "vue-i18n";
export default defineComponent({
  name: "ManageUserModal",
  components: {
    SyncOutlined,
  },
  props: {
    open: {
      type: Boolean,
      required: true,
    },
    data: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const isVisible = ref(false);
    const formRef: Ref<any> | null = ref(null);
    const { t } = useI18n();
    const confirmLoading = ref(false);
    const roles = ref<{ id: string; name: string }[]>([]);
    const sites = ref<{ id: string; name: string }[]>([]);
    const selectedRoleId = ref("");
    const selectedSiteId = ref("");
    const generatedPassword = ref("");
    const hasLeadingWhitespaceError = ref(false);
    const isInvalidEmailId = ref(false);
    const generatedPasswordLoading = ref(false);
    let customerId: string | null = null;
    let customerCode: string | null = null;
    const validateErrorMessage = ref<any>();

    const isNewUser = computed(
      () => !props.data || Object.keys(props.data).length === 0
    );
    const isEditUser = computed(
      () => !!props.data && Object.keys(props.data).length > 0
    );

    const decodedTokenString = localStorage.getItem("DecodedToken");
    if (decodedTokenString) {
      const decodedToken = JSON.parse(decodedTokenString);
      customerId = decodedToken.customer_id;
      customerCode = decodedToken.customer_code;
    }

    if (!customerId) {
      throw new Error("Customer ID not found in local storage");
    }
    // Computed property to get the selected role name
    const selectedRoleName = computed(() => {
      if (!props.data || !props.data.role_id) return "";
      const selectedRole = roles.value.find(
        (role) => role.id == props.data.role_id
      );
      validateForm("role");
      return selectedRole ? selectedRole.id : "";
    });

    // Computed property to get the selected site name
    const selectedSiteName = computed(() => {
      if (!props.data || !props.data.site_id) return "";
      const selectedSite = sites.value.find(
        (site) => site.id === props.data.site_id
      );
      validateForm("site");
      return selectedSite ? selectedSite.id : "";
    });

    const formState = ref({
      orgName: isNewUser.value
        ? customerCode
        : props.data?.customer_code || customerCode,
      firstName: props.data?.firstname || "",
      lastName: props.data?.lastname || "",
      email: props.data?.email || "",
      username: props.data?.username || "",
      role: selectedRoleName.value || null,
      site: selectedSiteName.value || null,
    });
    const isSubmitDisabled = ref(false);

    const validationRules = computed(() => ({
      firstName: [
        {
          required: true,
          message: "First Name is required",
        },
        {
          pattern: /^[\p{L}\p{M}\s\-']+$/u,
          message: "First Name should not contain numbers & special characters",
        },
        { validator: noWhitespaceValidator },
      ],
      lastName: [
        {
          required: true,
          message: "Last Name is required",
        },
        {
          pattern: /^[\p{L}\p{M}\s\-']+$/u,
          message: "Last Name should not contain numbers & special characters",
        },
        { validator: noWhitespaceValidator },
      ],
      email: [
        {
          required: true,
          message: "Email ID is required",
        },
        { validator: noWhitespaceValidator },
        { validator: customPatternValidator },
      ],
      username: [
        {
          required: true,
          message: "User Name is required",
        },
        { validator: noWhitespaceValidator },
        { validator: noSpecialCharactersAtStartValidator },
      ],
      role: [
        {
          required: true,
          message: "Please select the Role!",
        },
      ],
      site: [
        {
          required: true,
          message: "Please select the site!",
        },
      ],
    }));

    // Watch for changes in selected role ID and update the form state role
    watch(selectedRoleName, (newRoleName) => {
      formState.value.role = newRoleName;
    });

    watch(selectedSiteName, (newSiteName) => {
      formState.value.site = newSiteName;
      validateForm("site"); // Trigger validation for the entire form when site changes
    });

    // Watch for changes in the props.data and update formState
    watch(
      () => props.data,
      (newVal) => {
        formState.value = {
          orgName: isNewUser.value
            ? customerCode
            : newVal?.customer_code || customerCode,
          firstName: newVal?.firstname || "",
          lastName: newVal?.lastname || "",
          email: newVal?.email || "",
          username: newVal?.username || "",
          role: selectedRoleName.value || null,
          site: selectedSiteName.value || null,
        };
      },
      { immediate: true }
    );

    const isFormComplete = computed(() => {
      const state = formState.value;
      const hasNoLeadingWhitespace =
        !/^\s/.test(state.orgName || "") &&
        !/^\s/.test(state.firstName || "") &&
        !/^\s/.test(state.lastName || "") &&
        !/^\s/.test(state.email || "") &&
        !/^\s/.test(state.username || "") &&
        !/^\s/.test(generatedPassword.value || "");

      const requiredFieldsComplete =
        state.orgName?.trim() &&
        state.firstName?.trim() &&
        state.lastName?.trim() &&
        state.email?.trim() &&
        state.username?.trim() &&
        state.role &&
        state.site;

      if (isNewUser.value) {
        return (
          requiredFieldsComplete &&
          hasNoLeadingWhitespace &&
          generatedPassword.value?.trim()
        );
      }

      return requiredFieldsComplete && hasNoLeadingWhitespace;
    });

    const hasError = ref(false);
    // Function to check for errors in the entire form
    const checkFormValidity = () => {
      const form = formRef.value;
      form
        .validateFields() // Validate all fields
        .then(() => {
          console.log("Form is valid", validateErrorMessage.value.length);
          if (validateErrorMessage.value.length === 0) {
            hasError.value = false;
          } else {
            hasError.value = true;
          }
          // Reset hasError if no errors are found in the form
        })
        .catch((errors: any) => {
          console.error("Form has validation errors", errors);
          hasError.value = true; // Set hasError to true if any errors are found in the form
        });
    };
    // Watcher to check if form is valid, and set hasError to false when all fields are valid
    watch(isFormComplete, (isComplete) => {
      if (isComplete) {
        hasError.value = false; // Reset hasError if form is complete and valid
      }
    });

    const handleInputChange = (fieldName: string) => {
      console.log(":: fieldName :: ", fieldName); // Verify fieldName in console
      if (fieldName) {
        validateForm(fieldName); // Only call validateForm if fieldName is not undefined
      } else {
        console.error("fieldName is undefined");
      }
    };

    const handleSiteChnage = () => {
      console.log(":: handle site change called");
      validateForm("site");
    };
    const handleRoleChnage = () => {
      console.log(":: handle site change called");
      validateForm("role");
    };
    const validateForm = (fieldName?: string) => {
      console.log(":: Validate form field ::", fieldName);

      if (!formRef.value) {
        console.error("formRef is not initialized.");
        return;
      }

      const form = formRef.value;
      if (fieldName) {
        // Validate the form (either the entire form or a specific field)
        const validateFn = fieldName
          ? form.validate([fieldName]) // Validate a specific field
          : form.validate(); // Validate the entire form

        validateFn
          .then(() => {
            console.log(
              `Form is valid ${fieldName}`,
              validateErrorMessage.value.length
            );

            // After successful validation, clear errors and set hasError to false
            hasError.value = validateErrorMessage.value.length > 0; // No errors found
            console.log("hasError after validation:", hasError.value);

            // If the field is valid, clear the error
            if (fieldName) {
              clearErrorForField(fieldName);
            }
          })
          .catch((errors: any) => {
            console.log(`Validation failed for ${fieldName || "Form"}`);

            // If errorFields is empty, set hasError to false
            if (errors.errorFields && errors.errorFields.length === 0) {
              console.log("No errors found (errorFields is empty)");
              hasError.value = false; // No errors
            } else {
              console.log("Validation failed with errors:", errors.errorFields);
              hasError.value = true; // Set hasError to true if validation fails

              // Ensure validateErrorMessage.value is initialized as an empty array if undefined
              if (!Array.isArray(validateErrorMessage.value)) {
                validateErrorMessage.value = [];
              }

              // Handle errors and add them to validateErrorMessage.value
              if (Array.isArray(errors.errorFields)) {
                errors.errorFields.forEach((errorObj: any) => {
                  // Check if the error already exists for this field
                  const existingErrorIndex =
                    validateErrorMessage.value.findIndex((error: any) =>
                      error.name.includes(errorObj.name[0])
                    );

                  if (existingErrorIndex > -1) {
                    // If the error exists, remove it and add the updated one
                    validateErrorMessage.value.splice(
                      existingErrorIndex,
                      1,
                      errorObj
                    );
                  } else {
                    // If the error doesn't exist, simply add it
                    validateErrorMessage.value.push(errorObj);
                  }
                });
              }
            }

            // Update hasError based on validateErrorMessage.value
            hasError.value = validateErrorMessage.value.length > 0;
            console.log("hasError after validation:", hasError.value);
          });
      } else {
        console.log(":: no field value");
      }
    };

    // Function to clear the error for a specific field
    const clearErrorForField = (fieldName: string) => {
      const indexToRemove = validateErrorMessage.value.findIndex((error: any) =>
        error.name.includes(fieldName)
      );

      if (indexToRemove !== -1) {
        // Remove the error object related to the field
        validateErrorMessage.value.splice(indexToRemove, 1);
        console.log(`Removed error for field: ${fieldName}`);
      } else {
        console.log(`No error found for field: ${fieldName}`);
      }

      console.log(
        ":: validation error message after clearing ::",
        validateErrorMessage.value
      );

      // After clearing errors, update hasError
      hasError.value = validateErrorMessage.value.length > 0;
      console.log("hasError after clearing errors:", hasError.value);
    };

    const noWhitespaceValidator = (rule: any, value: any) => {
      console.log("noWhitespaceValidator ::", rule);
      if (!value) return Promise.resolve();
      const hasLeadingSpace = /^\s/.test(value);
      if (hasLeadingSpace) {
        hasLeadingWhitespaceError.value = true;
        hasError.value = true; // Set hasError to true
        return Promise.reject(
          t(
            "commonData.Leading whitespace is not allowed",
            "Leading whitespace is not allowed"
          )
        );
      }
      hasError.value = true; // Set hasError to true
      hasLeadingWhitespaceError.value = false;

      return Promise.resolve();
    };
    // Custom pattern validator for email format
    const customPatternValidator = (rule: any, value: any) => {
      console.log(rule);
      if (hasLeadingWhitespaceError.value) {
        return Promise.resolve(); // If there's a leading whitespace error, no need to validate email
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value !== "" && !emailPattern.test(value)) {
        hasError.value = true; // Set hasError to true if email format is invalid
        return Promise.reject(t("commonData.Invalid Email ID format"));
      }
      return Promise.resolve();
    };

    // Validator for username pattern
    const noSpecialCharactersAtStartValidator = (rule: any, value: any) => {
      console.log(rule);

      if (/^[^\p{L}\p{M}\s]/u.test(value)) {
        hasError.value = true; // Set hasError to true if username starts with invalid characters
        return Promise.reject(
          t(
            "commonData.User Name should not start with numbers & special characters"
          )
        );
      }
      if (!/^[\p{L}\p{M}\p{N}\s\-_]*$/u.test(value)) {
        hasError.value = true; // Set hasError to true if username contains invalid characters
        return Promise.reject(
          t(
            "commonData.User Name should contain only hyphen, or underscore",
            "User Name should contain only hyphen, or underscore"
          )
        );
      }

      return Promise.resolve();
    };

    const generateRandomPassword = () => {
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=_+";
      const regexPattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,20}$/;

      let password = "";

      do {
        password = "";
        for (let i = 0; i < 13; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset.charAt(randomIndex);
        }
      } while (!regexPattern.test(password));

      generatedPasswordLoading.value = true;

      setTimeout(() => {
        generatedPassword.value = password;
        generatedPasswordLoading.value = false;

        // Trigger form validation for the password field
        validateForm("password");
      }, 1500);
    };

    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        roles.value = response.data;
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    const roleCaseFormater = (roleName: string) => {
      roleName =
        roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
      // console.log("roleNameroleName", roleName);
      return roleName;
    };

    const fetchSites = async () => {
      try {
        const response = await getSitesByActive();
        sites.value = response.data;
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };

    const handleClose = () => {
      isVisible.value = false;
      emit("close");
      resetForm();
      generatedPassword.value = "";
    };

    const resetForm = () => {
      console.log(":::::Called the reset");
      formState.value = {
        orgName: isNewUser.value
          ? customerCode
          : props.data?.customer_code || customerCode,
        firstName: props.data?.firstname || "",
        lastName: props.data?.lastname || "",
        email: props.data?.email || "",
        username: props.data?.username || "",
        role: selectedRoleName.value || null, // Use computed property
        site: selectedSiteName.value || null, // Use computed property
      };
      if (formRef.value) {
        formRef.value.resetFields();
      }
    };

    const handleSubmit = () => {
      confirmLoading.value = true;
      formRef.value
        ?.validate()
        .then(() => {
          const userPayload: any = {
            username: formState.value.username.toLowerCase().trim(),
            customer_id: customerId,
            firstname: formState.value.firstName,
            lastname: formState.value.lastName,
            role_id: formState.value.role ? +formState.value.role : null,
            site_id: formState.value.site,
            email: formState.value.email,
            status: "ACTIVE",
          };

          if (generatedPassword.value) {
            (userPayload["is_default_password"] = true),
              (userPayload["password"] = generatedPassword.value);
          }

          if (isNewUser.value) {
            createUser(userPayload)
              .then((response: any) => {
                if (response.status === "success") {
                  emit("userSubmitted", response.data, "create");
                  handleClose();
                  resetForm();
                  message.success(
                    `"${userPayload.username}" ${t(
                      "commonData.Added Successfully!"
                    )}`
                  );
                } else if (response.status === "fail") {
                  message.error(response.message);
                }
                confirmLoading.value = false;
              })
              .catch((error: any) => {
                if (
                  error.response &&
                  error.response.data &&
                  error.response.data.message
                ) {
                  message.error(error.response.data.message);
                } else if (error.message) {
                  message.error(error.message);
                } else {
                  message.error(t("commonData.Failed to create user"));
                }
                confirmLoading.value = false;
              });
          } else {
            updateUserById(props.data.id, userPayload)
              .then((response: any) => {
                emit("userSubmitted", response.data, "edit");
                handleClose();
                resetForm();
                message.success(
                  `${userPayload.username} ${t(
                    "commonData.Updated Successfully!"
                  )}`
                );
              })
              .catch((error: any) => {
                console.log(error);
                message.error(t("commonData.Failed to update user"));
              })
              .finally(() => {
                confirmLoading.value = false;
              });
          }
        })
        .catch((errorInfo: any) => {
          console.log("errorInfo", errorInfo);
          confirmLoading.value = false;
        });
    };

    const modalTitle = computed(() =>
      isNewUser.value ? "Add User" : "Edit User"
    );

    const hasChanges = computed(() => {
      const currentData: any = {
        orgName: formState.value.orgName || "",
        firstName: formState.value.firstName || "",
        lastName: formState.value.lastName || "",
        email: formState.value.email || "",
        username: formState.value.username || "",
        role: formState.value.role ? +formState.value.role : "",
        site: formState.value.site || "",
        password: generatedPassword.value || "",
      };

      const originalData: any = {
        orgName: props.data.customer_code || customerCode || "",
        firstName: props.data.firstname || "",
        lastName: props.data.lastname || "",
        email: props.data.email || "",
        username: props.data.username || "",
        role: props.data.role_id || "",
        site: props.data.site_id || "",
        password: "", // password should remain empty, assuming it's not part of the comparison
      };

      // Iterate through each field and compare currentData to originalData
      for (const key in currentData) {
        if (currentData[key] !== originalData[key]) {
          return true; // If any field is different, return true
        }
      }

      return false; // If all fields are the same, return false
    });

    watch(
      () => props.open,
      (newValue) => {
        if (newValue) {
          isVisible.value = true;
          fetchSites();
        } else {
          isVisible.value = false;
        }
      }
    );

    onMounted(() => {
      fetchSites();
      fetchRoles();
      resetForm();
    });

    return {
      isVisible,
      formRef,
      formState,
      handleClose,
      handleSubmit,
      modalTitle,
      roles,
      sites,
      selectedRoleId,
      selectedSiteId,
      isEditUser,
      resetForm,
      isFormComplete,
      confirmLoading,
      selectedRoleName,
      selectedSiteName,
      hasChanges,
      noSpecialCharactersAtStartValidator,
      noWhitespaceValidator,
      customPatternValidator,
      isInvalidEmailId,
      generatedPassword,
      generatedPasswordLoading,
      generateRandomPassword,
      SyncOutlined,
      isNewUser,
      translateLabel,
      t,
      roleCaseFormater,
      validationRules,
      isSubmitDisabled,
      checkFormValidity,
      hasError,
      handleInputChange,
      handleSiteChnage,
      handleRoleChnage,
    };
  },
});
</script>

<style>
.input-margin {
  margin-right: 10px;
}

.modelUser .ant-modal-content {
  padding: 0px !important;
}
.modelUser .ant-modal-header {
  padding: 16px 24px;
  color: rgba(0, 0, 0, 0.65);
  border-bottom: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
}
.modelUser .ant-modal-body {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}
.modelUser .ant-modal-footer {
  padding: 10px 16px;
  text-align: right;
  background: 0 0;
  border-top: 1px solid #e8e8e8;
  border-radius: 0 0 4px 4px;
}
.passwordRefreshIcon {
  margin-top: 7px;
  margin-left: 12px;
  font-size: 19px;
  cursor: pointer;
  color: #00bceb;
}
.generatedPassword {
  margin-top: 31px;
  margin-left: 6px;
}
</style>
