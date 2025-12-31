import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "@/context/SocketContext";
import { SocketData, TraccarDevice, TraccarPosition } from "@/types/traccar";

export function useTraccarSocket(onData?: (data: SocketData) => void, throttleMs: number = 2000) {
    const { status, subscribe } = useSocketContext();
    const onDataRef = useRef(onData);

    // Buffer to store incoming updates between flushes
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

                // console.debug(`[Socket] Flushing batch`);
                onDataRef.current(payload);
            }
        }, throttleMs);

        return () => clearInterval(interval);
    }, [throttleMs]);


    // Subscribe to Context
    useEffect(() => {
        // If throttleMs is 0, we bypass buffering and call onDataRef directly
        const unsubscribe = subscribe((data: SocketData) => {
            if (throttleMs === 0) {
                if (onDataRef.current) onDataRef.current(data);
                return;
            }

            // Otherwise, buffer it
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

            // Events usually bypass throttle or are handled separately
            // For now, let's pass events immediately across
            if (data.events && onDataRef.current) {
                onDataRef.current({ events: data.events });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [subscribe, throttleMs]);

    return { status };
}
