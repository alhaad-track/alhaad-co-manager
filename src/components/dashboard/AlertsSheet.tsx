"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, X } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

export default function AlertsSheet() {
    const { alerts, clearAlerts, removeNotification } = useNotification();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600 hover:text-orange-600" />
                    {alerts.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col h-full">
                <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <SheetTitle>Recent Alerts ({alerts.length})</SheetTitle>
                    {alerts.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={clearAlerts}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {alerts.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No recent alerts
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={cn(
                                    "p-4 rounded-lg border bg-white shadow-sm relative group",
                                    alert.type === "error" ? "border-red-200 bg-red-50/50" :
                                        alert.type === "warning" ? "border-orange-200 bg-orange-50/50" :
                                            "border-gray-200"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={cn(
                                        "font-semibold text-sm",
                                        alert.type === "error" ? "text-red-700" :
                                            alert.type === "warning" ? "text-orange-700" :
                                                "text-gray-900"
                                    )}>
                                        {alert.title}
                                    </h4>
                                    <span className="text-xs text-gray-400">
                                        {/* Timestamp could be added to Notification object, for now just static or relative */}
                                        Just now
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {alert.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
