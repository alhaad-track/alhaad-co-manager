"use client";

import { use, useState, useEffect } from "react";
import DriverForm, { driverFromApi } from "@/components/drivers/DriverForm";
import { notFound } from "next/navigation";
import { getDriver, getDevices } from "@/lib/api";

export default function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [driver, setDriver] = useState<any>(null);
    const [vehicleId, setVehicleId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const [found, linkedDevices] = await Promise.all([
                    getDriver(resolvedParams.id),
                    getDevices(new URLSearchParams({ driverId: resolvedParams.id })).catch(() => []),
                ]);
                setDriver(found);
                setVehicleId(linkedDevices[0]?.id?.toString());
            } catch (err) {
                console.error("Failed to fetch driver", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDriver();
    }, [resolvedParams.id]);

    if (loading) return <div className="p-8">Loading driver...</div>;

    if (!driver) {
        notFound();
    }

    return (
        <DriverForm
            initialData={driverFromApi(driver)}
            initialAttributes={driver.attributes}
            initialVehicleId={vehicleId}
            isEditing={true}
        />
    );
}
