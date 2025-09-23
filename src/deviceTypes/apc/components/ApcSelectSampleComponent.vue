<template>
  <div>
    <div class="select-sample">
      <div class="select-sample-block">
        <h4 style="margin: 0">
          {{ translateLabel("devicePage", "Select a Sample Type") }}
        </h4>

        <a-select
          :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
          v-model:value="selectedSample"
          style="width: 200px; margin-left: 15px"
          @change="clearTable"
          :placeholder="translateLabel('devicePage', 'Select sample type')"
        >
          <a-select-option
            v-for="(sampleType, index) in availableSampleTypes"
            :key="sampleType.sample_type_key || index"
            :value="sampleType.sample_type_key"
          >
            {{ sampleType.sample_type_label }}
          </a-select-option>
        </a-select>
      </div>

      <!-- <div class="select-sample-block">
        <a-select
          :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
          v-model:value="selectedOption"
          style="width: 200px"
          :placeholder="
            translateLabel('devicePage', 'Select Preferable Option')
          "
          @change="handleOptionChange"
        >
          <a-select-option
            v-for="(option, index) in additionalOptions"
            :key="index"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div> -->
    </div>

    <template v-if="renderInputTasks !== null">
      <div class="add-inputs">
        <div class="select-action-title">
          <h4>{{ translateLabel("devicePage", "Measurement Parameters") }}</h4>
        </div>
        <div class="select-form-field">
          <a-row :gutter="[20, 20]" v-if="renderInputTasks">
            <template v-for="(property, key) in renderInputTasks" :key="key">
              <!-- Volume Field -->
              <template
                v-if="
                  String(key) === 'volume' &&
                  formData.volume &&
                  currentTaskDefinition?.input?.required.includes(key)
                "
              >
                <a-col :span="8">
                  <a-form-item
                    :label="translateLabel('devicePage', 'Volume')"
                    :validateStatus="formErrors.volume ? 'error' : ''"
                    :help="formErrors.volume || ''"
                    style="margin-right: 20px"
                  >
                    <a-input
                      v-model:value="formData.volume.value"
                      @input="
                        handleInput(formData.volume.value, 'volume', false)
                      "
                      @blur="
                        () =>
                          validateOnBlur('volume', formData.volume.value, false)
                      "
                      @keydown="preventInvalidInput"
                      :placeholder="
                        translateLabel('devicePage', 'Enter Volume')
                      "
                      type="number"
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item
                    :label="translateLabel('devicePage', 'Volume Unit')"
                    :validateStatus="formErrors.volumeUnit ? 'error' : ''"
                    :help="formErrors.volumeUnit || ''"
                    style="width: 100%; margin-right: 20px"
                  >
                    <a-select
                      v-model:value="formData.volume.unit"
                      @change="handleUnitChange(false)"
                      :placeholder="translateLabel('devicePage', 'Select Unit')"
                      :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                      style="width: 95%"
                    >
                      <a-select-option
                        v-for="(unit, index) in volumeUnits"
                        :key="index"
                        :value="unit.unit"
                      >
                        {{ unit.x_nice_name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </template>

              <!-- Generic Field -->
              <template
                v-else-if="
                  key !== 'flow_limits' &&
                  currentTaskDefinition?.input?.required.includes(key) &&
                  !property.enum
                "
              >
                <a-col :span="8">
                  <a-form-item
                    :label="
                      translateLabel('devicePage', property.x_nice_name || key)
                    "
                    :validateStatus="formErrors[key] ? 'error' : ''"
                    :help="formErrors[key] || ''"
                    style="margin-right: 20px; min-height: 80px"
                  >
                    <a-input
                      v-model:value="formData[key]"
                      @input="handleInput(formData[key], key, false)"
                      @blur="() => validateOnBlur(key, formData[key], false)"
                      :placeholder="
                        translateLabel(
                          'devicePage',
                          `Enter ${property.x_nice_name || key}`
                        )
                      "
                      style="width: 100%"
                    />
                  </a-form-item>
                </a-col>
              </template>
              <!-- Integer Enum Select Field (support for integer enums) -->
              <template
                v-else-if="
                  (property.type === 'string' || property.type === 'integer') &&
                  Array.isArray(property.enum) &&
                  key !== 'count_limits' &&
                  key !== 'flow_limits' &&
                  currentTaskDefinition?.input?.required.includes(key)
                "
              >
                <a-col :span="8">
                  <a-form-item
                    :label="
                      translateLabel('devicePage', property.x_nice_name || key)
                    "
                    :validateStatus="formErrors[key] ? 'error' : ''"
                    :help="formErrors[key] || ''"
                    style="margin-right: 20px; min-height: 80px"
                  >
                    <a-select
                      v-model:value="formData[key]"
                      @change="handleInput(formData[key], key, false)"
                      :placeholder="
                        translateLabel(
                          'devicePage',
                          `Select ${property.x_nice_name || key}`
                        )
                      "
                      :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                      style="width: 100%"
                    >
                      <a-select-option
                        v-for="option in property.enum"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </template>
            </template>
          </a-row>

          <div
            v-if="
              renderSampleInterval !== null &&
              selectedSample === 'Sample-Interval'
            "
          >
            <!-- Sample-Interval Form -->
            <a-row
              :gutter="[20, 20]"
              v-for="(property, key) in renderSampleInterval.properties"
              :key="key"
            >
              <a-col
                :span="8"
                v-if="property.type === 'object' && property.properties"
              >
                <a-form-item
                  :validateStatus="formErrors[key + 'Value'] ? 'error' : ''"
                  :help="formErrors[key + 'Value'] || ''"
                  style="margin-right: 20px"
                >
                  <!-- Custom label slot to include the label and info icon -->
                  <template #label>
                    <span>
                      {{
                        translateLabel(
                          "devicePage",
                          property.properties.value.x_nice_name ||
                            key + " Value"
                        )
                      }}
                      <a-popover
                        v-if="
                          ['Duration', 'Interval', 'Initial Delay'].includes(
                            property.properties.value.x_nice_name
                          )
                        "
                        trigger="hover"
                        placement="right"
                        :overlayStyle="{ maxWidth: '350px' }"
                      >
                        <template #content>
                          <div>
                            <div style="font-weight: bold; margin-bottom: 5px">
                              {{
                                translateLabel(
                                  "devicePage",
                                  property.properties.value.x_nice_name
                                )
                              }}
                            </div>
                            <div>
                              {{
                                translateLabel(
                                  "devicePage",
                                  popoverMessages[
                                    property.properties.value.x_nice_name
                                  ]
                                )
                              }}
                            </div>
                          </div>
                        </template>
                        <InfoCircleOutlined
                          style="margin-left: 8px; cursor: pointer"
                        />
                      </a-popover>
                    </span>
                  </template>
                  <a-input
                    v-model:value="formData.sample_interval_info[key].value"
                    @input="
                      handleInput(
                        formData.sample_interval_info[key].value,
                        key + 'Value',
                        false
                      )
                    "
                    @blur="
                      () =>
                        validateOnBlur(
                          key + 'Value',
                          formData.sample_interval_info[key].value,
                          false
                        )
                    "
                    @keydown="preventInvalidInput"
                    :placeholder="
                      translateLabel(
                        'devicePage',
                        `Enter ${property.properties.value.x_nice_name || key}`
                      )
                    "
                    type="number"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col
                :span="8"
                v-if="property.type === 'object' && property.properties"
              >
                <a-form-item
                  :validateStatus="formErrors[key + 'Unit'] ? 'error' : ''"
                  :help="formErrors[key + 'Unit'] || ''"
                  style="width: 100%; margin-right: 20px"
                >
                  <!-- Custom label slot to include the label and info icon -->
                  <template #label>
                    <span>
                      {{
                        translateLabel(
                          "devicePage",
                          property.properties.unit.x_nice_name || key + " Unit"
                        )
                      }}
                      <a-popover
                        v-if="
                          ['Duration', 'Interval', 'Initial Delay'].includes(
                            property.properties.unit.x_nice_name
                          )
                        "
                        trigger="hover"
                        placement="right"
                        :overlayStyle="{ maxWidth: '350px' }"
                      >
                        <template #content>
                          <div>
                            <div style="font-weight: bold; margin-bottom: 5px">
                              {{ property.properties.unit.x_nice_name }}
                            </div>
                            <div>
                              {{
                                translateLabel(
                                  "devicePage",
                                  popoverMessages[
                                    property.properties.unit.x_nice_name
                                  ]
                                )
                              }}
                            </div>
                          </div>
                        </template>
                        <InfoCircleOutlined
                          style="margin-left: 8px; cursor: pointer"
                        />
                      </a-popover>
                    </span>
                  </template>
                  <a-select
                    v-model:value="formData.sample_interval_info[key].unit"
                    @change="handleUnitChange(false)"
                    :placeholder="translateLabel('devicePage', 'Select Unit')"
                    :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                    style="width: 95%"
                  >
                    <a-select-option
                      v-for="unit in property.properties.unit.enum"
                      :key="unit"
                      :value="unit"
                    >
                      {{ unit }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8" v-else-if="property.type === 'integer'">
                <a-form-item
                  :validateStatus="formErrors[key] ? 'error' : ''"
                  :help="formErrors[key] || ''"
                  style="margin-right: 20px"
                >
                  <!-- Custom label slot to include the label and info icon -->
                  <template #label>
                    <span>
                      {{
                        translateLabel(
                          "devicePage",
                          property.x_nice_name || key
                        )
                      }}
                      <a-popover
                        v-if="
                          ['Duration', 'Interval', 'Initial Delay'].includes(
                            property.x_nice_name
                          )
                        "
                        trigger="hover"
                        placement="right"
                        :overlayStyle="{ maxWidth: '350px' }"
                      >
                        <template #content>
                          <div>
                            <div style="font-weight: bold; margin-bottom: 5px">
                              {{ property.x_nice_name }}
                            </div>
                            <div>
                              {{
                                translateLabel(
                                  "devicePage",
                                  popoverMessages[property.x_nice_name]
                                )
                              }}
                            </div>
                          </div>
                        </template>
                        <InfoCircleOutlined
                          style="margin-left: 8px; cursor: pointer"
                        />
                      </a-popover>
                    </span>
                  </template>
                  <a-input
                    v-model:value="formData.sample_interval_info[key]"
                    @input="
                      handleInput(
                        formData.sample_interval_info[key],
                        key,
                        false
                      )
                    "
                    @blur="
                      () =>
                        validateOnBlur(
                          key,
                          formData.sample_interval_info[key],
                          false
                        )
                    "
                    @keydown="preventInvalidInput"
                    :placeholder="
                      translateLabel(
                        'devicePage',
                        `Enter ${property.x_nice_name || key}`
                      )
                    "
                    type="number"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>

          <!-- Other Controls -->
          <a-row
            justify="space-between"
            align="middle"
            style="margin-top: 20px"
          >
            <a-col>
              <a-button
                v-if="showAdvanceOption"
                type="link"
                @click="openAdvanceOptionModal()"
                style="padding: 0"
                :disabled="isAddLinkDisabled"
                class="custom-link-selectsample-advanced-options"
              >
                {{ translateLabel("dataPage", "Advanced Options") }}
              </a-button>
            </a-col>
            <a-col>
              <a-button
                type="primary"
                v-if="isContinuousRun"
                :disabled="isAddButtonDisabled"
                @click="addSample"
              >
                {{ translateLabel("devicePage", "Add") }}
              </a-button>
            </a-col>
          </a-row>

          <a-table
            v-if="isContinuousRun"
            :columns="tableColumns"
            :data-source="sampleTableData"
            size="middle"
            class="custom-table"
          >
            <template #bodyCell="{ column, record }">
              <template
                v-if="
                  column?.dataIndex === 'actions' ||
                  column?.dataIndex === 'Actions'
                "
              >
                <EditOutlined
                  @click="handleEditClick(record)"
                  style="margin-right: 8px; color: #1890ff; cursor: pointer"
                />
                <a-popconfirm
                  :title="translateLabel('devicePage', `${deleteText}`)"
                  :ok-text="translateLabel('devicePage', 'Yes')"
                  :cancel-text="translateLabel('devicePage', 'No')"
                  @confirm="confirmDelete(record)"
                >
                  <DeleteOutlined style="color: red; cursor: pointer" />
                </a-popconfirm>
              </template>
              <template v-else-if="column?.dataIndex === 'volume'">
                {{ record.volume.value }}
              </template>
              <template v-else-if="column?.dataIndex === 'volumeUnit'">
                {{ record.volumeUnit }}
              </template>
            </template>
            <template #emptyText>
              <span>{{ translateLabel("devicePage", `${noDataText}`) }}</span>
            </template>
          </a-table>
          <div class="sample-buttons">
            <!-- Button to Start Sample -->
            <div class="sample-btn">
              <a-popover
                v-model:open="isSaveSettingsPopoverVisible"
                :title="popoverTitle"
                placement="topRight"
                trigger="click"
                :getPopupContainer="
                    (triggerNode : any) => triggerNode.parentElement
                  "
              >
                <template #content>
                  <a-form
                    ref="saveSettingsFormRef"
                    :model="saveSettingsFormData"
                    :layout="'vertical'"
                    :rules="saveSettingsFormRules"
                  >
                    <a-form-item
                      :label="translateLabel('devicePage', formLabel)"
                      name="name"
                    >
                      <a-input
                        v-model:value="saveSettingsFormData.name"
                        :placeholder="translateLabel('devicePage', formLabel)"
                      />
                    </a-form-item>
                  </a-form>
                  <div class="popover-footer">
                    <a-button @click="handleSaveSettingsCancel">{{
                      translateLabel("devicePage", "Cancel")
                    }}</a-button>
                    <a-button
                      type="primary"
                      @click="handleSaveSettingsConfirm"
                      :disabled="!saveSettingsFormData.name"
                    >
                      {{ translateLabel("devicePage", "Ok") }}
                    </a-button>
                  </div>
                </template>
                <!-- <a-button
                  @click="openSaveSettingsPopover"
                  :disabled="isSampleSettingsButtonDisabled"
                >
                  {{ sampleSettingsButtonLabel }}
                </a-button> -->
              </a-popover>
            </div>

            <div class="sample-btn">
              <a-button
                type="primary"
                @click="startSample"
                :loading="isStartLoading"
                :disabled="
                  isStartbtnDisable ||
                  selectedAssetData.connection_status === 'disconnected'
                "
              >
                {{ translateLabel("devicePage", startbuttonLabel) }}
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="empty-wrapper">
        <a-empty description="No Sample Types are available." />
      </div>
    </template>
  </div>

  <!-- Edit Modal -->
  <a-modal
    v-model:open="isEditModalVisible"
    :title="translateLabel('devicePage', `${EditTitle}`)"
    class="modalEdit"
    :width="600"
  >
    <a-form
      :layout="'vertical'"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      class="formConfirm"
    >
      <!-- Loop through input properties -->
      <template v-for="(property, key) in renderInputTasks" :key="key">
        <!-- Volume Field -->
        <template v-if="key === 'volume' && property.oneOf">
          <a-row>
            <!-- Form Item for 'volume.value' -->
            <a-col :span="24">
              <a-form-item
                :label="
                  property.x_nice_name || translateLabel('devicePage', 'Volume')
                "
                :validateStatus="editFormErrors['volume'] ? 'error' : ''"
                :help="editFormErrors['volume'] || ''"
                style="width: 100%; min-height: 60px"
              >
                <a-input
                  v-model:value="recordToEdit.volume.value"
                  @input="
                    handleInput(recordToEdit.volume.value, 'volume', true)
                  "
                  @blur="
                    () =>
                      validateOnBlur(
                        'volume',
                        recordToEdit?.volume?.value,
                        true
                      )
                  "
                  @keydown="preventInvalidInput"
                  type="number"
                  :min="property.oneOf[0]?.properties?.value?.minimum"
                  :max="property.oneOf[0]?.properties?.value?.maximum"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>

            <!-- Form Item for 'volume.unit' -->
            <a-col :span="24">
              <a-form-item
                :label="property.x_nice_name || 'Volume Unit'"
                style="width: 100%"
              >
                <a-select
                  v-model:value="recordToEdit.volume.unit"
                  @change="handleUnitChange(true)"
                  @blur="
                    () =>
                      validateOnBlur(
                        'volumeUnit',
                        recordToEdit.volume.unit,
                        true
                      )
                  "
                  :placeholder="translateLabel('devicePage', 'Select Unit')"
                  style="width: 100%"
                >
                  <a-select-option
                    v-for="(unit, index) in volumeUnits"
                    :key="index"
                    :value="unit.unit"
                  >
                    {{ unit.x_nice_name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </template>

        <!-- Generic Field -->
        <template
          v-else-if="
            key !== 'count_limits' &&
            key !== 'flow_limits' &&
            apcAssetTasks?.input?.required.includes(key) &&
            !property.enum
          "
        >
          <a-col :span="24">
            <a-form-item
              :label="translateLabel('devicePage', property.x_nice_name || key)"
              :validateStatus="editFormErrors[key] ? 'error' : ''"
              :help="editFormErrors[key] || ''"
              style="width: 100%; margin-right: 20px; min-height: 80px"
            >
              <a-input
                v-model:value="recordToEdit[key]"
                @input="handleInput(recordToEdit[key], key, true)"
                @blur="() => validateOnBlur(key, recordToEdit[key], true)"
                :placeholder="
                  translateLabel(
                    'devicePage',
                    `Enter ${property.x_nice_name || key}`
                  )
                "
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </template>

        <!-- Integer Enum Select Field (support for integer enums) -->
        <template
          v-else-if="
            key !== 'count_limits' &&
            key !== 'flow_limits' &&
            (property.type === 'string' || property.type === 'integer') &&
            Array.isArray(property.enum) &&
            apcAssetTasks?.input?.required.includes(key)
          "
        >
          <a-col :span="24">
            <a-form-item
              :label="translateLabel('devicePage', property.x_nice_name || key)"
              :validateStatus="formErrors[key] ? 'error' : ''"
              :help="formErrors[key] || ''"
              style="width: 100%; margin-right: 20px; min-height: 80px"
            >
              <a-select
                v-model:value="formData[key]"
                @change="handleInput(formData[key], key, false)"
                :placeholder="
                  translateLabel(
                    'devicePage',
                    `Select ${property.x_nice_name || key}`
                  )
                "
                :getPopupContainer="(triggerNode) => triggerNode.parentElement"
                style="width: 100%"
              >
                <a-select-option
                  v-for="option in property.enum"
                  :key="option"
                  :value="option"
                >
                  {{ option }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </template>
      </template>

      <!-- Button for Advanced Options -->
      <a-button
        v-if="showAdvanceOption"
        type="link"
        @click="openEditAdvanceOptionModal"
        style="padding: 0"
        class="custom-link-selectsample-advanced-options"
      >
        {{ translateLabel("dataPage", "Advanced Options") }}
      </a-button>
    </a-form>

    <template #footer>
      <a-button @click="handleEditCancel">
        {{ translateLabel("devicePage", "Cancel") }}
      </a-button>
      <a-button
        type="primary"
        @click="SaveEditChanges"
        :disabled="isEditOkButtonDisabled"
      >
        {{ translateLabel("devicePage", "Ok") }}
      </a-button>
    </template>
  </a-modal>

  <!-- E-Signature Modal -->
  <a-modal
    v-model:open="esignModalVisible"
    @ok="handleSampleStart"
    :title="
      translateLabel('devicePage', `E-Signature needed for ${selectedSample}`)
    "
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="esignformData"
      :layout="formLayout"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      @submit.prevent="handleSampleStart"
      @keydown.enter.prevent="handleSampleStart"
      class="formConfirm"
    >
      <a-form-item
        :label="translateLabel('devicePage', 'Username')"
        name="username"
        :rules="[
          {
            required: true,
            message: translateLabel(
              'devicePage',
              'Please input your username!'
            ),
          },
        ]"
      >
        <a-input
          v-model:value="esignformData.username"
          :placeholder="translateLabel('devicePage', 'Enter your username')"
        >
          <template #prefix>
            <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        :label="translateLabel('devicePage', 'Password')"
        name="password"
        :rules="[
          {
            required: true,
            message: translateLabel(
              'devicePage',
              'Please input your password!'
            ),
          },
        ]"
      >
        <a-input
          :type="passwordVisible ? 'text' : 'password'"
          v-model:value="esignformData.password"
          :placeholder="translateLabel('devicePage', 'Enter your password')"
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
    <template #footer>
      <a-button @click="handleCancel">{{
        translateLabel("devicePage", "Cancel")
      }}</a-button>
      <a-button
        type="primary"
        @click="handleSampleStart"
        :disabled="
          !isFormValid || selectedAssetData.connection_status === 'disconnected'
        "
        :loading="isVerifyingSignature"
      >
        {{ translateLabel("devicePage", "Verify Signature & Start") }}
      </a-button>
    </template>
  </a-modal>

  <!-- Advance Device Modal -->
  <a-modal
    v-model:open="isAdvanceModalVisible"
    width="75%"
    height="90vh"
    style="top: 20px"
    :maskClosable="false"
    class="advanced-modal"
  >
    <template #title>
      <div style="margin-bottom: 0">
        <div class="recordTitle">
          <div>{{ translateLabel("dataPage", "Advanced Options") }}</div>
        </div>
      </div>
    </template>
    <hr />
    <div class="advanceTabModal">
      <!-- Tabs inside the modal -->
      <!-- <a-tabs v-model:activeKey="activeTab" default-active-key="1">
        <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.title"> -->
      <!-- tab-content -->
      <div class="advanced-options-content">
        <!-- Custom Options -->
        <!-- <div v-if="tab.key === '1'"> -->
        <template v-if="renderInputTasks !== null">
          <div class="add-inputs">
            <div class="select-form-field">
              <a-row :gutter="20" align="middle" v-if="renderInputTasks">
                <template
                  v-for="(property, key) in renderInputTasks"
                  :key="key"
                >
                  <!-- Generic Field -->
                  <template
                    v-if="
                      key !== 'count_limits' &&
                      key !== 'volume' &&
                      key !== 'flow_limits' &&
                      !property.enum &&
                      !currentTaskDefinition?.input?.required.includes(key)
                    "
                  >
                    <a-col :span="8">
                      <a-form-item
                        :label="
                          translateLabel(
                            'devicePage',
                            property.x_nice_name || key
                          )
                        "
                        :validateStatus="formErrors[key] ? 'error' : ''"
                        :help="formErrors[key] || ''"
                        style="margin-right: 20px; min-height: 80px"
                      >
                        <a-input
                          v-model:value="formData[key]"
                          @input="handleInput(formData[key], key, false)"
                          @blur="
                            () => validateOnBlur(key, formData[key], false)
                          "
                          :placeholder="
                            translateLabel(
                              'devicePage',
                              `Enter ${property.x_nice_name || key}`
                            )
                          "
                          style="width: 100%"
                        />
                      </a-form-item>
                    </a-col>
                  </template>
                  <!-- Integer Enum Select Field (support for integer enums) -->
                  <template
                    v-else-if="
                      key !== 'count_limits' &&
                      key !== 'volume' &&
                      key !== 'flow_limits' &&
                      (property.type === 'string' ||
                        property.type === 'integer') &&
                      Array.isArray(property.enum) &&
                      !currentTaskDefinition?.input?.required.includes(key)
                    "
                  >
                    <a-col :span="8">
                      <a-form-item
                        :label="
                          translateLabel(
                            'devicePage',
                            property.x_nice_name || key
                          )
                        "
                        :validateStatus="formErrors[key] ? 'error' : ''"
                        :help="formErrors[key] || ''"
                        style="margin-right: 20px; min-height: 80px"
                      >
                        <a-select
                          v-model:value="formData[key]"
                          @change="handleInput(formData[key], key, false)"
                          :placeholder="
                            translateLabel(
                              'devicePage',
                              `Select ${property.x_nice_name || key}`
                            )
                          "
                          :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                          style="width: 100%"
                        >
                          <a-select-option
                            v-for="option in property.enum"
                            :key="option"
                            :value="option"
                          >
                            {{ option }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                  </template>

                  <!-- Count Object Rendering -->
                  <template
                    v-if="key === 'count_limits' && property.type === 'object'"
                  >
                    <a-col :span="24">
                      <label style="line-height: 32px">
                        {{
                          translateLabel(
                            "devicePage",
                            property.x_nice_name || key
                          )
                        }}
                      </label>
                      <template
                        v-for="(
                          nestedProperty, nestedKey
                        ) in property.properties"
                        :key="nestedKey"
                      >
                        <a-row :gutter="[16, 24]">
                          <a-col :span="6">
                            <label style="line-height: 32px">
                              {{
                                translateLabel(
                                  "devicePage",
                                  nestedProperty.x_nice_name || nestedKey
                                )
                              }}
                            </label>
                          </a-col>

                          <template
                            v-for="(
                              field, fieldKey
                            ) in nestedProperty.properties"
                            :key="fieldKey"
                          >
                            <a-col :span="6">
                              <a-form-item
                                :label="
                                  translateLabel(
                                    'devicePage',
                                    field.x_nice_name || fieldKey
                                  )
                                "
                                :validateStatus="
                                  formErrors?.[
                                    `${key},${nestedKey},${fieldKey}`
                                  ]
                                    ? 'error'
                                    : ''
                                "
                                :help="
                                  formErrors?.[
                                    `${key},${nestedKey},${fieldKey}`
                                  ] || ''
                                "
                              >
                                <a-input
                                  v-model:value="
                                    formData.count_limits[nestedKey][fieldKey]
                                  "
                                  @input="
                                    handleInput(
                                      formData.count_limits[nestedKey][
                                        fieldKey
                                      ],
                                      `${key},${nestedKey},${fieldKey}`,
                                      false
                                    )
                                  "
                                  @blur="
                                    () =>
                                      validateOnBlur(
                                        `${key},${nestedKey},${fieldKey}`,
                                        formData.count_limits[nestedKey][
                                          fieldKey
                                        ],
                                        false
                                      )
                                  "
                                  :placeholder="
                                    translateLabel(
                                      'devicePage',
                                      `Enter ${field.x_nice_name || fieldKey}`
                                    )
                                  "
                                  style="width: 100%"
                                />
                              </a-form-item>
                            </a-col>
                          </template>
                        </a-row>
                      </template>
                    </a-col>
                  </template>

                  <!-- Flow Limits Rendering -->
                  <template
                    v-if="key === 'flow_limits' && property.type === 'object'"
                  >
                    <a-col :span="24">
                      <label style="line-height: 32px">
                        {{
                          translateLabel(
                            "devicePage",
                            property.x_nice_name || key
                          )
                        }}
                      </label>
                      <a-row :gutter="[16, 24]">
                        <template
                          v-for="(field, fieldKey) in property.properties"
                          :key="fieldKey"
                        >
                          <a-col :span="8">
                            <a-form-item
                              :label="
                                translateLabel(
                                  'devicePage',
                                  field.x_nice_name || fieldKey
                                )
                              "
                              :validateStatus="
                                formErrors?.[`${key},${fieldKey}`]
                                  ? 'error'
                                  : ''
                              "
                              :help="formErrors?.[`${key},${fieldKey}`] || ''"
                              style="margin-right: 20px; min-height: 80px"
                            >
                              <a-input
                                v-model:value="formData.flow_limits[fieldKey]"
                                @input="
                                  handleInput(
                                    formData.flow_limits[fieldKey],
                                    `${key},${fieldKey}`,
                                    false
                                  )
                                "
                                @blur="
                                  () =>
                                    validateOnBlur(
                                      `${key},${fieldKey}`,
                                      formData.flow_limits[fieldKey],
                                      false
                                    )
                                "
                                :placeholder="
                                  translateLabel(
                                    'devicePage',
                                    `Enter ${field.x_nice_name || fieldKey}`
                                  )
                                "
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                        </template>
                      </a-row>
                    </a-col>
                  </template>
                </template>
              </a-row>
            </div>
          </div>
        </template>
        <!-- </div> -->

        <!-- Pre Config Options -->
        <!-- <div v-if="tab.key === '2'">
            <template v-if="renderInputTasks !== null">
              <div class="add-inputs">
                <div class="select-form-field">
                  <a-row gutter="{20}" align="middle" v-if="renderInputTasks">
                  </a-row>
                </div>
              </div>
            </template>
          </div> -->
      </div>
      <!-- </a-tab-pane>
      </a-tabs> -->
    </div>

    <!-- Footer with Cancel and Save buttons -->
    <template #footer>
      <a-button @click="closeModalAdvanceOptions">{{
        translateLabel("devicePage", "Cancel")
      }}</a-button>
      <a-button
        type="primary"
        @click="saveAdvanceChanges"
        :disabled="isAdvancedFormOkBtnDisabled"
        >{{ translateLabel("devicePage", "Ok") }}</a-button
      >
    </template>
  </a-modal>

  <!-- Advance Device  edit Modal -->
  <a-modal
    v-model:open="isAdvanceEditModalVisible"
    width="75%"
    height="90vh"
    style="top: 20px"
    :maskClosable="false"
    class="edit-advanced-modal"
  >
    <template #title>
      <div style="margin-bottom: 0">
        <div class="recordTitle">
          <div>Edit Advanced Options</div>
        </div>
      </div>
    </template>
    <hr />
    <div class="editAdvanceTabModal">
      <!-- Tabs inside the modal -->
      <!-- <a-tabs v-model:activeKey="activeTab" default-active-key="1">
        <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.title"> -->
      <!-- tab-content -->
      <div class="edit-advanced-options-content">
        <!-- Custom Options -->
        <!-- <div v-if="tab.key === '1'"> -->
        <template v-if="renderInputTasks !== null">
          <div class="add-inputs">
            <div class="select-form-field">
              <a-row
                :gutter="isAdvanceEditModalVisible ? 20 : 10"
                align="middle"
                v-if="renderInputTasks"
              >
                <template
                  v-for="(property, key) in renderInputTasks"
                  :key="key"
                >
                  <!-- Generic Field -->
                  <template
                    v-if="
                      key !== 'count_limits' &&
                      key !== 'volume' &&
                      key !== 'flow_limits' &&
                      !property.enum &&
                      !currentTaskDefinition?.input?.required.includes(key)
                    "
                  >
                    <a-col :span="8">
                      <a-form-item
                        :label="
                          translateLabel(
                            'devicePage',
                            property.x_nice_name || key
                          )
                        "
                        :validateStatus="editFormErrors[key] ? 'error' : ''"
                        :help="editFormErrors[key] || ''"
                        style="margin-right: 20px; min-height: 80px"
                      >
                        <a-input
                          v-model:value="recordToEdit[key]"
                          @input="handleInput(recordToEdit[key], key, true)"
                          @blur="
                            () => validateOnBlur(key, recordToEdit[key], true)
                          "
                          :placeholder="
                            translateLabel(
                              'devicePage',
                              `Enter ${property.x_nice_name || key}`
                            )
                          "
                          style="width: 100%"
                        />
                      </a-form-item>
                    </a-col>
                  </template>

                  <!-- Integer Enum Select Field (support for integer enums) -->
                  <template
                    v-else-if="
                      key !== 'count_limits' &&
                      key !== 'volume' &&
                      key !== 'flow_limits' &&
                      (property.type === 'string' ||
                        property.type === 'integer') &&
                      Array.isArray(property.enum) &&
                      !currentTaskDefinition?.input?.required.includes(key)
                    "
                  >
                    <a-col :span="8">
                      <a-form-item
                        :label="
                          translateLabel(
                            'devicePage',
                            property.x_nice_name || key
                          )
                        "
                        :validateStatus="formErrors[key] ? 'error' : ''"
                        :help="formErrors[key] || ''"
                        style="margin-right: 20px; min-height: 80px"
                      >
                        <a-select
                          v-model:value="formData[key]"
                          @change="handleInput(formData[key], key, false)"
                          :placeholder="
                            translateLabel(
                              'devicePage',
                              `Select ${property.x_nice_name || key}`
                            )
                          "
                          :getPopupContainer="(triggerNode: any) => triggerNode.parentElement"
                          style="width: 100%"
                        >
                          <a-select-option
                            v-for="option in property.enum"
                            :key="option"
                            :value="option"
                          >
                            {{ option }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                  </template>

                  <!-- Count Limits Rendering -->
                  <template
                    v-if="key === 'count_limits' && property.type === 'object'"
                  >
                    <a-col :span="24">
                      <label style="line-height: 32px">
                        {{
                          translateLabel(
                            "devicePage",
                            property.x_nice_name || key
                          )
                        }}
                      </label>
                      <template
                        v-for="(
                          nestedProperty, nestedKey
                        ) in property.properties"
                        :key="nestedKey"
                      >
                        <a-row
                          :gutter="
                            isAdvanceEditModalVisible ? [16, 24] : [8, 16]
                          "
                        >
                          <a-col :span="6">
                            <label style="line-height: 32px">
                              {{
                                translateLabel(
                                  "devicePage",
                                  nestedProperty.x_nice_name || nestedKey
                                )
                              }}
                            </label>
                          </a-col>

                          <template
                            v-for="(
                              field, fieldKey
                            ) in nestedProperty.properties"
                            :key="fieldKey"
                          >
                            <a-col :span="6">
                              <a-form-item
                                :label="
                                  translateLabel(
                                    'devicePage',
                                    field.x_nice_name || fieldKey
                                  )
                                "
                                :validateStatus="
                                  editFormErrors?.[key]?.[nestedKey]?.[fieldKey]
                                    ? 'error'
                                    : ''
                                "
                                :help="
                                  editFormErrors?.[key]?.[nestedKey]?.[
                                    fieldKey
                                  ] || ''
                                "
                              >
                                <a-input
                                  v-model:value="
                                    recordToEdit.count_limits[nestedKey][
                                      fieldKey
                                    ]
                                  "
                                  @input="
                                    handleInput(
                                      recordToEdit.count_limits[nestedKey][
                                        fieldKey
                                      ],
                                      `${key},${nestedKey},${fieldKey}`,
                                      true
                                    )
                                  "
                                  @blur="
                                    () =>
                                      validateOnBlur(
                                        `${key},${nestedKey},${fieldKey}`,
                                        recordToEdit.count_limits[nestedKey][
                                          fieldKey
                                        ],
                                        true
                                      )
                                  "
                                  :placeholder="
                                    translateLabel(
                                      'devicePage',
                                      `Enter ${field.x_nice_name || fieldKey}`
                                    )
                                  "
                                  style="width: 100%"
                                />
                              </a-form-item>
                            </a-col>
                          </template>
                        </a-row>
                      </template>
                    </a-col>
                  </template>

                  <!-- Flow Limits Rendering -->
                  <template
                    v-if="key === 'flow_limits' && property.type === 'object'"
                  >
                    <a-col :span="24">
                      <label style="line-height: 32px">
                        {{
                          translateLabel(
                            "devicePage",
                            property.x_nice_name || key
                          )
                        }}
                      </label>
                      <a-row
                        :gutter="isAdvanceEditModalVisible ? [16, 24] : [8, 16]"
                      >
                        <template
                          v-for="(field, fieldKey) in property.properties"
                          :key="fieldKey"
                        >
                          <a-col :span="8">
                            <a-form-item
                              :label="
                                translateLabel(
                                  'devicePage',
                                  field.x_nice_name || fieldKey
                                )
                              "
                              :validateStatus="
                                editFormErrors?.[key]?.[fieldKey] ? 'error' : ''
                              "
                              :help="editFormErrors?.[key]?.[fieldKey] || ''"
                              style="margin-right: 20px; min-height: 80px"
                            >
                              <a-input
                                v-model:value="
                                  recordToEdit.flow_limits[fieldKey]
                                "
                                @input="
                                  handleInput(
                                    recordToEdit.flow_limits[fieldKey],
                                    `${key},${fieldKey}`,
                                    false
                                  )
                                "
                                @blur="
                                  () =>
                                    validateOnBlur(
                                      `${key},${fieldKey}`,
                                      recordToEdit.flow_limits[fieldKey],
                                      false
                                    )
                                "
                                :placeholder="
                                  translateLabel(
                                    'devicePage',
                                    `Enter ${field.x_nice_name || fieldKey}`
                                  )
                                "
                                style="width: 100%"
                              />
                            </a-form-item>
                          </a-col>
                        </template>
                      </a-row>
                    </a-col>
                  </template>
                </template>
              </a-row>
            </div>
          </div>
        </template>
        <!-- </div> -->
      </div>
      <!-- </a-tab-pane>
      </a-tabs> -->
    </div>

    <!-- Footer inside the modal -->
    <template #footer>
      <a-button key="cancel" @click="closeModalEditAdvanceOptions"
        >Cancel</a-button
      >
      <a-button
        key="submit"
        type="primary"
        @click="saveEditAdvanceChanges"
        :disabled="isEditAdvancedFormOkBtnDisabled"
        >Ok</a-button
      >
    </template>
  </a-modal>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  PropType,
  watch,
  nextTick,
} from "vue";
import { message } from "ant-design-vue";
// import { nextTick } from "vue";

// import ApcAdvanceOptionModalComponent from "./ApcAdvanceOptionModalComponent.vue";
import {
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import { useStore } from "vuex";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { useI18n } from "vue-i18n";
import { apcApiServices } from "../services/apcService";
import { esignConfirmLogin } from "@/services/apiService";
import { translateLabel } from "@/common/utils";
import _ from "lodash";
import type { FormInstance } from "ant-design-vue";
// import apcSetInterval from "../config/apcSetInterval.json";
// import apcPrefableSettigs from "../mockData/apcPrefableSettings.json";
import { generateSampleSettingsPayload } from "../../../common/generatePayload";
// import taskDefMock from "../mockData/mockSampleData.json";

// Add formats support
interface Column {
  title: string;
  dataIndex: string;
  width?: string;
  key?: string;
  customCell?: () => { style: any };
  customHeaderCell?: () => { style: any };
}

interface Property {
  type?: string;
  properties?: Record<string, Property>;
  default?: any;
}
export default defineComponent({
  components: {
    DeleteOutlined,
    EditOutlined,
    LockOutlined,
    UserOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    EyeInvisibleOutlined,
  },
  props: {
    selectedAssetData: {
      type: Object as PropType<any>,
      required: true,
    },
  },

  setup(props, { emit }) {
    const { t } = useI18n();
    const apcService = new apcApiServices();
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      multipleOfPrecision: 10,
    });
    const formLayout = "horizontal";
    const editFormLayout = "horizontal";
    const selectedSample = ref<string | null>(null);
    const renderInputTasks = ref<any>(null);
    const formData: any = ref({});
    const editFormDataClone: any = {};
    let advanceOptionClone: any = {};
    let advanceOptionEditFormClone: any = {};
    const isVerifyingSignature = ref(false);
    const isAdvanceModalVisible = ref(false);
    const sessionId = ref<string | null>(null);
    const sampleTableData = ref<any[]>([]);
    // const apcAssetTasks = ref<any>();
    const isContinuousRun = ref(false);
    const isStartLoading = ref(false);
    const isEditModalVisible = ref(false);
    const recordToEdit = ref<any>({ id: 0 });
    const store = useStore();
    const deviceTypeId = computed(() => store.getters.getDeviceTypeId);
    const esignModalVisible = ref(false);
    const userName = ref("");
    const password = ref("");
    const isAddButtonDisabled = ref(false);
    const formErrors = ref<Record<string, string | null>>({}); // Store field-specific errors
    const editFormErrors = ref<Record<string, string | null>>({}); // Store field-specific errors
    let idCounter = 0;
    const isAdvanceEditModalVisible = ref(false);
    const activeTab = ref("1");
    const isStartbtnDisable = ref(false);
    const isEditAdvancedFormOkBtnDisabled = ref(false);
    const isAdvancedFormOkBtnDisabled = ref(false);
    const isAddLinkDisabled = ref(false);
    const formRef = ref<FormInstance | null>(null);
    // const setInterval = ref(apcSetInterval);
    const samplePrefarable = ref<any[]>([]);
    const selectedOption = ref<number | string | null>(null);
    const renderSampleInterval = ref<any>(null);
    const supportedSampleType = ref<any>(null);
    // const mockTaskDef = ref<any>(taskDefMock);
    const tabs = ref([
      { key: "1", title: "Advanced Options", content: "" },
      // { key: "2", title: "Pre Config Option", content: "" },
    ]);

    const deviceAssetId = ref<any>(props.selectedAssetData.asset_id);
    const apcAssetTasks = ref<any>();

    const isUpdateMode = ref(false);

    const selectedData = ref<any>(null);

    let loggedInUsername = "";
    let loggedInUserId: any;
    const deviceModalName = ref<any>(props.selectedAssetData.info?.model);

    const passwordVisible = ref(false);
    const isSaveSettingsPopoverVisible = ref(false);
    const saveSettingsFormRef = ref<FormInstance | null>(null);
    const saveSettingsFormData = ref({
      name: "",
    });
    const saveSettingsFormRules = {
      name: [
        {
          required: true,
          message: t("devicePage.Please input name", "Please input name"),
        },
      ],
    };

    const isSampleSettingsButtonDisabled = computed(() => {
      return (
        !formData.value ||
        Object.keys(formData.value).length === 0 ||
        isStartbtnDisable.value
      );
    });

    const sampleSettingsButtonLabel = computed(() => {
      if (selectedData.value || isUpdateMode.value) {
        return t("devicePage.Update Sample Settings", "Update Sample Settings");
      }
      return t("devicePage.Save Sample Settings", "Save Sample Settings");
    });

    const popoverTitle = computed(() => {
      return isUpdateMode.value
        ? t("devicePage.Update Setting", "Update Setting")
        : t("devicePage.Save Setting", "Save Setting");
    });

    const formLabel = computed(() => {
      return isUpdateMode.value
        ? t("devicePage.Update Name", "Update Name")
        : t("devicePage.Enter Name", "Enter Name");
    });

    const openSaveSettingsPopover = () => {
      if (!selectedData.value) {
        console.warn(
          "No selected data found. Cannot open save settings popover."
        );
        return;
      }

      isSaveSettingsPopoverVisible.value = true;

      const apcData = selectedData.value.preference?.measure_info?.apc?.[0];

      saveSettingsFormData.value.name = apcData?.preference_name || "";

      isUpdateMode.value = true;
      saveSettingsFormRef.value?.clearValidate();
    };

    const handleSaveSettingsCancel = () => {
      isSaveSettingsPopoverVisible.value = false;
      saveSettingsFormData.value.name = "";
      saveSettingsFormRef.value?.resetFields();
    };

    const getUserSamplePreferences = async () => {
      try {
        const response = await apcService.userSamplePreference(
          "get",
          undefined, // payload
          undefined, // preferenceId
          { created_by: loggedInUserId } // queryParams
        );

        console.log("::::response", response);

        if (response?.status === "success" && Array.isArray(response.data)) {
          samplePrefarable.value = response.data;
          console.log("Loaded sample preferences:", samplePrefarable.value);
        } else {
          console.warn("Unexpected response structure:", response);
          samplePrefarable.value = [];
        }
      } catch (error) {
        console.error("Failed to fetch sample preferences:", error);
        samplePrefarable.value = [];
      }
    };

    const additionalOptions = computed(() => {
      const preferenceOptions = samplePrefarable.value
        .filter((item) => {
          const deviceId = item.preference?.measure_info?.apc?.[0]?.asset_id;
          return deviceId === deviceAssetId.value;
        })
        .map((item) => {
          const apc = item.preference?.measure_info?.apc?.[0];
          return {
            value: item.id, // Unique identifier
            label: apc?.preference_name, // Display name
          };
        });

      return [
        {
          value: null,
          label: "No Preference",
        },
        ...preferenceOptions,
      ];
    });

    // Define popover messages for duration, interval, and delay_period
    const popoverMessages: any = {
      Duration: "Total time over which the sample collection should run.",
      Interval: "Time gap between two consecutive samples.",
      "Initial Delay":
        "Time to wait before starting the first sample in the Sample Interval collection.",
    };

    console.log("::: additionalOptions lables", additionalOptions.value);

    // Volume units map
    const volumeUnitsMap = computed(() => {
      const map: Record<string, string> = {};
      volumeUnits.value?.forEach((unitObj: any) => {
        map[unitObj.unit] = unitObj.x_nice_name;
      });
      return map;
    });

    // Handle save settings
    const handleSaveSettingsConfirm = async () => {
      try {
        // Validate form
        await saveSettingsFormRef.value?.validate();

        if (!deviceAssetId.value?.trim()) {
          message.error("Asset Id is required.");
          return;
        }

        const preferenceName = saveSettingsFormData.value.name
          ?.trim()
          .toLowerCase();
        if (!preferenceName) {
          message.error(
            t(
              "commonData.Preference name is required.",
              "Preference name is required."
            )
          );
          return;
        }

        const sampleList = Array.isArray(samplePrefarable.value)
          ? samplePrefarable.value
          : [];

        const isDuplicate = sampleList.some((item) => {
          const apcPreferences = item.preference?.measure_info?.apc || [];
          return apcPreferences.some(
            (apcItem: any) =>
              apcItem.preference_name?.trim().toLowerCase() ===
                preferenceName &&
              apcItem.asset_id?.trim().toLowerCase() ===
                deviceAssetId.value?.trim().toLowerCase() &&
              (!isUpdateMode.value || item.id !== selectedData.value?.id)
          );
        });

        if (isDuplicate) {
          message.error(
            t(
              "commonData.A preference with this name already exists for this modal.",
              "A preference with this name already exists for this modal."
            )
          );
          return;
        }

        // Build payload
        const settingsPayloadOptions = {
          formData: formData.value,
          selectedSample: selectedSample.value || "",
          assetId: deviceAssetId.value,
          preferedName: saveSettingsFormData.value.name?.trim(),
          tableData: isContinuousRun.value ? sampleTableData.value : [],
          volumeUnits: volumeUnitsMap.value,
          apcAssetTasks: {
            ...currentTaskDefinition.value,
            modal_name: deviceModalName.value,
          },
          assetInfo: {
            assetType: "apc",
            assetName: props.selectedAssetData.name,
            modelName: deviceModalName.value || "",
          },
          createdBy: parseInt(loggedInUserId),
        };

        const payload = generateSampleSettingsPayload(settingsPayloadOptions);
        let response;
        let successMessage = "";
        let operationType = "";

        try {
          if (isUpdateMode.value && selectedData.value?.id) {
            response = await apcService.userSamplePreference(
              "patch",
              payload,
              selectedData.value.id
            );
            successMessage = "User preference updated successfully";
            operationType = "update";
          } else {
            response = await apcService.userSamplePreference("post", payload);
            successMessage = "User preference saved successfully";
            operationType = "save";
          }
        } catch (err) {
          const action =
            operationType === "update"
              ? t("commonData.updating")
              : t("commonData.saving");

          const messageText = t(
            "commonData.error during updating/saving user preference",
            {
              action,
            }
          );

          message.error(messageText);

          console.error(`Error during ${operationType.toUpperCase()}:`, err);
          return;
        }

        if (response?.status !== "success") {
          const action =
            operationType === "update"
              ? t("commonData.updating")
              : t("commonData.saving");

          const messageText = t(
            "commonData.failed to updating/saving user preference",
            {
              action,
            }
          );

          message.error(messageText);
          return;
        }

        //  Refresh list
        samplePrefarable.value = Array.isArray(response.data)
          ? response.data
          : [response.data].filter(Boolean);

        message.success(t(`commonData.${successMessage}`, `${successMessage}`));

        //  Always refresh preferences
        await getUserSamplePreferences();

        // Update selected data (for both save & update)
        const newId = response?.data?.id;
        if (newId) {
          const newItem = samplePrefarable.value.find(
            (item) => item.id === newId
          );
          if (newItem) {
            selectedData.value = newItem;
            selectedOption.value = newItem.id;

            // Keep updated name in popup form
            saveSettingsFormData.value.name =
              newItem.preference?.measure_info?.apc?.[0]?.preference_name ||
              newItem.name ||
              "";
          } else {
            console.warn(`No item found with id ${newId} in samplePrefarable`);
          }
        } else {
          // Fallback case → use currently selectedOption
          if (selectedOption.value) {
            const fallbackItem = samplePrefarable.value.find(
              (item) => item.id === selectedOption.value
            );
            if (fallbackItem) {
              selectedData.value = fallbackItem;

              // Sync popup input with fallback preference name
              saveSettingsFormData.value.name =
                fallbackItem.preference?.measure_info?.apc?.[0]
                  ?.preference_name ||
                fallbackItem.name ||
                "";
            } else {
              console.warn(
                `No item found with id ${selectedOption.value} in samplePrefarable`
              );
            }
          }
        }

        isUpdateMode.value = true;
        isSaveSettingsPopoverVisible.value = false;

        // saveSettingsFormData.value.name = "";

        saveSettingsFormRef.value?.resetFields();
      } catch (error) {
        message.error(
          t(
            "commonData.Form validation failed or an unexpected error occurred.",
            "Form validation failed or an unexpected error occurred."
          )
        );
        console.error("Form validation or save operation failed:", error);
      }
    };

    const saveSampleSettings = () => {
      openSaveSettingsPopover();
    };

    const togglePasswordVisibility = () => {
      console.log("lock function calling", passwordVisible.value);
      passwordVisible.value = !passwordVisible.value;
    };

    const volumeUnits = computed(() => {
      // Only process volume units if volume exists with oneOf schema
      if (!renderInputTasks.value?.volume?.oneOf) {
        return [];
      }
      return renderInputTasks.value.volume.oneOf.map((obj: any) => ({
        unit: obj.properties.unit.const,
        x_nice_name: obj.properties.unit.x_nice_name,
        x_unit_short: obj.properties.unit.const,
      }));
    });

    // Computed property to extract sample types from task_defs
    const availableSampleTypes = computed(() => {
      if (!apcAssetTasks.value?.task_defs) return [];

      return apcAssetTasks.value.task_defs.map((taskDef: any) => ({
        sample_type_key: taskDef.sample_type_key,
        sample_type_label: taskDef.sample_type_label,
      }));
    });

    console.log("::::::availableSampleTypes", availableSampleTypes.value);

    // Computed property to get the current task definition based on selected sample type
    const currentTaskDefinition = computed(() => {
      if (!apcAssetTasks.value?.task_defs || !selectedSample.value) return null;
      return apcAssetTasks.value.task_defs.find(
        (taskDef: any) => taskDef.sample_type_key === selectedSample.value
      );
    });

    const decodedTokenString = localStorage.getItem("DecodedToken");

    if (decodedTokenString) {
      const decodedToken = JSON.parse(decodedTokenString);

      loggedInUsername = decodedToken.username;
      loggedInUserId = decodedToken.id;
    }

    // const isSampleSettingsButtonDisabled = computed(() => {
    //   return !selectedData.value;
    // });

    // const sampleSettingsButtonLabel = computed(() => {
    //   return selectedData.value
    //     ? "Update Sample Settings"
    //     : "Save Sample Settings";
    // });

    const esignformData = ref({
      username: "",
      password: "",
    });

    console.log("::::samplePrefarable", samplePrefarable.value);

    // Handle dropdown change to log matching data
    const handleOptionChange = (id: number | null) => {
      console.log(
        "::::::: id & selectedSample.value",
        id,
        selectedSample.value
      );
      // Handle "No Preference" selection
      if (id === null) {
        console.log("No Preference selected - resetting form");
        selectedData.value = null;
        isUpdateMode.value = false;

        // Clear table data and reset errors
        sampleTableData.value = [];
        formErrors.value = {};
        editFormErrors.value = {};

        // Reset form data to fresh values from task definition
        if (
          selectedSample.value &&
          currentTaskDefinition.value?.input?.properties
        ) {
          if (selectedSample.value === "sample-interval") {
            createSampleIntervalFormData(
              currentTaskDefinition.value.input.properties
            );
          } else {
            createFormDataObj(currentTaskDefinition.value.input.properties);
          }
        }

        // Reset continuous run state
        if (
          selectedSample.value === "flush-continuous-run" ||
          selectedSample.value === "sample-continuous-run"
        ) {
          isContinuousRun.value = true;
        } else {
          isContinuousRun.value = false;
        }

        checkCrSample();
        return;
      }

      // Handle existing preference selection
      selectedData.value = samplePrefarable.value.find(
        (item) => item.id === id
      );

      console.log(":::::selectedData.value", selectedData.value);

      if (!selectedData.value) return;

      isUpdateMode.value = true;

      const apcData = selectedData.value.preference?.measure_info?.apc?.[0];
      if (!apcData) {
        console.warn("No APC data found in selectedData");
        return;
      }

      console.log(":::::: apcData", apcData);

      // Validate the selected sample_type against availableSampleTypes
      const matchedType = availableSampleTypes.value.find(
        (t: any) => t.sample_type_key === apcData.sample_type
      );

      if (matchedType) {
        selectedSample.value = matchedType.sample_type_key;
        console.log("Selected sample type:", matchedType.sample_type_label);
      } else {
        selectedSample.value = null;
      }

      // Create form data based on type
      if (selectedSample.value !== "sample-interval") {
        createFormDataObj(apcData.input?.properties || {}, apcData);
      } else {
        createSampleIntervalFormData(apcData.input?.properties || {}, apcData);
      }

      // Handle continuous run state
      if (
        selectedSample.value === "flush-continuous-run" ||
        selectedSample.value === "sample-continuous-run"
      ) {
        isContinuousRun.value = true;
        sampleTableData.value = apcData.tableData || [];
      } else {
        isContinuousRun.value = false;
      }

      console.log(
        ":::::: table enable",
        isContinuousRun.value,
        selectedSample.value
      );

      checkCrSample();
    };

    addFormats(ajv);
    // Recursive function to iterate through the object and call validateOnBlur
    const validateAllKeys = (obj: any, parentKey = "", isEditForm: boolean) => {
      Object.entries(obj).forEach(([key, value]) => {
        const compositeKey = parentKey ? `${parentKey},${key}` : key;

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          console.log(
            "validateAllKeys",
            "value:",
            value,
            "compositeKey:",
            compositeKey
          );
          // Recursively validate nested objects
          validateAllKeys(value, compositeKey, isEditForm);
        } else {
          // Validate leaf node
          validateOnBlur(compositeKey, value, isEditForm);
        }
      });
    };
    const hasErrorsInNonRequiredKeys = (errors: any) => {
      const requiredKeys = currentTaskDefinition.value?.input?.required || [];
      for (const key in errors) {
        if (requiredKeys.includes(key)) continue; // Skip required keys

        const value = errors[key];

        // If the value is an object, recursively check nested keys
        if (typeof value === "object" && value !== null) {
          if (hasErrorsInNonRequiredKeys(value)) {
            return true; // Found a non-required key with an error
          }
        } else if (value !== null && value !== undefined) {
          return true; // Found an error in a non-required key
        }
      }
      return false;
    };

    const hasErrorsInRequiredKeys = (errors: any): boolean => {
      const requiredKeys = currentTaskDefinition.value?.input?.required || [];

      for (const key in errors) {
        if (!requiredKeys.includes(key)) continue; // Skip non-required keys

        const value = errors[key];

        // If the value is an object, recursively check nested keys
        if (typeof value === "object" && value !== null) {
          if (hasErrorsInRequiredKeys(value)) {
            return true; // Found an error in nested required key
          }
        } else if (value !== null && value !== undefined) {
          return true; // Found an error in a required key
        }
      }

      return false; // No errors in required keys
    };

    const isEditOkButtonDisabled = computed(() => {
      return hasErrorsInRequiredKeys(editFormErrors.value);
    });

    const isAdvancedFormOkDisabled = computed(() => {
      // Check if there are any errors in non-required keys
      return hasErrorsInNonRequiredKeys(formErrors.value);
    });
    const isEditAdvancedFormOkDisabled = computed(() => {
      // Check if there are any errors in non-required keys
      return hasErrorsInNonRequiredKeys(editFormErrors.value);
    });

    const isStartButtonDisabled = computed(() => {
      // If there are errors in non-required keys, disable the start button
      const hasErrors = hasErrorsInNonRequiredKeys(formErrors.value);
      console.log("::: has Error ::", hasErrors);

      if (!hasErrors) {
        if (isContinuousRun.value && sampleTableData.value.length > 0) {
          return false;
        }

        if (!isContinuousRun.value) {
          return false;
        }
      }

      return true;
    });

    const closeModalAdvanceOptions = () => {
      isAdvanceModalVisible.value = false;
      formErrors.value = {};
      console.log(
        ":: closeModalAdvanceOptions advanceOptionClone.value ::",
        advanceOptionClone
      );
      formData.value = { ...advanceOptionClone };

      // Trigger validation for all keys in formData.value
      validateAllKeys(formData.value, "", false);
    };
    const closeModalEditAdvanceOptions = () => {
      isAdvanceEditModalVisible.value = false;
      editFormErrors.value = {};

      console.log(
        ":: closeModalEditAdvanceOptions advanceOptionEditFormClone.value ::",
        advanceOptionEditFormClone
      );
      recordToEdit.value = { ...advanceOptionEditFormClone };

      validateAllKeys(recordToEdit.value, "", true);

      // Trigger validation for all keys in formData.value
      // validateAllKeys(formData.value, "", false);
    };
    // const closeEditModal = () => {
    //   isAdvanceEditModalVisible.value = false;

    //   emit("update:open", false);
    // };
    const advanceOptionKeys = computed(() => {
      const required = currentTaskDefinition.value?.input?.required || [];
      const properties = currentTaskDefinition.value?.input?.properties || {};

      return Object.keys(properties).filter((key) => !required.includes(key));
    });

    const showAdvanceOption = computed(() => {
      return advanceOptionKeys.value.length > 0;
    });

    const getSessionId = () => {
      const sessionIdFromURL = getSessionIdFromURL();
      if (sessionIdFromURL) {
        return sessionIdFromURL;
      } else {
        return getSessionIdFromCookie();
      }
    };

    const setSessionIdInCookie = (sessionId: string) => {
      document.cookie = `browserSessionId=${sessionId}`;
      console.log("::: document.cookie :::", document.cookie);
    };

    const assignDefaultValues = (formData: any, schema: any) => {
      // Recursive helper function to assign default values
      const assignDefaults = (
        data: any,
        schemaObj: any,
        path: string[] = []
      ) => {
        for (const key in schemaObj) {
          const currentSchema = schemaObj[key];

          // Handle "oneOf" by assigning defaults from the first valid schema
          if (currentSchema.oneOf && Array.isArray(currentSchema.oneOf)) {
            if (!data[key]) {
              // Initialize data[key] if empty
              data[key] = {};
            }
            // Apply defaults from the first "oneOf" object
            assignDefaults(data[key], currentSchema.oneOf[0].properties, [
              ...path,
              key,
            ]);
          } else if (currentSchema.type === "object") {
            // Handle nested objects
            if (!data[key] || typeof data[key] !== "object") {
              data[key] = {}; // Initialize as object if not already
            }
            assignDefaults(data[key], currentSchema.properties, [...path, key]);
          } else if (currentSchema.type === "array" && currentSchema.items) {
            // Handle arrays
            if (!Array.isArray(data[key])) {
              data[key] = []; // Initialize as array if not already
            }
            if (
              currentSchema.items.type === "object" &&
              currentSchema.items.properties
            ) {
              // Assign defaults for objects inside the array
              data[key].forEach((item: any, index: number) => {
                assignDefaults(item, currentSchema.items.properties, [
                  ...path,
                  key,
                  `${index}`,
                ]);
              });
            }
          } else if (currentSchema.default !== undefined) {
            // Assign default value for non-object types
            if (data[key] === "" || data[key] === undefined) {
              data[key] = currentSchema.default;
              console.log(
                `Assigned default value for ${[...path, key].join(".")} = ${
                  currentSchema.default
                }`
              );
            }
          }
        }
      };

      // Start recursion with main formData and schema structure
      if (Array.isArray(formData)) {
        formData.forEach((item, index) =>
          assignDefaults(item, schema.input.properties, [`[${index}]`])
        );
      } else {
        assignDefaults(formData, schema.input.properties);
      }

      // Return updated formData
      return formData;
    };

    // Function to Sample-Interval payload dynamically
    const payloadSampleInterval = () => {
      const rawParams = assignDefaultValues(
        formData.value,
        currentTaskDefinition.value
      );
      let finalParams = { ...rawParams };

      // Remove unintended flattened keys
      delete finalParams.delay_period;
      delete finalParams.durationValue;
      delete finalParams.intervalValue;

      let sampleIntervalInfo = null;
      if (rawParams.sample_interval_info) {
        sampleIntervalInfo = rawParams.sample_interval_info;
        delete finalParams.sample_interval_info;
      }

      return {
        source: "IN-HOUSE",
        asset_id: deviceAssetId.value,
        asset_type_id: parseInt(deviceTypeId.value),
        session_id: sessionId.value,
        sample_type: "Sample-Interval",
        params: finalParams,
        sample_interval_info: sampleIntervalInfo,
      };
    };

    const handleSampleStart = async () => {
      console.log("#start clicked::::");

      // Collect e-sign form data
      const esignFormData: any = {
        username: esignformData.value.username,
        password: esignformData.value.password,
        devicename: props.selectedAssetData.name,
      };

      if (!esignFormData.username || !esignFormData.password) {
        message.error(
          `${t(
            "devicePage.Username and Password are required",
            "Username and Password are required"
          )}`
        );
        return;
      }

      console.log("#eSign Form Data:::", esignFormData);

      if (
        loggedInUsername.toLowerCase() !== esignFormData.username.toLowerCase()
      ) {
        message.error(
          `${t(
            "commonData.Authentication failed for",
            "Authentication failed for"
          )} "${loggedInUsername}"`
        );
        return;
      }

      isVerifyingSignature.value = true;

      try {
        const esignResponse: any = await esignConfirmLogin(esignFormData);

        console.log("esignConfirmLogin response:", esignResponse);
        const auditTaskResultEventId = esignResponse.data[0].id;

        if (!esignResponse) {
          message.error(
            `${t(
              "commonData.Authentication failed for",
              "Authentication failed for"
            )} "${loggedInUsername}"`
          );
          return;
        }

        isStartLoading.value = true;
        isVerifyingSignature.value = false;

        let apcJobPayload: any;

        const selectedTask = renderInputTasks.value;
        console.log("::: renderInputTasks ::: Data ::", selectedTask);

        if (
          !isContinuousRun.value &&
          selectedSample.value !== "Sample-Interval" &&
          selectedSample.value !== "continuous-sample"
        ) {
          let rawParams = assignDefaultValues(
            formData.value,
            currentTaskDefinition.value
          );
          let finalParams = { ...rawParams };

          // Remove unintended flattened keys
          delete finalParams.delay_period;
          delete finalParams.durationValue;
          delete finalParams.intervalValue;

          let sampleIntervalInfo = null;
          if (
            selectedSample.value === "Sample-Interval" &&
            rawParams.sample_interval_info
          ) {
            sampleIntervalInfo = rawParams.sample_interval_info;
            delete finalParams.sample_interval_info;
          }

          apcJobPayload = {
            audit_event_id: auditTaskResultEventId,
            job_def_id: selectedTask?.job_def_id,
            asset_id: deviceAssetId.value,
            asset_type_id: parseInt(deviceTypeId.value),
            source: "IN-HOUSE",
            session_id: sessionId.value,
            sample_type: selectedSample.value,
            params: finalParams,
            ...(sampleIntervalInfo
              ? { sample_interval_info: sampleIntervalInfo }
              : {}),
          };
          console.log(":: sample Payload data ::", apcJobPayload);
        } else if (selectedSample.value === "continuous-sample") {
          const rawParams = assignDefaultValues(
            formData.value,
            currentTaskDefinition.value
          );
          const finalParams = { ...rawParams };

          apcJobPayload = {
            source: "IN-HOUSE",
            assets: [
              {
                asset_id: deviceAssetId.value,
                asset_type_id: parseInt(deviceTypeId.value),
              },
            ],
            sample_info: {
              session_id: sessionId.value,
              params: finalParams,
            },
          };

          console.log(
            ":: Continuous-Monitoring Payload data ::",
            apcJobPayload
          );
        } else if (isContinuousRun.value) {
          const continuousRunParamsArray = assignDefaultValues(
            sampleTableData.value,
            currentTaskDefinition.value
          );
          console.log(
            "::: continuousRunParamsArray ::",
            continuousRunParamsArray
          );

          apcJobPayload = {
            audit_event_id: auditTaskResultEventId,
            job_def_id: selectedTask?.job_def_id,
            asset_type_id: parseInt(deviceTypeId.value),
            source: "IN-HOUSE",
            asset_id: deviceAssetId.value,
            session_id: sessionId.value,
            sample_type: selectedSample.value,
            params: continuousRunParamsArray,
          };
          console.log(":: sample Payload data ::", apcJobPayload);
        }

        try {
          const sampleType = selectedSample.value || "";
          let response;

          if (sampleType === "Sample-Interval") {
            const sampleIntervalPayload = payloadSampleInterval();
            console.log(
              ":: Sample-Interval Payload data ::",
              sampleIntervalPayload
            );
            response = await apcService.startSampleInterval(
              sampleIntervalPayload
            );
          } else if (sampleType === "continuous-sample") {
            console.log(":: Calling continuousSample API ::");
            response = await apcService.continuousSample(apcJobPayload);
          } else {
            response = await apcService.createApcJob(apcJobPayload);
          }

          console.log("API response", response);
          isStartLoading.value = false;
          isVerifyingSignature.value = false;

          console.log("::::::::::sampletype", sampleType);
          const selected = availableSampleTypes.value.find(
            (s: any) => s.sample_type_key === selectedSample.value
          );

          message.success(
            `${selected?.sample_type_label || selectedSample.value} ${t(
              "devicePage.Started Successfully",
              "Started Successfully"
            )}`
          );

          emit("prevStep");
        } catch (error: any) {
          console.log("createJob error", error);

          isStartLoading.value = false;
          isVerifyingSignature.value = false;
          esignModalVisible.value = true;

          // Enhanced error handling for the specific API response format
          if (error?.response?.data?.responses) {
            // Extract all error messages from the responses array
            const errorMessages = error.response.data.responses
              .filter((response: any) => response.error)
              .map((response: any) => response.error);

            // Display all error messages
            if (errorMessages.length > 0) {
              message.error(`${errorMessages.join("; ")}`);
            } else {
              // Fallback for unexpected response format
              message.error(
                t(
                  "commonData.Failed to start new sample",
                  "Failed to start new sample"
                )
              );
            }
          } else if (error?.response?.data?.errors) {
            // Handle legacy error format
            const errMsg = error.response.data.errors;
            message.error(`${Array.isArray(errMsg) ? errMsg[0] : errMsg}`);
          } else {
            // Generic error fallback
            message.error(
              t(
                "commonData.Failed to start new sample",
                "Failed to start new sample"
              )
            );
          }
          return;
        }
      } catch (error: any) {
        console.log(":::::::::: error", error);
        isVerifyingSignature.value = false;

        if (error?.response?.data) {
          // Try to extract a meaningful error message
          const apiError =
            error.response.data.message ||
            error.response.data.error ||
            (Array.isArray(error.response.data.errors)
              ? error.response.data.errors[0]
              : error.response.data.errors) ||
            JSON.stringify(error.response.data);

          message.error(
            `${t(
              "commonData.Authentication failed for",
              "Authentication failed for"
            )} "${loggedInUsername}": ${apiError}`
          );
        } else {
          // Fallback generic error
          message.error(
            t(
              "commonData.E-sign verification failed",
              "E-sign verification failed"
            )
          );
        }
      }

      esignModalVisible.value = true;
    };

    const handleCancel = async () => {
      // Reset form fields first
      console.log("cancel is calling", formRef.value);
      if (formRef.value) {
        formRef.value.resetFields();

        // Force clear validation states
        const formEl = formRef.value.$el;
        console.log(formEl);
        if (formEl) {
          const errorElements = formEl.querySelectorAll(
            ".ant-form-item-has-error"
          );
          errorElements.forEach((el: HTMLElement) => {
            el.classList.remove("ant-form-item-has-error");
          });

          const errorMsgElements = formEl.querySelectorAll(
            ".ant-form-item-explain"
          );
          errorMsgElements.forEach((el: HTMLElement) => {
            el.innerHTML = "";
          });
        }
      }

      // Reset form data manually as well
      esignformData.value = {
        username: "",
        password: "",
      };

      // Reset password visibility
      passwordVisible.value = false;

      // Finally close the modal
      await nextTick();
      esignModalVisible.value = false;
    };

    watch(esignModalVisible, async (newVal, oldVal) => {
      console.log("Modal visibility changed:", newVal);

      if (newVal && !oldVal) {
        if (formRef.value) {
          formRef.value.resetFields();
        }

        // Reset form data
        esignformData.value = {
          username: "",
          password: "",
        };

        passwordVisible.value = false;
      }

      if (!newVal && oldVal) {
        await nextTick();
        if (formRef.value && formRef.value.$el) {
          const formEl = formRef.value.$el;

          formEl
            .querySelectorAll(".ant-form-item-has-error")
            .forEach((el: HTMLElement) => {
              el.classList.remove("ant-form-item-has-error");
            });

          formEl
            .querySelectorAll(".ant-form-item-explain")
            .forEach((el: HTMLElement) => {
              el.innerHTML = "";
            });
        }
      }
    });

    const handleEditCancel = () => {
      console.log(":: editFormDataClone ::", editFormDataClone.value);
      isEditModalVisible.value = false; // Hide the modal
      editFormErrors.value = {};
      // createRecordToEditObj(recordToEdit.value);
      // resetForm();
    };
    // const resetField = (key: string, property: any) => {
    //   console.log(key);
    //   // Dynamically reset fields based on property structure
    //   if (property?.oneOf) {
    //     // Handle fields like "volume" with complex structure (unit and value)
    //     const resetObj: Record<string, any> = {};
    //     property.oneOf[0]?.properties &&
    //       Object.keys(property.oneOf[0].properties).forEach((subKey) => {
    //         resetObj[subKey] = null; // Reset subfields (e.g., unit and value)
    //       });
    //     return resetObj;
    //   }

    //   // Handle standard fields with default values or set them to null
    //   return property?.default ?? null;
    // };

    const isFormValid = computed(() => {
      return (
        esignformData.value.username.length > 0 &&
        esignformData.value.password.length > 0
      );
    });

    // Open the user modal
    const openUserModal = () => {
      esignModalVisible.value = true;
      console.log("formRef opened");
    };
    const openAdvanceOptionModal = () => {
      advanceOptionClone = _.cloneDeep(formData.value);
      console.log(":: advanceOptionClone.value ::", advanceOptionClone);
      isAdvanceModalVisible.value = true;
      formErrors.value = {};
    };
    const openEditAdvanceOptionModal = () => {
      isAdvanceEditModalVisible.value = true;
      editFormErrors.value = {};

      advanceOptionEditFormClone = _.cloneDeep(recordToEdit.value);
      console.log(":: openEditAdvanceOptionModal ::", formData.value);
    };

    // Updated getAssetTaskDefinations
    const getAssetTaskDefinations = async () => {
      try {
        const response = await apcService.getApcAssetIdTaskDefinitions(
          deviceAssetId.value
        );
        // const response: any = mockTaskDef.value;
        console.log("::: getApcAssetIdTaskDefinitions :::", response);

        // Check for new response structure
        if (
          response &&
          response.task_defs &&
          Array.isArray(response.task_defs)
        ) {
          // Store the full response with asset_id and task_defs
          const transformedResponse = {
            asset_id: response.asset_id,
            supported_sample_types: response.task_defs.map((def: any) => ({
              sample_type_key: def.sample_type_key,
              sample_type_label: def.sample_type_label,
            })),
            task_defs: response.task_defs,
          };

          // Object.assign(transformedResponse, setInterval.value);

          apcAssetTasks.value = transformedResponse;
          console.log(
            "apcAssetTasks.value after assignment:",
            apcAssetTasks.value
          );

          // Set default sample type from first task definition
          if (
            !selectedSample.value &&
            transformedResponse.supported_sample_types.length > 0
          ) {
            selectedSample.value =
              transformedResponse.supported_sample_types[0].sample_type_key;
          }
          console.log(":::::: selected sample data", selectedSample.value);

          // Set input based on selected sample type
          if (selectedSample.value) {
            const taskDef = transformedResponse.task_defs.find(
              (def: any) => def.sample_type_key === selectedSample.value
            );
            if (taskDef) {
              apcAssetTasks.value.input = taskDef.input;
            }
            console.log(
              ":::::: taskDef input data",
              taskDef,
              apcAssetTasks.value.input
            );
          }

          // Populate form data based on selected sample type
          const selectedTaskDef = response.task_defs.find(
            (taskDef: any) => taskDef.sample_type_key === selectedSample.value
          );

          if (selectedTaskDef && selectedTaskDef.input?.properties) {
            createFormDataObj(selectedTaskDef.input.properties);
          }

          // console.log(":: set interval json data", setInterval.value);
        } else {
          console.log(
            "Invalid response format or no task definitions:",
            response
          );
        }
      } catch (error) {
        console.log("Error fetching asset task definitions:", error);
      }
    };

    const getSessionIdFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("sessionID");
    };

    const getSessionIdFromCookie = () => {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "sessionID") {
          return value;
        }
      }
      return generateSessionId();
    };

    const generateSessionId = () => {
      let randomSessionID = Math.random().toString(36).substring(2, 15);
      setSessionIdInCookie(randomSessionID);
      return randomSessionID;
    };

    const handleEditClick = async (record: any) => {
      console.log(":: handleEditClick record Data ::", record);
      console.log("::recordToEdit.value :: ", recordToEdit.value);
      editFormDataClone.value = { ...record };
      await createRecordToEditObj(record);
      isEditModalVisible.value = true;
      editFormErrors.value = {};
    };

    const SaveEditChanges = () => {
      console.log(":: recordToEdit.value ::", recordToEdit.value);

      // Get the volumeUnits from the computed property

      // Update the matching record in sampleTableData
      sampleTableData.value = sampleTableData.value.map((record) => {
        // Check if the IDs match
        if (record.id === recordToEdit.value.id) {
          // Clone the record to avoid mutation
          const updatedRecord = { ...record, ...recordToEdit.value };

          // Ensure volumeUnit is updated based on the volume.unit
          if (updatedRecord.volume && updatedRecord.volume.unit) {
            // Find the matching volumeUnit from availableVolumeUnits
            const matchedUnit = volumeUnits.value.find(
              (unit: any) => unit.unit === updatedRecord.volume.unit
            );

            // If a matching unit is found, update volumeUnit
            if (matchedUnit) {
              updatedRecord.volumeUnit = matchedUnit.x_nice_name;
            }
          }

          return updatedRecord;
        }
        return record;
      });

      console.log(
        ":: SaveEditChanges sampleTableData ::",
        sampleTableData.value
      );

      // Close the modal and reset the recordToEdit
      isEditModalVisible.value = false;
      editFormErrors.value = {};
    };

    const saveEditAdvanceChanges = () => {
      console.log(
        ":: saveEditAdvanceChanges recordToEdit.value ::",
        recordToEdit.value
      );
      console.log(
        ":: saveEditAdvanceChanges sampleTableData before ::",
        sampleTableData.value
      );

      // Update the matching record in sampleTableData
      sampleTableData.value = sampleTableData.value.map((record) => {
        // Check if the IDs match
        if (record.id === recordToEdit.value.id) {
          // Replace the record with the new data
          return { ...record, ...recordToEdit.value };
        }
        return record;
      });

      console.log(
        ":: saveEditAdvanceChanges sampleTableData after ::",
        sampleTableData.value
      );

      // Close the modal
      isAdvanceEditModalVisible.value = false;
      editFormErrors.value = {};
    };
    const saveAdvanceChanges = () => {
      isAdvanceModalVisible.value = false;

      formErrors.value = {};
    };

    const handleDeleteClick = (record: any, column: any) => {
      console.log("delete", record, column);
    };

    const confirmDelete = (record: any) => {
      console.log("record", record);
      sampleTableData.value = sampleTableData.value.filter(
        (each) => each.id !== record.id
      );
      checkCrSample();
      message.success(
        `${t(
          "devicePage.Sample deleted successfully",
          "Sample deleted successfully"
        )}`
      );
    };

    const clearTable = () => {
      sampleTableData.value = [];
      formErrors.value = {};
      editFormErrors.value = {};
      isAdvancedFormOkBtnDisabled.value = true;

      if (
        selectedSample.value === "Flush-Continuous Run" ||
        selectedSample.value === "Sample-Continuous Run"
      ) {
        isContinuousRun.value = true;
      } else {
        isContinuousRun.value = false;
      }

      console.log(
        ":::::currentTaskDefinition.value in the change option",
        currentTaskDefinition.value,
        selectedSample.value
      );

      checkCrSample();
      if (selectedData.value) {
        getAssetTaskDefinations();
      }

      if (selectedSample.value !== "Sample-Interval") {
        if (currentTaskDefinition.value?.input?.properties) {
          createFormDataObj(currentTaskDefinition.value.input.properties);
        }
      } else {
        createSampleIntervalFormData(
          currentTaskDefinition.value.input.properties
        );
      }
    };

    const preventInvalidInput = (event: KeyboardEvent) => {
      const invalidKeys = ["e", "E", "+", "-"]; // Block these keys
      if (invalidKeys.includes(event.key)) {
        event.preventDefault();
      }
    };

    const handleInput = (value: any, key: string, isEditForm: boolean) => {
      console.log("handleInput called with:", { key, value, isEditForm });

      // Get the schema property for the current key
      const properties = currentTaskDefinition.value?.input?.properties;
      const keyParts = key.split(",");

      const resolveSchema = (schema: any, keyParts: string[]): any => {
        return keyParts.reduce((acc: any, part: string) => {
          if (!acc) return undefined;

          if (acc.type === "object" && acc.properties) {
            return acc.properties[part];
          }

          return acc[part];
        }, schema);
      };

      const property = resolveSchema(properties, keyParts);
      const fieldType = property?.type || "string"; // Default to "string" if type is not defined

      let sanitizedValue = value;

      if (fieldType === "number") {
        // For numeric fields, sanitize the value
        sanitizedValue = String(value)
          .replace(/[^0-9.]/g, "") // Remove non-numeric characters except "."
          .replace(/(\..*?)\..*/g, "$1"); // Ensure only one "."

        sanitizedValue = parseFloat(sanitizedValue); // Parse the sanitized value to a number
        if (isNaN(sanitizedValue)) sanitizedValue = ""; // Handle invalid numbers
      } else if (fieldType === "string") {
        // For string fields, keep the value as-is
        sanitizedValue = String(value);
      }

      console.log("Sanitized Value:", sanitizedValue);

      if (isEditForm) {
        // if (key === "volume") {
        //   recordToEdit.value[key] = recordToEdit.value[key] || {};
        //   recordToEdit.value[key]["value"] = sanitizedValue;
        // } else if (key === "volumeUnit") {
        //   recordToEdit.value["volume"] = recordToEdit.value["volume"] || {};
        //   recordToEdit.value["volume"]["unit"] = sanitizedValue;
        // } else {
        //   recordToEdit.value[key] = sanitizedValue;
        // }
        ///

        if (key === "volume") {
          recordToEdit.value[key] = recordToEdit.value[key] || {};
          recordToEdit.value[key]["value"] = sanitizedValue;
        } else if (key === "volumeUnit") {
          recordToEdit.value["volume"] = recordToEdit.value["volume"] || {};
          recordToEdit.value["volume"]["unit"] = sanitizedValue;
        } else {
          const keyParts = key.split(",");
          let current = recordToEdit.value;

          keyParts.forEach((part, index) => {
            if (index === keyParts.length - 1) {
              current[part] = sanitizedValue;
            } else {
              current[part] = current[part] || {};
              current = current[part];
            }
          });
        }
      } else {
        if (key === "volume") {
          formData.value[key] = formData.value[key] || {};
          formData.value[key]["value"] = sanitizedValue;
        } else if (key === "volumeUnit") {
          formData.value["volume"] = formData.value["volume"] || {};
          formData.value["volume"]["unit"] = sanitizedValue;
        } else {
          const keyParts = key.split(",");
          let current = formData.value;

          keyParts.forEach((part, index) => {
            if (index === keyParts.length - 1) {
              current[part] = sanitizedValue;
            } else {
              current[part] = current[part] || {};
              current = current[part];
            }
          });
        }
      }
      checkCrSample();

      validateOnBlur(key, sanitizedValue, isEditForm);
    };
    /**
     * Handle validation on blur
     */
    const parseValueByType = (value: any, type: string) => {
      try {
        let parsedValue;

        switch (type) {
          case "integer":
            // Ensure the value is treated as an integer (ignore decimals)
            parsedValue = parseFloat(value);
            return Number.isNaN(parsedValue) ? value : parsedValue;

          case "number":
            // For 'number', allow both integers and floats (preserve decimal)
            parsedValue = parseFloat(value);
            return Number.isNaN(parsedValue) ? value : parsedValue;

          case "string":
            // Convert any value to string
            return String(value);

          case "boolean":
            // Handle boolean conversion
            return value === "true" || value === true;

          default:
            // Return as-is for unsupported types
            return value;
        }
      } catch (err) {
        console.log(`Error parsing value "${value}" as type "${type}":`, err);
        return value; // Return original value if parsing fails
      }
    };

    // Handle unit change
    const handleUnitChange = (isEditForm: boolean) => {
      const targetData = isEditForm ? recordToEdit.value : formData.value;

      if (
        targetData.volume &&
        currentTaskDefinition.value?.input?.properties?.volume?.oneOf
      ) {
        const selectedUnit = targetData.volume.unit;
        const volumeSchema =
          currentTaskDefinition.value.input.properties.volume.oneOf.find(
            (schema: any) => schema.properties.unit.const === selectedUnit
          );

        if (volumeSchema) {
          // Update volume.value to the minimum value for the selected unit
          targetData.volume.value = volumeSchema.properties.value.minimum;
          console.log(
            `:: Updated volume.value to minimum ${targetData.volume.value} for unit ${selectedUnit}`
          );

          // Validate the volume field after updating
          validateOnBlur("volume", targetData.volume, isEditForm);
        }

        // Validate other fields
        Object.keys(targetData).forEach((key) => {
          if (key !== "volume") {
            validateOnBlur(key, targetData[key], isEditForm);
          }
        });
      }
    };

    const checkCrSample = () => {
      if (isContinuousRun.value && sampleTableData.value.length > 0) {
        isStartbtnDisable.value = false;
      } else if (!isContinuousRun.value) {
        isStartbtnDisable.value = false;
      } else {
        isStartbtnDisable.value = true;
      }
    };

    const setNestedError = (
      errors: any,
      keyParts: string[],
      errorMessage: string | null
    ) => {
      let nestedErrors = errors;

      // For Sample-Interval, use the full key (e.g., "durationValue") directly
      if (selectedSample.value === "Sample-Interval") {
        nestedErrors[keyParts[0]] = errorMessage; // e.g., errors.durationValue = "must be at least 1"
      } else {
        // Existing logic for nested input schema
        keyParts.forEach((keyPart, index) => {
          if (index === keyParts.length - 1) {
            nestedErrors[keyPart] = errorMessage;
          } else {
            nestedErrors[keyPart] = nestedErrors[keyPart] || {};
            nestedErrors = nestedErrors[keyPart];
          }
        });
      }
    };

    const validationErrors = ref<string[]>([]); // Central error tracking

    const validateOnBlur = (key: string, value: any, isEditForm: boolean) => {
      console.log("validateOnBlur key :::", key);

      const isSampleInterval = selectedSample.value === "Sample-Interval";
      const targetData = isEditForm ? recordToEdit.value : formData.value;

      const isSampleIntervalKey =
        isSampleInterval &&
        (key.endsWith("Value") ||
          key.endsWith("Unit") ||
          key === "delay_period");

      const inputSchema = currentTaskDefinition.value?.input;
      const sampleIntervalSchema = apcAssetTasks.value?.sample_interval_info;

      const inputProperties = inputSchema?.properties;
      const sampleIntervalProperties = sampleIntervalSchema?.properties;

      let fieldSchema;

      if (isSampleIntervalKey) {
        if (key.endsWith("Value")) {
          const field = key.replace("Value", "");
          fieldSchema = sampleIntervalProperties?.[field]?.properties?.value;
        } else if (key.endsWith("Unit")) {
          const field = key.replace("Unit", "");
          fieldSchema = sampleIntervalProperties?.[field]?.properties?.unit;
        } else {
          fieldSchema =
            sampleIntervalProperties?.[key] ||
            key.split(",").reduce((acc: any, part: string) => {
              if (!acc) return null;
              return acc.type === "object" && acc.properties
                ? acc.properties[part]
                : acc[part];
            }, inputProperties);
        }
      } else {
        fieldSchema = key.split(",").reduce((acc: any, part: string) => {
          if (!acc) return null;
          return acc.type === "object" && acc.properties
            ? acc.properties[part]
            : acc[part];
        }, inputProperties);
      }

      if (!fieldSchema) {
        console.log(`No schema found for key: ${key}`);
        return;
      }

      let parsedValue = parseValueByType(value, fieldSchema.type);

      if (isSampleIntervalKey) {
        if (key.endsWith("Value") || key.endsWith("Unit")) {
          const field = key.replace(/(Value|Unit)$/, "");
          const subKey = key.endsWith("Value") ? "value" : "unit";
          if (!targetData.sample_interval_info[field]) {
            targetData.sample_interval_info[field] = {};
          }
          targetData.sample_interval_info[field][subKey] = parsedValue;
        } else {
          targetData.sample_interval_info[key] = parsedValue;
        }
      } else {
        if (key === "volume" || key === "volumeUnit") {
          const volumeData = targetData.volume;
          const volumeSchema = inputSchema?.properties?.volume?.oneOf?.[0];
          if (!volumeData || !volumeSchema) return;

          const volumeParsedValue = {
            value: parseValueByType(
              volumeData.value,
              volumeSchema.properties?.value?.type
            ),
            unit: volumeData.unit,
          };
          if (
            volumeParsedValue.value === null ||
            volumeParsedValue.unit === null
          )
            return;

          targetData.volume = volumeParsedValue;
          parsedValue = volumeParsedValue;
        } else {
          let nestedObj = targetData;
          const keyParts = key.split(",");
          for (let i = 0; i < keyParts.length - 1; i++) {
            const currentKey = keyParts[i];
            if (!nestedObj[currentKey]) nestedObj[currentKey] = {};
            nestedObj = nestedObj[currentKey];
          }
          nestedObj[keyParts[keyParts.length - 1]] = parsedValue;
        }
      }

      const finalSchema = isSampleIntervalKey
        ? sampleIntervalSchema
        : inputSchema;

      const errorMessage = validateField(
        key,
        parsedValue,
        finalSchema,
        targetData
      );
      if (targetData.sample_interval_info) {
        const sampleDuration = targetData.sample_interval_info["duration"];
        const sampleInterval = targetData.sample_interval_info["interval"];
        if (
          sampleDuration.unit === sampleInterval.unit &&
          sampleDuration.value > sampleInterval.value
        ) {
          console.log("sample error");
          setNestedError(formErrors.value, ["durationValue"], null);
          setNestedError(formErrors.value, ["intervalValue"], null);
          validationErrors.value = validationErrors.value.filter(
            (error) => error !== "durationValue" && error !== "intervalValue"
          );
        }
      }

      if (isEditForm) {
        setNestedError(editFormErrors.value, [key], errorMessage || null);
      } else {
        setNestedError(formErrors.value, [key], errorMessage || null);
      }

      //  Maintain error array
      const errorIndex = validationErrors.value.indexOf(key);
      if (errorMessage) {
        if (errorIndex === -1) {
          validationErrors.value.push(key);
        }
        console.log(`:: Validation error for ${key}: ${errorMessage}`);
      } else {
        if (errorIndex !== -1) {
          validationErrors.value.splice(errorIndex, 1);
        }
        console.log(`:: Validation passed for ${key}`);
      }

      if (!isEditForm) {
        const hasErrors = validationErrors.value.length > 0;
        isStartbtnDisable.value = hasErrors;
        isAdvancedFormOkBtnDisabled.value = hasErrors;

        if (!hasErrors) {
          checkCrSample();
          isAddButtonDisabled.value = false;
          isEditAdvancedFormOkBtnDisabled.value = false;
          isAdvancedFormOkBtnDisabled.value = false;
          isAddLinkDisabled.value = false;
        }
      }

      console.log(":: formErrors ::", formErrors.value);
      console.log(":: active validationErrors ::", validationErrors.value);
    };

    function validateMultipleOf(value: any, multiple: any) {
      const tolerance = 1e-10; // Small tolerance to account for floating-point errors
      const remainder = value % multiple;
      return (
        Math.abs(remainder) < tolerance ||
        Math.abs(remainder - multiple) < tolerance
      );
    }

    const validateField = (
      key: string,
      value: any,
      inputSchema: any,
      targetData: any
    ) => {
      console.log(":::: inputSchema ::::", inputSchema);

      // Determine schema context based on selectedSample
      const isSampleInterval = selectedSample.value === "Sample-Interval";
      const schema = inputSchema;

      if (!schema || !schema.properties) {
        console.log(`No properties found in schema`);
        return null;
      }

      let property;
      let errorMessage = null;

      if (isSampleInterval) {
        // Handle Sample-Interval fields
        if (key.endsWith("Value") || key.endsWith("Unit")) {
          const field = key.replace(/(Value|Unit)$/, ""); // e.g., "durationValue" -> "duration"
          const subKey = key.endsWith("Value") ? "value" : "unit";
          property = schema.properties[field]?.properties[subKey];

          if (!property) {
            console.log(`No schema found for ${field}.${subKey}`);
            return null;
          }

          if (value === undefined || value === null || value === "") {
            if (schema.properties[field]?.required?.includes(subKey)) {
              errorMessage = `${schema.properties[field].properties.value.x_nice_name} is required`;
              console.log("Required Field Validation Error:", errorMessage);
            }
          } else {
            // Custom multipleOf check (if applicable)
            if (
              property.multipleOf &&
              !validateMultipleOf(value, property.multipleOf)
            ) {
              errorMessage = `${field} ${subKey} must be a multiple of ${property.multipleOf}`;
              console.log("Custom Validation Error:", errorMessage);
              return errorMessage;
            }

            // AJV validation
            const validate = ajv.compile(property);
            const isValid = validate(value);

            if (!isValid) {
              errorMessage = validate.errors?.[0]?.message;
              console.log(`AJV Validation Error for ${key}:`, validate.errors);
            }
            if (targetData.sample_interval_info) {
              const sampleDuration =
                targetData.sample_interval_info["duration"];
              const sampleInterval =
                targetData.sample_interval_info["interval"];
              if (
                sampleDuration.unit === sampleInterval.unit &&
                sampleDuration.value < sampleInterval.value
              ) {
                errorMessage = `Duration must be greater than interval`;
                console.log("Custom Validation Error:", errorMessage);
                return errorMessage;
              }
            }
          }
        } else {
          // Handle delay_period
          property = schema.properties[key]; // e.g., "delay_period"

          if (!property) {
            console.log(`No schema found for key: ${key}`);
            return null;
          }

          if (value === undefined || value === null || value === "") {
            if (schema.required?.includes(key)) {
              errorMessage = `${key} is required.`;
              console.log("Required Field Validation Error:", errorMessage);
            }
          } else {
            // Custom multipleOf check (if applicable)
            if (
              property.multipleOf &&
              !validateMultipleOf(value, property.multipleOf)
            ) {
              errorMessage = `${key} must be a multiple of ${property.multipleOf}`;
              console.log("Custom Validation Error:", errorMessage);
              return errorMessage;
            }

            // AJV validation
            const validate = ajv.compile(property);
            const isValid = validate(value);

            if (!isValid) {
              errorMessage = validate.errors?.[0]?.message || `Invalid ${key}`;
              console.log(`AJV Validation Error for ${key}:`, validate.errors);
            }
          }
        }
      } else {
        // Existing logic for input schema (e.g., volume)
        const keyParts = key.split(",");
        property = keyParts.reduce((acc: any, part: any) => {
          if (!acc) {
            console.log(`No schema found for key part: ${part}`);
            return null;
          }
          if (acc.type === "object" && acc.properties) {
            return acc.properties[part];
          } else {
            return acc[part];
          }
        }, schema.properties);

        if (!property) {
          console.log(`No schema found for key: ${key}`);
          return null;
        }

        if (key === "volume" && property.oneOf) {
          const volumeData = value;
          if (volumeData && volumeData.unit) {
            const unit = volumeData.unit;
            const volumeSchema = property.oneOf.find(
              (schema: any) => schema.properties.unit.const === unit
            );

            if (volumeSchema) {
              // Custom multipleOf check
              if (
                volumeSchema.properties.value.multipleOf &&
                !validateMultipleOf(
                  value.value,
                  volumeSchema.properties.value.multipleOf
                )
              ) {
                errorMessage = `Volume value must be a multiple of ${volumeSchema.properties.value.multipleOf}`;
                console.log("Custom Validation Error:", errorMessage);
                return errorMessage;
              }

              // AJV validation
              const validate = ajv.compile(volumeSchema);
              const isValid = validate(volumeData);

              if (!isValid) {
                errorMessage =
                  validate.errors?.[0]?.message ||
                  `Validation failed for volume with unit ${unit}`;
                console.log(
                  "AJV Validation Error for volume:",
                  validate.errors
                );
              }
            } else {
              errorMessage = `No schema found for volume unit: ${unit}`;
            }
          }
        } else {
          if (value === undefined || value === null || value === "") {
            if (schema.required?.includes(keyParts[0])) {
              // errorMessage = `${keyParts[0]} is required and cannot be empty.`;
              errorMessage = t("devicePage.input validation error message", {
                field: keyParts[0],
              });
              console.log("Required Field Validation Error:", errorMessage);
            }
          } else {
            // Custom multipleOf check (if applicable)
            if (
              property.multipleOf &&
              !validateMultipleOf(value, property.multipleOf)
            ) {
              errorMessage = `${key} must be a multiple of ${property.multipleOf}`;
              console.log("Custom Validation Error:", errorMessage);
              return errorMessage;
            }

            // AJV validation
            const validate = ajv.compile(property);
            const isValid = validate(value);

            if (!isValid) {
              errorMessage = validate.errors?.[0]?.message || `Invalid ${key}`;
              console.log("AJV Validation Error:", validate.errors);
            }
          }
        }
      }

      return errorMessage;
    };

    // const startbuttonLabel = computed(() => {
    //   switch (selectedSample.value) {
    //     case "Flush-Continuous Run":
    //     case "Sample-Continuous Run":
    //       return "Start Run";
    //     case "start-flush":
    //       return "Start Flush";
    //     case "start-sample":
    //       return "Start Sample";
    //     case "Sample-Interval":
    //       return "Start Sample Interval";
    //     case "continuous-sample":
    //       return "Start Continuous Sample";
    //     default:
    //       return "Start";
    //   }
    // });

    const startbuttonLabel = computed(() => {
      const selected = availableSampleTypes.value.find(
        (s: any) => s.sample_type_key === selectedSample.value
      );

      // If found, return its label, otherwise fallback to "Start"
      return selected ? `Start ${selected.sample_type_label}` : "Start";
    });

    const startSample = async () => {
      console.log("formaData in startSample", formData.value);
      esignModalVisible.value = true;
    };

    const addSample = () => {
      console.log(":: from Data for adding sample ::", formData.value);

      const hasVolume =
        formData.value.volume &&
        formData.value.volume.value !== undefined &&
        formData.value.volume.unit !== undefined;

      // Get display unit name if volume exists
      const selectedUnit = hasVolume
        ? volumeUnits.value.find(
            (unit: any) => unit.unit === formData.value.volume.unit
          )
        : null;

      // Generate next unique ID
      const usedIds = new Set(sampleTableData.value.map((item) => item.id));
      let nextId = 0;
      while (usedIds.has(nextId)) {
        nextId++;
      }
      idCounter = nextId;

      // Base sample data
      const newSample: any = {
        ...formData.value,
        id: idCounter++,
      };

      // Add volume only if it's present
      if (hasVolume) {
        newSample.volume = {
          value: formData.value.volume.value,
          unit: formData.value.volume.unit,
        };
        newSample.volumeUnit = selectedUnit
          ? selectedUnit.x_nice_name
          : formData.value.volume.unit;
      }

      // Push to table
      sampleTableData.value.push(newSample);

      console.log(":: sample Data table ::", sampleTableData.value);

      // Post actions
      checkCrSample();
      createFormDataObj(currentTaskDefinition.value.input.properties);
    };

    const tableColumns = computed<Column[]>(() => {
      const inputProperties = renderInputTasks.value;

      if (!inputProperties) return [];

      const columns: Column[] = Object.keys(inputProperties)
        .filter((key) =>
          currentTaskDefinition.value?.input?.required.includes(key)
        ) // Exclude count_limits
        .map((key) => {
          if (key === "volume") {
            return [
              {
                title: "Volume",
                dataIndex: key,
                key,
                render: (text: any) =>
                  `${text} ${
                    inputProperties[key]?.oneOf[0]?.properties?.unit?.const ||
                    ""
                  }`,
              },
              {
                title: "Volume Unit",
                dataIndex: "volumeUnit",
                key: "volumeUnit",
                render: (text: any) => {
                  const unit = volumeUnits.value.find(
                    (unit: any) => unit.unit === text
                  );
                  return unit ? unit.x_nice_name : text || "";
                },
              },
            ];
          }

          return {
            title: inputProperties[key]?.x_nice_name || key,
            dataIndex: key,
            key,
          };
        })
        .flat();

      // Actions column
      columns.push({
        title: "Actions",
        dataIndex: "actions",
        key: "actions",
      });

      columns.forEach((each) => {
        each.title = translateLabel("devicePage", each.title);
      });

      return columns;
    });

    const deleteText = computed(() => {
      return selectedSample.value?.includes("Flush")
        ? "Are you sure to delete this flush?"
        : "Are you sure to delete this sample?";
    });

    const noDataText = computed(() => {
      return selectedSample.value?.includes("Flush")
        ? "Please add Flush to the list"
        : "Please add Sample to the list";
    });

    const EditTitle = computed(() => {
      return selectedSample.value?.includes("Flush")
        ? "Edit Flush"
        : "Edit Sample";
    });

    const populateNestedProperties = (property: Property): any => {
      if (property?.type === "object" && property?.properties) {
        const result: Record<string, any> = {};
        Object.keys(property.properties).forEach((key) => {
          const subProperty = property.properties![key];
          result[key] =
            subProperty?.type === "object" && subProperty?.properties
              ? populateNestedProperties(subProperty)
              : subProperty?.default !== undefined
              ? subProperty.default
              : null;
        });
        return result;
      }
      return null;
    };

    const createPreferableFormDataObj = (inputProperties: object) => {
      renderInputTasks.value = inputProperties;
      console.log(":::::::inputProperties data", inputProperties);

      if (renderInputTasks.value) {
        formData.value = {};
        Object.keys(renderInputTasks.value).forEach((key) => {
          const property = renderInputTasks.value[key];
          console.log(":::: property ::::", property, "::::: key :::::", key);

          if (key === "volume" && property.oneOf) {
            formData.value[key] = {};
            formData.value[key]["unit"] =
              property.oneOf[0].properties.unit.default ??
              property.oneOf[0].properties.unit.const;
            formData.value[key]["value"] =
              property.oneOf[0].properties.value.default ?? null;
          } else if (key === "delay_time") {
            // Explicitly handle delay_time default
            formData.value[key] =
              property.default !== undefined ? property.default : null;
          } else if (key === "count_limits" && property.type === "object") {
            formData.value[key] = {};
            Object.keys(property.properties || {}).forEach((nestedKey) => {
              const nestedProperty = property.properties[nestedKey];
              formData.value[key][nestedKey] = {};
              Object.keys(nestedProperty.properties || {}).forEach(
                (fieldKey) => {
                  const field = nestedProperty.properties[fieldKey];
                  formData.value[key][nestedKey][fieldKey] =
                    field.default !== undefined ? field.default : null;
                }
              );
            });
          } else if (key === "flow_limits" && property.type === "object") {
            formData.value[key] = {};
            Object.keys(property.properties || {}).forEach((fieldKey) => {
              const field = property.properties[fieldKey];
              formData.value[key][fieldKey] =
                field.default !== undefined ? field.default : null;
            });
          } else {
            // Default handling for all other fields
            let defaultValue;
            if (property.default !== undefined) {
              defaultValue = property.default;
            } else if (property.type === "string") {
              defaultValue = "";
            } else {
              defaultValue = null;
            }

            formData.value[key] = defaultValue;
          }
        });
      }
      console.log(
        "::createPreferableFormDataObj_formData.value::",
        formData.value
      );
    };

    const createFormDataObj = (
      inputProperties: object,
      savedValues: any = {}
    ) => {
      renderInputTasks.value = inputProperties;
      console.log(":::: createFormDataObj - savedValues :::::", savedValues);
      // renderInputTasks.value.location = {
      //   x_nice_name: "Location",
      //   type: "string",
      //   enum: ["Red", "Yellow", "Green  ", "Blue"],
      //   default: "Yellow",
      // };
      console.log(":::: inputProperties :::::", renderInputTasks.value);

      if (renderInputTasks.value) {
        formData.value = {};
        // Dynamically populate formData based on the properties in the template
        Object.keys(renderInputTasks.value).forEach((key) => {
          const property = renderInputTasks.value[key];
          console.log(":::: property ::::", property, "::::: key :::::", key);

          if (key === "volume" && property.oneOf) {
            console.log(":::: Processing volume - property:", property);
            console.log(":::: Volume oneOf[0]:", property.oneOf[0]);
            // Handle 'volume' property - use saved values if available
            if (savedValues[key]) {
              formData.value[key] = {
                unit:
                  savedValues[key].unit ||
                  property.oneOf[0].properties.unit.const,
                value:
                  savedValues[key].value ??
                  property.oneOf[0].properties.value.minimum,
              };
            } else {
              formData.value[key] = {};
              formData.value[key]["unit"] =
                property.oneOf[0].properties.unit.default ??
                property.oneOf[0].properties.unit.const;
              formData.value[key]["value"] =
                property.oneOf[0].properties.value.default ??
                property.oneOf[0].properties.value.minimum;
            }
          } else if (key === "count_limits" && property.type === "object") {
            // Handle 'count_limits' property
            if (savedValues[key] && typeof savedValues[key] === "object") {
              formData.value[key] = savedValues[key];
            } else {
              formData.value[key] = {};
              Object.keys(property.properties || {}).forEach((nestedKey) => {
                const nestedProperty = property.properties[nestedKey];
                formData.value[key][nestedKey] = {};
                Object.keys(nestedProperty.properties || {}).forEach(
                  (fieldKey) => {
                    const field = nestedProperty.properties[fieldKey];
                    formData.value[key][nestedKey][fieldKey] =
                      field.default !== undefined ? field.default : null;
                  }
                );
              });
            }
          } else if (key === "flow_limits" && property.type === "object") {
            // Handle 'flow_limits' property
            if (savedValues[key] && typeof savedValues[key] === "object") {
              formData.value[key] = savedValues[key];
            } else {
              formData.value[key] = {};
              Object.keys(property.properties || {}).forEach((fieldKey) => {
                const field = property.properties[fieldKey];
                formData.value[key][fieldKey] =
                  field.default !== undefined ? field.default : null;
              });
            }
          } else {
            // Default handling for other properties
            // Use saved value if available
            if (savedValues[key] !== undefined && savedValues[key] !== null) {
              formData.value[key] = savedValues[key];
            } else {
              // Fall back to default from schema
              let defaultValue;

              if (property.default !== undefined) {
                defaultValue = property.default;
              } else if (property.type === "string") {
                defaultValue = ""; // Assign empty string for string type when no default is provided
              } else {
                defaultValue = null; // Assign null for other types
              }

              formData.value[key] = defaultValue;
            }
          }

          console.log(
            "::createFormDataObj --> formData.value ::",
            formData.value
          );
        });
      }
    };

    // Function to create form data for sample_interval_info
    const createSampleIntervalFormData = (
      sampleIntervalData: object,
      savedValues: any = {}
    ) => {
      renderSampleInterval.value = sampleIntervalData;
      console.log("Sample Interval Data:", sampleIntervalData);
      console.log(
        ":::: createSampleIntervalFormData - savedValues :::::",
        savedValues
      );

      if (renderSampleInterval.value) {
        // Check if we have saved sample_interval_info data
        if (savedValues.sample_interval_info) {
          formData.value.sample_interval_info =
            savedValues.sample_interval_info;
        } else {
          formData.value.sample_interval_info = {};
        }

        // Only populate default values if we didn't already load saved values
        if (!savedValues.sample_interval_info) {
          const properties = renderSampleInterval.value.properties || {};
          Object.keys(properties).forEach((key) => {
            const property = properties[key];

            if (property.type === "object" && property.properties) {
              formData.value.sample_interval_info[key] = {};
              formData.value.sample_interval_info[key].value =
                property.properties.value.default !== undefined
                  ? property.properties.value.default
                  : property.properties.value.minimum || 0;
              formData.value.sample_interval_info[key].unit =
                property.properties.unit.default ||
                property.properties.unit.enum[0];
            } else if (property.type === "integer") {
              formData.value.sample_interval_info[key] =
                property.default !== undefined
                  ? property.default
                  : property.minimum || 0;
            }
          });
        }

        console.log(
          "::createSampleIntervalFormData --> formData.value ::",
          formData.value
        );
      }
    };

    const createRecordToEditObj = (record: any) => {
      console.log(":: record Data in createRecordToEditObj ::", record);
      console.log(":: recordToEdit.value ::", recordToEdit.value);

      if (renderInputTasks.value) {
        Object.keys(renderInputTasks.value).forEach((key) => {
          const property = renderInputTasks.value[key];
          console.log(":::: property ::::", property, "::::: key :::::", key);

          if (key === "volume" && property.oneOf) {
            // Handle 'volume' property
            recordToEdit.value[key] = {
              unit:
                record[key]?.unit || property.oneOf[0]?.properties.unit.const,
              value:
                record[key]?.value ||
                property.oneOf[0]?.properties.value.minimum ||
                null,
            };
          } else if (key === "count_limits" && property.type === "object") {
            // Handle 'count_limits' property
            recordToEdit.value[key] = {};
            Object.keys(property.properties || {}).forEach((nestedKey) => {
              const nestedProperty = property.properties[nestedKey];
              recordToEdit.value[key][nestedKey] = {};
              Object.keys(nestedProperty.properties || {}).forEach(
                (fieldKey) => {
                  const field = nestedProperty.properties[fieldKey];
                  recordToEdit.value[key][nestedKey][fieldKey] =
                    record[key]?.[nestedKey]?.[fieldKey] ??
                    (field.default !== undefined ? field.default : null);
                }
              );
            });
          } else if (key === "flow_limits" && property.type === "object") {
            // Handle 'flow_limits' property
            recordToEdit.value[key] = {};
            Object.keys(property.properties || {}).forEach((fieldKey) => {
              const field = property.properties[fieldKey];
              recordToEdit.value[key][fieldKey] =
                record[key]?.[fieldKey] ??
                (field.default !== undefined ? field.default : null);
            });
          } else {
            // Default handling for other properties
            recordToEdit.value[key] =
              record[key] ??
              (property.default !== undefined ? property.default : null);
          }
          recordToEdit.value["id"] = record.id;
        });
      }
    };
    onMounted(async () => {
      checkCrSample();
      sessionId.value = getSessionId();
      await getAssetTaskDefinations();
      await getUserSamplePreferences();
    });

    watch(selectedSample, (newSample) => {
      if (newSample && apcAssetTasks.value.task_defs) {
        // Update input based on selected sample type
        const taskDef = apcAssetTasks.value.task_defs.find(
          (def: any) => def.sample_type === newSample
        );
        if (taskDef) {
          apcAssetTasks.value.input = taskDef.input;
        }
      }

      if (newSample === "Sample-Interval") {
        createFormDataObj(currentTaskDefinition.value.input.properties);
        console.log(
          "apcAssetTasks.value after assignment:",
          apcAssetTasks.value
        );
      } else if (currentTaskDefinition.value?.input?.properties) {
        createFormDataObj(currentTaskDefinition.value.input.properties);
      }
      console.log("showAdvanceOption", showAdvanceOption.value);
    });

    return {
      formErrors,
      formRef,
      selectedSample,
      formData,
      sessionId,
      sampleTableData,
      currentTaskDefinition,
      renderInputTasks,
      isContinuousRun,
      isStartLoading,
      volumeUnits,
      clearTable,
      startSample,
      addSample,
      tableColumns,
      isStartButtonDisabled,
      isAddButtonDisabled,
      validateOnBlur,
      DeleteOutlined,
      EditOutlined,
      EyeInvisibleOutlined,
      EyeOutlined,
      LockOutlined,
      UserOutlined,
      togglePasswordVisibility,
      passwordVisible,
      handleEditClick,
      handleDeleteClick,
      confirmDelete,
      startbuttonLabel,
      recordToEdit,
      isEditModalVisible,
      SaveEditChanges,
      deleteText,
      EditTitle,
      isEditOkButtonDisabled,
      esignModalVisible,
      userName,
      password,
      handleSampleStart,
      handleCancel,
      openUserModal,
      esignformData,
      formLayout,
      editFormLayout,
      isFormValid,
      noDataText,
      isVerifyingSignature,
      translateLabel,
      handleEditCancel,
      handleInput,
      editFormErrors,
      handleUnitChange,
      checkCrSample,
      isAdvanceModalVisible,
      openAdvanceOptionModal,
      closeModalAdvanceOptions,
      closeModalEditAdvanceOptions,
      activeTab,
      tabs,
      openEditAdvanceOptionModal,
      isAdvanceEditModalVisible,
      saveEditAdvanceChanges,
      saveAdvanceChanges,
      isAdvancedFormOkDisabled,
      isEditAdvancedFormOkDisabled,
      isEditAdvancedFormOkBtnDisabled,
      isAdvancedFormOkBtnDisabled,
      showAdvanceOption,
      isStartbtnDisable,
      assignDefaultValues,
      isAddLinkDisabled,
      preventInvalidInput,
      createSampleIntervalFormData,
      renderSampleInterval,
      selectedOption,
      additionalOptions,
      supportedSampleType,
      handleOptionChange,
      createPreferableFormDataObj,
      saveSampleSettings,
      sampleSettingsButtonLabel,
      isSampleSettingsButtonDisabled,
      isSaveSettingsPopoverVisible,
      saveSettingsFormRef,
      saveSettingsFormData,
      saveSettingsFormRules,
      openSaveSettingsPopover,
      handleSaveSettingsConfirm,
      handleSaveSettingsCancel,
      popoverTitle,
      formLabel,
      popoverMessages,
      InfoCircleOutlined,
      availableSampleTypes,
      apcAssetTasks,
    };
  },
});
</script>

