<template>
  <a-modal
    :open="visible"
    :title="t('monitorPage.Restart Service', 'Restart Service')"
    @cancel="handleCancel"
    :maskClosable="false"
    width="520px"
    height="400px"
    class="upload-modal"
  >
    <div class="modal-content">
      <!-- Form -->
      <div class="form-container">
        <a-form layout="vertical" class="upload-form">
          <a-form-item
            :label="t('monitorPage.Select Service', 'Select Service')"
          >
            <a-select
              v-model:value="selectedServiceType"
              style="width: 100%"
              :placeholder="
                t(
                  'monitorPage.Select service to restart',
                  'Select service to restart'
                )
              "
              :options="serviceOptions"
              allowClear
            >
            </a-select>
          </a-form-item>
          <a-form-item
            v-if="!singleIpMode"
            :label="t('monitorPage.Select Edgeman IPs', 'Select Edgeman IPs')"
          >
            <a-select
              v-model:value="selectedBatchIps"
              mode="multiple"
              style="width: 100%"
              :placeholder="t('monitorPage.Select edgeman', 'Select edgeman')"
              @change="handleOptionsChange"
              :tagRender="customTagRender"
              :getPopupContainer="(triggerNode:any) => triggerNode.parentElement"
              :options="batchEdgemanIps"
            >
            </a-select>
          </a-form-item>
          <a-form-item
            v-else
            :label="t('monitorPage.Edgeman IP', 'Edgeman IP')"
          >
            <a-input :value="selectedEmIps?.[0]" disabled style="width: 100%" />
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <a-button class="cancel-btn" @click="handleCancel">{{
        t("monitorPage.Cancel", "Cancel")
      }}</a-button>

      <a-button
        type="primary"
        @click="handleSubmit"
        class="upload-btn"
        :disabled="
          selectedBatchIps?.length === 0 || selectedServiceType === undefined
        "
      >
        <ReloadOutlined />
        {{ t("monitorPage.Restart", "Restart") }}
      </a-button>
    </template>
  </a-modal>
</template>
<script lang="ts">
import { defineComponent, ref, computed, h, PropType } from "vue";
import { ReloadOutlined } from "@ant-design/icons-vue";
import { Tag, message } from "ant-design-vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "RestartModel",
  components: {
    ReloadOutlined,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    selectedEmIps: {
      type: Array as PropType<string[]>,
    },
    restartType: {
      type: String,
      required: false,
    },
    singleIpMode: {
      type: Boolean,
      default: false,
    },
    emData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["close", "upload"],
  setup(props, { emit }) {
    const { t } = useI18n();
    interface CustomTagRenderProps {
      label: any;
      value: any;
      closable: boolean;
      onClose: (event: MouseEvent) => void;
    }
    const isModalVisible = ref(props.visible);
    const selectedServiceType = ref<string | undefined>(undefined);
    const serviceOptions = computed(() => [
      { label: t("monitorPage.EdgeManager"), value: "edgeman" },
      { label: t("monitorPage.Screen"), value: "screen" },
    ]);

    const selectedBatchIps: any = ref<string[]>([
      ...(props.selectedEmIps as string[]),
    ]);
    const batchEdgemanIps = computed(() => {
      const options = (props.selectedEmIps as string[])?.map((ip: string) => ({
        label: ip,
        value: ip,
      }));
      if (options.length === 0) return [];
      return [{ label: "Select All", value: "all" }, ...options];
    });
    console.log(batchEdgemanIps.value);
    const prevSelected = ref<string[]>([]);

    const handleOptionsChange = (newValues: string[]) => {
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

    function customTagRender({
      label,
      value,
      closable,
      onClose,
    }: CustomTagRenderProps) {
      if (value === "all") return null;
      return h(
        Tag,
        {
          closable,
          onClose,
          style: "margin-right: 3px;",
        },
        () => label
      );
    }
    const formattedSelectedIps = ref<string[]>([]);
    const formatIps = () => {
      if (typeof selectedBatchIps.value[0] === "object") {
        formattedSelectedIps.value = selectedBatchIps.value
          .filter(({ value }: { value: string }) => value !== "all")
          .map(({ value }: { value: string }) => value);

        console.log(
          "formattedSelectedIpsformattedSelectedIps",
          formattedSelectedIps.value
        );
      } else {
        formattedSelectedIps.value = selectedBatchIps.value;
      }
    };

    console.log(isModalVisible.value);
    const handleCancel = () => {
      formatIps();
      console.log("clicked on cancel");
      formattedSelectedIps.value = [];
      selectedBatchIps.value = [];
      selectedServiceType.value = undefined;
      emit("close");
    };

    const handleSubmit = () => {
      let ipsToSend;

      if (props.singleIpMode) {
        // For single IP mode, use the selected IP directly
        ipsToSend = props.selectedEmIps || [];
      } else {
        // For multiple IP mode, format the selected IPs
        formatIps();
        ipsToSend = selectedBatchIps.value;
      }

      const ipStrings = ipsToSend
        .filter((item: any) => typeof item === "string" || (item && item.value))
        .map((item: any) => (typeof item === "string" ? item : item.value))
        .filter((ip: string) => ip !== "all");
      // Check if no IPs selected
      if (ipStrings.length === 0) {
        message.error(
          t(
            "monitorPage.Please select at least one EdgeManager IP",
            "Please select at least one EdgeManager IP"
          )
        );
        return;
      }
      if (!selectedServiceType.value) {
        message.error(
          t(
            "monitorPage.Please select a service to restart",
            "Please select a service to restart"
          )
        );
        return;
      }
      // Check connection status for each selected IP
      const disconnectedIps = ipStrings.filter((ip: string) => {
        const emData = props.emData[ip];
        console.log(`Checking IP ${ip}:`, emData, emData?.is_connected);
        return !emData || emData.is_connected !== "connected";
      });

      const ipList = disconnectedIps.join(", ");
      if (disconnectedIps.length > 0) {
        if (disconnectedIps.length > 1) {
          message.error(
            t(
              "monitorPage.Cannot restart service: The following EdgeManagers are disconnected:",
              "Cannot restart service: The following EdgeManagers are disconnected:"
            ) + ` ${ipList}`
          );
        } else {
          message.error(
            t(
              "monitorPage.Cannot restart service: The following EdgeManager is disconnected:",
              "Cannot restart service: The following EdgeManager is disconnected:"
            ) + ` ${ipList}`
          );
        }
        return;
      }

      console.log("handle submit", ipsToSend);
      emit("upload", {
        ips: ipsToSend,
        serviceType: selectedServiceType.value,
      });

      formattedSelectedIps.value = [];
      selectedBatchIps.value = [];
      selectedServiceType.value = undefined;
      emit("close");
    };
    return {
      t,
      handleCancel,
      handleOptionsChange,
      handleSubmit,
      selectedBatchIps,
      batchEdgemanIps,
      customTagRender,
      selectedServiceType,
      serviceOptions,
    };
  },
});
</script>

<style scoped>
.upload-modal ::v-deep(.ant-modal-content) {
  border-radius: 8px;
  height: 300px;
}
</style>
