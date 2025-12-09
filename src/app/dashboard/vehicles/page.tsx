"use client";

import { useState } from "react";
import { initialVehicles, Vehicle, initialUsers } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Truck, Car, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [search, setSearch] = useState("");

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.imei.includes(search)
    );

    const getUserName = (userId?: string) => {
        if (!userId) return "Unassigned";
        const user = initialUsers.find(u => u.id === userId);
        return user ? user.name : "Unknown";
    };

    const getStatusColor = (status: Vehicle["status"]) => {
        switch (status) {
            case "online": return "text-green-600 bg-green-50 border-green-200";
            case "moving": return "text-blue-600 bg-blue-50 border-blue-200";
            case "offline": return "text-gray-600 bg-gray-50 border-gray-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
                <Link href="/dashboard/vehicles/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Vehicle
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search vehicles..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVehicles.map((vehicle) => (
                    <Card key={vehicle.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {vehicle.name}
                            </CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vehicle.model}</div>
                            <p className="text-xs text-muted-foreground mb-4">IMEI: {vehicle.imei}</p>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Assigned to:</span>
                                    <span className="font-medium">{getUserName(vehicle.userId)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last Update:</span>
                                    <span className="font-medium">{vehicle.lastUpdate}</span>
                                </div>
                                <div className="pt-2 flex items-center justify-between">
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(vehicle.status))}>
                                        {vehicle.status.toUpperCase()}
                                    </span>
                                    <div className="flex gap-2 ml-auto">
                                        <Link href={`/dashboard/vehicles/${vehicle.id}/view`}>
                                            <Button size="sm" className="h-6 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">View</Button>
                                        </Link>
                                        <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                                            <Button variant="outline" size="sm" className="h-6 text-xs">Edit</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
