"use client";

import dynamic from "next/dynamic";
import { Geofence } from "@/lib/data";

const GeofenceMapComponent = dynamic(() => import("./GeofenceMapComponent"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Loading Map...</div>
});

interface GeofenceMapProps {
    geofences: Geofence[];
    onGeofenceCreated: (geofence: Omit<Geofence, "id">) => void;
    onGeofenceEdited: (id: string, newShape: any) => void;
    onGeofenceDeleted: (id: string) => void;
    selectedGeofenceIds: string[];
}

import { forwardRef } from "react";
import { GeofenceMapHandle } from "./GeofenceMapComponent";

export default forwardRef<GeofenceMapHandle, GeofenceMapProps>(function GeofenceMap(props, ref) {
    return <GeofenceMapComponent {...props} ref={ref} />;
});
