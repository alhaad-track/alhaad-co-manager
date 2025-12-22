"use client";

import { useState, useEffect, useRef } from "react";
import { Vehicle } from "@/lib/data";
import Map from "@/components/map/Map";
import TrackingStats from "@/components/tracking/TrackingStats";
import VehicleList from "@/components/tracking/VehicleList";
import { Card } from "@/components/ui/card";
import Draggable from "react-draggable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { traccarApi, getRoute } from "@/lib/api";
import { useTraccarSocket, SocketData, TraccarPosition, TraccarDevice } from "@/hooks/useTraccarSocket";

// Interface for rich path data
export interface TripPoint {
    latitude: number;
    longitude: number;
    speed?: number;
    course?: number;
    fixTime?: string;
}

export default function TrackingPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [vehiclePaths, setVehiclePaths] = useState<Record<string, TripPoint[]>>({});
    const nodeRef = useRef(null);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    // Initial Fetch (No polling)
    const fetchTrackingData = async () => {
        try {
            // 1. Fetch all devices
            const devicesRes = await traccarApi("/api/devices");
            if (!devicesRes.ok) return;
            const devices = await devicesRes.json();

            // 2. Fetch all latest positions
            const positionsRes = await traccarApi("/api/positions");
            let positions: any[] = [];
            if (positionsRes.ok) {
                positions = await positionsRes.json();
            }

            // 3. Map Data
            const updatedVehicles: Vehicle[] = devices.map((device: any) => {
                const pos = positions.find((p: any) => p.deviceId === device.id);
                return {
                    id: device.id.toString(),
                    name: device.name,
                    model: device.model || "Unknown Model",
                    imei: device.uniqueId,
                    userId: device.attributes?.userId?.toString(),
                    status: (device.status === "online" || device.status === "moving" || device.status === "offline") ? device.status : "offline",
                    lastUpdate: pos ? new Date(pos.fixTime).toLocaleString() : new Date(device.lastUpdate).toLocaleString(),
                    lat: pos ? pos.latitude : 0,
                    lng: pos ? pos.longitude : 0,
                    icon: device.category || "default",
                    category: device.category,
                    positionId: device.positionId?.toString(),
                    speed: pos?.speed,
                    course: pos?.course,
                    maxSpeed: device.attributes?.speedLimit
                } as Vehicle;
            });

            setVehicles(updatedVehicles);

            // Update selected vehicle if it exists
            if (selectedVehicle) {
                const updatedSelected = updatedVehicles.find(v => v.id === selectedVehicle.id);
                if (updatedSelected) {
                    setSelectedVehicle(updatedSelected);
                }
            }

        } catch (error) {
            console.error("Error fetching tracking data:", error);
        }
    };

    useEffect(() => {
        // Initial call
        fetchTrackingData();
    }, []); // Only run once on mount

    // Fetch history when vehicle is selected
    useEffect(() => {
        if (!selectedVehicle?.id) return;

        const loadHistory = async () => {
            try {
                const to = new Date();
                const from = new Date(to.getTime() - 60 * 60 * 1000); // 1 hour ago
                const params = new URLSearchParams({
                    deviceId: selectedVehicle.id,
                    from: from.toISOString(),
                    to: to.toISOString()
                });

                const route = await getRoute(params);
                if (route && Array.isArray(route)) {
                    // Map to TripPoint
                    const historyPath: TripPoint[] = route.map((p: any) => ({
                        latitude: p.latitude,
                        longitude: p.longitude,
                        speed: p.speed,
                        course: p.course,
                        fixTime: p.fixTime
                    }));

                    setVehiclePaths(prev => {
                        return {
                            ...prev,
                            [selectedVehicle.id]: historyPath
                        };
                    });
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };

        loadHistory();
    }, [selectedVehicle?.id]);

    // WebSocket Integration
    useTraccarSocket((data: SocketData) => {
        if (data.positions) {
            // Update Paths
            setVehiclePaths(prev => {
                const nextPaths = { ...prev };
                data.positions!.forEach(pos => {
                    const id = pos.deviceId.toString();
                    if (!nextPaths[id]) nextPaths[id] = [];

                    // Add new point if it's different from the last one (simple dedup)
                    const lastPoint = nextPaths[id][nextPaths[id].length - 1];
                    if (!lastPoint || lastPoint.latitude !== pos.latitude || lastPoint.longitude !== pos.longitude) {
                        nextPaths[id] = [...nextPaths[id], {
                            latitude: pos.latitude,
                            longitude: pos.longitude,
                            speed: pos.speed,
                            course: pos.course,
                            fixTime: pos.fixTime
                        }];
                    }
                });
                return nextPaths;
            });

            // Update Vehicles
            setVehicles(prev => {
                const next = prev.map(v => {
                    const update = data.positions!.find((p: TraccarPosition) => p.deviceId.toString() === v.id);
                    if (update) {
                        return {
                            ...v,
                            lat: update.latitude,
                            lng: update.longitude,
                            speed: update.speed,
                            course: update.course,
                            lastUpdate: new Date(update.fixTime).toLocaleString(),
                            status: (update.speed > 0 ? "moving" : "online") as "moving" | "online" | "offline"
                        };
                    }
                    return v;
                });

                // Keep selected vehicle in sync
                if (selectedVehicle) {
                    const updatedSelected = next.find(v => v.id === selectedVehicle.id);
                    if (updatedSelected && (updatedSelected.lat !== selectedVehicle.lat || updatedSelected.lng !== selectedVehicle.lng)) {
                        setSelectedVehicle(updatedSelected);
                    }
                }

                return next;
            });
        }

        if (data.devices) {
            setVehicles(prev => {
                return prev.map(v => {
                    const update = data.devices!.find((d: TraccarDevice) => d.id.toString() === v.id);
                    if (update) {
                        return {
                            ...v,
                            name: update.name,
                            status: (update.status === "online" || update.status === "moving" || update.status === "offline") ? update.status : "offline",
                            lastUpdate: new Date(update.lastUpdate).toLocaleString()
                        };
                    }
                    return v;
                });
            });
        }
    });

    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsMobileListOpen(false);
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col relative">
            <div className="mb-4">
                <TrackingStats vehicles={vehicles} />
            </div>

            <div className="flex-1 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                {/* Map */}
                <div className="absolute inset-0 z-0">
                    <Map
                        vehicles={vehicles}
                        selectedVehicle={selectedVehicle}
                        onSelectVehicle={handleSelectVehicle}
                        livePath={selectedVehicle ? vehiclePaths[selectedVehicle.id] : undefined}
                    />
                </div>

                {/* Mobile Vehicle List Trigger */}
                <div className="absolute top-4 left-4 z-10 md:hidden">
                    <Sheet open={isMobileListOpen} onOpenChange={setIsMobileListOpen}>
                        <SheetTrigger asChild>
                            <Button variant="secondary" className="shadow-lg bg-white/90 backdrop-blur-sm">
                                <List className="w-4 h-4 mr-2" />
                                Vehicles
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] sm:w-[380px] p-0">
                            <div className="h-full overflow-y-auto p-4">
                                <h2 className="text-lg font-bold mb-4">Active Fleet</h2>
                                <VehicleList
                                    vehicles={vehicles}
                                    onSelectVehicle={handleSelectVehicle}
                                    selectedVehicleId={selectedVehicle?.id}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Floating Sidebar */}
                <div className="hidden md:block">
                    <Draggable handle=".drag-handle" bounds="parent" nodeRef={nodeRef}>
                        <div ref={nodeRef} className="absolute top-4 left-4 z-10 w-80">
                            <VehicleList
                                vehicles={vehicles}
                                onSelectVehicle={setSelectedVehicle}
                                selectedVehicleId={selectedVehicle?.id}
                            />
                        </div>
                    </Draggable>
                </div>
            </div>
        </div>
    );
}
