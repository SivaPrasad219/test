<template>
  <a-modal
    :open="visible"
    :title="t('monitorPage.Upload Files', 'Upload Files')"
    @cancel="handleCancel"
    :maskClosable="false"
    width="520px"
    class="upload-modal"
  >
    <div class="modal-content">
      <!-- Form -->
      <div class="form-container">
        <a-form layout="vertical" class="upload-form">
          <a-form-item
            :label="t('monitorPage.Select File Type', 'Select File Type')"
            class="form-item"
          >
            <a-select
              v-model:value="selectedType"
              :getPopupContainer="(triggerNode:any) => triggerNode.parentElement"
              :placeholder="t('monitorPage.Select type', 'Select type')"
              class="form-select"
            >
              <template #suffixIcon><folder-open-outlined /></template>
              <a-select-option value="edgeman">{{
                t("monitorPage.Edgeman", "Edgeman")
              }}</a-select-option>
              <a-select-option value="pkgs">{{
                t("monitorPage.Pkgs", "Pkgs")
              }}</a-select-option>
              <a-select-option value="screen.py">{{
                t("monitorPage['Screen.py']", "Screen.py")
              }}</a-select-option>
              <a-select-option value="otherFile">{{
                t("monitorPage.Other Files", "Other Files")
              }}</a-select-option>
              <a-select-option value="otherFolder">{{
                t("monitorPage.Other Folder", "Other Folder")
              }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item
            :label="t('monitorPage.Target Path', 'Target Path')"
            :validate-status="errors?.path ? 'error' : ''"
            :help="errors?.path"
            class="form-item"
          >
            <a-input
              v-model:value="uploadPath"
              :placeholder="
                t('monitorPage.Enter target path', 'Enter target path')
              "
              :disabled="
                selectedType.trim().length > 0 &&
                !selectedType.includes('other')
              "
              class="form-input"
            >
              <template #prefix><link-outlined /></template>
            </a-input>
          </a-form-item>

          <a-form-item
            :label="
              t('monitorPage.Select EdgeManager IPs', 'Select EdgeManager IPs')
            "
            v-if="uploadType === `batchUpload`"
          >
            <a-select
              v-model:value="selectedBatchIps"
              mode="multiple"
              style="width: 100%"
              :placeholder="t('monitorPage.Select Item', 'Select Item')"
              @change="handleOptionsChange"
              :tagRender="customTagRender"
              :getPopupContainer="(triggerNode:any) => triggerNode.parentElement"
              :options="batchEdgemanIps"
            >
            </a-select>
          </a-form-item>

          <a-form-item
            :label="t('monitorPage.Select File/Folder', 'Select File/Folder')"
            :validate-status="errors.file ? 'error' : ''"
            :help="errors.file"
            class="form-item"
          >
            <a-upload
              :before-upload="handleBeforeUpload"
              :show-upload-list="false"
              :directory="
                selectedType === 'pkgs' || selectedType === 'otherFolder'
              "
              :multiple="true"
            >
              <a-button class="select-btn" type="primary">
                <upload-outlined />
                {{ t("monitorPage.Select", "Select") }}
                {{
                  selectedType === "pkgs" || selectedType === "otherFolder"
                    ? t("monitorPage.Folder", "Folder")
                    : t("monitorPage.File", "File")
                }}
              </a-button>
            </a-upload>

            <div v-if="fileList.length" class="file-list server-card">
              <ul>
                <li v-for="file in fileList" :key="file.uid">
                  <file-outlined class="file-icon" />
                  <span class="file-name">{{
                    file.webkitRelativePath || file.name
                  }}</span>
                </li>
              </ul>
            </div>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <p
        v-if="selectedType.trim().length > 0 && !selectedType.includes('other')"
        class="note-text"
      >
        {{
          t(
            "monitorPage.NOTE: The EdgeManager service will restart automatically after a successful upload of this/these file(s)",
            "NOTE: The EdgeManager service will restart automatically after a successful upload of this/these file(s)."
          )
        }}
      </p>
      <a-button class="cancel-btn" @click="handleCancel">{{
        t("monitorPage.Cancel", "Cancel")
      }}</a-button>
      <a-tooltip :title="isUploading ? 'File is uploading' : ''">
        <a-button
          type="primary"
          :disabled="isButtonDisabled"
          :loading="isUploading"
          @click="uploadFiles"
          class="upload-btn"
        >
          <upload-outlined />
          {{ t("monitorPage.Upload", "Upload") }}
        </a-button>
      </a-tooltip>
    </template>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, ref, h, watch, computed } from "vue";
