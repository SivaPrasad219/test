<template>
  <div :class="footerClass">
    <div class="version-number">{{ footerDetails.versionText }}</div>
    © {{ currentYear }} Phizzle, Inc.
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";

export default defineComponent({
  props: {
    footerDetails: {
      type: Object as PropType<{ versionText: string; copyrightText: string }>,
      required: true,
    },
    isCollapsed: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const currentYear = new Date().getFullYear();
    const footerClass = computed(() => ({
      footer: true,
      collapsed: props.isCollapsed,
      expanded: !props.isCollapsed,
    }));

    return {
      footerClass,
      currentYear,
    };
  },
});
</script>

<style scoped>
.footer {
  bottom: 0;
  padding: 25px 10px !important;
  font-size: 14px;
  background: #1f3339;
  text-align: center;
  color: white;
  position: fixed;
  left: 0;
  transition: width 0.3s;
  font-family: Montserrat-Regular, Montserrat, sans-serif;
  font-weight: 400;
  font-style: normal;
}

.footerClass {
  bottom: 0;
  padding: 25px 12px !important;
  font-size: 14px !important;
  background: #1f3339;
  text-align: center;
  color: #fff;
  position: fixed;
  left: 0;
  width: 160px;
}

.version-number {
  font-size: 12px;
  margin-bottom: 10px;
  color: #1890ff;
}

.footer.collapsed {
  width: 80px;
}

.footer.expanded {
  width: 160px;
}
</style>
