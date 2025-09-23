<template>
  <div class="web-terminal-container">
    <div class="terminal-header">
      <div class="terminal-title">
        <CodeOutlined />
        <span>{{ t("monitorPage.DAS Terminal", title) }}</span>
      </div>
      <div class="terminal-controls">
        <div class="connection-status">
          <LinkOutlined v-if="isConnected" class="status-icon connected" />
          <DisconnectOutlined v-else class="status-icon disconnected" />
          <span class="status-text">{{
            isConnected
              ? t("monitorPage.Connected", "Connected")
              : t("monitorPage.Disconnected", "Disconnected")
          }}</span>
        </div>
        <a-button size="small" @click="reconnect" :loading="isConnecting">
          {{ t("monitorPage.Reconnect", "Reconnect") }}
        </a-button>
        <a-button size="small" @click="toggleFullscreen">
          <FullscreenOutlined v-if="!isFullscreen" />
          <FullscreenExitOutlined v-else />
        </a-button>
      </div>
    </div>
    <div ref="terminalContainer" class="terminal-body"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { message } from "ant-design-vue";
import { SocketService } from "@/services/socketService";
import { environment } from "@/environment/environment";
import {
  CodeOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from "@ant-design/icons-vue";
import "xterm/css/xterm.css";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "WebTerminal",
  components: {
    CodeOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    LinkOutlined,
    DisconnectOutlined,
  },
  props: {
    title: {
      type: String,
      default: "Terminal",
    },
    wsUrl: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const terminalContainer = ref<HTMLElement>();
    const terminal = ref<Terminal>();
    const fitAddon = ref<FitAddon>();
    const socketService = ref<SocketService>();
    const sessionId = ref<string>("");

    const isConnected = ref(false);
    const isConnecting = ref(false);
    const isFullscreen = ref(false);
    const { t } = useI18n();

    const initTerminal = () => {
      if (!terminalContainer.value) return;

      if (terminal.value) return;

      terminal.value = new Terminal({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: "#1e1e1e",
          foreground: "#d4d4d4",
          cursor: "#aeafad",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#e5e5e5",
        },
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 10000,
        tabStopWidth: 4,
        // scrollSensitivity: 3,
        // fastScrollSensitivity: 5,
        // rightClickSelectsWord: true,
        // allowTransparency: false,
        // overviewRulerWidth: 10,
      });

      fitAddon.value = new FitAddon();
      terminal.value.loadAddon(fitAddon.value);

      terminal.value.open(terminalContainer.value);
      fitAddon.value.fit();

      terminal.value.writeln("Welcome to DAS Terminal");
      terminal.value.writeln("Connecting to terminal server...");
      terminal.value.writeln("");

      terminal.value.onData((data: any) => {
        if (socketService.value && sessionId.value) {
          const socket = (socketService.value as any).socket;
          if (socket) {
            socket.emit("terminal:write", {
              sessionId: sessionId.value,
              data: data,
            });
          }
        }
      });

      terminal.value.onResize((size: any) => {
        if (socketService.value && sessionId.value) {
          const socket = (socketService.value as any).socket;
          if (socket) {
            socket.emit("terminal:resize", {
              sessionId: sessionId.value,
              cols: size.cols,
              rows: size.rows,
            });
          }
        }
      });

      window.addEventListener("resize", handleWindowResize);
    };

    const handleWindowResize = () => {
      if (fitAddon.value) {
        fitAddon.value.fit();
      }
    };

    const connectWebSocket = () => {
      isConnecting.value = true;

      socketService.value = new SocketService(
        environment.MONITORING_URL || `http://${props.wsUrl}`,
        "ms"
      );

      socketService.value.connectSocket();

      const socket = (socketService.value as any).socket;

      socket.on("connect", () => {
        console.log("Socket.IO connected for terminal");

        socket.emit("terminal:create", {}, (response: any) => {
          if (response.error) {
            message.error(`Failed to create terminal: ${response.error}`);
            isConnecting.value = false;
            return;
          }

          sessionId.value = response.session.sessionId;
          isConnected.value = true;
          isConnecting.value = false;

          if (terminal.value) {
            terminal.value.writeln("Terminal session created");
            terminal.value.focus();
          }
        });
      });

      socket.on("terminal:output", (data: any) => {
        if (data.sessionId === sessionId.value && terminal.value) {
          terminal.value.write(data.data);
        }
      });

      socket.on("connect_error", (error: any) => {
        isConnecting.value = false;
        console.error("Socket.IO connection error:", error);
      });

      socket.on("disconnect", (reason: string) => {
        isConnected.value = false;
        isConnecting.value = false;
        if (terminal.value) {
          terminal.value.writeln(`\r\n[Disconnected: ${reason}]`);
        }
      });
    };

    const disconnectWebSocket = () => {
      if (socketService.value && sessionId.value) {
        const socket = (socketService.value as any).socket;
        if (socket) {
          socket.emit("terminal:destroy", {
            sessionId: sessionId.value,
          });
        }
        socketService.value.disconnectSocket();
        socketService.value = undefined;
        sessionId.value = "";
      }
      isConnected.value = false;
    };

    const reconnect = () => {
      disconnectWebSocket();
      if (terminal.value) {
        terminal.value.clear();
      }
      setTimeout(() => {
        connectWebSocket();
      }, 100);
    };

    const toggleFullscreen = () => {
      if (!terminalContainer.value) return;

      const container = terminalContainer.value.parentElement;
      if (!container) return;

      if (!isFullscreen.value) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }

      isFullscreen.value = !isFullscreen.value;

      setTimeout(() => {
        if (fitAddon.value) {
          fitAddon.value.fit();
        }
      }, 100);
    };

    onMounted(() => {
      nextTick(() => {
        initTerminal();

        connectWebSocket();
      });
    });

    onUnmounted(() => {
      disconnectWebSocket();
      window.removeEventListener("resize", handleWindowResize);

      try {
        if (fitAddon.value) {
          fitAddon.value.dispose();
        }

        if (terminal.value) {
          terminal.value.dispose();
        }
      } catch (error) {
        console.log("unmounted error", error);
      }
    });

    return {
      terminalContainer,
      isConnected,
      isConnecting,
      isFullscreen,
      reconnect,
      toggleFullscreen,
      t,
    };
  },
});
</script>

<style scoped>
.web-terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #000000;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.terminal-title {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.85);
  font-size: 16px;
  font-weight: 500;
}

.terminal-title > span {
  margin-left: 8px;
}

.terminal-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.connected {
  color: #52c41a;
}

.status-icon.disconnected {
  color: #ff4d4f;
}

.status-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

/* .terminal-body {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  background-color: #1e1e1e;
}

:deep(.xterm) {
  height: 100%;
} */

.terminal-body {
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
  position: relative;
}

/* Fixed xterm styles to prevent scrollbar issues */
:deep(.xterm) {
  height: 100%;
  width: 100%;
  position: relative;
  padding: 12px;
  box-sizing: border-box;
}

:deep(.xterm-viewport) {
  overflow-y: auto;
}

:deep(.ant-btn-sm) {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
}

/* Fullscreen styles */
.web-terminal-container:fullscreen {
  width: 100vw;
  height: 100vh;
}

.web-terminal-container:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
}

.web-terminal-container:-moz-full-screen {
  width: 100vw;
  height: 100vh;
}

.web-terminal-container:-ms-fullscreen {
  width: 100vw;
  height: 100vh;
}
</style>
