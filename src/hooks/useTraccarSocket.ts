import { useEffect, useRef, useState, useCallback } from "react";
import { TRACCAR_BASE_URL, traccarApi } from "@/lib/api";

export interface TraccarPosition {
    id: number;
    deviceId: number;
    protocol: string;
    serverTime: string;
    deviceTime: string;
    fixTime: string;
    outdated: boolean;
    valid: boolean;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    course: number;
    address: string | null;
    attributes: Record<string, any>;
}

export interface TraccarDevice {
    id: number;
    name: string;
    uniqueId: string;
    status: string;
    lastUpdate: string;
    positionId: number;
    groupId: number;
    phone: string;
    model: string;
    contact: string;
    category: string | null;
    disabled: boolean;
    attributes: Record<string, any>;
}

export interface SocketData {
    positions?: TraccarPosition[];
    devices?: TraccarDevice[];
    events?: any[];
}

export function useTraccarSocket(onData?: (data: SocketData) => void, throttleMs: number = 2000) {
    const socketRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

    const onDataRef = useRef(onData);

    // Buffer to store incoming updates between flushes
    // We use Map to automatically deduplicate updates by ID (last write wins)
    const bufferRef = useRef({
        positions: new Map<number, TraccarPosition>(),
        devices: new Map<number, TraccarDevice>(),
    });

    useEffect(() => {
        onDataRef.current = onData;
    }, [onData]);

    // Throttling / Batching Logic
    useEffect(() => {
        if (!throttleMs) return;

        const interval = setInterval(() => {
            const hasPositions = bufferRef.current.positions.size > 0;
            const hasDevices = bufferRef.current.devices.size > 0;

            if ((hasPositions || hasDevices) && onDataRef.current) {
                // Convert Maps to Arrays
                const payload: SocketData = {};

                if (hasPositions) {
                    payload.positions = Array.from(bufferRef.current.positions.values());
                    bufferRef.current.positions.clear();
                }

                if (hasDevices) {
                    payload.devices = Array.from(bufferRef.current.devices.values());
                    bufferRef.current.devices.clear();
                }

                console.debug(`[Socket] Flushing batch: ${payload.positions?.length || 0} positions, ${payload.devices?.length || 0} devices`);
                onDataRef.current(payload);
            }
        }, throttleMs);

        return () => clearInterval(interval);
    }, [throttleMs]);

    useEffect(() => {
        let isMounted = true;

        const connect = async () => {
            if (socketRef.current?.readyState === WebSocket.OPEN) return;

            try {
                // 1. Get a session token via the Proxy (uses Cookie)
                setStatus("connecting");
                const tokenRes = await traccarApi("/api/session/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "expiration=" + new Date(Date.now() + 86400000).toISOString() // 24h token
                });

                if (!tokenRes.ok) {
                    throw new Error("Failed to get session token");
                }

                const tokenData = await tokenRes.text(); // Token is returned as text string
                // Traccar might return the token string directly

                if (!isMounted) return;

                // 2. Connect Directly to Traccar using the Token
                // Note: We skip the proxy and go direct, avoiding WS upgrade issues in Next/Turbopack
                const wsUrl = `ws://144.21.50.12/api/socket?token=${tokenData}`;

                console.log("Connecting to WebSocket with token...");
                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log("Traccar WebSocket Connected");
                    setStatus("connected");
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // Instead of dispatching immediately, add to buffer
                        if (data.positions) {
                            data.positions.forEach((pos: TraccarPosition) => {
                                bufferRef.current.positions.set(pos.deviceId, pos);
                            });
                        }

                        if (data.devices) {
                            data.devices.forEach((dev: TraccarDevice) => {
                                bufferRef.current.devices.set(dev.id, dev);
                            });
                        }

                        // Events are usually critical, so we might want to pass them through immediately
                        // or buffer them too. For now let's pass events immediately if need be, 
                        // but the interface doesn't strictly use events yet. 
                        // If 'events' key exists, we can dispatch it directly or add to buffer.
                        // For simplicity, let's treat positions/devices as the high-volume data to throttle.

                        if (data.events && onDataRef.current) {
                            onDataRef.current({ events: data.events });
                        }

                    } catch (err) {
                        console.error("Error parsing WebSocket message:", err);
                    }
                };

                socket.onclose = (event) => {
                    console.log("Traccar WebSocket Disconnected", event.code, event.reason);
                    if (isMounted) setStatus("disconnected");

                    // Simple reconnect logic
                    setTimeout(() => {
                        if (isMounted && (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED)) {
                            connect();
                        }
                    }, 5000);
                };

                socket.onerror = (error) => {
                    console.error("Traccar WebSocket Error:", error);
                    if (isMounted) setStatus("error");
                };

            } catch (error) {
                console.error("Failed to initialize WebSocket:", error);
                if (isMounted) setStatus("error");
                // Retry token fetch after delay
                setTimeout(() => {
                    if (isMounted) connect();
                }, 5000);
            }
        };

        connect();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures connection persists

    return { status };
}
