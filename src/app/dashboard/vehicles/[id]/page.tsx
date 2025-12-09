"use client";

import { use, useState } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState(initialVehicles.find(v => v.id === resolvedParams.id));

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
