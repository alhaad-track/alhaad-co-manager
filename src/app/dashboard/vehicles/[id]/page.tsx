"use client";

import { use, useState, useEffect } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const { getDevice } = await import("@/lib/api");
                const found = await getDevice(resolvedParams.id);

                if (found) {
                    // Normalize data for VehicleForm
                    const normalizedVehicle = {
                        id: found.id.toString(),
                        name: found.name,
                        model: found.model || "Unknown",
                        imei: found.uniqueId,
                        status: found.status,
                        lastUpdate: found.lastUpdate,
                        lat: 0, // Not needed for edit form
                        lng: 0,
                        icon: "default", // Deprecated but required by type
                        category: found.category,
                        phone: found.phone,
                        contact: found.contact,
                        disabled: found.disabled,
                        attributes: found.attributes,
                        expirationTime: found.expirationTime,
                        userId: found.attributes?.userId || found.userId,
                        driverId: found.attributes?.driverId || found.driverId
                    };
                    setVehicle(normalizedVehicle);
                } else {
                    setVehicle(null);
                }
            } catch (err) {
                console.error("Failed to fetch vehicle", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicle();
    }, [resolvedParams.id]);

    if (loading) return <div className="p-8">Loading vehicle...</div>;

    if (!vehicle) {
        notFound();
    }

    return (
        <VehicleForm
            initialData={vehicle}
            isEditing={true}
        />
    );
}
