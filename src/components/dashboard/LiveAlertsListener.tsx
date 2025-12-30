"use client";

import { useEffect, useRef } from "react";
import { useTraccarSocket, SocketData } from "@/hooks/useTraccarSocket";
import { useNotification } from "@/context/NotificationContext";

export default function LiveAlertsListener() {
    const { addNotification } = useNotification();

    // Track processed event IDs to prevent duplicate alerts if socket reconnects or sends redundant data
    const processedEvents = useRef<Set<number>>(new Set());

    // Connect to socket with NO throttle for alerts (immediate)
    // We strictly care about 'events' here.
    useTraccarSocket((data: SocketData) => {
        if (data.events && data.events.length > 0) {
            data.events.forEach((event: any) => {
                if (!processedEvents.current.has(event.id)) {
                    processedEvents.current.add(event.id);

                    // Determine Type
                    // Traccar event types: deviceOnline, deviceOffline, deviceMoving, deviceStopped, 
                    // alarm, geofenceEnter, geofenceExit, etc.

                    let type: "info" | "success" | "warning" | "error" = "info";
                    let title = "Event";

                    switch (event.type) {
                        case "deviceOnline":
                            type = "success";
                            title = "Device Online";
                            break;
                        case "deviceOffline":
                            type = "warning";
                            title = "Device Offline";
                            break;
                        case "deviceMoving":
                        case "deviceStopped":
                            type = "info";
                            title = "Device Status";
                            break;
                        case "alarm":
                        case "overspeed":
                            type = "error";
                            title = "Alarm Alert";
                            break;
                        case "geofenceEnter":
                        case "geofenceExit":
                            type = "warning";
                            title = "Geofence Alert";
                            break;
                        default:
                            title = event.type.replace(/([A-Z])/g, ' $1').trim(); // camelCase to Normal Text
                            break;
                    }

                    // For alarms, the specific alarm type (e.g., "sos", "shock") is usually in attributes[alarm]
                    const message = event.attributes?.alarm
                        ? `Alarm: ${event.attributes.alarm} (Device #${event.deviceId})`
                        : `Device #${event.deviceId}: ${title}`;

                    addNotification(type, title, message, 6000);
                }
            });

            // Cleanup old events from Set to prevent memory leak (optional, kept simple for now)
            if (processedEvents.current.size > 1000) {
                processedEvents.current.clear();
            }
        }
    }, 0); // 0 throttle for immediate alerts!

    return null; // This component renders nothing, just logic
}
