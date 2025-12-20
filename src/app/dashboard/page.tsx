"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Truck, AlertTriangle, Wifi, WifiOff, PlayCircle, PauseCircle } from "lucide-react";
import TripStats from "@/components/dashboard/TripStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import { getUsers, getDrivers, getDevices, getEvents } from "@/lib/api";

export default function DashboardPage() {
    const [counts, setCounts] = useState({
        users: 0,
        drivers: 0,
        vehicles: 0,
        alerts: 0
    });
    const [deviceStatus, setDeviceStatus] = useState({
        online: 0,
        offline: 0,
        unknown: 0
    });
    const [movementStatus, setMovementStatus] = useState({
        moving: 0,
        stopped: 0
    });
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // 1. Fetch Users, Drivers, Devices first
                const [usersData, driversData, devicesData] = await Promise.all([
                    getUsers().catch(() => []),
                    getDrivers().catch(() => []),
                    getDevices().catch(() => [])
                ]);

                // 2. Fetch Events using Device IDs (Required by Traccar API)
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const eventParams = new URLSearchParams({
                    from: startOfDay.toISOString(),
                    to: now.toISOString()
                });

                if (Array.isArray(devicesData) && devicesData.length > 0) {
                    devicesData.forEach((d: any) => {
                        eventParams.append("deviceId", d.id);
                    });
                }

                // Only fetch events if we have devices, otherwise empty array
                const eventsData = (Array.isArray(devicesData) && devicesData.length > 0)
                    ? await getEvents(eventParams).catch(() => [])
                    : [];

                // Calculate Device Statuses
                let online = 0, offline = 0, unknown = 0;
                let moving = 0, stopped = 0;

                devicesData.forEach((d: any) => {
                    if (d.status === "online") online++;
                    else if (d.status === "offline") offline++;
                    else unknown++;

                    // Check motion - usually in attributes.motion (bool) or derived from speed > 0
                    if (d.attributes?.motion || (d.speed && d.speed > 0)) {
                        moving++;
                    } else {
                        stopped++;
                    }
                });

                setCounts({
                    users: usersData.length,
                    drivers: driversData.length,
                    vehicles: devicesData.length,
                    alerts: eventsData.length
                });

                setEvents(eventsData);
                setDeviceStatus({ online, offline, unknown });
                setMovementStatus({ moving, stopped });

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const stats = [
        {
            title: "Total Users",
            value: loading ? "-" : counts.users,
            icon: Users,
            description: "Active system users",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Total Drivers",
            value: loading ? "-" : counts.drivers,
            icon: Users,
            description: "Registered drivers",
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            title: "Total Vehicles",
            value: loading ? "-" : counts.vehicles,
            icon: Truck,
            description: "Fleet size",
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "System Alerts",
            value: loading ? "-" : counts.alerts,
            icon: AlertTriangle,
            description: "Events today",
            color: "text-red-600",
            bg: "bg-red-100"
        }
    ];

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome to Alhaad Track & Transport Management System
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Key Metrics</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Trip Statistics</h3>
                <TripStats />
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Analytics</h3>
                <DashboardCharts />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* 1. Notifications */}
                <DashboardNotifications events={events} />

                {/* 2. Fleet Status */}
                <Card className="border-none shadow-sm bg-white h-full">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Fleet Status</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-[300px] space-y-6">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <Wifi className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700">Online</span>
                            </div>
                            <span className="text-2xl font-bold text-green-700">{loading ? "-" : deviceStatus.online}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full text-red-600">
                                    <WifiOff className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700">Offline</span>
                            </div>
                            <span className="text-2xl font-bold text-red-700">{loading ? "-" : deviceStatus.offline}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-700">Unknown</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-700">{loading ? "-" : deviceStatus.unknown}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Movement Status */}
                <Card className="border-none shadow-sm bg-white h-full">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Movement Status</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-[300px] space-y-6">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                    <PlayCircle className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">Moving</span>
                                    <span className="text-xs text-muted-foreground">Currently in motion</span>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-blue-700">{loading ? "-" : movementStatus.moving}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                    <PauseCircle className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">Stopped</span>
                                    <span className="text-xs text-muted-foreground">Idle or parked</span>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-orange-700">{loading ? "-" : movementStatus.stopped}</span>
                        </div>

                        <div className="pt-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                Real-time monitoring of fleet activity.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