import { uploadZipFile } from "@/services/apiService";
import JSZip from "jszip";
import {
  FolderOpenOutlined,
  LinkOutlined,
  UploadOutlined,
  FileOutlined,
} from "@ant-design/icons-vue";
import { message, Tag } from "ant-design-vue";
import { useI18n } from "vue-i18n";

type IpValue = string;
type IpOption = { label: string; value: string };

export default defineComponent({
  name: "UploadFilesModal",
  components: {
    FolderOpenOutlined,
    LinkOutlined,
    UploadOutlined,
    FileOutlined,
  },
  props: {
    visible: { type: Boolean, required: true },
    selectedEmIps: { type: Array as () => string[], required: true },
    uploadType: { type: String, required: true },
    connection_status: { type: String, default: "" },
    emData: { type: Object },
  },
  emits: ["close", "upload", "loading", "uploadId"],
  setup(props, { emit }) {
    const { t } = useI18n();
    const selectedType = ref("");
    const uploadPath = ref("");
    const fileList = ref<any[]>([]);
    const errors = ref({ path: "", file: "" });
    const isUploading = ref(false);
    const isModalVisible = ref(props.visible);
    const selectedBatchIps = ref<IpValue[]>([]);

    const batchEdgemanIps = computed<IpOption[]>(() => {
      const options = props.selectedEmIps.map((ip) => ({
        label: ip,
        value: ip,
      }));
      return props.selectedEmIps.length
        ? [{ label: "Select All", value: "all" }, ...options]
        : options;
    });

    const formattedSelectedIps = computed<IpValue[]>(() =>
      selectedBatchIps.value.filter((ip) => ip !== "all")
    );

    const isButtonDisabled = computed(() => {
      return (
        !fileList.value.length ||
        hasErrors.value ||
        isUploading.value ||
        (props.uploadType === "batchUpload" &&
          selectedBatchIps.value.length === 0) ||
        selectedType.value.trim().length === 0 ||
        uploadPath.value.trim().length === 0
      );
    });

    const prevSelected = ref<IpValue[]>([]);

    const handleOptionsChange = (newValues: IpValue[]) => {
      const ipsOnly = batchEdgemanIps.value
        .filter((opt) => opt.value !== "all")
        .map((opt) => opt.value);

      const lastValue = newValues.slice(-1)[0];

      const isAllAlreadySelected =
        prevSelected.value.length === ipsOnly.length &&
        prevSelected.value.every((ip) => ipsOnly.includes(ip));

      if (lastValue === "all" && isAllAlreadySelected) {
        selectedBatchIps.value = [];
      } else if (lastValue === "all") {
        selectedBatchIps.value = ipsOnly;
      } else {
        selectedBatchIps.value = newValues.filter((val) => val !== "all");
      }
      prevSelected.value = [...selectedBatchIps.value];
    };

    const customTagRender = ({
      label,
      value,
      closable,
      onClose,
    }: {
      label: any;
      value: any;
      closable: boolean;
      onClose: (event: MouseEvent) => void;
    }) => {
      if (value === "all") return null;
      return h(
        Tag,
        { closable, onClose, style: "margin-right: 3px;" },
        () => label
      );
    };

    const expectedNameMap: Record<string, string> = {
      edgeman: "edgeman",
      "screen.py": "screen.py",
      pkgs: "pkgs",
    };

    // const isConnected = computed(() => props.connection_status);
    // const MAX_FILE_SIZE_GB = 1;
    // let totalFolderSize = 0;

    const handleBeforeUpload = (file: any, fileListRaw: any[]) => {
      if (
        selectedType.value === "pkgs" ||
        selectedType.value === "otherFolder"
      ) {
        fileList.value = [...fileListRaw];
        // for (const file of fileList.value) {
        // const sizeMB = file.size / (1000 * 1000);
        // totalFolderSize += sizeMB;
        // }

        // if (totalFolderSize / 1000 > MAX_FILE_SIZE_GB) {
        //   errors.value.file = `Selected Folder size exceeds the ${MAX_FILE_SIZE_GB}GB limit.`;
        //   return;
        // }
      } else {
        fileList.value = [file];
      }
      // console.log(
      //   "file list after upload is the ",
      //   fileList.value,
      //   fileList.value[0].size / (1000 * 1000 * 1000)
      // );

      // if (fileList.value[0].size / (1000 * 1000 * 1000) > MAX_FILE_SIZE_GB) {
      //   errors.value.file = `File "${fileList.value[0].name}" exceeds the ${MAX_FILE_SIZE_GB}GB limit.`;
      // }
      errors.value.file = "";
      return false;
    };

    watch(selectedType, (val) => {
      if (val === "edgeman") uploadPath.value = "/opt/phz/em";
      else if (val === "pkgs") uploadPath.value = "/opt/phz/em/files";
      else if (val === "screen.py") uploadPath.value = "/opt/phz/screen";
      else uploadPath.value = "";

      fileList.value = [];
      errors.value = { path: "", file: "" };
    });

    watch(uploadPath, (val) => {
      if (selectedType.value === "otherFile" && val !== "") {
        errors.value = { path: "", file: "" };
      }
    });

    const validate = () => {
      errors.value = { path: "", file: "" };
      if (!uploadPath.value) errors.value.path = "Path is required";
      if (!fileList.value.length) errors.value.file = "File is required";

      if (
        selectedType.value !== "otherFolder" &&
        fileList.value.length &&
        !["otherFile", "otherFolder"].includes(selectedType.value)
      ) {
        const expected = expectedNameMap[selectedType.value];
        // console.log(
        //   "fileName expected",
        //   fileList.value[0].webkitRelativePath.split("/")[0],
        //   expected
        // );
        const fileName =
          selectedType.value === "pkgs"
            ? fileList.value[0].webkitRelativePath.split("/")[0]
            : fileList.value[0]?.name || "";

        if (fileName !== expected) {
          errors.value.file = `File name must be "${expected}"`;
        }
      }

      if (
        ["otherFile", "otherFolder"].includes(selectedType.value) &&
        !uploadPath.value.trim()
      ) {
        message.error(
          t(
            "monitorPage.Path is required for other type",
            "Path is required for other type"
          )
        );
        errors.value.path = 'Path is required for "other" type';
      }
    };

    const hasErrors = computed(
      () => !!errors.value.path || !!errors.value.file
    );

    // const atleastOneSelectedIpIsActive = computed(() => {
    //   if (!props?.emData) return false;
    //   return Object.entries(props?.emData).some(
    //     ([key, value]) =>
    //       formattedSelectedIps.value.includes(key) &&
    //       value.is_connected === "connected"
    //   );
    // });

    const allSelectedIpsAreActive = computed(() => {
      if (!props?.emData || formattedSelectedIps.value.length === 0)
        return false;
      return formattedSelectedIps.value.every((ip) => {
        const emData = props?.emData?.[ip];
        return emData && emData.is_connected === "connected";
      });
    });

    const uploadFiles = async () => {
      validate();
      console.log(
        "UploadModal - formattedSelectedIps:",
        formattedSelectedIps.value
      );
      if (props.uploadType === "singleUpload") {
        // For single upload, check connection_status prop
        if (props.connection_status !== "connected") {
          const selectedIp = props.selectedEmIps?.[0] || "Unknown";
          message.error(
            t(
              "monitorPage.Cannot upload: The following EdgeManager is disconnected:",
              "Cannot upload: The following EdgeManager is disconnected:"
            ) + ` ${selectedIp}`
          );
          return;
        }
      } else if (props.uploadType === "batchUpload") {
        // Check if no IPs are selected for batch upload
        if (formattedSelectedIps.value.length === 0) {
          message.error(
            t(
              "monitorPage.Please select at least one EdgeManager IP to upload",
              "Please select at least one EdgeManager IP to upload"
            )
          );
          return;
        }

        // Check if all selected IPs are connected
        if (!allSelectedIpsAreActive.value) {
          const disconnectedIps = formattedSelectedIps.value.filter((ip) => {
            const emData = props.emData && props.emData[ip];
            return !emData || emData.is_connected !== "connected";
          });

          if (disconnectedIps.length > 0) {
            const ipList = disconnectedIps.join(", ");
            if (disconnectedIps.length > 1) {
              message.error(
                t(
                  "monitorPage.Cannot upload: The following EdgeManagers are disconnected:",
                  "Cannot upload: The following EdgeManagers are disconnected:"
                ) + ` ${ipList}`
              );
            } else {
              message.error(
                t(
                  "monitorPage.Cannot upload: The following EdgeManager is disconnected:",
                  "Cannot upload: The following EdgeManager is disconnected:"
                ) + ` ${ipList}`
              );
            }
          } else {
            message.error(
              t(
                "monitorPage.Cannot upload: No active EdgeManager selected",
                "Cannot upload: No active EdgeManager selected"
              )
            );
          }
          return;
        }
      }

      // Check for form validation errors
      if (hasErrors.value) {
        return;
      }

      isUploading.value = true;
      const zip = new JSZip();
      for (const file of fileList.value) {
        const relativePath = file.webkitRelativePath || file.name;
        zip.file(relativePath, file);
      }

      try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const firstFile = fileList.value[0];
        const excludedTypes = ["edgeman", "screen.py", "pkgs"];
        const zipFileName = firstFile
          ? firstFile.webkitRelativePath
            ? excludedTypes.includes(selectedType.value)
              ? firstFile.webkitRelativePath.split("/")[0]
              : firstFile.webkitRelativePath.split("/")[0] + ".zip"
            : excludedTypes.includes(selectedType.value)
            ? firstFile.name
            : firstFile.name + ".zip"
          : "upload.zip";

        if (isUploading.value) {
          // Use correct IP array based on upload type
          const ipsToUpload =
            props.uploadType === "singleUpload"
              ? props.selectedEmIps
              : formattedSelectedIps.value;

          const data = await uploadZipFile(
            JSON.stringify(ipsToUpload),
            zipFileName,
            zipBlob,
            uploadPath.value
          );
          emit("uploadId", data);
          isUploading.value = false;
          isModalVisible.value = false;
          emit("loading", ipsToUpload);
          handleCancel();
        }
      } catch (error) {
        console.error(`Upload failed:`, error);
        message.error(
          t("monitorPage.Failed to upload files", "Failed to upload files")
        );
        isUploading.value = false;
        setTimeout(() => {
          message.error(
            t(
              "monitorPage.Something went wrong, please try again",
              "Something went wrong, please try again"
            )
          );
        }, 2500);
      }
    };

    const handleCancel = () => {
      selectedType.value = "";
      uploadPath.value = "";
      fileList.value = [];
      if (
        selectedBatchIps.value.length > 0 &&
        props.uploadType !== "singleUpload"
      ) {
        selectedBatchIps.value = [];
      }
      isModalVisible.value = false;
      isUploading.value = false;
      emit("close");
    };

    return {
      t,
      selectedType,
      isButtonDisabled,
      batchEdgemanIps,
      handleOptionsChange,
      customTagRender,
      uploadPath,
      fileList,
      errors,
      isUploading,
      handleBeforeUpload,
      hasErrors,
      uploadFiles,
      handleCancel,
      selectedBatchIps,
    };
  },
});
</script>

