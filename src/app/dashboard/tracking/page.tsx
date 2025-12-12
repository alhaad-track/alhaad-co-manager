"use client";

import { useState, useEffect, useRef } from "react";
import { initialVehicles, Vehicle } from "@/lib/data";
import Map from "@/components/map/Map";
import TrackingStats from "@/components/tracking/TrackingStats";
import VehicleList from "@/components/tracking/VehicleList";
import { Card } from "@/components/ui/card";
import Draggable from "react-draggable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

export default function TrackingPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const nodeRef = useRef(null);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setVehicles(currentVehicles =>
                currentVehicles.map(v => {
                    if (v.status === "moving") {
                        // Move slightly randomly
                        return {
                            ...v,
                            lat: v.lat + (Math.random() - 0.5) * 0.001,
                            lng: v.lng + (Math.random() - 0.5) * 0.001,
                            lastUpdate: "Just now"
                        };
                    }
                    return v;
                })
            );
        }, 3000);

        return () => clearInterval(interval);
    }, []);

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
