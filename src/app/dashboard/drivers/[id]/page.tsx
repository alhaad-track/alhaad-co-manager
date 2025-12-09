"use client";

import { use, useState, useEffect } from "react";
import { initialDrivers, initialVehicles } from "@/lib/data";
import DriverForm from "@/components/drivers/DriverForm";
import { notFound } from "next/navigation";

export default function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [driver, setDriver] = useState(initialDrivers.find(d => d.id === resolvedParams.id));
    const [vehicleId, setVehicleId] = useState(initialVehicles.find(v => v.driverId === resolvedParams.id)?.id);

    if (!driver) {
        notFound();
    }

    return (
        <DriverForm
            initialData={driver}
            initialVehicleId={vehicleId}
            isEditing={true}
        />
    );
}
