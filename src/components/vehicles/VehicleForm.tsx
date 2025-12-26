"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, ChevronUp, ChevronDown, X, Plus, Trash2, Truck, Car, Bus, Bike, Anchor, Plane, Tractor, User, Leaf } from "lucide-react";
import Link from "next/link";
import { Vehicle, initialVehicles, initialGeofences } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TripHistory from "./TripHistory";
import TripMap from "@/components/map/TripMap";
import { useStore } from "@/context/StoreContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface VehicleFormProps {
    initialData?: Vehicle;
    isEditing?: boolean;
    readOnly?: boolean;
    positionData?: any;
}

export default function VehicleForm({ initialData, isEditing = false, readOnly = false, positionData }: VehicleFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);

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
        icon: initialData?.icon || "default",
        phone: initialData?.phone || "",
        contact: initialData?.contact || "",
        category: initialData?.category || "default",
        attributes: initialData?.attributes || {}
    });

    // specific attributes state
    const [speedLimitKmh, setSpeedLimitKmh] = useState<string>(() => {
        const knots = initialData?.attributes?.speedLimit;
        return knots ? Math.round(knots * 1.852).toString() : "";
    });
    const [fuelDropThreshold, setFuelDropThreshold] = useState<string>(() => initialData?.attributes?.fuelDropThreshold?.toString() || "");
    const [devicePassword, setDevicePassword] = useState<string>(() => initialData?.attributes?.devicePassword || "");
    const [copyAttributes, setCopyAttributes] = useState<boolean>(() => !!initialData?.attributes?.["processing.copyAttributes"]);
    const [saleRef, setSaleRef] = useState<string>(() => initialData?.attributes?.saleRef || "");
    const [supportManager, setSupportManager] = useState<string>(() => initialData?.attributes?.supportManager || "");
    const [currentAssignedUserId, setCurrentAssignedUserId] = useState<string | null>(null);
    const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
    const [userToRemove, setUserToRemove] = useState<string | null>(null);

    // Registration Details
    const [registrationNumber, setRegistrationNumber] = useState<string>(() => initialData?.attributes?.registrationNumber || "");
    const [registrationDate, setRegistrationDate] = useState<string>(() => initialData?.attributes?.registrationDate || "");
    const [registrationExpiry, setRegistrationExpiry] = useState<string>(() => initialData?.attributes?.registrationExpiry || "");

    // Customer Details
    const [customerName, setCustomerName] = useState<string>(() => initialData?.attributes?.customerName || "");
    const [customerPhone, setCustomerPhone] = useState<string>(() => initialData?.attributes?.customerPhone || "");
    const [customerEmail, setCustomerEmail] = useState<string>(() => initialData?.attributes?.customerEmail || "");
    const [customerNotes, setCustomerNotes] = useState<string>(() => initialData?.attributes?.customerNotes || "");

    // Vehicle Identity Extras
    const [vehicleMake, setVehicleMake] = useState<string>(() => initialData?.attributes?.vehicleMake || "");
    const [vehicleColor, setVehicleColor] = useState<string>(() => initialData?.attributes?.vehicleColor || "");

    // Expiration Date
    const [expirationDate, setExpirationDate] = useState<string>(() => {
        if (initialData?.expirationTime) {
            return new Date(initialData.expirationTime).toISOString().split('T')[0];
        }
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear.toISOString().split('T')[0];
    });

    // Fetched Lists
    const { users, drivers, geofences: availableGeofences } = useStore();

    // -- VALIDATION HELPERS --
    const cleanPhone = (val: string) => val.replace(/[^0-9+]/g, "").slice(0, 15);
    const cleanAlphanumeric = (val: string) => val.replace(/[^a-zA-Z0-9]/g, ""); // Optional strictness, Traccar UniqueID is usually implied alphanumeric

    useEffect(() => {
        const initData = async () => {
            if (initialData?.id) {
                try {
                    const { getUsers } = await import("@/lib/api");
                    const linkedUsers = await getUsers(`deviceId=${initialData.id}`);

                    if (linkedUsers && linkedUsers.length > 0) {
                        setAssignedUsers(linkedUsers);
                        const firstUser = linkedUsers[0];
                        if (firstUser && firstUser.id) {
                            setCurrentAssignedUserId(firstUser.id.toString());
                            setFormData(prev => ({ ...prev, userId: firstUser.id.toString() }));
                        }
                    } else {
                        setAssignedUsers([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch linked users", e);
                }
            }
        };
        initData();
    }, [isEditing, initialData?.id]);

    useEffect(() => {
        if ((initialData as any)?.uniqueId && drivers.length > 0 && !formData.driverId && (initialData as any).driverUniqueId) {
            const d = drivers.find(d => d.uniqueId === (initialData as any).driverUniqueId);
            if (d) {
                setFormData(prev => ({ ...prev, driverId: d.id.toString() }));
            }
        }
    }, [drivers, initialData]);

    const [accordionValue, setAccordionValue] = useState("details");
    const [trips, setTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [tripsError, setTripsError] = useState<string | null>(null);
    const [tripsFetched, setTripsFetched] = useState(false);

    const [selectedTripRoute, setSelectedTripRoute] = useState<any[] | null>(null);
    const [selectedTripDetails, setSelectedTripDetails] = useState<any>(null);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [mapCollapsed, setMapCollapsed] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const [currentAddress, setCurrentAddress] = useState<string | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);

    const handleAccordionChange = (val: string) => {
        setAccordionValue(val);
        if (val === "trips" && !tripsFetched && !loadingTrips && initialData?.id) {
            fetchTrips(initialData.id);
        }
    };

    const handleViewTrip = async (trip: any) => {
        setLoadingRoute(true);
        setSelectedTripRoute(null);
        setSelectedTripId(trip.id);
        setMapCollapsed(false);
        try {
            const { getRoute, reverseGeocode } = await import("@/lib/api");

            const params = new URLSearchParams({
                deviceId: trip.vehicleId,
                from: trip.rawStartTime || new Date().toISOString(),
                to: trip.rawEndTime || new Date().toISOString()
            });

            console.log("Fetching route with params:", params.toString());
            const routeData = await getRoute(params);
            setSelectedTripRoute(routeData);
            let startAddress = trip.startLocation;
            let endAddress = trip.endLocation;

            if (!startAddress || startAddress === "Unknown Location") {
                if (trip.startLat && trip.startLon) {
                    try {
                        startAddress = await reverseGeocode(trip.startLat, trip.startLon);
                    } catch (err) {
                        console.warn("Failed to resolve start address", err);
                    }
                }
            }

            if (!endAddress || endAddress === "Unknown Location") {
                if (trip.endLat && trip.endLon) {
                    try {
                        endAddress = await reverseGeocode(trip.endLat, trip.endLon);
                    } catch (err) {
                        console.warn("Failed to resolve end address", err);
                    }
                }
            }

            setSelectedTripDetails({
                startAddress: startAddress,
                endAddress: endAddress,
                startTime: trip.startTime,
                endTime: trip.endTime
            });

            if (mapRef.current) {
                mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } catch (e) {
            console.error("Failed to load route", e);
        } finally {
            setLoadingRoute(false);
        }
    };

    const handleShowCurrentAddress = async () => {
        if (!positionData?.latitude || !positionData?.longitude) return;
        setLoadingAddress(true);
        try {
            const { reverseGeocode } = await import("@/lib/api");
            const address = await reverseGeocode(positionData.latitude, positionData.longitude);
            setCurrentAddress(address);
        } catch (e) {
            console.error("Failed to fetch address", e);
        } finally {
            setLoadingAddress(false);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setUserToRemove(userId);
    };

    const confirmRemoveUser = async () => {
        if (!userToRemove) return;

        try {
            const { removePermission } = await import("@/lib/api");
            await removePermission({ userId: Number(userToRemove), deviceId: Number(initialData?.id) });

            setAssignedUsers(prev => prev.filter(u => u.id.toString() !== userToRemove));

            if (formData.userId === userToRemove) {
                setFormData(prev => ({ ...prev, userId: "" }));
            }
            if (currentAssignedUserId === userToRemove) {
                setCurrentAssignedUserId(null);
            }

        } catch (e) {
            console.error("Failed to remove permission", e);
            alert("Failed to remove user permission.");
        } finally {
            setUserToRemove(null);
        }
    };

    const fetchTrips = async (deviceId: string) => {
        setLoadingTrips(true);
        setTripsError(null);
        try {
            const { getTrips } = await import("@/lib/api");

            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - 7);

            const tripParams = new URLSearchParams({
                deviceId: deviceId,
                from: from.toISOString(),
                to: to.toISOString()
            });

            console.log("Fetching trips with params:", tripParams.toString());
            const tripsData = await getTrips(tripParams);

            if (Array.isArray(tripsData)) {
                const mappedTrips = tripsData.map((t: any) => ({
                    id: t.id ? t.id.toString() : Math.random().toString(),
                    vehicleId: deviceId,
                    startLocation: t.startAddress || (t.startLat && t.startLon ? "" : "Unknown Location"),
                    endLocation: t.endAddress || (t.endLat && t.endLon ? "" : "Unknown Location"),
                    startTime: t.startTime ? new Date(t.startTime).toLocaleString() : "-",
                    endTime: t.endTime ? new Date(t.endTime).toLocaleString() : "-",
                    distance: t.distance ? `${(t.distance / 1000).toFixed(2)} km` : "0 km",
                    duration: t.duration ? formatDuration(t.duration) : "-",
                    averageSpeed: t.averageSpeed ? `${(t.averageSpeed * 1.852).toFixed(1)} km/h` : "0 km/h",
                    startLat: t.startLat,
                    startLon: t.startLon,
                    endLat: t.endLat,
                    endLon: t.endLon,
                    rawStartTime: t.startTime,
                    rawEndTime: t.endTime,
                }));
                setTrips(mappedTrips.reverse());
            } else {
                setTrips([]);
            }
            setTripsFetched(true);
        } catch (e) {
            console.error("Failed to load trips", e);
            setTripsError("Failed to load trip history.");
        } finally {
            setLoadingTrips(false);
        }
    };

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const attributesObj: Record<string, any> = { ...formData.attributes };

        if (speedLimitKmh) {
            attributesObj.speedLimit = Number(speedLimitKmh) / 1.852;
        } else {
            delete attributesObj.speedLimit;
        }

        if (fuelDropThreshold) {
            attributesObj.fuelDropThreshold = Number(fuelDropThreshold);
        } else {
            delete attributesObj.fuelDropThreshold;
        }

        if (devicePassword) {
            attributesObj.devicePassword = devicePassword;
        } else {
            delete attributesObj.devicePassword;
        }

        if (copyAttributes) {
            attributesObj["processing.copyAttributes"] = true;
        } else {
            delete attributesObj["processing.copyAttributes"];
        }

        if (saleRef) {
            attributesObj.saleRef = saleRef;
        } else {
            delete attributesObj.saleRef;
        }

        if (supportManager) {
            attributesObj.supportManager = supportManager;
            delete attributesObj.supportManager;
        }

        if (registrationNumber) attributesObj.registrationNumber = registrationNumber; else delete attributesObj.registrationNumber;
        if (registrationDate) attributesObj.registrationDate = registrationDate; else delete attributesObj.registrationDate;
        if (registrationExpiry) attributesObj.registrationExpiry = registrationExpiry; else delete attributesObj.registrationExpiry;

        if (customerName) attributesObj.customerName = customerName; else delete attributesObj.customerName;
        if (customerPhone) attributesObj.customerPhone = customerPhone; else delete attributesObj.customerPhone;
        if (customerEmail) attributesObj.customerEmail = customerEmail; else delete attributesObj.customerEmail;
        if (customerNotes) attributesObj.customerNotes = customerNotes; else delete attributesObj.customerNotes;

        if (vehicleMake) attributesObj.vehicleMake = vehicleMake; else delete attributesObj.vehicleMake;
        if (vehicleColor) attributesObj.vehicleColor = vehicleColor; else delete attributesObj.vehicleColor;

        const finalData = {
            id: isEditing && initialData?.id ? Number(initialData.id) : -1,
            name: formData.name,
            uniqueId: formData.imei,
            phone: formData.phone,
            model: formData.model,
            contact: formData.contact,
            category: formData.category,
            disabled: formData.disabled,
            attributes: attributesObj,
            expirationTime: expirationDate ? new Date(expirationDate).toISOString() : undefined
        };

        try {
            const { createDevice, updateDevice, addPermission, removePermission } = await import("@/lib/api");

            let savedDeviceId = isEditing && initialData?.id ? Number(initialData.id) : null;
            let resultDevice: any = null;

            const payload: any = { ...finalData };

            if (formData.driverId) {
                const selectedDriver = drivers.find(d => d.id.toString() === formData.driverId?.toString());
                if (selectedDriver) {
                    payload.driverUniqueId = selectedDriver.uniqueId;
                }
            } else {
                if (isEditing && (initialData as any)?.driverUniqueId) {
                    payload.driverUniqueId = "";
                }
            }

            if (isEditing && initialData?.id) {
                await updateDevice(initialData.id, payload);
            } else {
                resultDevice = await createDevice(payload);
                savedDeviceId = resultDevice.id;
            }

            const newUserId = formData.userId ? Number(formData.userId) : null;
            const oldUserId = currentAssignedUserId ? Number(currentAssignedUserId) : null;

            if (savedDeviceId) {
                if (oldUserId && oldUserId !== newUserId) {
                    const oldUser = users.find(u => u.id === oldUserId);
                    const shouldKeepOldUser = oldUser && (oldUser.administrator || (oldUser.deviceLimit > 0));

                    if (!shouldKeepOldUser) {
                        try {
                            await removePermission({ userId: oldUserId, deviceId: Number(savedDeviceId) });
                        } catch (e) {
                            console.warn("Failed to remove old permission", e);
                        }
                    }
                }

                if (newUserId && newUserId !== oldUserId) {
                    try {
                        await addPermission({ userId: newUserId, deviceId: Number(savedDeviceId) });
                    } catch (e) {
                        console.error("Failed to add new permission", e);
                    }
                }
            }

            router.push("/dashboard/vehicles");
        } catch (error) {
            console.error("Failed to save vehicle", error);
            alert("Failed to save vehicle. Please check your inputs and connection.");
        } finally {
            setIsLoading(false);
        }
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

            <Card className="w-full max-w-5xl mx-auto border-0 shadow-none bg-transparent">
                <Accordion type="single" collapsible value={accordionValue} onValueChange={handleAccordionChange} className="w-full space-y-4">
                    <AccordionItem value="details" className="border rounded-lg bg-white px-6">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <span className="text-xl font-semibold">Vehicle Details</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                                {/* Group 1: Identity & Status */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> Vehicle Identity
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">
                                                Vehicle Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                maxLength={50}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="Truck 001"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="model">
                                                Model <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="model"
                                                value={formData.model}
                                                maxLength={50}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                placeholder="Volvo FH16"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="make">
                                                Make <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="make"
                                                value={vehicleMake}
                                                maxLength={50}
                                                onChange={(e) => setVehicleMake(e.target.value)}
                                                placeholder="Volvo"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="color">
                                                Color <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="color"
                                                value={vehicleColor}
                                                maxLength={50}
                                                onChange={(e) => setVehicleColor(e.target.value)}
                                                placeholder="White"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">
                                                Category <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Select
                                                value={formData.category || "default"}
                                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                                disabled={readOnly}
                                            >
                                                <SelectTrigger id="category">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Default</span></SelectItem>
                                                    <SelectItem value="car"><span className="flex items-center gap-2"><Car className="w-4 h-4" /> Car</span></SelectItem>
                                                    <SelectItem value="truck"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Truck</span></SelectItem>
                                                    <SelectItem value="motorcycle"><span className="flex items-center gap-2"><Bike className="w-4 h-4" /> Motorcycle</span></SelectItem>
                                                    <SelectItem value="bus"><span className="flex items-center gap-2"><Bus className="w-4 h-4" /> Bus</span></SelectItem>
                                                    <SelectItem value="van"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Van</span></SelectItem>
                                                    <SelectItem value="pickup"><span className="flex items-center gap-2"><Car className="w-4 h-4" /> Pickup</span></SelectItem>
                                                    <SelectItem value="tractor"><span className="flex items-center gap-2"><Tractor className="w-4 h-4" /> Tractor</span></SelectItem>
                                                    <SelectItem value="animal"><span className="flex items-center gap-2"><Leaf className="w-4 h-4" /> Animal</span></SelectItem>
                                                    <SelectItem value="bicycle"><span className="flex items-center gap-2"><Bike className="w-4 h-4" /> Bicycle</span></SelectItem>
                                                    <SelectItem value="boat"><span className="flex items-center gap-2"><Anchor className="w-4 h-4" /> Boat</span></SelectItem>
                                                    <SelectItem value="crane"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Crane</span></SelectItem>
                                                    <SelectItem value="helicopter"><span className="flex items-center gap-2"><Plane className="w-4 h-4" /> Helicopter</span></SelectItem>
                                                    <SelectItem value="offroad"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Offroad</span></SelectItem>
                                                    <SelectItem value="person"><span className="flex items-center gap-2"><User className="w-4 h-4" /> Person</span></SelectItem>
                                                    <SelectItem value="plane"><span className="flex items-center gap-2"><Plane className="w-4 h-4" /> Plane</span></SelectItem>
                                                    <SelectItem value="ship"><span className="flex items-center gap-2"><Anchor className="w-4 h-4" /> Ship</span></SelectItem>
                                                    <SelectItem value="train"><span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Train</span></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expiration">
                                                Expiration Date <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="expiration"
                                                type="date"
                                                value={expirationDate}
                                                onChange={(e) => setExpirationDate(e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="disabled"
                                            checked={formData.disabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, disabled: !!checked })}
                                            disabled={readOnly}
                                        />
                                        <label
                                            htmlFor="disabled"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Disable Vehicle (Stop Tracking)
                                        </label>
                                    </div>
                                </div>

                                {/* Group 2: Assignments & Contact */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Assignments & Contact
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="user">
                                                Assign to User <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
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
                                                    {users.map(user => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* Display all assigned users */}
                                        {assignedUsers.length > 0 && (
                                            <div className="col-span-2 mt-2">
                                                <Label className="text-xs font-semibold text-gray-500">Currently Assigned Users:</Label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {assignedUsers.map(u => (
                                                        <span key={u.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 gap-1">
                                                            {u.name} ({u.email})
                                                            {!readOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveUser(u.id.toString())}
                                                                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="driver">
                                                Assign Driver <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
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
                                                    {drivers.map(driver => (
                                                        <SelectItem key={driver.id} value={driver.id.toString()}>
                                                            {driver.name} {driver.uniqueId ? `(${driver.uniqueId})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="saleRef">
                                                Sale Ref (Person/ID) <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="saleRef"
                                                type="text"
                                                value={saleRef}
                                                maxLength={50}
                                                onChange={(e) => setSaleRef(e.target.value)}
                                                placeholder="e.g. Sales-101"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="supportManager">
                                                Support Manager <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="supportManager"
                                                type="text"
                                                value={supportManager}
                                                maxLength={50}
                                                onChange={(e) => setSupportManager(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">
                                                Phone Number <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                maxLength={15}
                                                onChange={(e) => setFormData({ ...formData, phone: cleanPhone(e.target.value) })}
                                                placeholder="+123456789"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact">
                                                Contact Info <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="contact"
                                                value={formData.contact}
                                                maxLength={50}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                placeholder="Owner Name / Support"
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group: Registration Details */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <CardTitle className="text-base">Registration Details</CardTitle>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationNumber">
                                                Registration Number <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="registrationNumber"
                                                value={registrationNumber}
                                                maxLength={50}
                                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                                placeholder="e.g. ABC-123"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationDate">
                                                Registration Date <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="registrationDate"
                                                type="date"
                                                value={registrationDate}
                                                onChange={(e) => setRegistrationDate(e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationExpiry">
                                                Registration Expiry <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="registrationExpiry"
                                                type="date"
                                                value={registrationExpiry}
                                                onChange={(e) => setRegistrationExpiry(e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group: Customer Information */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Customer Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="customerName">
                                                Customer Name <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="customerName"
                                                value={customerName}
                                                maxLength={50}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Full Name / Company"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="customerPhone">
                                                Customer Phone <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="customerPhone"
                                                value={customerPhone}
                                                maxLength={15}
                                                onChange={(e) => setCustomerPhone(cleanPhone(e.target.value))}
                                                placeholder="+123456789"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="customerEmail">
                                                Customer Email <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="customerEmail"
                                                type="email"
                                                value={customerEmail}
                                                maxLength={100}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                placeholder="email@example.com"
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customerNotes">
                                            Notes / Address <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </Label>
                                        <textarea
                                            id="customerNotes"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={customerNotes}
                                            maxLength={250}
                                            onChange={(e) => setCustomerNotes(e.target.value)}
                                            placeholder="Additional details..."
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>

                                {/* Group 3: Device Connection */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Leaf className="w-4 h-4" /> Connection Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="imei">
                                                IMEI / Identifier <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="imei"
                                                value={formData.imei}
                                                maxLength={20}
                                                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                                required
                                                placeholder="15-digit IMEI"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="devicePassword">
                                                Device Password <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="devicePassword"
                                                type="text"
                                                value={devicePassword}
                                                maxLength={50}
                                                onChange={(e) => setDevicePassword(e.target.value)}
                                                placeholder="Device Password (if required)"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 border p-3 rounded bg-white mt-auto h-[42px]">
                                            <Checkbox
                                                id="copyAttributes"
                                                checked={copyAttributes}
                                                onCheckedChange={(checked) => setCopyAttributes(!!checked)}
                                                disabled={readOnly}
                                            />
                                            <label
                                                htmlFor="copyAttributes"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Copy Attributes (Processing)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 4: Device Configuration */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Tractor className="w-4 h-4" /> Configuration
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="speedLimit">
                                                Speed Limit (km/h) <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="speedLimit"
                                                    type="number"
                                                    value={speedLimitKmh}
                                                    onChange={(e) => setSpeedLimitKmh(e.target.value)}
                                                    placeholder="e.g. 100"
                                                    disabled={readOnly}
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-500">km/h</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Values &gt; this will trigger "Over Speed" events.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fuelDrop">
                                                Fuel Drop Threshold <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="fuelDrop"
                                                type="number"
                                                value={fuelDropThreshold}
                                                onChange={(e) => setFuelDropThreshold(e.target.value)}
                                                placeholder="e.g. 10"
                                                disabled={readOnly}
                                            />
                                            <p className="text-[10px] text-muted-foreground">Percentage drop to trigger fuel theft alert.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Assigned Geofences <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-4 bg-gray-50/50">
                                        {availableGeofences.map(geofence => (
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
                                                    {geofence.name} <span className="text-xs text-muted-foreground">{geofence.description ? `(${geofence.description})` : ""}</span>
                                                </label>
                                            </div>
                                        ))}
                                        {availableGeofences.length === 0 && (
                                            <p className="text-sm text-muted-foreground col-span-2 text-center py-2">
                                                No geofences found. {!readOnly && <Link href="/dashboard/geofences" className="text-orange-600 hover:underline">Create one</Link>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-4">
                                    <Link href="/dashboard/vehicles">
                                        <Button variant="outline" type="button">{readOnly ? "Back" : "Cancel"}</Button>
                                    </Link>
                                    {!readOnly && (
                                        <Button type="submit" disabled={isLoading} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
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
                                            <div className="col-span-2 grid grid-cols-2 gap-2">
                                                <span className="text-gray-500">Address:</span>
                                                <span className="font-medium">
                                                    {currentAddress || (positionData.address ? positionData.address : (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-orange-600 font-normal hover:bg-transparent hover:underline"
                                                            onClick={handleShowCurrentAddress}
                                                            disabled={loadingAddress}
                                                        >
                                                            {loadingAddress ? (
                                                                <>
                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                                                                    Loading...
                                                                </>
                                                            ) : "Show Address"}
                                                        </Button>
                                                    ))}
                                                </span>
                                            </div>
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
                                            <span className="font-medium col-span-1" suppressHydrationWarning>{new Date(positionData.fixTime).toLocaleString()}</span>

                                            {/* Dynamic Attributes */}
                                            {positionData.attributes && Object.entries(positionData.attributes).map(([key, value]) => {
                                                if (["ignition", "batteryLevel", "motion", "door", "fuel", "odometer", "totalDistance", "hours"].includes(key)) return null;

                                                const formatKey = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                                let displayValue: any = value;
                                                if (typeof value === 'boolean') displayValue = value ? "Yes" : "No";
                                                if (typeof value === 'object') displayValue = JSON.stringify(value);
                                                if (value === null || value === undefined) return null;

                                                return (
                                                    <Fragment key={key}>
                                                        <span className="text-gray-500">{formatKey(key)}:</span>
                                                        <span className="font-medium break-all">{displayValue}</span>
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {(isEditing || readOnly) && initialData && (
                        <AccordionItem value="trips" className="border rounded-lg bg-white px-6">
                            <AccordionTrigger className="hover:no-underline py-6">
                                <span className="text-xl font-semibold">Trip History (Last 7 Days)</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2" ref={mapRef}>
                                    {selectedTripRoute && (
                                        <div className="mb-6 border rounded-lg overflow-hidden shadow-sm bg-gray-100 transition-all duration-300">
                                            <div className="flex items-center justify-between p-2 bg-white border-b px-4">
                                                <h3 className="font-semibold text-sm text-gray-700">Trip Route Map</h3>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setMapCollapsed(!mapCollapsed)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {mapCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedTripRoute(null);
                                                            setSelectedTripId(null);
                                                        }}
                                                        className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {!mapCollapsed && (
                                                <div className="h-[500px] relative">
                                                    <TripMap route={selectedTripRoute} tripDetails={selectedTripDetails} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {loadingTrips ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                            <p>Loading trips...</p>
                                        </div>
                                    ) : tripsError ? (
                                        <div className="rounded-md bg-red-50 p-4 mb-4">
                                            <p className="text-sm text-red-600 text-center">{tripsError}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <TripHistory trips={trips} onViewTrip={handleViewTrip} selectedTripId={selectedTripId || undefined} />
                                            <div className="mt-4 flex justify-end border-t pt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => initialData.id && fetchTrips(initialData.id)}
                                                    disabled={loadingTrips}
                                                    className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                                                >
                                                    Refresh Report
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Removal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this user's access to the vehicle? This action cannot be undone immediately without re-assigning.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToRemove(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmRemoveUser}>
                            Remove User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
