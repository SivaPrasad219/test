<template>
  <a-modal
    v-model:open="isSiteVisible"
    :title="translateLabel('commonData', modalTitle)"
    @cancel="handleClose"
    @ok="handleOk"
    :okText="t('commonData.Submit')"
    :cancelText="t('commonData.Cancel')"
    :confirmLoading="confirmLoading"
    :okButtonProps="{
      disabled: isSubmitDisabled,
    }"
    class="modelSite"
    centered
  >
    <a-form :model="siteModelData" ref="formRef" layout="vertical">
      <a-row :gutter="16">
        <!-- Site Name Field -->
        <a-col :span="12" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Site Name')"
            name="name"
            class="input-margin"
            :rules="[
              {
                required: true,
                message: translateLabel('commonData', 'Site Name is required'),
              },
              { validator: noWhitespaceValidator },
              { validator: noSpecialCharactersAtStartValidator },
            ]"
          >
            <a-input
              v-model:value="siteModelData.name"
              class="input-field"
              :disabled="isUpdating"
              :placeholder="translateLabel('commonData', 'Enter Site Name')"
            />
          </a-form-item>
        </a-col>
        <!-- Timezone Field -->
        <a-col :span="12" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Timezone')"
            name="site_timezone"
            class="input-margin"
            :rules="timezoneRules"
          >
            <a-select
              v-model:value="siteModelData.site_timezone"
              :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              class="input-field"
              :placeholder="translateLabel('commonData', 'Select Timezone')"
              show-search
              optionFilterProp="children"
              allowClear
              :filterOption="filterOption"
            >
              <a-select-option
                v-for="tz in timeZones"
                :key="tz.timezone"
                :value="tz.timezone"
              >
                {{ tz.timezoneAbb }} ({{ tz.timezone }})
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Alias Field -->
      <a-row :gutter="16">
        <a-col :span="24" class="col-margin">
          <a-form-item
            :label="translateLabel('commonData', 'Alias')"
            name="alias"
            class="input-margin"
            :rules="[{ validator: noInvalidValidator, trigger: 'change' }]"
          >
            <div style="display: flex; justify-content: space-between">
              <a-input
                v-model:value="newAlias"
                class="input-field"
                :placeholder="translateLabel('commonData', 'Enter Alias')"
                style="width: 75%"
                @keyup.enter="addAlias"
              />
              <a-button
                type="primary"
                @click="addAlias"
                :disabled="isAliasInputEmpty || aliasValidationDisable"
              >
                {{ translateLabel("commonData", "Add Alias") }}</a-button
              >
            </div>
            <div v-if="filteredAliases.length > 0">
              <a-tag
                v-for="alias in filteredAliases"
                :key="alias"
                closable
                @close="removeAlias(alias)"
              >
                {{ alias }}
              </a-tag>
            </div>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Description Field -->
      <a-row>
        <a-col :span="24">
          <a-form-item
            :label="translateLabel('commonData', 'Description')"
            name="description"
            class="input-margin"
            :rules="[{ validator: noInvalidValidator, trigger: 'change' }]"
          >
            <a-textarea
              v-model:value="siteModelData.description"
              class="input-field"
              :placeholder="translateLabel('commonData', 'Enter Description')"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from "vue";
import { getAllTimeZones, translateLabel } from "@/common/utils";
import { createSite, updateSiteById } from "../../services/apiService";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";

interface SiteData {
  id?: number;
  name: string;
  site_timezone: any;
  alias: string[];
  description: string;
}

interface TimeZone {
  timezone: string;
  timezoneAbb: string;
}

