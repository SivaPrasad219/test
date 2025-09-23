<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    @update:visible="$emit('update:visible', $event)"
    :footer="null"
    width="500px"
    class="modal-content"
  >
    <a-divider class="modal-divider" />

    <div class="section-box">
      <!-- Overlay Arrow Buttons -->
      <div v-if="selectedRecords.length > 1" class="arrow-buttons">
        <a-button
          type="text"
          size="small"
          class="arrow-btn left-arrow"
          :disabled="currentIndex === 0"
          @click="prevRecord"
        >
          <LeftCircleFilled />
        </a-button>
        <a-button
          type="text"
          size="small"
          class="arrow-btn right-arrow"
          :disabled="currentIndex === selectedRecords.length - 1"
          @click="nextRecord"
        >
          <RightCircleFilled />
        </a-button>
      </div>

      <!-- Record Display -->
      <a-row justify="space-between" align="middle" class="header-row">
        <a-col>
          <div class="sample-id-text">
            {{ record?.data?.samplePoint || "-" }}
          </div>
        </a-col>
        <a-col>
          <a-tag :color="getStatusColor(record?.status)" class="elevated-tag">
            {{ record?.status || "-" }}
          </a-tag>
        </a-col>
      </a-row>

      <a-row class="asset-status-row" :gutter="16">
        <a-col :span="12">
          <div class="asset-status-text">
            <span class="label">{{ translateLabel("mfgPage", "Asset") }}:</span>
            <strong class="value">{{
              record?.meta?.asset_info?.name || "-"
            }}</strong>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="asset-status-text">
            <span class="label"
              >{{ translateLabel("mfgPage", "Sample Type") }}:</span
            >
            <strong class="value">{{
              record?.meta?.sample_type_label || "-"
            }}</strong>
          </div>
        </a-col>
      </a-row>

      <a-row class="info-grid-row" :gutter="16">
        <!-- Row 2 -->
        <a-col :span="12">
          <div class="info-label">
            <span class="label"
              >{{ translateLabel("mfgPage", "Text id") }}:</span
            >
            <strong class="value">{{ record?.data?.sampleId || "-" }}</strong>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="info-label">
            <span class="label"
              >{{ translateLabel("mfgPage", "Sample Point") }}:</span
            >
            <strong class="value">{{
              record?.data?.samplePoint || "-"
            }}</strong>
          </div>
        </a-col>

        <!-- Row 3 -->
        <a-col :span="12">
          <div class="info-label">
            <span class="label"
              >{{ translateLabel("mfgPage", "Program") }}:</span
            >
            <strong class="value">{{ record?.data?.program || "-" }}</strong>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="info-label">
            <span class="label"
              >{{ translateLabel("mfgPage", "Worklist ID") }}:</span
            >
            <strong class="value">{{ record?.data?.worklistId || "-" }}</strong>
          </div>
        </a-col>

        <!-- Row 4 -->
        <a-col :span="12">
          <div class="info-label">
            <span class="label"
              >{{ translateLabel("mfgPage", "LIMS Sample #") }}:</span
            >
            <strong class="value">{{
              record?.data?.limsSampleId || "-"
            }}</strong>
          </div>
        </a-col>
      </a-row>

      <a-divider class="modal-divider" />

      <a-row :gutter="16">
        <a-col :span="8">
          <a-card size="small" class="custom-card">
            <template #title>
              <BarChartOutlined style="font-size: 11px; margin-right: 4px" />
              <a-tooltip>
                <template #title>
                  <span style="font-size: 10px">{{
                    translateLabel("mfgPage", "Particle Counts")
                  }}</span>
                </template>
                <span style="font-size: 10px">
                  {{
                    getTruncatedTitle(
                      translateLabel("mfgPage", "Particle Counts")
                    )
                  }}
                </span>
              </a-tooltip>
            </template>
            <p
              v-for="[key, value] in Object.entries(
                record?.data?.data?.cumulative_data || {}
              )"
              :key="key"
            >
              {{ key }}:
              <strong>{{
                value?.toLocaleString() ??
                translateLabel("mfgPage", "Measuring...")
              }}</strong>
            </p>
          </a-card>
        </a-col>

        <a-col :span="8">
          <a-card size="small" class="custom-card">
            <template #title>
              <ClockCircleOutlined style="font-size: 11px; margin-right: 4px" />
              <a-tooltip>
                <template #title>
                  <span style="font-size: 10px">{{
                    translateLabel("mfgPage", "Timing Information")
                  }}</span>
                </template>
                <span style="font-size: 10px">
                  {{
                    getTruncatedTitle(
                      translateLabel("mfgPage", "Timing Information")
                    )
                  }}
                </span>
              </a-tooltip>
            </template>
            <p>
              <strong>{{ translateLabel("mfgPage", "Start Time") }}:</strong>
            </p>
            <p>{{ record?.measure_start_time }}</p>
            <p>
              <strong>{{ translateLabel("mfgPage", "End Time") }}:</strong>
            </p>
            <p>{{ record?.measure_end_time }}</p>

            <template v-if="record?.meta?.input?.delay_time">
              <p>
                <strong>{{ translateLabel("mfgPage", "Delay Time") }}:</strong>
              </p>
              <p>
                {{
                  record?.meta?.input?.delay_time === 0
                    ? "0 " + translateLabel("mfgPage", "secs")
                    : record?.meta?.input?.delay_time
                    ? record.meta.input.delay_time +
                      " " +
                      translateLabel("mfgPage", "secs")
                    : "-"
                }}
              </p>
            </template>
          </a-card>
        </a-col>

        <a-col :span="8">
          <a-card size="small" class="custom-card">
            <template #title>
              <ThunderboltOutlined style="font-size: 11px; margin-right: 4px" />
              <a-tooltip>
                <template #title>
                  <span style="font-size: 10px">{{
                    translateLabel("mfgPage", "Environmental Conditions")
                  }}</span>
                </template>
                <span style="font-size: 10px">
                  {{
                    getTruncatedTitle(
                      translateLabel("mfgPage", "Environmental Conditions")
                    )
                  }}
                </span>
              </a-tooltip>
            </template>
            <p>
              <strong>{{ translateLabel("mfgPage", "Location") }}:</strong>
            </p>
            <p>{{ record?.meta?.input?.location || "-" }}</p>
            <p>
              <strong>{{ translateLabel("mfgPage", "Operator") }}:</strong>
            </p>
            <p>{{ record?.meta?.operator || "-" }}</p>
            <p>
              <strong>{{ translateLabel("mfgPage", "Volume") }}:</strong>
            </p>
            <p>
              {{ record?.data?.data?.volume?.value || "-" }}
              {{ record?.data?.data?.volume?.unit || "-" }}
            </p>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <a-divider class="modal-divider" />

    <a-row>
      <a-col :span="24">
        <div style="display: flex; align-items: center; margin-bottom: 4px">
          <DatabaseOutlined style="font-size: 11px; margin-right: 4px" />
          <label class="comment-label">{{
            translateLabel("mfgPage", "Sample Notes")
          }}</label>
        </div>

        <a-textarea
          v-model:value="comments"
          :disabled="isCommentDisabled || userRole !== 'operator'"
          :placeholder="translateLabel('mfgPage', 'Enter your notes')"
          style="width: 100%; height: 50px; font-size: 10px; resize: none"
        />
      </a-col>
    </a-row>

    <div style="text-align: right; margin-top: 16px">
      <a-button
        size="small"
        style="font-size: 10px"
        @click="$emit('update:visible', false)"
      >
        {{ translateLabel("mfgPage", "Close") }}
      </a-button>
      <a-button
        v-if="!isCommentDisabled && userRole === 'operator'"
        type="primary"
        size="small"
        style="font-size: 10px; margin-left: 11px"
        @click="esignModalVisible = true"
      >
        {{ translateLabel("mfgPage", "Confirm Data") }}
      </a-button>
    </div>
  </a-modal>

  <a-modal
    v-model:open="esignModalVisible"
    @ok="handleConfirmData"
    @cancel="handleEsignCancel"
    @keydown.enter.prevent="handleConfirmData"
    width="500px"
    class="modal-content"
    centered
    :bodyStyle="{ padding: '0 !important' }"
  >
    <template #title>
      <a-tooltip
        :title="
          translateLabel('mfgPage', 'E-Signature needed for Confirm Data')
        "
      >
        <div style="font-weight: 600">
          {{ translateLabel("mfgPage", "E-Signature needed for Confirm Data") }}
        </div>
      </a-tooltip>
      <a-divider style="margin: 10px 0" />
    </template>

    <a-form
      :model="esignformData"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
    >
      <a-form-item
        :label="translateLabel('mfgPage', 'Username')"
        name="username"
        :rules="[
          {
            required: true,
            message: translateLabel('mfgPage', 'Please input your username!'),
          },
        ]"
      >
        <a-input
          v-model:value="esignformData.username"
          :placeholder="translateLabel('mfgPage', 'Enter your username')"
        >
          <template #prefix>
            <UserOutlined style="font-size: 11px; color: rgba(0, 0, 0, 0.25)" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        :label="translateLabel('mfgPage', 'Password')"
        name="password"
        :rules="[
          {
            required: true,
            message: translateLabel('mfgPage', 'Please input your password!'),
          },
        ]"
      >
        <a-input
          v-model:value="esignformData.password"
          :type="passwordVisible ? 'text' : 'password'"
          :placeholder="translateLabel('mfgPage', 'Enter your password')"
        >
          <template #prefix>
            <LockOutlined style="font-size: 11px; color: rgba(0, 0, 0, 0.25)" />
          </template>
          <template #suffix>
            <a @click="togglePasswordVisibility">
              <EyeOutlined
                v-if="passwordVisible"
                style="font-size: 11px; color: rgba(0, 0, 0, 0.85)"
              />
              <EyeInvisibleOutlined
                v-else
                style="font-size: 11px; color: rgba(0, 0, 0, 0.25)"
              />
            </a>
          </template>
        </a-input>
      </a-form-item>
    </a-form>

    <!-- Footer buttons -->
    <template #footer>
      <a-divider style="margin: 16px 0" />

      <a-button @click="handleEsignCancel">
        {{ translateLabel("mfgPage", "Cancel") }}
      </a-button>
      <a-button
        type="primary"
        :loading="isLoading"
        :disabled="!esignformData.username || !esignformData.password"
        @click="handleConfirmData"
      >
        {{ translateLabel("mfgPage", "Verify Signature & Confirm") }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import {
  ClockCircleOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LeftCircleFilled,
  RightCircleFilled,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import {
  esignConfirmLogin,
  mfgConfirmatationCMSample,
} from "../../../../services/apiService";
import { defineProps, defineEmits, computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

interface MonitoringRecord {
  id: number;
  asset_id: string;
  measure_start_time: string;
  measure_end_time: string;
  status: string;
  job_id: number;
  details: { message: string; comment: string };
  meta: {
    input: {
      volume: { unit: string; value: number };
      location: string;
      delay_time: number;
      flow_limits?: { lower_limit: number; upper_limit: number };
      count_limits?: Record<
        string,
        { alarm_limit: number; warning_limit: number }
      >;
    };
    source: string;
    operator: string;
    asset_info: {
      name: string;
      model: string;
      notes?: string[];
      types?: { name: string; nice_name: string }[];
      manufacturer?: string;
    };
    sample_type_label: string;
    task_def_id: number;
  };
  data: {
    data: {
      volume: { unit: string; value: number };
      cumulative_data: Record<string, number>;
      start_time: { time: string };
      end_time: { time: string };
      run_time: { elapsed: string; expected: string; remaining: string };
      period: string;
      key: string;
    };
    status: string;
    location: string;
    agent_time: { time: string; zone: string; offset: string; dst: string };
    status_msg: string;
  };
  created_by: string;
  created_date: string;
  last_updated_by: string;
  last_updated_date: string;
  lims_sample_id: string | null;
}

interface Props {
  visible: boolean;
  selectedRecords: any;
}

const { t } = useI18n();
const props = defineProps<Props>();
const currentIndex = ref(0);
const comments = ref("");
const record = computed(
  () => props.selectedRecords[currentIndex.value] || null
);
import { translateLabel } from "@/common/utils";

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "mfg-confirm-success": any;
}>();

const decodedTokenString = localStorage.getItem("DecodedToken");
// let userName = "";
let userRole = "";
if (decodedTokenString) {
  const decodedToken = JSON.parse(decodedTokenString);
  userRole = decodedToken.role;
  // userName = decodedToken.username;
  console.log("userName::::::::", userRole, record);
}

console.log(":::props.selectedRecords", props.selectedRecords);

const esignModalVisible = ref(false);
const passwordVisible = ref(false);
const esignformData = ref({
  username: "",
  password: "",
});

const isLoading = ref(false);

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const handleEsignCancel = () => {
  esignModalVisible.value = false;
};

const getStatusColor = (status: string) => {
  // Handle null, undefined, or empty status
  if (!status || status.trim() === "") {
    return "default";
  }

  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "warning";
    case "REVIEWED":
      return "green";
    case "ABORTED":
    case "ABORTING":
    case "SUSPENDED":
    case "FORCE DROPPING":
    case "EXTERNAL INTERRUPT":
    case "FAILED":
    case "EXTERNAL SAMPLE":
    case "FORCE DROP":
      return "red";
    case "NEW":
      return "#c9c9c9";
    case "IN-PROGRESS":
    case "IN PROGRESS":
      return "cyan";
    case "SYNCED":
      return "green";
    default:
      return "default";
  }
};
const isCommentDisabled = computed(() => {
  const status = record.value?.status || "";
  const details = record.value?.details || {};

  const disabledStatuses = [
    "In-Progress",
    "Reviewed",
    "New",
    "In-Progress Disconnected",
    "Force Dropping",
    "Aborting",
    "Suspended",
  ];

  return (
    disabledStatuses.includes(status) ||
    Object.prototype.hasOwnProperty.call(details, "comment")
  );
});

// const existingComment = computed(() => {
//   return (
//     record.value?.details?.comment || comments.value[record.value?.id] || ""
//   );
// });

const commentPlaceholder = computed(() => {
  const status = record.value?.status;

  const blockStatuses = [
    "In-Progress",
    "New",
    "In-Progress Disconnected",
    "Force Dropping",
    "Aborting",
    "Suspended",
  ];

  return blockStatuses.includes(status) ? "" : "Enter your Sample Note here";
});

const handleConfirmData = async () => {
  isLoading.value = true;

  const username = esignformData.value.username;
  const password = esignformData.value.password;

  const payload = {
    username,
    password,
  };

  if (username.toLowerCase() !== esignformData.value.username.toLowerCase()) {
    message.error(
      t(
        "mfgPage.Authentication failed for ",
        `Authentication failed for "${username}"`
      )
    );
    isLoading.value = false;
    return;
  }
  try {
    const loginResult = await esignConfirmLogin(payload);

    if (loginResult) {
      // message.success(
      //   t(
      //     "mfgPage.E-Signature Verified Successfully.",
      //     `E-Signature Verified Successfully."`
      //   )
      // );
      esignModalVisible.value = false;

      const confirmationPayload: {
        task_result_ids: number[];
        job_id: number;
        comment: any;
        asset_id: string;
        asset_name: string;
        source: string;
      }[] = [];

      if (props.selectedRecords.length > 0) {
        // console.log(props.selectedRecords);
        props.selectedRecords.forEach((rec: any) => {
          confirmationPayload.push({
            task_result_ids: [rec.id],
            job_id: rec.job_id,
            comment: comments.value || "-",
            asset_id: rec.asset_id || "",
            asset_name: rec.meta?.asset_info?.name || "",
            source: rec.meta?.source || "",
          });
        });
      }

      console.log(
        "::: Final Confirmation Payload",
        confirmationPayload,
        comments.value
      );

      // Call the confirmation API
      const response = await mfgConfirmatationCMSample(confirmationPayload);

      if (response?.result === "Confirm sucessfull") {
        message.success(
          t(
            "mfgPage.Sample confirmation submitted successfully.",
            "Sample confirmation submitted successfully."
          )
        );
        // Emit event to notify parent
        emit("mfg-confirm-success");
      } else {
        message.error(
          t(
            "mfgPage.Sample confirmation failed.",
            "Sample confirmation failed."
          )
        );
      }
    } else {
      message.error(
        t(
          "mfgPage.Authentication failed for ",
          `Authentication failed for "${username}"`
        )
      );
    }
  } catch (error: any) {
    console.error("E-Sign Error:", error);
    message.error(
      error?.response?.data?.message ||
        t(
          "mfgPage.An error occurred during confirmation.",
          "An error occurred during confirmation."
        )
    );
  } finally {
    isLoading.value = false;
    // Reset form data
    esignformData.value.username = "";
    esignformData.value.password = "";
  }
};

const prevRecord = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const nextRecord = () => {
  if (currentIndex.value < props.selectedRecords.length - 1) {
    currentIndex.value++;
  }
};

const modalTitle = computed(() => {
  return `Sample Point - ${record.value?.data?.samplePoint || "-"}`;
});

const getTruncatedTitle = (title: string) => {
  return title.length > 20 ? title.slice(0, 20) + "..." : title;
};

watch(
  () => record.value,
  (newRecord) => {
    if (newRecord?.details?.comment) {
      comments.value = newRecord.details.comment;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.modal-content {
  padding: 11px;
}

.section-box {
  border-left: 2px solid rgb(50, 197, 255);
  border-radius: 11px;
  padding-left: 12px;
  margin-bottom: 16px;
  position: relative;
}

.arrow-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  z-index: 10;
}

.arrow-btn {
  font-size: 18px;
  color: #1890ff;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 4px;
  transition: all 0.3s;
}

.arrow-btn:hover {
  color: #40a9ff;
  background: rgba(255, 255, 255, 1);
}

.arrow-btn:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.8);
}

.left-arrow {
  margin-left: -6px;
}

.right-arrow {
  margin-right: -6px;
}

.custom-card {
  font-size: 10px;
  padding: 0 5px !important;
  min-height: 160px;
}

.custom-card :deep(.ant-card-body) {
  padding: 5px !important;
}

.custom-card :deep(.ant-card-head-title) {
  font-size: 10px !important;
  min-height: 20px !important;
  padding: 2px !important;
}

:deep(.ant-card-head) {
  font-size: 10px !important;
  min-height: 20px !important;
  padding: 2px !important;
}

.custom-card strong {
  font-size: 10px;
  color: #52c41a;
}

p {
  font-size: 10px;
  margin-bottom: 4px;
}

.comment-label {
  font-size: 10px;
  display: block;
}

.modal-divider {
  padding: 0;
  margin: 11px 0 !important;
}

.sample-id-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.elevated-tag {
  font-size: 7px !important;
  font-weight: bold;
  border-radius: 4px;
  padding: 0 7px;
}

.asset-status-text {
  font-size: 10px;
  color: #555;
  margin-top: 2px;
}

.ant-modal-root .ant-modal-wrap .ant-modal .ant-modal-content {
  padding: 0 !important;
}

.info-label {
  font-size: 9px;
  margin-bottom: 2px;
  color: #555;
}

.label {
  font-size: 9px;
  color: #555;
  margin-right: 2px;
}

.value {
  font-size: 9px;
  color: #555;
}
</style>
