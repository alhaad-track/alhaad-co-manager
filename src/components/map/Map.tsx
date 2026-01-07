"use client";

import dynamic from "next/dynamic";
import { Vehicle } from "@/lib/data";

const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Loading Map...</div>
});

import { TripPoint } from "./MapComponent";

interface MapProps {
    vehicles: Vehicle[];
    selectedVehicle?: Vehicle | null;
    onSelectVehicle?: (vehicle: Vehicle) => void;
    onDoubleClickVehicle?: (vehicle: Vehicle) => void;
    livePath?: TripPoint[];
    showFullHistory?: boolean;
    onSendCommand?: (vehicle: Vehicle) => void;
}

export default function Map({ vehicles, selectedVehicle, onSelectVehicle, onDoubleClickVehicle, livePath, showFullHistory, onSendCommand }: MapProps) {
    return <MapComponent vehicles={vehicles} selectedVehicle={selectedVehicle} onSelectVehicle={onSelectVehicle} onDoubleClickVehicle={onDoubleClickVehicle} livePath={livePath} showFullHistory={showFullHistory} onSendCommand={onSendCommand} />;
}
