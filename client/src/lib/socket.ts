import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

// Socket singleton instance
let socket: Socket | null = null;

export const initializeSocket = (userId: string, token: string) => {
  if (!socket) {
    // In development, connect to your local server
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    socket = io(API_URL, {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Setup global handlers
    socket.on("connect", () => {
      console.log("Socket connected!");
    });
    
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// React hook for socket state
export const useSocket = (userId: string, token: string) => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!userId || !token) return;
    
    const socketInstance = initializeSocket(userId, token);
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    
    // Set initial state
    setIsConnected(socketInstance.connected);
    
    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
    };
  }, [userId, token]);
  
  return { socket, isConnected };
};