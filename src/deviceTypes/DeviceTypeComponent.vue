<template>
  <a-row :gutter="16">
    <a-col :span="6" v-for="deviceType in deviceTypesList" :key="deviceType.id">
      <a-card class="deviceCard" :loading="deviceType.imageLoading">
        <img
          :src="getImageSrc(deviceType)"
          :alt="translateLabel('Instrument Label')"
          class="deviceImage"
        />
        <p>{{ translateLabel(deviceType.label) }}</p>
        <a-button
          type="primary"
          class="selectBtn"
          @click="selectDeviceType(deviceType)"
          >{{ translateLabel("Select") }}</a-button
        >
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDeviceTypes, getDevicePictureById } from "../services/apiService";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";

const store = useStore();
const router = useRouter();
const { t } = useI18n();
const deviceTypesList = ref<
  {
    id: string;
    label: string;
    picture_id?: string;
    picture?: { image: string };
    imageSrc?: string;
    imageLoading: boolean;
  }[]
>([]);

const fetchDeviceTypes = async () => {
  try {
    const { data } = await getDeviceTypes();
    deviceTypesList.value = data.map((deviceType: any) => ({
      ...deviceType,
      imageLoading: true,
    }));

    const picturePromises = data.map(async (deviceType: any) => {
      try {
        const pictureId = deviceType.picture_id;
        let imgSrc;

        if (pictureId) {
          const picture = await getDevicePictureById(pictureId);
          const TYPED_ARRAY = new Uint8Array(
            picture.data.medium_definition_image.data
          );
          const STRING_CHAR = TYPED_ARRAY.reduce((data, byte) => {
            return data + String.fromCharCode(byte);
          }, "");
          const base64String = btoa(STRING_CHAR);
          imgSrc = `data:image/jpeg;base64, ${base64String}`;
        } else if (deviceType.picture?.image) {
          imgSrc = deviceType.picture.image;
        }

        const deviceTypeIndex = deviceTypesList.value.findIndex(
          (dt) => dt.id === deviceType.id
        );
        deviceTypesList.value[deviceTypeIndex].imageSrc = imgSrc;
        deviceTypesList.value[deviceTypeIndex].imageLoading = false;
      } catch (error) {
        console.error(
          `Error fetching picture for instrument type ${
            deviceType.picture_id || deviceType.picture?.image
          }:`,
          error
        );
      }
    });

    await Promise.all(picturePromises);
  } catch (error) {
    console.error("Error fetching instrument types:", error);
  }
};
const translateLabel = (key: string) => {
  return t(`commonData.${key}`, `${key}`);
};

const getImageSrc = (deviceType: {
  picture_id?: string;
  picture?: { image: string };
  label: string;
  imageSrc?: string;
  imageLoading: boolean;
}) => {
  return deviceType.imageSrc || "";
};

onMounted(() => {
  fetchDeviceTypes();
  store.dispatch("setDeviceTypeId", null);
  localStorage.removeItem("deviceTypeId");
});

const selectDeviceType = (deviceType: { name: any; id: string }) => {
  console.log("deviceType:::::", deviceType);
  let deviceTypeName;
  if (deviceType) {
    if (deviceType.name === "smartplate") {
      deviceTypeName = "hp";
    } else {
      deviceTypeName = deviceType.name
        ? deviceType.name.toLowerCase()
        : undefined;
    }
    localStorage.setItem("deviceTypeId", deviceType.id);
    localStorage.setItem("deviceTypeName", deviceTypeName);
    store.dispatch("setDeviceTypeId", deviceType.id);
    store.dispatch("setDeviceTypeName", deviceTypeName);
    router.push(`/${deviceTypeName}/instrument`);
  }
};
</script>

<style lang="css" scoped>
.deviceImage {
  width: 100%;
  height: 170px;
  object-fit: contain;
  margin-bottom: 10px;
}

.deviceCard {
  border-radius: 0;
  text-align: center;
  transition: box-shadow 0.3s;
  padding: 0 15px;
  margin-top: 10px;
  height: 298px;
}

.deviceCard:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.selectBtn {
  width: 100px;
}
</style>
