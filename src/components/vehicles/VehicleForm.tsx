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

    // Specific Attribute States (managed separately for UI convenience, merged into attributes on submit)
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

    // Expiration Date State (Standard HTML date input uses YYYY-MM-DD)
    const [expirationDate, setExpirationDate] = useState<string>(() => {
        if (initialData?.expirationTime) {
            return new Date(initialData.expirationTime).toISOString().split('T')[0];
        }
        // Default to 1 year from now for new vehicles
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear.toISOString().split('T')[0];
    });

    // Fetched Lists
    const [users, setUsers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [availableGeofences, setAvailableGeofences] = useState<any[]>([]);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const { getGeofences, getUsers, getDrivers } = await import("@/lib/api");
                const [geofencesData, usersData, driversData] = await Promise.all([
                    getGeofences(),
                    getUsers(),
                    getDrivers()
                ]);

                setAvailableGeofences(geofencesData || []);
                setUsers(usersData || []);
                setDrivers(driversData || []);
            } catch (err) {
                console.error("Failed to fetch resources", err);
                setAvailableGeofences(initialGeofences);
                // Ideally show error toast
            }
        };
        fetchResources();
    }, []);

    // Fetch initial permissions and match driver
    useEffect(() => {
        const initData = async () => {
            if (initialData?.id) {
                try {
                    const { getUsers } = await import("@/lib/api");
                    // Using getUsers with deviceId query to check assignment
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

    // Match driver from uniqueId if driverId is missing
    useEffect(() => {
        if ((initialData as any)?.uniqueId && drivers.length > 0 && !formData.driverId && (initialData as any).driverUniqueId) {
            const d = drivers.find(d => d.uniqueId === (initialData as any).driverUniqueId);
            if (d) {
                setFormData(prev => ({ ...prev, driverId: d.id.toString() }));
            }
        }
    }, [drivers, initialData]);

    const [accordionValue, setAccordionValue] = useState("details");
    const [trips, setTrips] = useState<any[]>([]); // Using any[] to match TripHistory props if we cast or map
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [tripsError, setTripsError] = useState<string | null>(null);
    const [tripsFetched, setTripsFetched] = useState(false);

    // State for viewing trip route
    const [selectedTripRoute, setSelectedTripRoute] = useState<any[] | null>(null);
    const [selectedTripDetails, setSelectedTripDetails] = useState<any>(null);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [mapCollapsed, setMapCollapsed] = useState(false);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // State for current position address
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
        setMapCollapsed(false); // Auto-expand when selecting a new trip
        try {
            const { getRoute, reverseGeocode } = await import("@/lib/api");

            const params = new URLSearchParams({
                deviceId: trip.vehicleId,
                from: trip.rawStartTime || new Date().toISOString(), // Fallback if missing
                to: trip.rawEndTime || new Date().toISOString()
            });

            console.log("Fetching route with params:", params.toString());
            const routeData = await getRoute(params);
            setSelectedTripRoute(routeData);
            let startAddress = trip.startLocation;
            let endAddress = trip.endLocation;

            // Resolve addresses if missing
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

            // Scroll to map
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

            // Update state
            setAssignedUsers(prev => prev.filter(u => u.id.toString() !== userToRemove));

            // If we removed the currently selected/active user, clear selection
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
                // Map API data to Trip interface expected by TripHistory
                const mappedTrips = tripsData.map((t: any) => ({
                    id: t.id ? t.id.toString() : Math.random().toString(),
                    vehicleId: deviceId,
                    startLocation: t.startAddress || (t.startLat && t.startLon ? "" : "Unknown Location"), // Leave empty if coords exist but address is missing, to trigger "Show Address" logic if we treat empty/null as missing
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

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Merge specific fields into attributes
        const attributesObj: Record<string, any> = { ...formData.attributes };

        // Speed Limit (convert km/h to knots)
        if (speedLimitKmh) {
            attributesObj.speedLimit = Number(speedLimitKmh) / 1.852;
        } else {
            delete attributesObj.speedLimit;
        }

        // Fuel Drop Threshold
        if (fuelDropThreshold) {
            attributesObj.fuelDropThreshold = Number(fuelDropThreshold);
        } else {
            delete attributesObj.fuelDropThreshold;
        }

        // Device Password
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

        // Sale Ref
        if (saleRef) {
            attributesObj.saleRef = saleRef;
        } else {
            delete attributesObj.saleRef;
        }

        // Support Manager
        if (supportManager) {
            attributesObj.supportManager = supportManager;
        } else {
            delete attributesObj.supportManager;
        }

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

            // Use 'any' to allow adding driverUniqueId which might be missing from the inferred type
            const payload: any = { ...finalData };

            // Drivers: Map selected driver ID to UniqueID
            if (formData.driverId) {
                const selectedDriver = drivers.find(d => d.id.toString() === formData.driverId?.toString());
                if (selectedDriver) {
                    payload.driverUniqueId = selectedDriver.uniqueId;
                }
            } else {
                // Do not send null driverUniqueId unless we are sure.
                // Traccar API often treats empty string as unset, or omission.
                // If previously set, we might need to send "".
                // Safest bet for 'unassign' is often empty string.
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


            // User Assignment (Permissions)
            const newUserId = formData.userId ? Number(formData.userId) : null;
            const oldUserId = currentAssignedUserId ? Number(currentAssignedUserId) : null;

            if (savedDeviceId) {
                // Imports handled above

                // If user changed
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

            // Assign User / Driver if selected (Separate API calls might be needed if Traccar device endpoint doesn't support direct assignment, but standard Traccar creates permissions separately. Assuming device creation is primary user goal for now. For full flow, permissions APIs would be needed but simplified for now.)

            router.push("/dashboard/vehicles");
        } catch (error) {
            console.error("Failed to save vehicle", error);
            // Ideally show error toast here
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
                        {/* ... existing details ... */}
                        <AccordionTrigger className="hover:no-underline py-6">
                            <span className="text-xl font-semibold">Vehicle Details</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                                {/* ... form content ... */}
                                {/* Group 1: Identity & Status */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> Vehicle Identity
                                    </h3>
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
                                            <Label htmlFor="category">Category</Label>
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
                                            <Label htmlFor="expiration">Expiration Date (Account Validity)</Label>
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
                                            <Label htmlFor="user">Assign to User</Label>
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
                                            <Label htmlFor="driver">Assign Driver</Label>
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
                                            <Label htmlFor="saleRef">Sale Ref (Person/ID)</Label>
                                            <Input
                                                id="saleRef"
                                                type="text"
                                                value={saleRef}
                                                onChange={(e) => setSaleRef(e.target.value)}
                                                placeholder="e.g. Sales-101"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="supportManager">Support Manager</Label>
                                            <Input
                                                id="supportManager"
                                                type="text"
                                                value={supportManager}
                                                onChange={(e) => setSupportManager(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+123456789"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact">Contact Info</Label>
                                            <Input
                                                id="contact"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                placeholder="Owner Name / Support"
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Device Connection */}
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Leaf className="w-4 h-4" /> Connection Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <div className="space-y-2">
                                            <Label htmlFor="devicePassword">Device Password</Label>
                                            <Input
                                                id="devicePassword"
                                                type="text"
                                                value={devicePassword}
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
                                            <Label htmlFor="speedLimit">Speed Limit (km/h)</Label>
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
                                            <Label htmlFor="fuelDrop">Fuel Drop Threshold</Label>
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
                                    <Label>Assigned Geofences</Label>
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
            </Card >

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
        </div >
    );
}