<style scoped>
.select-sample {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  min-height: 50px;
  align-items: center;
  margin-bottom: 15px;
}

.add-inputs {
  background-color: white;
}

.select-action-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 20px;
  padding-top: 20px;
}

.select-form-field {
  background-color: #fff;
  padding: 20px;
}

.advanced-options-content,
.edit-advanced-options-content {
  max-height: 65vh;
  overflow-y: auto;
}
</style>
<style>
.modalEdit .ant-modal-content {
  padding: 0px !important;
}

.modalEdit .ant-modal-header {
  padding: 16px 24px;
  color: rgba(0, 0, 0, 0.65);
  border-bottom: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
}

.modalEdit .ant-modal-body {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.modalEdit .ant-modal-footer {
  padding: 10px 16px;
  text-align: right;
  background: 0 0;
  border-top: 1px solid #e8e8e8;
  border-radius: 0 0 4px 4px;
}

.formConfirm {
  align-content: center;
  margin-top: 22px;
}

.no-table-data {
  height: 110px;
  display: flex;
  justify-content: center;
  background-color: white;
  align-items: center;
}

.ant-btn.custom-link-selectsample-advanced-options span {
  text-decoration: underline;
}

.ant-modal.advanced-modal .ant-modal-header {
  margin-bottom: 0 !important;
}

.ant-modal.advanced-modal .recordTitle,
.ant-modal.edit-advanced-modal .recordTitle {
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: left;
  height: 48px;
  color: black;
  font-size: 18px;
  padding-left: 0px;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
}

.advanced-modal .ant-modal-content,
.edit-advanced-modal .ant-modal-content {
  font-family: Montserrat-Regular, sans-serif;
  padding: 0 24px 24px !important;
  border-radius: 3px !important;
}

.advanced-modal .ant-modal-header,
.edit-advanced-modal .ant-modal-header {
  margin-bottom: 0;
}

.add-inputs {
  background-color: white;
}

.select-action-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 20px;
  padding-top: 20px;
}

.select-form-field {
  background-color: #fff;
  padding: 20px;
}

.advanced-options-content,
.edit-advanced-options-content {
  max-height: 65vh;
  overflow-y: auto;
}

.sample-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
  text-align: end;
  justify-content: end;
}

.sample-btn {
  display: flex;
  margin: 15px 0;
}

.select-sample-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.popover-footer {
  display: flex;
  justify-content: space-between;
}

.empty-wrapper {
  height: 300px; /* adjust the height as needed */
  display: flex;
  justify-content: center; /* horizontal center */
  align-items: center; /* vertical center */
  background-color: white;
}
</style>
