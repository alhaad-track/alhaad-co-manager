"use client";

import { useState, useEffect, useRef } from "react";
import { initialVehicles, Vehicle } from "@/lib/data";
import Map from "@/components/map/Map";
import TrackingStats from "@/components/tracking/TrackingStats";
import VehicleList from "@/components/tracking/VehicleList";
import { Card } from "@/components/ui/card";
import Draggable from "react-draggable";

export default function TrackingPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const nodeRef = useRef(null);

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

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <TrackingStats vehicles={vehicles} />

            <div className="flex-1 relative overflow-hidden">
                {/* Map */}
                <Card className="absolute inset-0 border-0 shadow-md z-0">
                    <Map vehicles={vehicles} selectedVehicle={selectedVehicle} />
                </Card>

                {/* Floating Sidebar */}
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
    );
}
