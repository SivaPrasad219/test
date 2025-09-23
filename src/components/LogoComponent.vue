<template>
  <div v-if="logoDetails && logoDetails.altText" class="logo-item">
    <img
      :src="imageLogo"
      :alt="logoDetails.altText"
      :class="{ collapsed: isCollapsed }"
      class="logoImg"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";

export default defineComponent({
  props: {
    isCollapsed: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    logoDetails: {
      type: Object as PropType<{ imagePath: string; altText: string }>,
      required: true,
    },
  },
  setup(props) {
    const imageLogo = computed(() => {
      const imagePath = props.isCollapsed
        ? "logo-icon.png"
        : props.logoDetails.imagePath;
      return require(`../assets/${imagePath}`);
    });

    return {
      imageLogo,
    };
  },
});
</script>

<style scoped>
.logo-item {
  padding: 8px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logoImg {
  width: 100px;
  transition: width 0.3s ease, padding 0.3s ease;
  height: auto;
}

.collapsed {
  width: 50px !important;
  padding: 10px !important;
  transition: width 0.3s ease, padding 0.3s ease !important;
}

.logoImg[alt="Company Logo"] {
  width: 100%;
  padding: 5px;
}

.logoImg[alt="User Avatar"] {
  width: 50px;
}

.collapsed .logoImg {
  width: 40px;
  padding: 10px;
}
</style>
