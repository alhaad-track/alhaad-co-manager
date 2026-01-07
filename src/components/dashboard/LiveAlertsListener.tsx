"use client";

import { useEffect, useRef } from "react";
import { useTraccarSocket } from "@/hooks/useTraccarSocket";
import { SocketData } from "@/types/traccar";
import { useNotification } from "@/context/NotificationContext";

export default function LiveAlertsListener() {
    const { addNotification } = useNotification();
    const processedEvents = useRef<Set<number>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio (Preload)
        // Using a generic notification sound (Glass Ping or similar)
        // Alternative: /sounds/notification.mp3 if user had one, but we use a remote one for now.
        // Let's use a Data URI for a simple beep or a reliable CDN link. 
        // Using a distinct "Ping" sound.
        audioRef.current = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
    }, []);

    useTraccarSocket((data: SocketData) => {
        if (data.events && data.events.length > 0) {
            console.log("[LiveAlerts] Received events:", data.events);

            let hasNewEvent = false;

            data.events.forEach((event: any) => {
                if (!processedEvents.current.has(event.id)) {
                    processedEvents.current.add(event.id);
                    hasNewEvent = true;

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
                            type = "warning";
                            title = "Entered Geofence";
                            break;
                        case "geofenceExit":
                            type = "warning";
                            title = "Exited Geofence";
                            break;
                        default:
                            title = event.type.replace(/([A-Z])/g, ' $1').trim();
                            break;
                    }

                    let messageBody = event.attributes?.message || event.attributes?.alarm || title;

                    let message = `Device #${event.deviceId}: ${messageBody}`;

                    if (event.geofenceId) {
                        message += ` (Geofence #${event.geofenceId})`;
                    }

                    // Traccar events usually have serverTime or eventTime
                    addNotification(type, title, message, 6000, event.eventTime || event.serverTime);
                }
            });

            // Play Sound if at least one new event
            if (hasNewEvent && audioRef.current) {
                audioRef.current.play().catch(err => console.error("Audio play failed:", err));
            }

            if (processedEvents.current.size > 1000) {
                processedEvents.current.clear();
            }
        }
    }, 0);

    return null;
}
