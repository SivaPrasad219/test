<template>
  <div class="json-container">
    <pre>{{ jsonData }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "JsonPanelComponent",
  props: {
    jsonData: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    const { t } = useI18n();
    console.log(props.jsonData);
    // Function to translate a single key
    const translateKeysPerLanguage = (key: string) => {
      // Using the translation function to translate the key
      return t(`dataPage.${key}`, key); // Default to the original key if translation is missing
    };

    // Recursive function to translate JSON keys
    const translateJson = (data: any): any => {
      if (Array.isArray(data)) {
        // If the data is an array, map through and recursively translate each item
        return data.map((item) => translateJson(item));
      } else if (data && typeof data === "object") {
        // If the data is an object, translate each key and its corresponding value
        const translatedObject: Record<string, any> = {};
        for (const key in data) {
          const translatedKey = translateKeysPerLanguage(key);
          translatedObject[translatedKey] = translateJson(data[key]);
        }
        return translatedObject;
      }
      return data; // Return the value if it's not an object or array
    };

    return { translateJson };
  },
});
</script>

<style scoped>
.json-container {
  font-family: monospace;
  padding: 20px;
}
pre {
  overflow: hidden;
}
</style>
