<template>
  <span>
    {{ t(`devicePage.${column.title}`, `${column.title}`) }}
    <a-popover trigger="hover" @openChange="handlePopoverOpen">
      <template #content>
        <template v-if="infoType === 'arrayOfData'">
          <a-list
            size="small"
            bordered
            :data-source="renderDataTable"
            style="max-width: 500px; max-height: 300px; overflow-y: auto"
          >
            <template #renderItem="{ item }">
              <a-list-item
                ><div class="flex-container">
                  <span style="color: black; font-weight: bold; width: 35%"
                    >{{
                      t(`constantsTranslate['${item.name}']`, `${item.name}`)
                    }}
                    -
                  </span>
                  <span style="width: 65%">{{
                    t(`constantsTranslate['${item.value}']`, `${item.value}`)
                  }}</span>
                </div></a-list-item
              >
            </template>
            <template #header>
              <div style="color: black; font-weight: bold">
                {{
                  t(
                    `constantsTranslate['${headerContent}']`,
                    `${headerContent}`
                  )
                }}
              </div>
            </template>
          </a-list>
        </template>
        <template v-else-if="infoType === 'singleData'">
          <div style="color: black; max-width: 350px">
            {{
              t(`constantsTranslate['${headerContent}']`, `${headerContent}`)
            }}
          </div>
        </template>
        <template v-else-if="infoType === 'tableDataOfEvents'">
          <div style="width: 700px; height: 500px" class="scrollable-content">
            <a-table
              :data-source="tableData"
              :size="'small'"
              :pagination="false"
              :scroll="{ y: 400 }"
              class="custom-table"
            >
              <a-table-column
                title="Type of Event"
                data-index="name"
                key="name"
              ></a-table-column>
              <a-table-column
                title="When the event occur"
                data-index="value"
                key="value"
              ></a-table-column>
              <a-table-column
                title="Sample type"
                data-index="type"
                key="type"
              ></a-table-column>
            </a-table>
          </div>
        </template>
      </template>

      <InfoCircleOutlined />
    </a-popover>
  </span>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { InfoCircleOutlined } from "@ant-design/icons-vue";
import { Popover } from "ant-design-vue";
import InfoCommentsData from "@/common/constants.json";
import { useI18n } from "vue-i18n";

// Define the structure of the JSON data
interface InfoComments {
  [key: string]: any;
}

export default defineComponent({
  name: "ColumnTitle",
  components: {
    InfoCircleOutlined,
    "a-popover": Popover,
  },
  props: {
    column: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // Cast imported JSON data to the defined type
    const InfoComments: InfoComments = InfoCommentsData;
    const tableData = ref<{ name: string; value: string; type: string }[]>([]);
    const infoType = ref("");
    const renderDataTable = ref([]);
    const headerContent = ref("");
    const { t } = useI18n();
    onMounted(() => {
      console.log("propsColums::::", props.column);
    });
    const handlePopoverOpen = (visible: boolean) => {
      if (visible) {
        let comment;
        if (props.column.page === "data") {
          comment = InfoComments[props.column.page][props.column.title];
        } else {
          comment = InfoComments[props.column.page][props.column.title];
        }
        console.log("comment::::", comment);
        if (typeof comment === "object") {
          if (props.column.dataIndex === "event_type") {
            infoType.value = "tableDataOfEvents";
            tableData.value = comment.data.map((item: any) => ({
              name: item.name,
              value: item.value,
              type: item.type,
            }));
          } else {
            infoType.value = "arrayOfData";
            renderDataTable.value = comment.data;
            headerContent.value = comment.head;
          }
        } else if (typeof comment === "string") {
          infoType.value = "singleData";
          headerContent.value = comment;
        } else {
          infoType.value = "";
          headerContent.value = "Default tooltip content";
        }
      }
    };

    return {
      handlePopoverOpen,
      infoType,
      renderDataTable,
      headerContent,
      tableData,
      t,
    };
  },
});
</script>
<style>
.flex-container {
  display: flex;
  width: 100%;
}
</style>
