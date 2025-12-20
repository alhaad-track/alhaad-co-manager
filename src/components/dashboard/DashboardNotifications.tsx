"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Key, Clock, MapPin, AlertCircle, PowerOff, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function DashboardNotifications({ events = [] }: { events?: any[] }) {
    const [filter, setFilter] = useState("all");

    // Categorize events exactly like Alerts Page
    const categorizedEvents = events.map(event => {
        let type = "other";
        if (event.type === "geofenceEnter" || event.type === "deviceOnline") type = "entry";
        else if (event.type === "geofenceExit") type = "exit";
        else if (event.type === "deviceOverspeed" || (event.type === "alarm" && event.attributes?.alarm === "overspeed")) type = "speed";
        else if (event.type === "deviceOffline") type = "warning";
        return { ...event, category: type };
    });

    const stats = {
        entry: categorizedEvents.filter(e => e.category === "entry").length,
        exit: categorizedEvents.filter(e => e.category === "exit").length,
        speed: categorizedEvents.filter(e => e.category === "speed").length,
        warning: categorizedEvents.filter(e => e.category === "warning").length,
        other: categorizedEvents.filter(e => e.category === "other").length
    };

    const notificationTypes = [
        {
            id: "entry",
            label: "Entry / Online",
            count: stats.entry,
            icon: MapPin,
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            id: "exit",
            label: "Exit",
            count: stats.exit,
            icon: MapPin,
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            id: "speed",
            label: "Speeding",
            count: stats.speed,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-100"
        },
        {
            id: "warning",
            label: "Warnings / Offline",
            count: stats.warning,
            icon: AlertTriangle,
            color: "text-yellow-600",
            bg: "bg-yellow-100"
        },
        {
            id: "other",
            label: "Other Events",
            count: stats.other,
            icon: Bell,
            color: "text-gray-600",
            bg: "bg-gray-100"
        }
    ];

    const filteredNotifications = notificationTypes.filter(item => {
        if (item.count === 0) return false;
        if (filter === "all") return true;
        return item.id === filter;
    });

    return (
        <Card className="border-none shadow-sm bg-white h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">System Notifications (Today)</CardTitle>
                <Select defaultValue="all" onValueChange={setFilter}>
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="entry">Entry</SelectItem>
                        <SelectItem value="exit">Exit</SelectItem>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredNotifications.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${item.bg}`}>
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                                    <p className="text-lg font-bold text-gray-800">{item.count}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                        <div className="text-center text-xs text-gray-400 py-4">
                            {filter === "all" ? "No events recorded today." : "No events of this type."}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
