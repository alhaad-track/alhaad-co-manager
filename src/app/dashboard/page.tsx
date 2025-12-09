import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Truck, AlertTriangle } from "lucide-react";
import { initialUsers, initialDrivers, initialVehicles } from "@/lib/data";
import TripStats from "@/components/dashboard/TripStats";

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
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground mt-2">
                    Welcome to Alhaad Track & Transport Management System
                </p>
            </div>

            {/* Trip Statistics Section */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Trip Statistics</h3>
                <TripStats />
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4">System Overview</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className="border-none shadow-sm bg-white">
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
        </div>
    );
}
