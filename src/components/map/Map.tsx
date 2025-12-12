"use client";

import dynamic from "next/dynamic";
import { Vehicle } from "@/lib/data";

const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Loading Map...</div>
});

interface MapProps {
    vehicles: Vehicle[];
    selectedVehicle?: Vehicle | null;
    onSelectVehicle?: (vehicle: Vehicle) => void;
}

export default function Map({ vehicles, selectedVehicle, onSelectVehicle }: MapProps) {
    return <MapComponent vehicles={vehicles} selectedVehicle={selectedVehicle} onSelectVehicle={onSelectVehicle} />;
}
