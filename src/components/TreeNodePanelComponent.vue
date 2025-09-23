<template>
  <div class="treeNodePanel" v-if="treeData.length > 0">
    <a-tree :treeData="treeData" :defaultExpandAll="true" :key="treeKey">
      <template #title="{ key, nodevalue, dataRef }">
        <span class="tree-node">
          <span v-if="editingUid !== dataRef.uid">
            <span class="node-key" @click="attemptStartEdit(dataRef.uid, key)">
              {{ key }} :
            </span>
          </span>
          <span v-else>
            <CheckOutlined class="check-icon" @click="onKeyEdit(dataRef.uid)" />
            <a-input-group size="small" class="custom-input-group">
              <a-input
                v-model:value="editedKey"
                class="key-input"
                @keyup.enter="onKeyEdit(dataRef.uid)"
              />
            </a-input-group>
            <!-- <CloseOutlined
              class="delete-icon"
              @click="deleteNode(dataRef.uid)"
            /> -->
          </span>
          <span class="node-value"> {{ nodevalue }} </span>
        </span>
      </template>
    </a-tree>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from "vue";
import { Tree, Input } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import {
  CheckOutlined,
  // CloseOutlined
} from "@ant-design/icons-vue";
import { v4 as uuidv4 } from "uuid";

interface TreeNode {
  title: string;
  key: string;
  nodevalue: string | object | null;
  uid: string;
  children?: TreeNode[];
}

export default defineComponent({
  name: "TreeNodePanel",
  components: {
    "a-tree": Tree,
    "a-input": Input,
    CheckOutlined,
    // CloseOutlined,
  },
  props: {
    jsonData: {
      type: Object,
      required: true,
    },
  },
  setup(props, { emit }) {
    const treeData = ref<TreeNode[]>([]);
    const treeKey = ref<number>(0);
    const editingUid = ref<string | null>(null);
    const editedKey = ref<string>("");
    const { t } = useI18n();
    let userRole = "";
    // const changedKeys = ref<Record<string, string>>({});
    type NestedRecord = Record<string, Record<string, string>>;
    const changedKeys = ref<NestedRecord>({});

    const translateKeysPerLanguage = (recordDatakey: any) => {
      // console.log("recordDataVariablerecordDataVariable", recordDataVariable);
      return t(`dataPage.${recordDatakey}`);
    };

    watch(
      () => props.jsonData,
      (newValue) => {
        if (newValue) {
          treeData.value = transformData(newValue);
        }
      },
      { deep: true, immediate: true }
    );
    onMounted(() => {
      const decodedTokenString = localStorage.getItem("DecodedToken");
      console.log(":: props data in Editor ::", props.jsonData);
      if (decodedTokenString) {
        const decodedToken = JSON.parse(decodedTokenString);
        userRole = decodedToken.role;
        console.log("Customer ID::::::::", userRole);
      }
    });
    function transformData(data: any, parentKey = ""): TreeNode[] {
      const treeNodes: TreeNode[] = [];
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          const fullKey = parentKey ? `${key}` : key;
          const isLeaf = value === null || typeof value !== "object";
          const treeNode: TreeNode = {
            title: key,
            nodevalue: isLeaf ? String(value) : "",
            key: fullKey,
            uid: uuidv4(),
            children: isLeaf ? undefined : transformData(value, fullKey),
          };
          treeNodes.push(treeNode);
        }
      }
      return treeNodes;
    }

    function updateNodeInTreeData(
      treeData: TreeNode[],
      uid: string,
      newKey: string
    ): TreeNode[] {
      return treeData.map((node) => {
        if (node.uid === uid) {
          return {
            ...node,
            key: newKey,
          };
        } else if (node.children) {
          return {
            ...node,
            children: updateNodeInTreeData(node.children, uid, newKey),
          };
        } else {
          return node;
        }
      });
    }

    function convertToJSON(treeData: TreeNode[]): any {
      const jsonData: any = {};
      treeData.forEach((node) => {
        if (node.children && node.children.length > 0) {
          jsonData[node.key] = convertToJSON(node.children);
        } else {
          if (typeof node.nodevalue === "string") {
            jsonData[node.key] = parseValue(node.nodevalue);
          }
        }
      });
      return jsonData;
    }

    function parseValue(value: string): any {
      if (value === "null") {
        return null;
      }
      const numberValue = parseFloat(value);
      if (!isNaN(numberValue) && numberValue.toString() === value) {
        return numberValue;
      }
      return value;
    }

    function attemptStartEdit(uid: string, key: string) {
      if (userRole === "administrator") {
        startKeyEdit(uid, key);
      } else {
        console.log("Editing is not allowed for any users other than Admin");
      }
    }

    function startKeyEdit(uid: string, key: string) {
      editingUid.value = uid;
      editedKey.value = key;
    }

    function onKeyEdit(uid: string) {
      const node = findNodeByUid(treeData.value, uid);
      if (node) {
        console.log("node number validate", node);
        const oldKey = node.key;
        const newKey = editedKey.value;
        if (oldKey !== newKey) {
          if (!changedKeys.value[uid]) {
            changedKeys.value[uid] = {};
            changedKeys.value[uid][oldKey] = newKey;
          } else {
            const originalKey =
              Object.keys(changedKeys.value[uid]).find(
                (key) => changedKeys.value[uid][key] === oldKey
              ) || oldKey;
            changedKeys.value[uid][originalKey] = newKey;
          }
        }
        treeData.value = updateNodeInTreeData(treeData.value, uid, newKey);
        editingUid.value = null;
        const updatedJsonData = convertToJSON(treeData.value);
        emit("jsonEdited", updatedJsonData);
      }
    }

    function findNodeByUid(treeData: TreeNode[], uid: string): TreeNode | null {
      for (const node of treeData) {
        if (node.uid === uid) {
          return node;
        } else if (node.children) {
          const childNode = findNodeByUid(node.children, uid);
          if (childNode) {
            return childNode;
          }
        }
      }
      return null;
    }

    function emitChangedKeys() {
      if (Object.keys(changedKeys.value).length > 0) {
        emit("changedKeys", { ...changedKeys.value });
        // changedKeys.value = {};
      }
    }
    function clearChangedKeys() {
      changedKeys.value = {};
    }

    function deleteNode(uid: string) {
      function deleteRecursive(nodes: TreeNode[]): TreeNode[] {
        return nodes
          .filter((node) => node.uid !== uid)
          .map((node) => ({
            ...node,
            children: node.children
              ? deleteRecursive(node.children)
              : undefined,
          }));
      }
      treeData.value = deleteRecursive(treeData.value);
      const updatedJsonData = convertToJSON(treeData.value);
      emit("jsonEdited", updatedJsonData);
    }

    return {
      treeData,
      treeKey,
      editingUid,
      editedKey,
      startKeyEdit,
      attemptStartEdit,
      onKeyEdit,
      changedKeys,
      emitChangedKeys,
      clearChangedKeys,
      deleteNode,
      convertToJSON,
      translateKeysPerLanguage,
    };
  },
});
</script>

<style scoped>
.tree-node {
  display: inline-block;
  cursor: pointer;
  margin-right: 8px;
  position: relative;
}

.node-key {
  font-weight: bold;
  cursor: pointer;
}

.node-value {
  margin-left: 5px;
}

.delete-icon {
  color: #ff4d4f;
  cursor: pointer;
  margin-left: 5px;
}

.custom-input-group {
  display: inline-block;
  width: auto;
  margin-right: 8px;
}

.check-icon {
  cursor: pointer;
  color: #1890ff;
}
::v-deep .ant-tree-list-holder-inner {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