export default defineComponent({
  name: "ManageSiteModal",
  props: {
    data: {
      type: Object as () => Partial<SiteData>,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const isSiteVisible = ref(false);
    const formRef = ref<any>(null);
    const timeZones = ref<TimeZone[]>([]);
    const confirmLoading = ref(false);
    const newAlias = ref("");
    const { t } = useI18n();

    const defaultData: SiteData = {
      id: undefined,
      name: "",
      site_timezone: null,
      alias: [],
      description: "",
    };

    const isAliasInputEmpty = computed(() => newAlias.value.trim() === "");
    const siteModelData = ref<SiteData>({ ...defaultData });
    const areObjectsEqual = (obj1: any, obj2: any) => {
      if (!obj1 || !obj2) return false; // Ensure both objects exist

      const keys = Object.keys(siteModelData.value || {}); // Avoid potential errors

      return keys.every((key) => {
        if (key === "alias") {
          // if (
          //   (obj1?.[key].length === 0 && obj2?.[key] === null) ||
          //   (obj2?.[key].length === 0 && obj2?.[key] === "")
          // )
          //   return true;
          // else return false;
          return (
            (Array.isArray(obj1?.[key]) &&
              obj1[key].length === 0 &&
              obj2?.[key] === null) ||
            (Array.isArray(obj1?.[key]) &&
              obj1[key].length === 0 &&
              obj2?.[key] === "") ||
            JSON.stringify(obj1?.[key]) === JSON.stringify(obj2?.[key])
          );
        }
        return obj1?.[key] === obj2?.[key]; // Use optional chaining to prevent errors
      });
    };

    const isSubmitDisabled = computed(() => {
      const state = siteModelData.value;
      console.log("props data site data", siteModelData.value, props.data);
      // const areEqual = areObjectsEqual(siteModelData.value, props.data);
      const areEqual = !hasChanges.value;
      console.log("objects are equal", areEqual);
      // Validate "Site Name"
      const isSiteNameInvalid =
        /[^\p{L}\p{M}\p{N}\s\-_]/u.test(state.name) ||
        /^[^\p{L}\p{M}\s]/u.test(state.name);

      const isAliasInvalid =
        state.alias.length > 0 && aliasValidationDisable.value;

      const isDescriptionInvalid =
        state.description.trim() !== "" && descriptionValidationDisable.value;

      // Check if form is valid and if all required fields are filled
      console.log(
        "final submit button check",
        "are equal",
        areEqual,
        isSiteNameInvalid,
        !isFormValid.value,
        aliasValidationDisable.value,
        descriptionValidationDisable.value,
        !isAliasInputEmpty.value
      );
      return (
        isSiteNameInvalid ||
        areEqual ||
        !isFormValid.value ||
        isAliasInvalid ||
        isDescriptionInvalid
        // aliasValidationDisable.value ||
        // descriptionValidationDisable.value ||
        // !isAliasInputEmpty.value ||
        // !isNewlyAliasAdded.value
      );
    });

    const timezoneRules = computed(() => [
      {
        required: true,
        message: translateLabel("commonData", "Timezone is required"),
      },
    ]);

    const initializeAlias = (alias: string | string[] | undefined) => {
      if (typeof alias === "string") {
        return alias
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a);
      }
      return Array.isArray(alias) ? alias.filter((a) => a) : [];
    };
    const filterOption = (input: any, option: any) => {
      const label = option.children[0]?.children;
      return (
        option.value.toLowerCase().includes(input.toLowerCase()) ||
        (label && label.toLowerCase().includes(input.toLowerCase()))
      );
    };

    watch(
      () => props.data,
      (newVal: Partial<SiteData>) => {
        if (newVal) {
          console.log("propsdata while opening", props.data);
          console.log("siteDtaa", siteModelData.value);
          console.log();
          siteModelData.value = {
            ...defaultData,
            ...newVal,
            alias: initializeAlias(newVal.alias),
          };
        } else {
          siteModelData.value = { ...defaultData };
        }
      },
      { immediate: true }
    );

    const isUpdating = computed(() => !!siteModelData.value.id);
    const modalTitle = computed(() =>
      isUpdating.value ? "Edit Site" : "Add Site"
    );

    const isFormValid = computed(() => {
      const state = siteModelData.value;
      const hasNoLeadingWhitespace =
        !/^\s/.test(state.name || "") && !/^\s/.test(state.site_timezone || "");
      const requiredFieldsComplete =
        state.name?.trim() && state.site_timezone?.trim();
      console.log(
        "isformValid",
        hasNoLeadingWhitespace,
        requiredFieldsComplete
      );

      return requiredFieldsComplete && hasNoLeadingWhitespace;
    });

    // {
    //   return (
    //     siteModelData.value.name.trim() && siteModelData.value.site_timezone
    //   );
    // });

    const fetchTimeZones = async () => {
      try {
        const timeZonesData = getAllTimeZones();
        timeZones.value = timeZonesData;
      } catch (error) {
        console.error("Failed to fetch time zones:", error);
      }
    };

    const noWhitespaceValidator = (rule: any, value: any) => {
      console.log(rule);
      if (!value) return Promise.resolve();
      const hasLeadingSpace = /^\s/.test(value);
      if (hasLeadingSpace) {
        return Promise.reject(
          t(
            "commonData.Leading whitespace is not allowed",
            "Leading whitespace is not allowed"
          )
        );
      }
      return Promise.resolve();
    };

    const noSpecialCharactersAtStartValidator = (rule: any, value: any) => {
      console.log("rule is calling", rule);
      if (/^[^\p{L}\p{M}\s]/u.test(value)) {
        return Promise.reject(
          t(
            "commonData.Site Name should not start with numbers & special characters",
            "Site Name should not start with numbers & special characters"
          )
        );
      }
      if (!/^[\p{L}\p{M}\p{N}\s\-_]*$/u.test(value)) {
        return Promise.reject(
          t(
            "commonData.Site Name should not contain special characters",
            "Site Name should not contain special characters"
          )
        );
      }
      return Promise.resolve();
    };
    const aliasValidationDisable = ref(false);
    const descriptionValidationDisable = ref(false);
    const isNewlyAliasAdded = ref(false);
    const noInvalidValidator = (rule: any, value: any) => {
      console.log("rule", rule);
      // Check for the presence of '%' or '\' characters
      //console.log("rule newAlias", newAlias.value);
      console.log("rule value", value);
      if (rule.field === "alias") {
        value = newAlias.value;
      }
      if (value.includes("%") || value.includes("\\")) {
        if (rule.field === "description")
          descriptionValidationDisable.value = true;
        else aliasValidationDisable.value = true;

        console.log(
          "rule validator value",
          isAliasInputEmpty.value,
          aliasValidationDisable.value
        );
        return Promise.reject(t("commonData.Illegal input"));
      }

      // If no validation errors, resolve the promise
      if (rule.field === "alias") {
        aliasValidationDisable.value = false;
      } else descriptionValidationDisable.value = false;
      console.log(
        "rule validator value",
        isAliasInputEmpty.value,
        aliasValidationDisable.value
      );
      return Promise.resolve();
    };

    onMounted(() => {
      fetchTimeZones();
    });

    const resetData = () => {
      console.log(
        "at reset Data default Data before reset",
        { ...defaultData },
        "sitemodel",
        { ...siteModelData.value }
      );
      // aliases storing in defaultData too. clear them.
      siteModelData.value.alias = [];
      defaultData.alias = [];
      siteModelData.value = { ...defaultData };
      console.log("at reset Data default Data after reset", {
        ...siteModelData.value,
      });

      newAlias.value = "";
      isNewlyAliasAdded.value = false;
    };

    const handleClose = () => {
      console.log("handle close is calling");
      if (formRef.value) {
        formRef.value.resetFields();
      }
      console.log("calling before reset");
      isSiteVisible.value = false;
      console.log("calling before reset");
      resetData();
      //change value in flitered alias they are still storing after cancel.
      filteredAliases.value.length = 0;
      emit("close");
    };

    const userSitePayload = () => {
      const payload = {
        name: siteModelData.value.name,
        site_timezone: siteModelData.value.site_timezone,
        alias: siteModelData.value.alias.join(","),
        description: siteModelData.value.description,
      };
      console.log("::::: payload site ", payload);

      return payload;
    };

    const handleOk = async () => {
      confirmLoading.value = true;
      try {
        await formRef.value.validate();
        const payload = userSitePayload();
        if (isUpdating.value) {
          if (siteModelData.value.id !== undefined) {
            try {
              await updateSiteById(Number(siteModelData.value.id), payload);
              emit("submit", payload, "edit");
              message.success(
                `"${payload.name}" ${t(
                  "commonData.Updated Successfully!",
                  "Updated Successfully!"
                )}`
              );
            } catch (err) {
              // console.error(
              //   `${t(
              //     "commonData.Unable to Inactive site when users(s) are associated to this site."
              //   )}`
              // );
              console.error(
                `${t(
                  "commonData.Unable to edit site when users(s) are associated to this site.",
                  "Unable to edit site when users(s) are associated to this site."
                )}`
              );
            }
          }
        } else {
          const response = await createSite(payload);
          console.log("response of site create", response);
          emit("submit", payload, "create");
          message.success(
            `"${payload.name}" ${t(
              "commonData.Added Successfully!",
              "Added Successfully!"
            )}`
          );
        }

        handleClose();
        resetData();
      } catch (error: any) {
        console.log("error");
      } finally {
        confirmLoading.value = false;
      }
    };

    const addAlias = () => {
      const aliasesToAdd = newAlias.value
        .split(",")
        .map((alias) => alias.trim())
        .filter((alias) => alias);

      siteModelData.value.alias.push(...aliasesToAdd);
      isNewlyAliasAdded.value = true;
      newAlias.value = "";
    };

    const removeAlias = (alias: string) => {
      console.log("closed div ");

      siteModelData.value.alias = siteModelData.value.alias.filter(
        (a) => a !== alias
      );
    };

    const filteredAliases = computed(() => {
      return siteModelData.value.alias.filter((alias) => alias !== "");
    });

    const hasChanges = computed(() => {
      const currentData = {
        name: siteModelData.value.name,
        site_timezone: siteModelData.value.site_timezone,
        alias: siteModelData.value.alias.join(","),
        description: siteModelData.value.description,
      };

      const originalData = {
        name: props?.data?.name,
        site_timezone: props.data?.site_timezone,
        alias: Array.isArray(props.data?.alias)
          ? props.data?.alias.join(",")
          : props.data?.alias
          ? props.data?.alias
          : "",
        description: props.data?.description,
      };

      return JSON.stringify(currentData) !== JSON.stringify(originalData);
    });

    return {
      isSiteVisible,
      formRef,
      siteModelData,
      handleClose,
      handleOk,
      isUpdating,
      modalTitle,
      timeZones,
      confirmLoading,
      newAlias,
      addAlias,
      areObjectsEqual,
      removeAlias,
      isFormValid,
      filteredAliases,
      timezoneRules,
      isAliasInputEmpty,
      hasChanges,
      noSpecialCharactersAtStartValidator,
      noWhitespaceValidator,
      filterOption,
      translateLabel,
      // onFormChange,
      t,
      isSubmitDisabled,
      aliasValidationDisable,
      descriptionValidationDisable,
      // aliasValidator,
      // descriptionValidator,
      noInvalidValidator,
    };
  },
});
</script>

<style scoped>
.col-margin {
  margin-bottom: 16px;
}
.input-margin {
  margin-bottom: 8px;
}
.input-field {
  width: 100%;
}
.modelSite {
  .ant-form-item {
    margin-bottom: 24px;
  }
}
</style>

<style>
.input-margin {
  margin-right: 10px;
}
.modelSite .ant-modal-content {
  padding: 0px !important;
}
.modelSite .ant-modal-header {
  padding: 16px 24px;
  color: rgba(0, 0, 0, 0.65);
  border-bottom: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
}
.modelSite .ant-modal-body {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}
.modelSite .ant-modal-footer {
  padding: 10px 16px;
  text-align: right;
  background: 0 0;
  border-top: 1px solid #e8e8e8;
  border-radius: 0 0 4px 4px;
}
</style>
