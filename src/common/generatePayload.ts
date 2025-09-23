interface SettingsPayloadOptions {
  formData: Record<string, any>;
  selectedSample: string;
  assetId: string;
  preferedName: string;
  tableData: any[];
  volumeUnits: Record<string, string>;
  apcAssetTasks: any;
  assetInfo: {
    assetType: string;
    assetName: string;
    modelName: string;
  };
  createdBy: any;
}

export function generateSampleSettingsPayload(options: SettingsPayloadOptions) {
  const {
    formData,
    selectedSample,
    assetId,
    preferedName,
    tableData,
    volumeUnits,
    apcAssetTasks,
    assetInfo,
    createdBy,
  } = options;

  const taskInput = apcAssetTasks?.input || {};
  const inputProperties = taskInput.properties || {};
  const requiredFields = taskInput.required || [];

  const generatedProperties: Record<string, any> = {};

  for (const key in inputProperties) {
    const schema = inputProperties[key];

    if (key === "volume" && schema.oneOf && Array.isArray(schema.oneOf)) {
      const oneOfSchema = schema.oneOf[0];

      const volumeValue =
        formData?.volume?.value ?? oneOfSchema?.properties?.value?.default ?? 1;
      const volumeUnit =
        formData?.volume?.unit ?? oneOfSchema?.properties?.unit?.const ?? "CF";

      generatedProperties.volume = {
        oneOf: [
          {
            type: "object",
            required: ["value", "unit"],
            properties: {
              unit: {
                type: "string",
                const: volumeUnit,
                default: volumeUnit,
                x_nice_name: volumeUnits[volumeUnit] || volumeUnit,
              },
              value: {
                type: "integer",
                default: volumeValue,
                minimum: oneOfSchema?.properties?.value?.minimum ?? 1,
                maximum: oneOfSchema?.properties?.value?.maximum ?? 600,
              },
            },
          },
        ],
      };
    } else {
      const userVal = formData?.[key] ?? schema.default ?? "";
      const dynamicProp: Record<string, any> = {
        type: schema.type || typeof userVal,
        default: userVal,
      };

      if (schema.x_nice_name) {
        dynamicProp.x_nice_name = schema.x_nice_name;
      }

      generatedProperties[key] = dynamicProp;
    }
  }

  const dynamicPayload = {
    id: Math.floor(Math.random() * 10000), // you can replace this with real ID logic
    name: preferedName,
    preference: {
      measure_info: {
        apc: [
          {
            input: {
              type: "object",
              required: requiredFields,
              properties: generatedProperties,
            },
            asset_id: assetId,
            modal_name: assetInfo.modelName,
            device_name: assetInfo.assetName,
            sample_type: selectedSample,
            preference_name: preferedName,
            ...(tableData?.length ? { tableData } : {}),
          },
        ],
      },
    },
    created_by: parseInt(createdBy),
    created_at: new Date().toISOString(),
  };

  return dynamicPayload;
}
