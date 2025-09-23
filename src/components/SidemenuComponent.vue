<template>
  <div style="height: calc(100vh - 275px)">
    <ul
      :class="{ collapsed: isCollapsed, 'menu-ul': 'true' }"
      nz-menu
      nzTheme="dark"
      nzMode="inline"
    >
      <template v-for="task in tasks" :key="task.id">
        <template v-if="task.type === 'renderMenu'">
          <li
            v-for="(item, index) in task.items"
            :key="index"
            :class="{
              'ant-menu-item-selected':
                (isSelected(item.url) &&
                  isSelected(item.url) === ($route.path === item.url)) ||
                $route.path.includes(item.url),
              'menu-items': true,
              'menu-disabled': item.name.toUpperCase() === 'EM UPDATE',
            }"
            :style="{
              alignItems: isCollapsed ? 'center' : 'flex-start',
              backgroundColor: '#436c79',
              opacity: item.name === 'EM UPDATE' ? 0.5 : 1,
              pointerEvents: item.name === 'EM UPDATE' ? 'none' : 'auto',
            }"
            nz-menu-item
          >
            <router-link
              v-if="item.name.toUpperCase() !== 'EM UPDATE'"
              :to="item.url"
              @click="handleDeviceType(item.url)"
            >
              <component :is="getIconComponent(item.name)" class="icon" />
              <span class="letterSpace" :hidden="isCollapsed">{{
                translateLabel("commonData", item.name)
              }}</span>
            </router-link>

            <!-- Disabled version (no router-link) -->
            <div v-else class="disabled-link">
              <component :is="getIconComponent(item.name)" class="icon" />
              <span class="letterSpace disabled-link" :hidden="isCollapsed">{{
                translateLabel("commonData", item.name)
              }}</span>
            </div>
          </li>
        </template>
        <template v-else-if="task.type === 'renderLogo'">
          <span>
            <img :src="task.details.imagePath" :alt="task.details.altText" />
          </span>
        </template>
      </template>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import {
  HomeOutlined,
  GoldOutlined,
  DatabaseOutlined,
  AuditOutlined,
  ExperimentOutlined,
  UserOutlined,
  FileSyncOutlined,
  ContainerOutlined,
  UserAddOutlined,
  NotificationOutlined,
  LaptopOutlined,
  MonitorOutlined,
} from "@ant-design/icons-vue";
import { useStore } from "vuex";
import { translateLabel } from "@/common/utils";

export default defineComponent({
  props: {
    tasks: {
      type: Array,
      required: true,
    },
    isCollapsed: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();

    type IconMap = {
      [key: string]: typeof HomeOutlined;
    };

    const iconMap: IconMap = {
      HOME: HomeOutlined,
      INSTRUMENT: GoldOutlined,
      MEASURE: ExperimentOutlined,
      DATA: DatabaseOutlined,
      AUDIT: AuditOutlined,
      MANAGE: UserOutlined,
      LIMS: FileSyncOutlined,
      OTHER: ContainerOutlined,
      CLIENTS: UserAddOutlined,
      NOTIFICATION: NotificationOutlined,
      MONITORING: LaptopOutlined,
      MFG: MonitorOutlined,
      EMUPDATE: DatabaseOutlined,
    };

    const getIconComponent = computed(() => {
      return (itemName: string) => {
        const normalizedKey = itemName.toUpperCase().replace(/\s+/g, "");
        console.log("getIconComponent", normalizedKey);
        return iconMap[normalizedKey] || null;
      };
    });

    const isSelected = (url: string) => {
      const selected = useRoute().path === url;
      if (selected) {
        console.log("Selected URL:", url);
      }
      return selected;
    };

    const handleDeviceType = (url: string) => {
      console.log("handleDeviceTypeURL::", url);
      if (url === "/devicetype") {
        store.dispatch("setDeviceTypeId", null);
        localStorage.removeItem("deviceTypeId");
      }
    };

    return {
      getIconComponent,
      isSelected,
      handleDeviceType,
      props,
      translateLabel,
    };
  },
});
</script>

<style scoped>
.collapsed li .icon {
  padding-top: 8px;
  padding-left: 0px;
}

.menu-items:hover {
  background-color: #32505a !important;
}

.letterSpace {
  letter-spacing: 1px;
  color: white;
}

.menu-ul {
  max-height: 100%;
  overflow-y: auto;
  height: inherit;
  list-style-type: none;
  padding-left: 0;
  font-size: 14px;
  line-height: 40px;
  text-overflow: ellipsis;
}
.menu-ul::-webkit-scrollbar {
  width: 5px;
}
.menu-ul::-webkit-scrollbar-track {
  background-color: rgba(30, 29, 29, 0.035);
}
.menu-ul::-webkit-scrollbar-thumb {
  background-color: #db5e27 !important;
}
.menu-ul::-webkit-scrollbar-thumb:hover {
  background-color: #db5e27 !important;
}

.ant-menu-item-selected {
  background-color: #32505a !important;
  border-left: 3px solid #db5e27;
}

.ant-menu-item-selected span {
  color: #fff;
}

.ant-menu-dark.ant-menu-inline .ant-menu-item {
  width: 100%;
}
li {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.menu-items {
  font-family: Montserrat-Bold;

  font-size: 12px;
  color: #fff;
  text-transform: uppercase;
  font-weight: bolder;
  letter-spacing: 1px;
  padding: 9px 0;
}

.footer {
  bottom: 0px;
  padding: 20px 10px;
  font-size: 14px;
  background: #1f3339;
  text-align: center;
  color: white;
  position: fixed;
  left: 0;
  width: 160px;
}

.mb-10 {
  margin-bottom: 10px;
}

.version-number {
  font-size: 12px;
  color: #1890ff;
}
.icon {
  color: #ffffff;
  font-size: 18px;
  margin: 0 15px;
}
.menu-disabled {
  cursor: not-allowed;
}
.disabled-link {
  display: flex;
  align-items: center;
  width: 100%;
  color: #d3c8c8;
}
</style>
