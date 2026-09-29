"use client";

import { use, useState, useEffect } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";
import { getDevice, getPosition } from "@/lib/api";

// Removed unused date-fns import

export default function ViewVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState<any>(null); // Use any or Vehicle type
    const [position, setPosition] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch the vehicle (includes its latest positionId)
                const device = await getDevice(resolvedParams.id);

                if (!device) throw new Error("Vehicle not found");
                setVehicle(device);

                // 2. Fetch Position if positionId exists
                if (device.positionId) {
                    try {
                        setPosition(await getPosition(device.positionId));
                    } catch (e) {
                        console.error("Failed to load position", e);
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
                    icon: "truck",
                    category: vehicle.category,
                    phone: vehicle.phone,
                    contact: vehicle.contact,
                    disabled: vehicle.disabled,
                    attributes: vehicle.attributes,
                    expirationTime: vehicle.expirationTime,
                    userId: vehicle.attributes?.userId || vehicle.userId, // generic fallback
                    driverId: vehicle.attributes?.driverId || vehicle.driverId
                }}
                readOnly={true}
                positionData={position}
            />
        </div>
    );
}
