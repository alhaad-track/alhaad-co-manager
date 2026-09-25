"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SocketData } from "@/types/traccar";

interface SocketContextType {
    status: "connecting" | "connected" | "disconnected" | "error";
    subscribe: (callback: (data: SocketData) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocketContext must be used within a SocketProvider");
    }
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
    const socketRef = useRef<WebSocket | null>(null);
    const subscribersRef = useRef<Set<(data: SocketData) => void>>(new Set());

    // Memoize subscribe to ensure stable identity and prevent effect re-execution downstream
    const subscribe = useCallback((callback: (data: SocketData) => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        let reconnectTimer: NodeJS.Timeout;

        const connect = async () => {
            if (socketRef.current?.readyState === WebSocket.OPEN) return;

            try {
                setStatus("connecting");
                if (!isMounted) return;

                // Go API live stream (Redis pub/sub of forwarded Traccar positions)
                const wsUrl = process.env.NEXT_PUBLIC_GO_SOCKET_URL || "ws://localhost:8080/ws/live";
                console.log("[SocketContext] Connecting...");

                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log("[SocketContext] Connected");
                    if (isMounted) setStatus("connected");
                };

                socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.error) {
                            console.warn("[SocketContext] Server:", message.error);
                            return;
                        }
                        // Go API sends one raw position per message; wrap it in Traccar's socket shape
                        const data: SocketData = message.deviceId !== undefined ? { positions: [message] } : message;
                        // Broadcast to all subscribers
                        subscribersRef.current.forEach(callback => callback(data));
                    } catch (err) {
                        console.error("[SocketContext] Parse Error:", err);
                    }
                };

                socket.onclose = (event) => {
                    console.log("[SocketContext] Disconnected", event.code);
                    if (isMounted) setStatus("disconnected");
                    // Reconnect
                    if (isMounted) {
                        reconnectTimer = setTimeout(connect, 5000);
                    }
                };

                socket.onerror = (error) => {
                    console.error("[SocketContext] Error:", error);
                    if (isMounted) setStatus("error");
                };

            } catch (error) {
                console.error("[SocketContext] Init Error:", error);
                if (isMounted) setStatus("error");
                if (isMounted) {
                    reconnectTimer = setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer);
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, []);

    const value = useMemo(() => ({ status, subscribe }), [status, subscribe]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
