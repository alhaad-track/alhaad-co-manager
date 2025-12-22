"use client";

import { useState, useEffect } from "react";
import { initialVehicles, Vehicle, initialUsers } from "@/lib/data";
import { traccarApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Truck, Car, AlertCircle, Ship, Plane, Bike, User, Bus, Anchor, Tractor } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await traccarApi("/api/devices");
                if (!response.ok) {
                    throw new Error("Failed to fetch devices");
                }
                const data = await response.json();

                const mappedVehicles: Vehicle[] = data.map((device: any) => ({
                    id: device.id.toString(),
                    name: device.name,
                    model: device.model || "Unknown Model",
                    imei: device.uniqueId,
                    userId: device.attributes?.userId?.toString(), // Assuming userId might be in attributes or similar
                    status: device.status,
                    lastUpdate: new Date(device.lastUpdate).toLocaleString(),
                    lat: 0, // Placeholder
                    lng: 0, // Placeholder
                    icon: device.category || "default",
                    category: device.category,
                    positionId: device.positionId?.toString(),
                }));

                setVehicles(mappedVehicles);
            } catch (err) {
                console.error("Error fetching vehicles:", err);
                setError("Failed to load vehicles. Please try again later.");
                // Fallback to initialVehicles if fetch fails, or just show error
                // setVehicles(initialVehicles); 
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

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

    const getCategoryIcon = (category?: string) => {
        switch (category?.toLowerCase()) {
            case "car": return <Car className="h-4 w-4 text-muted-foreground" />;
            case "truck": return <Truck className="h-4 w-4 text-muted-foreground" />;
            case "bus": return <Bus className="h-4 w-4 text-muted-foreground" />;
            case "motorcycle":
            case "scooter":
            case "bicycle": return <Bike className="h-4 w-4 text-muted-foreground" />;
            case "ship":
            case "boat": return <Anchor className="h-4 w-4 text-muted-foreground" />; // or Ship if available
            case "plane":
            case "helicopter": return <Plane className="h-4 w-4 text-muted-foreground" />;
            case "tractor": return <Tractor className="h-4 w-4 text-muted-foreground" />;
            case "person": return <User className="h-4 w-4 text-muted-foreground" />;
            default: return <Truck className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading vehicles...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
                <Link href="/dashboard/vehicles/new">
                    <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
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
                            {getCategoryIcon(vehicle.category)}
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
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(vehicle.status))} >
                                        {vehicle.status.toUpperCase()}
                                    </span>
                                    <div className="flex gap-2 ml-auto">
                                        <Link href={`/dashboard/vehicles/${vehicle.id}/view`}>
                                            <Button size="sm" className="h-6 text-xs bg-orange-600 hover:bg-orange-700 text-white">View</Button>
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
