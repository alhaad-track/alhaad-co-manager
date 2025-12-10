"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Key, Clock, MapPin, AlertCircle, PowerOff } from "lucide-react";
import { useState } from "react";

export default function DashboardNotifications() {
    const [filter, setFilter] = useState("all");

    const notifications = [
        {
            id: 1,
            type: "IGNITION ON",
            count: 821,
            icon: Key,
            color: "text-gray-600",
            date: "today"
        },
        {
            id: 2,
            type: "IDLING",
            count: 330,
            icon: Clock,
            color: "text-orange-500",
            date: "today"
        },
        {
            id: 3,
            type: "ENTERED ZONE",
            count: 135,
            icon: MapPin,
            color: "text-blue-500",
            date: "week"
        },
        {
            id: 4,
            type: "LEFT ZONE",
            count: 135,
            icon: MapPin,
            color: "text-purple-500",
            date: "week"
        },
        {
            id: 5,
            type: "DEVICE UNPLUGGED",
            count: 2,
            icon: PowerOff,
            color: "text-red-500",
            date: "month"
        },
    ];

    const filteredNotifications = notifications.filter(item => {
        if (filter === "all") return true;
        if (filter === "today") return item.date === "today";
        if (filter === "week") return item.date === "today" || item.date === "week";
        return true;
    });

    return (
        <Card className="border-none shadow-sm bg-white h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Notifications</CardTitle>
                <Select defaultValue="all" onValueChange={setFilter}>
                    <SelectTrigger className="w-[80px] h-7 text-xs">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredNotifications.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-full">
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.type}</p>
                                    <p className="text-lg font-bold text-gray-800">{item.count}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                        <div className="text-center text-xs text-gray-400 py-4">
                            No notifications for this period.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
