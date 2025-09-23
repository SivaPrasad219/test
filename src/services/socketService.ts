import io from "socket.io-client";
export class SocketService {
  SOCKET_URL: string;
  PATH: string;
  private socket: any;
  private clientName = "phziot";

  constructor(SOCKET_URL: string, PATH: string) {
    // Retrieve the decoded token from local storage
    const decodedToken = JSON.parse(
      localStorage.getItem("DecodedToken") || "{}"
    );
    this.clientName = decodedToken.customer_code;
    this.SOCKET_URL = SOCKET_URL;
    this.PATH = PATH;
    //console.log(":::: this.SOCKET_URL ::", SOCKET_URL);
    // this.SOCKET_URL = environment.MONITORING_URL;
  }
  connectSocket(): void {
    let connectionPath;
    if (this.PATH !== "") {
      connectionPath = `/${this.PATH}/socket.io/`;
    } else connectionPath = `/socket.io/`;
    // connectionPath = `/socket.io/`;
    this.socket = io(`${this.SOCKET_URL}`, {
      path: connectionPath,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    // console.log("Connected to socket server using SOCKET_URL", this.SOCKET_URL);

    this.socket.on("connect", () => {
      console.log("Connected to socket server using EIO3");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });
  }

  handleMessage(callback: (data: any) => void): void {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }
    this.socket.on("message", callback);
  }
  handleEdgemanMessage(callback: (data: any, topic: string) => void): void {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }
    this.socket.onAny((event: any, data: any) => {
      // console.log("handleEdgemanMessage Event received:", event, data);
      callback(data, event);
    });
  }

  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }
    this.socket.on(event, callback);
  }

  removeEventListener(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }
    this.socket.off(event, callback);
  }

  subscribeToRooms(topics: string | string[]): void {
    topics = Array.isArray(topics) ? topics : [topics];
    topics.forEach((topic) => {
      this.joinRoom(`${this.clientName}/${topic}`);
    });
  }

  leaveRooms(topics: string | string[]): void {
    topics = Array.isArray(topics) ? topics : [topics];
    topics.forEach((topic) => {
      this.leaveRoom(`${this.clientName}/${topic}`);
    });
  }

  private leaveRoom(room: string): void {
    this.socket?.emit("unsubscribe", room);
    // console.log(`Unsubscribed from room: ${room}`);
  }

  private joinRoom(room: string): void {
    this.socket?.emit("subscribe", room);
    console.log(`Subscribed to room: ${room}`);
  }

  disconnectSocket(): void {
    this.socket?.disconnect();
  }
}
