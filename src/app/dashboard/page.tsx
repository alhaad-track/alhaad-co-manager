import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Truck, AlertTriangle } from "lucide-react";
import { initialUsers, initialDrivers, initialVehicles } from "@/lib/data";
import TripStats from "@/components/dashboard/TripStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";

export default function DashboardPage() {
    const stats = [
        {
            title: "Total Users",
            value: initialUsers.length,
            icon: Users,
            description: "Active system users",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Total Drivers",
            value: initialDrivers.length,
            icon: Users,
            description: "Registered drivers",
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            title: "Total Vehicles",
            value: initialVehicles.length,
            icon: Truck,
            description: "Fleet size",
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "Active Alerts",
            value: "3", // Mock value
            icon: AlertTriangle,
            description: "Requires attention",
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
                <DashboardNotifications />

                {/* 2. Highest Idling Vehicles (Placeholder) */}
                <Card className="border-none shadow-sm bg-white h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Highest idling vehicles</CardTitle>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">TODAY</span>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 max-w-[200px]">
                            No idling data available for this date. Try selecting a different date or check back later for updates.
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Maintenance (Placeholder) */}
                <Card className="border-none shadow-sm bg-white h-full">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Vehicles Currently in Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
                            <Truck className="w-12 h-12 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500">
                            Well done! All your vehicles are in good condition.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
