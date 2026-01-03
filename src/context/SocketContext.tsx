"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { traccarApi } from "@/lib/api";
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
                // 1. Get a session token via the Proxy
                const tokenRes = await traccarApi("/api/session/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "expiration=" + new Date(Date.now() + 86400000).toISOString()
                });

                if (!tokenRes.ok) throw new Error("Failed to get session token");

                const tokenData = await tokenRes.text();

                if (!isMounted) return;

                // 1. Connect Directly
                const wsUrl = `${process.env.NEXT_PUBLIC_TRACCAR_SOCKET_URL}?token=${tokenData}`;
                console.log("[SocketContext] Connecting...");

                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log("[SocketContext] Connected");
                    if (isMounted) setStatus("connected");
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
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
