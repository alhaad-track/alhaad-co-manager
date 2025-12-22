"use client";

import { use, useState, useEffect } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";
import { getDevices, getPosition } from "@/lib/api";

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
                // 1. Fetch Vehicle Details to get positionId
                // We could fetch list and find, or assume we have an endpoint for single vehicle
                // Traccar API: /api/devices?id=X (returns array) or just filtered list
                // For simplicity, let's just fetch all and find (or optimize later if needed)
                // Actually Traccar allows /api/devices?id=X

                const devicesData = await getDevices();
                const devices = Array.isArray(devicesData) ? devicesData : [];
                // The API /api/devices returns all devices if no ID, but our getDevices doesn't take params yet?
                // Wait, getDevices() fetches ALL. We should filter or update getDevices to take ID.
                // But for now, let's just find from the list as the previous code did (effectively).
                // Actually previous code did `traccarApi("/api/devices?id=...")`.
                // Our getDevices() in lib currently fetches ALL: `return fetchJson<any[]>("/api/devices");`
                // Let's just find it in the list for now to avoid breaking lib change or just use the ID if we add param support.
                // Ideally we update getDevices to accept params, but let's stick to client filtering for safety/speed unless list is huge.
                // Or better, let's just manually fetch for this specific one using the general getDevices if it accepted params.
                // Since getDevices has no params, we filter on client.

                const device = devices.find((d: any) => d.id.toString() === resolvedParams.id);

                if (!device) throw new Error("Vehicle not found");
                setVehicle(device);

                // 2. Fetch Position if positionId exists
                if (device.positionId) {
                    try {
                        const positionData = await getPosition(device.positionId.toString());
                        const positions = Array.isArray(positionData) ? positionData : [positionData];
                        if (positions && positions.length > 0) {
                            setPosition(positions[0]);
                        }
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
