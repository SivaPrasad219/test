<template>
  <a-modal
    v-model:visible="isModalVisible"
    title="Add Client Details"
    ok-text="Submit"
    cancel-text="Cancel"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form layout="vertical" @submit.prevent="handleSubmit">
      <!-- Display Name -->
      <a-row gutter="16">
        <a-col :span="24">
          <a-form-item label="Display Name">
            <a-input
              v-model:value="formData.display_name"
              placeholder="Display Name"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- DB Name and DB_Name -->
      <a-row gutter="16">
        <a-col :span="24">
          <a-form-item
            label="Client Name"
            :validate-status="fieldErrors.name ? 'error' : ''"
            :help="fieldErrors.name"
          >
            <a-input
              v-model:value="formData.name"
              placeholder="Enter Client Name"
              @input="updateDBName"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Key -->
      <a-row gutter="16">
        <a-col :span="12">
          <a-form-item label="DB Name">
            <a-input v-model:value="formData.db_username" disabled />
          </a-form-item>
        </a-col>
        <!-- DB Password -->
        <a-col :span="12">
          <a-form-item
            label="DB Password"
            :validate-status="fieldErrors.db_password ? 'error' : ''"
            :help="fieldErrors.db_password"
          >
            <a-input-password
              v-model:value="formData.db_password"
              placeholder="Enter DB Password"
              @input="validateField('db_password')"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { createNewClient } from "../services/apiService";
export default defineComponent({
  name: "ClientDetailsModal",
  emits: ["close"],
  setup(_, { emit }) {
    const isModalVisible = ref(false);

    const formData: any = ref({
      display_name: "", // Disabled field
      name: "",
      db_username: "",
      db_password: "",
    });

    const fieldErrors: any = ref({
      name: null,
      db_password: null,
    });

    // Update the reflected DB_Name field
    const updateDBName = () => {
      formData.value.db_username = formData.value.name;
      validateField("name");
    };

    // Validation function
    const validateField = (field: any) => {
      const value = formData.value[field];
      if (!value || value.trim() === "") {
        fieldErrors.value[field] = `The ${field} is required.`;
      } else {
        fieldErrors.value[field] = null;
      }
    };

    // Handle form submission
    const handleSubmit = async () => {
      // Validate all fields
      Object.keys(formData.value).forEach((field) => validateField(field));

      // Check for errors
      const hasErrors = Object.values(fieldErrors.value).some(
        (error) => error !== null
      );
      if (hasErrors) {
        return;
      }

      console.log("Form Submitted:", formData.value);

      // Perform API call or other actions here
      let newClientResponse = await createNewClient(formData.value);
      console.log("newClientResponse", newClientResponse);
      // Close modal
      handleCancel();
    };

    // Handle cancel action
    const handleCancel = () => {
      emit("close");
      resetForm();
    };

    // Reset form data and errors
    const resetForm = () => {
      formData.value = {
        display_name: "",
        name: "",
        db_username: "",
        db_password: "",
      };
      fieldErrors.value = {
        name: null,
        db_password: null,
      };
      isModalVisible.value = false;
    };

    return {
      isModalVisible,
      formData,
      fieldErrors,
      validateField,
      updateDBName,
      handleSubmit,
      handleCancel,
      resetForm,
    };
  },
});
</script>