<style scoped>
.upload-modal ::v-deep(.ant-modal-content) {
  border-radius: 8px;
}

.form-container {
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  max-width: 500px;
  margin: 30px 0px !important;
  border-radius: 8px;
}

.upload-form {
  margin-top: 10px;
  border-top: #595959;
}

.note-text {
  text-align: left;
  color: red;
  font-size: 0.8rem;
}

.form-item {
  margin-bottom: 16px;
}

.form-select,
.form-input {
  border-radius: 4px;
  transition: all 0.3s ease;
}

:deep(.ant-form-item-has-error .form-select),
:deep(.ant-form-item-has-error .form-input) {
  border-color: #b76f6f;
}

:deep(.ant-form-item-explain-error) {
  color: #b76f6f;
  font-size: 12px;
}

.select-btn,
.upload-btn {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  /* display: flex;
  align-items: center; */
  gap: 8px;
  transition: all 0.3s ease;
}

.select-btn:hover,
.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.upload-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: white;
  border-radius: 6px;
  margin-right: 20px;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-list {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 150px;
  overflow-y: auto;
}

.file-list ul {
  padding-left: 0;
  margin: 0;
}

.file-list li {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #595959;
  font-size: 12px;
  padding: 4px 0;
}

.file-icon {
  color: #1890ff;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.upload-alert {
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
}

.upload-alert:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

:deep(.ant-alert-success) {
  background-color: #e6f4ea;
  border-color: #6fb788;
}

:deep(.ant-alert-error) {
  background-color: #ffe6e6;
  border-color: #b76f6f;
}

:deep(.ant-alert-info) {
  background-color: #e6f7ff;
  border-color: #1890ff;
}
</style>
