import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useWebSocket = (url) => {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    // Initialize socket connection with namespace
    socket.current = io(`${url}/socket.io`, {
      transports: ["websocket"],
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socket.current.on("connected", (data) => {
      console.log("Server confirmed connection:", data);
    });

    socket.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socket.current.on("error", (error) => {
      console.error("Socket error:", error);
    });

    const heartbeat = setInterval(() => {
      if (socket.current?.connected) {
        socket.current.emit("heartbeat");
      }
    }, 30000);

    socket.current.on("heartbeat-ack", () => {
      console.log("Heartbeat acknowledged");
    });

    return () => {
      clearInterval(heartbeat);
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [url]);

  return { socket: socket.current, isConnected };
};
