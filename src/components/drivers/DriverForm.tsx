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
import { Driver, initialVehicles, Vehicle } from "@/lib/data";

interface DriverFormProps {
    initialData?: Driver;
    initialVehicleId?: string;
    isEditing?: boolean;
}

export default function DriverForm({ initialData, initialVehicleId, isEditing = false }: DriverFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<Driver>({
        id: initialData?.id || "",
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        licenseNumber: initialData?.licenseNumber || "",
        phone: initialData?.phone || "",
        email: initialData?.email || "",
        status: initialData?.status || "active",
    });

    const [assignedVehicleId, setAssignedVehicleId] = useState<string>(initialVehicleId || "");

    // Filter vehicles: show vehicles that are unassigned OR the one currently assigned to this driver
    const availableVehicles = initialVehicles.filter(v => !v.driverId || v.driverId === initialData?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("Driver Data:", formData);
        console.log("Assigned Vehicle ID:", assignedVehicleId);

        // In a real app, we would update the driver and the vehicle here

        router.push("/dashboard/drivers");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/drivers">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Driver" : "Add New Driver"}</h2>
                    <p className="text-muted-foreground">{isEditing ? "Update driver details" : "Enter driver details below"}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Driver Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="license">License Number</Label>
                            <Input
                                id="license"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicle">Assigned Vehicle</Label>
                            <Select
                                value={assignedVehicleId}
                                onValueChange={setAssignedVehicleId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {availableVehicles.map(vehicle => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.name} ({vehicle.model})
                                        </SelectItem>
                                    ))}
                                    {/* If the currently assigned vehicle is not in availableVehicles (e.g. data inconsistency), show it anyway */}
                                    {initialVehicleId && !availableVehicles.find(v => v.id === initialVehicleId) && (
                                        <SelectItem value={initialVehicleId}>
                                            {initialVehicles.find(v => v.id === initialVehicleId)?.name || "Unknown Vehicle"} (Current)
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Only vehicles without a driver are shown.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <Link href="/dashboard/drivers">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={isLoading} className="gap-2">
                                <Save className="w-4 h-4" />
                                {isLoading ? "Saving..." : "Save Driver"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
