import { ref } from "vue";
import { SocketService } from "@/services/socketService";
import { emServiceStart } from "@/services/apiService";
import { environment } from "@/environment/environment";

export const useRestartService = () => {
  const isRestartModelVisible = ref(false);
  const selectedServiceType = ref("");
  const restartIps = ref<string[]>([]);

  const serviceOptions = [
    { label: "EdgeManager", value: "edgeman" },
    { label: "Screen", value: "screen" },
  ];

  const createSocketService = () => {
    return new SocketService(`${environment.MONITORING_URL}`, "ms");
  };

  const handleServiceRestart = () => {
    selectedServiceType.value = "";
    isRestartModelVisible.value = true;
  };

  const handleRestartModalClose = () => {
    isRestartModelVisible.value = false;
  };

  const handleRestartTypeUpload = async (
    data: any,
    socketService: SocketService
  ) => {
    console.log("data from the emit", data);
    selectedServiceType.value = data.serviceType;
    if (typeof data.ips[0] === "object") {
      restartIps.value = data.ips
        .filter(({ value }: { value: string }) => value !== "all")
        .map(({ value }: { value: string }) => value);
    } else {
      restartIps.value = data.ips;
    }
    console.log("restartIps", restartIps.value);
    restartIps.value.forEach((ip: string) => {
      socketService.subscribeToRooms(
        `instrument/apc/edgeman/control/status/${ip}`
      );
    });

    if (selectedServiceType.value === "screen") {
      await handleBatchScreenRestart();
    } else {
      await handleBatchEdgemanRestart();
    }
  };

  const handleBatchEdgemanRestart = async () => {
    try {
      const payload = {
        state: "serviceRestart",
        ipList: restartIps.value,
        service: "edgeman",
      };
      console.log(payload);
      const response = await emServiceStart(payload);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBatchScreenRestart = async () => {
    try {
      const payload = {
        state: "serviceRestart",
        ipList: restartIps.value,
        service: "screen",
      };
      console.log(payload);
      const response = await emServiceStart(payload);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  const handleSingleServiceRestart = async (
    ip: string,
    service: string,
    socketService: SocketService
  ) => {
    try {
      const payload = {
        state: "serviceRestart",
        ipList: [ip],
        service: service,
      };
      console.log(payload);
      const response = await emServiceStart(payload);
      console.log(`handle${service}Restart response`, response);

      socketService.subscribeToRooms(
        `instrument/apc/edgeman/control/status/${ip}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  return {
    isRestartModelVisible,
    selectedServiceType,
    restartIps,
    serviceOptions,
    createSocketService,
    handleServiceRestart,
    handleRestartModalClose,
    handleRestartTypeUpload,
    handleBatchEdgemanRestart,
    handleBatchScreenRestart,
    handleSingleServiceRestart,
  };
};
