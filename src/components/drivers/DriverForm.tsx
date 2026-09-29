"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Driver } from "@/lib/data";
import { useStore } from "@/context/StoreContext";

// Traccar drivers only have name, uniqueId and attributes; the rest of Driver lives in attributes.
export function driverFromApi(d: any): Driver {
    return {
        id: d.id.toString(),
        firstName: d.name.split(' ')[0] || "Unknown",
        lastName: d.name.split(' ').slice(1).join(' ') || "",
        email: d.attributes?.email || "",
        phone: d.attributes?.phone || "",
        licenseNumber: d.uniqueId || "",
        status: (d.attributes?.active ?? true) ? "active" : "inactive",
    };
}

interface DriverFormProps {
    initialData?: Driver;
    initialAttributes?: Record<string, any>;
    initialVehicleId?: string;
    isEditing?: boolean;
}

export default function DriverForm({ initialData, initialAttributes, initialVehicleId, isEditing = false }: DriverFormProps) {
    const router = useRouter();
    const { refreshStore } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);

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

    useEffect(() => {
        import("@/lib/api")
            .then(({ getDevices }) => getDevices())
            .then(setVehicles)
            .catch(e => console.error("Failed to load vehicles", e));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            uniqueId: formData.licenseNumber,
            attributes: {
                ...initialAttributes,
                phone: formData.phone,
                email: formData.email,
                active: formData.status === "active",
            },
        };

        try {
            const { createDriver, updateDriver, addPermission, removePermission } = await import("@/lib/api");

            const saved = isEditing && initialData?.id
                ? await updateDriver(initialData.id, payload)
                : await createDriver(payload);
            const driverId = Number(saved.id);

            const newVehicleId = assignedVehicleId && assignedVehicleId !== "unassigned" ? Number(assignedVehicleId) : null;
            const oldVehicleId = initialVehicleId ? Number(initialVehicleId) : null;
            if (oldVehicleId && oldVehicleId !== newVehicleId) {
                await removePermission({ deviceId: oldVehicleId, driverId });
            }
            if (newVehicleId && newVehicleId !== oldVehicleId) {
                await addPermission({ deviceId: newVehicleId, driverId });
            }

            await refreshStore();
            router.push("/dashboard/drivers");
        } catch (error: any) {
            console.error("Failed to save driver", error);
            alert(error?.message || "Failed to save driver.");
            setIsLoading(false);
        }
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
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
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
                                placeholder="LIC-XXXXX"
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
                                    placeholder="+1 (555) 000-0000"
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
                                    placeholder="john@example.com"
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
                                    {vehicles.map(vehicle => (
                                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                            {vehicle.name}{vehicle.model ? ` (${vehicle.model})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
