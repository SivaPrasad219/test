<template>
  <div>
    <div class="select-sample">
      <h4>{{ translateLabel("devicePage", "Select a Sample Type") }}</h4>

      <a-select
        :getPopupContainer="(triggerNode: any) => triggerNode.parentElement
        "
        v-model:value="selectedSample"
        style="width: 200px; margin-left: 15px"
        @change="clearTable"
        :placeholder="translateLabel('devicePage', 'Select sample type')"
      >
        <a-select-option
          v-for="(sampleType, index) in apcAssetTasks?.supported_sample_types"
          :key="index"
          :value="sampleType"
        >
        </a-select-option>
      </a-select>
    </div>

    <template v-if="renderInputTasks !== null">
      <div class="add-inputs">
        <div class="select-action-title">
          <div>
            <h4>
              {{ translateLabel("devicePage", "Measurement Parameters") }}
            </h4>
          </div>
        </div>
        <div class="select-form-field">
          <a-row gutter="{20}" v-if="renderInputTasks">
            <template v-for="(property, key) in renderInputTasks" :key="key">
              <!-- Volume Field -->

              <template
                v-if="
                  String(key) === 'volume' &&
                  formData.volume &&
                  apcAssetTasks?.input?.required.includes(key)
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
                      :placeholder="
                        translateLabel('devicePage', 'Enter Volume')
                      "
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
                  key !== 'count_limits' &&
                  apcAssetTasks?.input?.required.includes(key)
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
            </template>
          </a-row>

          <!-- Other Controls -->
          <a-row justify="space-between" align="middle">
            <!-- Advance Options Button -->
            <a-col>
              <a-button
                v-if="showAdvanceOption"
                type="link"
                @click="openAdvanceOptionModal()"
                style="padding: 0"
                :disabled="isAddLinkDisabled"
                class="custom-link-selectsample-advanced-options"
              >
                {{ translateLabel("dataPage", "Advanced Options") }}</a-button
              >
            </a-col>

            <!-- Add Button -->
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
              <!-- Render Actions Column -->
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

              <!-- Render Volume Column -->
              <template v-else-if="column?.dataIndex === 'volume'">
                {{ record.volume.value }}
              </template>

              <!-- Render Volume Units -->
              <template v-else-if="column?.dataIndex === 'volumeUnit'">
                {{ record.volumeUnit }}
              </template>
            </template>

            <!-- Empty State -->
            <template #emptyText>
              <span>{{ translateLabel("devicePage", `${noDataText}`) }}</span>
            </template>
          </a-table>

          <!-- Button to Start Sample -->
          <div
            style="
              width: 100%;
              text-align: end;
              margin-top: 15px;
              margin-bottom: 15px;
            "
          >
            <a-button
              type="primary"
              @click="startSample"
              :loading="isStartLoading"
              :disabled="
                isStartbtnDisable ||
                selectedAssetData.connection_status === 'disconnected'
              "
            >
              <!-- ||
                selectedAssetData.connection_status === 'disconnected' -->
              {{ translateLabel("devicePage", startbuttonLabel) }}
            </a-button>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Edit Modal -->
  <a-modal
    v-model:open="isEditModalVisible"
    :title="translateLabel('devicePage', `${EditTitle}`)"
    class="modalEdit"
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
              <!-- Use full width for single column -->
              <a-form-item
                :label="
                  property.x_nice_name || translateLabel('devicePage', 'Volume')
                "
                :validateStatus="editFormErrors['volume'] ? 'error' : ''"
                :help="editFormErrors['volume'] || ''"
                style="min-height: 60px"
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
                  :min="property.oneOf[0]?.properties?.value?.minimum"
                  :max="property.oneOf[0]?.properties?.value?.maximum"
                />
              </a-form-item>
            </a-col>

            <!-- Form Item for 'volume.unit' -->
            <a-col :span="24">
              <a-form-item :label="property.x_nice_name || 'Volume Unit'">
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
            apcAssetTasks?.input?.required.includes(key)
          "
        >
          <a-col :span="24">
            <a-form-item
              :label="translateLabel('devicePage', property.x_nice_name || key)"
              :validateStatus="editFormErrors[key] ? 'error' : ''"
              :help="editFormErrors[key] || ''"
              style="margin-right: 20px; min-height: 80px"
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
      </template>

      <!-- Button for Advanced Options -->
      <!-- <a-button
        v-if="showAdvanceOption"
        type="default"
        @click="openEditAdvanceOptionModal"
      >
        {{ translateLabel("devicePage", "Advanced Options") }}
      </a-button> -->

      <a-button
        v-if="showAdvanceOption"
        type="link"
        @click="openEditAdvanceOptionModal"
        style="padding: 0"
        class="custom-link-selectsample-advanced-options"
      >
        {{ translateLabel("dataPage", "Advanced Options") }}</a-button
      >
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
        :disabled="!isFormValid"
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
          <div>Advanced Options</div>
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
              <a-row gutter="{20}" align="middle" v-if="renderInputTasks">
                <template
                  v-for="(property, key) in renderInputTasks"
                  :key="key"
                >
                  <!-- Generic Field -->
                  <template
                    v-if="
                      key !== 'count_limits' &&
                      key !== 'volume' &&
                      key !== 'flow_limits'
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
                                  formErrors?.[key]?.[nestedKey]?.[fieldKey]
                                    ? 'error'
                                    : ''
                                "
                                :help="
                                  formErrors?.[key]?.[nestedKey]?.[fieldKey] ||
                                  ''
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
                                formErrors?.[key]?.[fieldKey] ? 'error' : ''
                              "
                              :help="formErrors?.[key]?.[fieldKey] || ''"
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
      <a-button @click="closeModalAdvanceOptions">Cancel</a-button>
      <a-button
        type="primary"
        @click="saveAdvanceChanges"
        :disabled="isAdvancedFormOkBtnDisabled"
        >Ok</a-button
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
                      key !== 'flow_limits'
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
import { defineComponent, ref, computed, onMounted, PropType } from "vue";
import { message } from "ant-design-vue";
// import { nextTick } from "vue";

