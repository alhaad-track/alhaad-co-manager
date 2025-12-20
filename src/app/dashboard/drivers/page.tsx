"use client";

import { useState, useEffect } from "react";
import { Driver, initialVehicles } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Phone, Mail, FileText, Car, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDrivers } from "@/lib/api";

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]); // Start empty, fetch real data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const data = await getDrivers();
                // Map Traccar driver objects to our Driver interface
                // Traccar driver object usually has: id, name, uniqueId, attributes
                const mappedDrivers: Driver[] = data.map((d: any) => ({
                    id: d.id.toString(),
                    firstName: d.name.split(' ')[0] || "Unknown",
                    lastName: d.name.split(' ').slice(1).join(' ') || "",
                    email: d.attributes?.email || "No Email",
                    phone: d.attributes?.phone || "No Phone",
                    licenseNumber: d.uniqueId || "N/A", // Usually uniqueId is used for identifier/license
                    status: (d.attributes?.active ?? true) ? "active" : "inactive", // Default to active if not specified
                    assignedVehicleId: undefined, // Fetched via computed logic if needed, or attributes
                    rating: 5,
                    totalTrips: 0
                }));
                setDrivers(mappedDrivers);
            } catch (err) {
                console.error("Failed to fetch drivers", err);
                setError("Failed to load drivers.");
            } finally {
                setLoading(false);
            }
        };

        fetchDrivers();
    }, []);

    const filteredDrivers = drivers.filter(driver =>
        driver.firstName.toLowerCase().includes(search.toLowerCase()) ||
        driver.lastName.toLowerCase().includes(search.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(search.toLowerCase())
    );

    // This Logic for assigning matches based on mocked initialVehicles might need an update later 
    // to fetch REAL vehicle assignments, but for now we keep it compatible with existing UI logic
    const getAssignedVehicle = (driverId: string) => {
        // ideally we would check real vehicles, but initialVehicles is imported from data.
        return initialVehicles.find(v => v.driverId === driverId);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-orange-600" /></div>;
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
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
                    <p className="text-muted-foreground">Manage your fleet drivers</p>
                </div>
                <Link href="/dashboard/drivers/new">
                    <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4" />
                        Add Driver
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search drivers by name or identifier..."
                        className="pl-9 bg-gray-50 border-gray-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDrivers.map((driver) => {
                    const assignedVehicle = getAssignedVehicle(driver.id);

                    return (
                        <Card key={driver.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 bg-gray-50/50 pb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {driver.firstName[0]}{driver.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{driver.firstName} {driver.lastName}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                            driver.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                        )}>
                                            {driver.status}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="font-mono">{driver.licenseNumber}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{driver.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{driver.email}</span>
                                </div>

                                <div className="pt-3 mt-3 border-t flex items-center justify-between">
                                    <div className="flex items-center justify-between text-sm flex-1">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <Car className="w-4 h-4" />
                                            Assigned Vehicle
                                        </span>
                                        {assignedVehicle ? (
                                            <Link href={`/dashboard/tracking?vehicle=${assignedVehicle.id}`} className="font-medium text-blue-600 hover:underline">
                                                {assignedVehicle.name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 italic">None</span>
                                        )}
                                    </div>
                                    <Link href={`/dashboard/drivers/${driver.id}`} className="ml-4">
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {filteredDrivers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No drivers found.
                    </div>
                )}
            </div>
        </div>
    );
}
