"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, Notification, NotificationType } from "@/components/ui/Toast";

interface NotificationContextType {
    addNotification: (type: NotificationType, title: string, message: string, duration?: number, timestamp?: string) => void;
    removeNotification: (id: string) => void;

    alerts: Notification[]; // History Log
    removeAlert: (id: string) => void; // Delete individual alert
    clearAlerts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]); // Active Toasts
    const [alerts, setAlerts] = useState<Notification[]>([]); // History Log

    const addNotification = useCallback((
        type: NotificationType,
        title: string,
        message: string,
        duration = 5000,
        timestamp?: string
    ) => {
        const id = Math.random().toString(36).substring(2, 9);
        const finalTimestamp = timestamp || new Date().toISOString();
        const newNotif: Notification = { id, type, title, message, duration, timestamp: finalTimestamp };

        // Add to Active Toasts
        setNotifications((prev) => [...prev, newNotif]);

        // Add to History (prepend)
        setAlerts((prev) => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const removeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            addNotification,
            removeNotification,
            alerts,
            removeAlert,
            clearAlerts
        }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-0 right-0 z-50 flex flex-col items-end gap-2 p-4 pointer-events-none sm:p-6 w-full max-w-sm">
                {notifications.map((notification) => (
                    <Toast
                        key={notification.id}
                        notification={notification}
                        onDismiss={removeNotification}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