// import ApcAdvanceOptionModalComponent from "./ApcAdvanceOptionModalComponent.vue";
import {
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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
    const ajv = new Ajv({ allErrors: true, strict: false });
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
    const apcAssetTasks = ref<any>();
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
    const tabs = ref([
      { key: "1", title: "Advanced Options", content: "" },
      // { key: "2", title: "Pre Config Option", content: "" },
    ]);

    const passwordVisible = ref(false);

    const togglePasswordVisibility = () => {
      //console.log("lock function calling", passwordVisible.value);
      passwordVisible.value = !passwordVisible.value;
    };

    const volumeUnits = computed(() => {
      return renderInputTasks.value?.volume.oneOf.map((obj: any) => ({
        unit: obj.properties.unit.const,
        x_nice_name: obj.properties.unit.x_nice_name,
        x_unit_short: obj.properties.unit.const,
      }));
    });

    const decodedTokenString = localStorage.getItem("DecodedToken");
    let loggedInUsername = "";

    if (decodedTokenString) {
      const decodedToken = JSON.parse(decodedTokenString);

      loggedInUsername = decodedToken.username;
    }

    const esignformData = ref({
      username: "",
      password: "",
    });

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
      const requiredKeys = apcAssetTasks.value?.input?.required || [];
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
      const requiredKeys = apcAssetTasks.value?.input?.required || [];

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

    const showAdvanceOption = computed(() => {
      const requiredKeys = apcAssetTasks.value?.input?.required || [];
      const formKeys = Object.keys(formData.value);

      // Check if formData contains any keys not in requiredKeys
      return formKeys.some((key) => !requiredKeys.includes(key));
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

        esignModalVisible.value = false;
        isStartLoading.value = true;
        isVerifyingSignature.value = false;

        const allData = {
          formData: { ...formData.value },
          tableData: [...sampleTableData.value],
        };

        const singleSampleParam = assignDefaultValues(
          formData.value,
          apcAssetTasks.value
        );
        console.log(":: single sample params ::", singleSampleParam, allData);

        let apcJobPayload: any;

        const selectedTask = renderInputTasks.value;
        console.log("::: renderInputTasks ::: Data ::", selectedTask);

        if (!isContinuousRun.value) {
          apcJobPayload = {
            audit_event_id: auditTaskResultEventId,

            job_def_id: selectedTask?.job_def_id,
            asset_type_id: parseInt(deviceTypeId.value),
            source: "IN-HOUSE",
            asset_id: props.selectedAssetData.asset_id,
            session_id: sessionId.value,
            sample_type: selectedSample.value,
            params: singleSampleParam,
          };
          console.log(":: sample Payload data ::", apcJobPayload);
        } else {
          // Convert sampleTableData into the required format for continuous runs
          // const continuousParamsArray = (data: any[]): any[] => {
          //   return data.map((sample: any) => {
          //     const result: any = sample;
          //     return result;
          //   });
          // };

          const continuousRunParamsArray = assignDefaultValues(
            sampleTableData.value,
            apcAssetTasks.value
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
            asset_id: props.selectedAssetData.asset_id,
            session_id: sessionId.value,
            sample_type: selectedSample.value,
            params: continuousRunParamsArray,
          };
          console.log(":: sample Payload data ::", apcJobPayload);
        }

        try {
          const sampleType = apcJobPayload.sample_type || "";
          const response = await apcService.createApcJob(apcJobPayload);
          console.log("createApcJob(apcJobPayload)", response);
          isStartLoading.value = false;
          isVerifyingSignature.value = false;

          console.log("::::::::::sampletype", sampleType);
          message.success(
            `${sampleType} ${t(
              "devicePage.Started Successfully",
              "Started Successfully"
            )}`
          );
          emit("prevStep");
        } catch (error) {
          console.log("createJob error", error);
          isStartLoading.value = false;
          isVerifyingSignature.value = false;
        }
      } catch (error) {
        console.log("esignConfirmLogin error", error);
        isVerifyingSignature.value = false;
        message.error(
          `${t(
            "commonData.Authentication failed for",
            "Authentication failed for"
          )} "${loggedInUsername}"`
        );
      }
    };

    const handleCancel = () => {
      esignModalVisible.value = false; // Hide the modal
      console.log(":: called handle cancled");
      // resetForm(); // Reset form data, assuming you have a method to reset form-specific data
    };

    // Method to handle the Cancel button click
    const handleEditCancel = () => {
      console.log(":: editFormDataClone ::", editFormDataClone.value);
      isEditModalVisible.value = false; // Hide the modal
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
    };
    const openAdvanceOptionModal = () => {
      advanceOptionClone = _.cloneDeep(formData.value);
      console.log(":: advanceOptionClone.value ::", advanceOptionClone);
      isAdvanceModalVisible.value = true;
    };
    const openEditAdvanceOptionModal = () => {
      isAdvanceEditModalVisible.value = true;
      advanceOptionEditFormClone = _.cloneDeep(recordToEdit.value);
      console.log(":: openEditAdvanceOptionModal ::", formData.value);
    };

    const getAssetTaskDefinations = async () => {
      try {
        const response = await apcService.getApcAssetIdTaskDefinitions(
          props.selectedAssetData.asset_id
        );

        console.log("::: getApcAssetIdTaskDefinitions :::", response);
        // Ensure response is an object and has supported_sample_types
        if (
          response &&
          response.supported_sample_types &&
          Array.isArray(response.supported_sample_types)
        ) {
          apcAssetTasks.value = response;
          console.log(
            "apcAssetTasks.value after assignment:",
            apcAssetTasks.value
          );

          if (
            !selectedSample.value &&
            response.supported_sample_types.length > 0
          ) {
            selectedSample.value = response.supported_sample_types[0];
          }

          createFormDataObj(apcAssetTasks.value.input.properties);
        } else {
          console.log(
            "Invalid response format or unsupported sample types:",
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
    };
    const saveAdvanceChanges = () => {
      isAdvanceModalVisible.value = false;
    };

    const handleDeleteClick = (record: any, column: any) => {
      console.log("delete", record, column);
    };

    const confirmDelete = (record: any) => {
      console.log("record", record);
      sampleTableData.value = sampleTableData.value.filter(
        (each) => each.id !== record.id
      );
      message.success(
        `${t(
          "devicePage.Sample deleted successfully",
          "Sample deleted successfully"
        )}`
      );
    };

    const clearTable = () => {
      sampleTableData.value = [];
      if (
        selectedSample.value === "Flush-Continuous Run" ||
        selectedSample.value === "Sample-Continuous Run"
      ) {
        isContinuousRun.value = true;
      } else {
        isContinuousRun.value = false;
      }

      checkCrSample();
      createFormDataObj(apcAssetTasks.value.input.properties);
    };

    const handleInput = (value: any, key: string, isEditForm: boolean) => {
      console.log("handleInput called with:", { key, value, isEditForm });

      // Get the schema property for the current key
      const properties = apcAssetTasks.value?.input?.properties;
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

    const handleUnitChange = (isEditForm: boolean) => {
      const targetData = isEditForm ? recordToEdit.value : formData.value;

      // First, update the volume unit and value in the target data
      const volumeData = targetData.volume;
      if (volumeData) {
        // After the unit changes, ensure the volume data is validated
        validateOnBlur("volume", volumeData, isEditForm); // Validate entire volume object (value and unit)
      }

      // Now, validate all other fields in the target data
      Object.keys(targetData).forEach((key) => {
        if (key !== "volume") {
          // Skip volume as it is already validated
          validateOnBlur(key, targetData[key], isEditForm); // Validate other fields
        }
      });
    };

    const validateField = (key: string, value: any, inputSchema: any) => {
      console.log(":::: inputSchema ::::", inputSchema);

      // Split the key into parts to handle nested properties
      const keyParts = key.split(",");

      // Traverse through the properties schema using keyParts
      const property = keyParts.reduce((acc: any, part: string) => {
        if (!acc) {
          console.log(`No schema found for key part: ${part}`);
          return null;
        }

        if (acc.type === "object" && acc.properties) {
          // If we encounter an object, move deeper into its properties
          return acc.properties[part];
        } else {
          // Otherwise, continue moving down based on the key part
          return acc[part];
        }
      }, inputSchema.properties);
      if (!property) {
        console.log(`No schema found for key: ${key}`);
        return null;
      }

      let errorMessage = null;

      if (key === "volume") {
        const volumeData = value;
        if (volumeData && volumeData.unit) {
          const unit = volumeData.unit;
          const volumeSchema = property.oneOf.find(
            (schema: any) => schema.properties.unit.const === unit
          );

          if (volumeSchema) {
            // Dynamically validate based on the unit (L or CF)
            const validate = ajv.compile(volumeSchema);
            const isValid = validate(volumeData);

            if (!isValid) {
              errorMessage =
                validate.errors?.[0]?.message ||
                `Validation failed for volume with unit ${unit}`;
              console.log("AJV Validation Error for volume:", errorMessage);
            }
          } else {
            errorMessage = `No schema found for volume unit: ${unit}`;
          }
        }
      } else {
        // Regular validation for non-volume fields or nested fields
        if (value === undefined || value === null || value === "") {
          // Check if the field is required
          if (inputSchema.required?.includes(keyParts[0])) {
            errorMessage = `${keyParts[0]} is required and cannot be empty.`;
            console.log("Required Field Validation Error:", errorMessage);
          }
        } else {
          // Perform AJV validation for non-empty values
          const validate = ajv.compile(property);
          const isValid = validate(value);

          if (!isValid) {
            errorMessage = validate.errors?.[0]?.message; // Get the first error message
            console.log(":: validate.errors ::", validate.errors);
            console.log("AJV Validation Error:", errorMessage);
          }
        }
      }

      // else {
      //   // Regular validation for non-volume fields or nested fields
      //   const validate = ajv.compile(property);
      //   const isValid = validate(value);

      //   if (!isValid) {
      //     errorMessage = validate.errors?.[0]?.message; // Get the first error message
      //     console.log(":: validate.errors ::", validate.errors);
      //     console.log("AJV Validation Error:", errorMessage);
      //   }
      // }

      return errorMessage;
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

      // Traverse the keyParts to create the necessary nested structure
      keyParts.forEach((keyPart, index) => {
        // If we're at the last key part, set the error message
        if (index === keyParts.length - 1) {
          nestedErrors[keyPart] = errorMessage;
        } else {
          // Otherwise, ensure the nested object exists and navigate deeper
          nestedErrors[keyPart] = nestedErrors[keyPart] || {};
          nestedErrors = nestedErrors[keyPart]; // Move to the next level of nesting
        }
      });
    };

    const validateOnBlur = (key: string, value: any, isEditForm: boolean) => {
      console.log("validateOnBlur key :::", key);
      const inputSchema = apcAssetTasks.value?.input;
      const properties = apcAssetTasks.value?.input?.properties;

      if (!properties) {
        console.log("No input properties found in schema.");
        return;
      }

      const keyParts = key.split(",");
      console.log(":::: keyParts ::::", keyParts);

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

      if (!property) {
        console.log(`No schema found for key: ${key}`);
        return;
      }

      let parsedValue;
      const targetData = isEditForm ? recordToEdit.value : formData.value;

      // Special handling for "volume"
      if (key === "volume" || key === "volumeUnit") {
        const volumeData = targetData.volume;
        if (!volumeData) {
          console.log("Volume data is missing.");
          return;
        }

        // Only parse the volume data if it's valid, otherwise do not change it
        parsedValue = {
          value: parseValueByType(
            volumeData.value,
            property?.oneOf?.[0]?.properties?.value?.type
          ),
          unit: volumeData.unit,
        };

        // Don't override `volume` with `null` if no changes are detected
        if (parsedValue.value === null || parsedValue.unit === null) {
          console.log("Volume or unit is invalid, skipping update.");
          return; // Don't update the value if it's invalid
        }

        targetData.volume = parsedValue;
        console.log("Parsed value for volume/volumeUnit:", parsedValue);
      } else {
        parsedValue = parseValueByType(value, property.type);
        let nestedObj = targetData;

        console.log(":::: nestedObj (targetData) ::::", nestedObj);
        console.log(":::: properties (schema) ::::", properties);

        for (let i = 0; i < keyParts.length - 1; i++) {
          const currentKey = keyParts[i];

          if (
            properties[currentKey] &&
            properties[currentKey].type === "object" &&
            properties[currentKey].properties
          ) {
            if (!nestedObj[currentKey]) {
              nestedObj[currentKey] = {};
            }
            nestedObj = nestedObj[currentKey];
          } else {
            if (!nestedObj[currentKey]) {
              nestedObj[currentKey] = {};
            }
            nestedObj = nestedObj[currentKey];
          }
        }

        const lastKey = keyParts[keyParts.length - 1];
        nestedObj[lastKey] = parsedValue;

        console.log("nestedObj", nestedObj);
        console.log("Parsed value for nested fields:", parsedValue);
      }

      const errorMessage = validateField(key, parsedValue, inputSchema);
      if (isEditForm) {
        setNestedError(editFormErrors.value, keyParts, errorMessage || null);
      } else {
        setNestedError(formErrors.value, keyParts, errorMessage || null);
        console.log(":::: formErrors.value ::::", formErrors.value);
      }

      if (errorMessage && !isEditForm) {
        console.log(
          `:: Validation error for ${key}: ${errorMessage} (isEditForm: ${isEditForm})`
        );
        if (isContinuousRun.value && isAdvanceEditModalVisible.value) {
          isEditAdvancedFormOkBtnDisabled.value = true;
        } else if (isAdvanceModalVisible.value) {
          isAdvancedFormOkBtnDisabled.value = true;
        } else if (isContinuousRun.value) {
          isAddButtonDisabled.value = true;
          isAddLinkDisabled.value = true;
        } else {
          isStartbtnDisable.value = true;
          isAddLinkDisabled.value = true;
        }
      } else {
        console.log(
          `:: Validation passed for ${key} (isEditForm: ${isEditForm})`
        );
        checkCrSample();
        isAddButtonDisabled.value = false;
        isEditAdvancedFormOkBtnDisabled.value = false;
        isAdvancedFormOkBtnDisabled.value = false;
        isAddLinkDisabled.value = false;
      }
      // checkCrSample();

      // AJV schema validation
      const schema = apcAssetTasks.value?.input;
      if (!schema) {
        console.log("No schema found for AJV validation.");
        return;
      }
      console.log(":: formErrors ::", formErrors.value);
    };

    const startbuttonLabel = computed(() => {
      switch (selectedSample.value) {
        case "Flush-Continuous Run":
        case "Sample-Continuous Run":
          return "Start Run";
        case "Flush-Single":
          return "Start Flush";
        case "Sample-Single":
          return "Start Sample";
        default:
          return "Start";
      }
    });

    const startSample = async () => {
      console.log("formaData in startSample", formData.value);
      esignModalVisible.value = true;
    };

    const addSample = () => {
      console.log(":: from Data for adding sample ::", formData.value);

      // Ensure the volume unit is mapped to the corresponding x_nice_name
      const selectedUnit = volumeUnits.value.find(
        (unit: any) => unit.unit === formData.value.volume.unit
      );

      // Create a new sample object, mapping volumeUnit to x_nice_name
      const newSample = {
        ...formData.value,
        id: idCounter++, // Incrementing the id counter
        volume: {
          value: formData.value.volume.value,
          unit: formData.value.volume.unit,
        }, // Correct structure for volume
        volumeUnit: selectedUnit
          ? selectedUnit.x_nice_name
          : formData.value.volume.unit, // Map volume.unit to x_nice_name
      };

      // Push the new sample to the sampleTableData
      sampleTableData.value.push(newSample);

      console.log(":: sample Data table ::", sampleTableData.value);

      checkCrSample();
      createFormDataObj(apcAssetTasks.value.input.properties);
    };

    const tableColumns = computed<Column[]>(() => {
      const inputProperties = renderInputTasks.value;

      if (!inputProperties) return [];

      const columns: Column[] = Object.keys(inputProperties)
        .filter((key) => apcAssetTasks.value?.input?.required.includes(key)) // Exclude count_limits
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
    const createFormDataObj = (inputProperties: object) => {
      renderInputTasks.value = inputProperties;
      console.log(inputProperties);

      if (renderInputTasks.value) {
        formData.value = {};
        // Dynamically populate formData based on the properties in the template
        Object.keys(renderInputTasks.value).forEach((key) => {
          const property = renderInputTasks.value[key];
          console.log(":::: property ::::", property, "::::: key :::::", key);

          if (key === "volume") {
            // Handle 'volume' property
            formData.value[key] = {};
            formData.value[key]["unit"] =
              property.oneOf[0].properties.unit.const;
            formData.value[key]["value"] =
              property.oneOf[0].properties.value.minimum;
          } else if (key === "count_limits" && property.type === "object") {
            // Handle 'count_limits' property
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
            // Handle 'flow_limits' property
            formData.value[key] = {};
            Object.keys(property.properties || {}).forEach((fieldKey) => {
              const field = property.properties[fieldKey];
              formData.value[key][fieldKey] =
                field.default !== undefined ? field.default : null;
            });
          } else {
            // Default handling for other properties
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

          console.log(
            "::createFormDataObj --> formData.value ::",
            formData.value
          );
        });
      }
    };

    const createRecordToEditObj = (record: any) => {
      console.log(":: record Data in createRecordToEditObj ::", record);
      console.log(":: recordToEdit.value ::", recordToEdit.value);

      if (renderInputTasks.value) {
        Object.keys(renderInputTasks.value).forEach((key) => {
          const property = renderInputTasks.value[key];
          console.log(":::: property ::::", property, "::::: key :::::", key);

          if (key === "volume") {
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
    });

    return {
      formErrors,
      selectedSample,
      formData,
      sessionId,
      sampleTableData,
      apcAssetTasks,
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
    };
  },
});
</script>

<style scoped>
.select-sample {
  background-color: #fff;
  display: flex;
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
</style>
