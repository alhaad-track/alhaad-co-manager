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
import { traccarApi } from "@/lib/api";

export default function TrackingPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const nodeRef = useRef(null);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    // Initial Fetch and Polling
    useEffect(() => {
        const fetchTrackingData = async () => {
            try {
                // 1. Fetch all devices
                const devicesRes = await traccarApi("/api/devices");
                if (!devicesRes.ok) return; // Silent fail on error for now, or handle UI error
                const devices = await devicesRes.json();

                // 2. Fetch all latest positions
                const positionsRes = await traccarApi("/api/positions");
                let positions: any[] = [];
                if (positionsRes.ok) {
                    positions = await positionsRes.json();
                }

                // 3. Map Data
                const updatedVehicles: Vehicle[] = devices.map((device: any) => {
                    // Find position for this device
                    const pos = positions.find((p: any) => p.deviceId === device.id);

                    return {
                        id: device.id.toString(),
                        name: device.name,
                        model: device.model || "Unknown Model",
                        imei: device.uniqueId,
                        userId: device.attributes?.userId?.toString(),
                        status: device.status,
                        lastUpdate: pos ? new Date(pos.fixTime).toLocaleString() : new Date(device.lastUpdate).toLocaleString(),
                        lat: pos ? pos.latitude : 0,
                        lng: pos ? pos.longitude : 0,
                        icon: "truck", // Could map from device category if available
                        positionId: device.positionId?.toString(),
                        speed: pos?.speed, // Optional, if Vehicle interface supports it
                        course: pos?.course
                    };
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

        // Initial call
        fetchTrackingData();

        // Polling interval (e.g., every 5 seconds)
        const interval = setInterval(fetchTrackingData, 5000);

        return () => clearInterval(interval);
    }, [selectedVehicle?.id]); // Depend on ID to allow inner update logic to check it

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
                    <Map vehicles={vehicles} selectedVehicle={selectedVehicle} onSelectVehicle={handleSelectVehicle} />
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
