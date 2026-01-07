import React, { useEffect } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll create/mock it or standard import

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    timestamp?: string;
}

interface ToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const borderColors = {
    success: "border-l-green-500",
    error: "border-l-red-500",
    warning: "border-l-orange-500",
    info: "border-l-blue-500",
};

export const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification.duration && notification.duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(notification.id);
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    return (
        <div
            className={cn(
                "flex w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 animate-in slide-in-from-right",
                "border-l-4",
                borderColors[notification.type]
            )}
        >
            <div className="p-4 flex items-start gap-3 w-full">
                <div className="flex-shrink-0 pt-0.5">
                    {icons[notification.type]}
                </div>
                <div className="flex-1 w-0">
                    <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        {notification.message}
                    </p>
                </div>
                <div className="flex-shrink-0 ml-4 flex">
                    <button
                        className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        onClick={() => onDismiss(notification.id)}
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
