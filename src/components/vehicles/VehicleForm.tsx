"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Vehicle, initialUsers, initialDrivers, initialVehicles, initialGeofences, initialTrips } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TripHistory from "./TripHistory";

interface VehicleFormProps {
    initialData?: Vehicle;
    isEditing?: boolean;
    readOnly?: boolean;
    positionData?: any;
}

export default function VehicleForm({ initialData, isEditing = false, readOnly = false, positionData }: VehicleFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Vehicle>>({
        id: initialData?.id || "",
        name: initialData?.name || "",
        model: initialData?.model || "",
        imei: initialData?.imei || "",
        userId: initialData?.userId || "",
        driverId: initialData?.driverId || "",
        status: initialData?.status || "offline",
        lat: initialData?.lat || 0,
        lng: initialData?.lng || 0,
        lastUpdate: initialData?.lastUpdate || "Just now",
        assignedGeofenceIds: initialData?.assignedGeofenceIds || [],
        icon: initialData?.icon || "default"
    });

    // Filter available drivers: show drivers that are NOT assigned to any vehicle OR the driver currently assigned to THIS vehicle
    const availableDrivers = initialDrivers.filter(d => {
        const isAssignedToOther = initialVehicles.some(v => v.driverId === d.id && v.id !== initialData?.id);
        return !isAssignedToOther;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Vehicle Data:", formData);

        router.push("/dashboard/vehicles");
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex items-center">
                <Link href="/dashboard/vehicles">
                    <Button variant="ghost" size="sm" className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">
                    {readOnly ? "Vehicle Details" : isEditing ? "Edit Vehicle" : "Create New Vehicle"}
                </h1>
            </div>

            <Card className="w-full max-w-2xl mx-auto border-0 shadow-none bg-transparent">
                <Accordion type="single" collapsible defaultValue="details" className="w-full space-y-4">
                    <AccordionItem value="details" className="border rounded-lg bg-white px-6">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <span className="text-xl font-semibold">Vehicle Details</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Vehicle Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Truck 001"
                                            disabled={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="model">Model</Label>
                                        <Input
                                            id="model"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            required
                                            placeholder="Volvo FH16"
                                            disabled={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="icon">Icon</Label>
                                        <Select
                                            value={formData.icon || "default"}
                                            onValueChange={(value: any) => setFormData({ ...formData, icon: value })}
                                            disabled={readOnly}
                                        >
                                            <SelectTrigger id="icon">
                                                <SelectValue placeholder="Select an icon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Default (Standard Marker)</SelectItem>
                                                <SelectItem value="car">Car</SelectItem>
                                                <SelectItem value="truck">Truck</SelectItem>
                                                <SelectItem value="van">Van</SelectItem>
                                                <SelectItem value="bus">Bus</SelectItem>
                                                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imei">IMEI / Identifier</Label>
                                    <Input
                                        id="imei"
                                        value={formData.imei}
                                        onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                        required
                                        placeholder="15-digit IMEI"
                                        disabled={readOnly}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user">Assign to User (Optional)</Label>
                                        <Select
                                            value={formData.userId}
                                            onValueChange={(value) => setFormData({ ...formData, userId: value })}
                                            disabled={readOnly}
                                        >
                                            <SelectTrigger id="user">
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {initialUsers.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="driver">Assign Driver (Optional)</Label>
                                        <Select
                                            value={formData.driverId}
                                            onValueChange={(value) => setFormData({ ...formData, driverId: value === "unassigned" ? undefined : value })}
                                            disabled={readOnly}
                                        >
                                            <SelectTrigger id="driver">
                                                <SelectValue placeholder="Select a driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {availableDrivers.map(driver => (
                                                    <SelectItem key={driver.id} value={driver.id}>
                                                        {driver.firstName} {driver.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!readOnly && (
                                            <p className="text-xs text-muted-foreground">
                                                Only available drivers are shown.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Assigned Geofences</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-4 bg-gray-50/50">
                                        {initialGeofences.map(geofence => (
                                            <div key={geofence.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`geofence-${geofence.id}`}
                                                    checked={formData.assignedGeofenceIds?.includes(geofence.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = formData.assignedGeofenceIds || [];
                                                        if (checked) {
                                                            setFormData({ ...formData, assignedGeofenceIds: [...currentIds, geofence.id] });
                                                        } else {
                                                            setFormData({ ...formData, assignedGeofenceIds: currentIds.filter(id => id !== geofence.id) });
                                                        }
                                                    }}
                                                    disabled={readOnly}
                                                />
                                                <label
                                                    htmlFor={`geofence-${geofence.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {geofence.name} <span className="text-xs text-muted-foreground">({geofence.type})</span>
                                                </label>
                                            </div>
                                        ))}
                                        {initialGeofences.length === 0 && (
                                            <p className="text-sm text-muted-foreground col-span-2 text-center py-2">
                                                No geofences available. {!readOnly && <Link href="/dashboard/geofences" className="text-blue-600 hover:underline">Create one</Link>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-4">
                                    <Link href="/dashboard/vehicles">
                                        <Button variant="outline" type="button">{readOnly ? "Back" : "Cancel"}</Button>
                                    </Link>
                                    {!readOnly && (
                                        <Button type="submit" disabled={isLoading} className="gap-2">
                                            <Save className="w-4 h-4" />
                                            {isLoading ? "Saving..." : "Save Vehicle"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </AccordionContent>
                    </AccordionItem>

                    {positionData && (
                        <AccordionItem value="position" className="border rounded-lg bg-white px-6">
                            <AccordionTrigger className="hover:no-underline py-6">
                                <span className="text-xl font-semibold">Current Position</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-sm">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-500 uppercase text-xs tracking-wider">Location</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-500">Latitude:</span>
                                            <span className="font-medium">{positionData.latitude?.toFixed(6)}</span>
                                            <span className="text-gray-500">Longitude:</span>
                                            <span className="font-medium">{positionData.longitude?.toFixed(6)}</span>
                                            <span className="text-gray-500">Altitude:</span>
                                            <span className="font-medium">{positionData.altitude?.toFixed(1)} m</span>
                                            <span className="text-gray-500">Speed:</span>
                                            <span className="font-medium">{positionData.speed?.toFixed(1)} kn</span>
                                            <span className="text-gray-500">Course:</span>
                                            <span className="font-medium">{positionData.course}°</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-500 uppercase text-xs tracking-wider">Status & Attributes</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-500">Valid Fix:</span>
                                            <span className={positionData.valid ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                {positionData.valid ? "Yes" : "No"}
                                            </span>
                                            <span className="text-gray-500">Ignition:</span>
                                            <span className="font-medium">{positionData.attributes?.ignition ? "On" : "Off"}</span>
                                            <span className="text-gray-500">Battery:</span>
                                            <span className="font-medium">{positionData.attributes?.batteryLevel ? `${positionData.attributes.batteryLevel}%` : "N/A"}</span>
                                            <span className="text-gray-500">Motion:</span>
                                            <span className="font-medium">{positionData.attributes?.motion ? "Yes" : "No"}</span>
                                            <span className="text-gray-500">Fix Time:</span>
                                            <span className="font-medium col-span-1">{new Date(positionData.fixTime).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 mt-2">
                                        <h4 className="font-medium text-gray-500 uppercase text-xs tracking-wider mb-2">Raw Attributes</h4>
                                        <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all text-gray-700 border">
                                            {JSON.stringify(positionData.attributes, null, 2)}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {(isEditing || readOnly) && initialData && (
                        <AccordionItem value="trips" className="border rounded-lg bg-white px-6">
                            <AccordionTrigger className="hover:no-underline py-6">
                                <span className="text-xl font-semibold">Trip History</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2">
                                    <TripHistory trips={initialTrips.filter(t => t.vehicleId === initialData.id)} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </Card>
        </div>
    );
}
