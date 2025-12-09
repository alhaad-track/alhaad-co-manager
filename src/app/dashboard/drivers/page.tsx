"use client";

import { useState } from "react";
import { initialDrivers, Driver, initialVehicles } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Phone, Mail, FileText, Car } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
    const [search, setSearch] = useState("");

    const filteredDrivers = drivers.filter(driver =>
        driver.firstName.toLowerCase().includes(search.toLowerCase()) ||
        driver.lastName.toLowerCase().includes(search.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(search.toLowerCase())
    );

    const getAssignedVehicle = (driverId: string) => {
        return initialVehicles.find(v => v.driverId === driverId);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
                    <p className="text-muted-foreground">Manage your fleet drivers</p>
                </div>
                <Link href="/dashboard/drivers/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Driver
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search drivers by name or license..."
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
            </div>
        </div>
    );
}
