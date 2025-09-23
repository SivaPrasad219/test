<template>
  <div>
    <!-- Modal Component -->
    <a-modal
      v-model:open="isVisible"
      title="Advanced Options"
      @cancel="closeModal"
      :footer="null"
      width="70%"
      height="90vh"
      style="top: 20px"
      :maskClosable="false"
    >
      <div class="advanceTabModal">
        <!-- Tabs inside the modal -->
        <a-tabs v-model:activeKey="activeTab" default-active-key="1">
          <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.title">
            <div class="tab-content">
              <!-- Custom Options -->
              <div v-if="tab.key === '1'">
                <p><b>Custom Fields:</b></p>
                <a-form>
                  <a-form-item label="Field 1">
                    <a-input
                      v-model="customFields.field1"
                      placeholder="Enter Field 1"
                    />
                  </a-form-item>
                  <a-form-item label="Field 2">
                    <a-input
                      v-model="customFields.field2"
                      placeholder="Enter Field 2"
                    />
                  </a-form-item>
                </a-form>
              </div>

              <!-- Pre Config Options -->
              <div v-else-if="tab.key === '2'">
                <p><b>Pre-configured Data:</b></p>
                <pre>{{ data }}</pre>
              </div>

              <!-- Dynamic Content -->
              <div v-else>
                <p>{{ tab.content }}</p>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, onMounted } from "vue";
import { Modal, Tabs, Input, Form } from "ant-design-vue";

export default defineComponent({
  name: "AdvancedOptionsModal",
  components: {
    "a-modal": Modal,
    "a-tabs": Tabs,
    "a-tab-pane": Tabs.TabPane,
    "a-input": Input,
    "a-form": Form,
    "a-form-item": Form.Item,
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
    const { open, data } = toRefs(props);
    const isModalVisible = ref(false); // Modal visibility state
    const activeTab = ref("1"); // Active tab state

    // Tabs data array
    const tabs = ref([
      { key: "1", title: "Custom Options", content: "" },
      { key: "2", title: "Pre Config Option", content: "" },
    ]);

    // Custom Fields Reactive Object
    const customFields = ref({
      field1: "",
      field2: "",
    });

    // Function to close the modal
    const closeModal = () => {
      isModalVisible.value = false;
      emit("update:open", false);
    };

    onMounted(() => {
      console.log("::: data ::", data);
    });

    return {
      isVisible: open,
      closeModal,
      activeTab,
      tabs,
      customFields,
    };
  },
});
</script>

<style scoped>
/* Set fixed height for the tab panel and allow scrolling */
.tab-content {
  min-height: 50vh !important;
  height: 62vh !important;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background: #fff;
}
.advanceTabModal {
  height: 70vh !important;
}
</style>
