import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      setIsConnected(false);
      return;
    }
    const token = localStorage.getItem("connectx_token");
    const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
      auth: { token }, transports: ["websocket"],
    });
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("user_online", ({ userId }) => setOnlineUsers(p => new Set([...p, userId])));
    socket.on("user_offline", ({ userId }) => setOnlineUsers(p => { const n = new Set(p); n.delete(userId); return n; }));
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user]);

  const emit = (event, data) => socketRef.current?.emit(event, data);
  const on = (event, cb) => {
    socketRef.current?.on(event, cb);
    return () => socketRef.current?.off(event, cb);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, emit, on, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
