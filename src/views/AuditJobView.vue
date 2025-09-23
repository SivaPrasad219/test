<template>
  <div class="audit-view">
    <h2>{{ auditView.name }}</h2>

    <!-- Search bar -->
    <div class="search-bar">
      <select v-model="selectedColumn">
        <option
          v-for="column in columns"
          :value="column.dataIndex"
          :key="column.dataIndex"
        >
          {{ column.title }}
        </option>
      </select>
      <input type="text" v-model="searchText" placeholder="Search..." />
      <!-- <button @click="search">Search</button> -->
    </div>

    <!-- Audit table -->
    <div v-for="task in tasks" :key="task.id">
      <!-- <h3>{{ task.name }}</h3> -->
      <template v-if="task.type === 'defineColumns'">
        <a-table
          :columns="task.columns"
          :dataSource="filteredAudits"
          :pagination="false"
        >
        </a-table>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import auditMockData from "@/mockdata/auditMockData.json";

interface Audit {
  id: number;
  deviceId: string;
  deviceName: string;
  event: string;
  operator: string;
  deviceActionId: number;
  continuousRunId: number;
  timestamp: string;
  comments: string;
}

interface Column {
  title: string;
  dataIndex: string;
}

interface Task {
  id: number;
  name: string;
  type: string;
  columns: Column[];
}

interface AuditView {
  name: string;
  tasks: Task[];
}

const auditView = ref<AuditView>({
  name: auditMockData.name,
  tasks: auditMockData.jobs[0].tasks, // Assuming you're only interested in the tasks of the first job
});

const selectedColumn = ref<string>(""); // Selected column for search
const searchText = ref<string>(""); // Search text input

const audits = ref<Audit[]>([]);

const columns = computed(() => {
  const task = auditView.value.tasks.find(
    (task) => task.type === "defineColumns"
  );
  return task ? task.columns : [];
});

const tasks = computed(() => auditView.value.tasks);

const filteredAudits = computed(() => {
  if (!selectedColumn.value || !searchText.value) {
    return audits.value;
  }

  const searchRegex = new RegExp(searchText.value, "i");
  return audits.value.filter((audit) =>
    searchRegex.test(audit[selectedColumn.value])
  );
});

onMounted(() => {
  fetchAuditData();
});

function fetchAuditData() {
  // Simulate fetching audit data from an API
  setTimeout(() => {
    audits.value = [
      {
        id: 1,
        deviceId: "Device001",
        deviceName: "InstrumentA",
        event: "Event A",
        operator: "Operator A",
        deviceActionId: 123,
        continuousRunId: 456,
        timestamp: "2022-12-01 10:00:00",
        comments: "Comment A",
      },
      // Add more audit data as needed
    ];
  }, 1000);
}
</script>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}
.search-bar select,
.search-bar input,
.search-bar button {
  margin-right: 10px;
}
</style>
