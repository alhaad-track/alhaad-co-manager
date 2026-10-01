"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SocketData } from "@/types/traccar";
import { GO_TOKEN_KEY } from "@/lib/api";

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
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;

        const scheduleReconnect = () => {
            if (!isMounted) return;
            // 2s, 4s, 8s ... capped at 30s
            const delay = Math.min(30000, 2000 * 2 ** attempts++);
            reconnectTimer = setTimeout(connect, delay);
        };

        const connect = () => {
            if (!isMounted || socketRef.current) return;

            // /ws/live requires the Go API JWT; browsers can't send headers, so it goes in the query
            const token = typeof window !== "undefined" ? localStorage.getItem(GO_TOKEN_KEY) : null;
            if (!token) {
                setStatus("disconnected");
                scheduleReconnect();
                return;
            }

            setStatus("connecting");
            // Without an explicit socket URL, derive it from the Go API URL (http -> ws, https -> wss)
            const apiUrl = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8080";
            const baseUrl = process.env.NEXT_PUBLIC_GO_SOCKET_URL || `${apiUrl.replace(/^http/, "ws").replace(/\/+$/, "")}/ws/live`;
            const socket = new WebSocket(`${baseUrl}?token=${encodeURIComponent(token)}`);
            socketRef.current = socket;

            socket.onopen = () => {
                attempts = 0;
                console.log("[SocketContext] Connected");
                setStatus("connected");
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
                    subscribersRef.current.forEach(callback => callback(data));
                } catch (err) {
                    console.error("[SocketContext] Parse Error:", err);
                }
            };

            // The browser gives no details on WebSocket errors; onclose always follows and handles it
            socket.onerror = () => {
                console.warn(`[SocketContext] Connection to ${baseUrl} failed`);
            };

            socket.onclose = (event) => {
                if (socketRef.current === socket) socketRef.current = null;
                if (!isMounted) return;
                console.log("[SocketContext] Disconnected", event.code);
                setStatus("disconnected");
                scheduleReconnect();
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer);
            const socket = socketRef.current;
            socketRef.current = null;
            if (!socket) return;
            // Closing a socket that's still connecting makes the browser report an error
            // (e.g. React Strict Mode's double mount), so wait for it to open first
            socket.onerror = null;
            socket.onmessage = null;
            socket.onclose = null;
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => socket.close();
            } else {
                socket.close();
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
