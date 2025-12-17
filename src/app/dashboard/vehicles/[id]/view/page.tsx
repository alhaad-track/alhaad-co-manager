"use client";

import { use, useState, useEffect } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";
import { traccarApi } from "@/lib/api";

export default function ViewVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState<any>(null); // Use any or Vehicle type
    const [position, setPosition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Vehicle Details to get positionId
                // We could fetch list and find, or assume we have an endpoint for single vehicle
                // Traccar API: /api/devices?id=X (returns array) or just filtered list
                // For simplicity, let's just fetch all and find (or optimize later if needed)
                // Actually Traccar allows /api/devices?id=X

                const deviceResponse = await traccarApi(`/api/devices?id=${resolvedParams.id}`);
                if (!deviceResponse.ok) throw new Error("Failed to fetch vehicle");
                const devices = await deviceResponse.json();
                const device = devices[0];

                if (!device) throw new Error("Vehicle not found");
                setVehicle(device);

                // 2. Fetch Position if positionId exists
                if (device.positionId) {
                    const positionResponse = await traccarApi(`/api/positions?id=${device.positionId}`);
                    if (positionResponse.ok) {
                        const positions = await positionResponse.json();
                        if (positions && positions.length > 0) {
                            setPosition(positions[0]);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load vehicle data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resolvedParams.id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!vehicle) return <div className="p-8">Vehicle not found</div>;

    return (
        <div className="space-y-6">
            <VehicleForm
                initialData={{
                    id: vehicle.id.toString(),
                    name: vehicle.name,
                    model: vehicle.model || "Unknown",
                    imei: vehicle.uniqueId,
                    status: vehicle.status,
                    lastUpdate: vehicle.lastUpdate,
                    lat: position?.latitude || 0,
                    lng: position?.longitude || 0,
                    icon: "truck"
                }}
                readOnly={true}
                positionData={position}
            />
        </div>
    );
}
