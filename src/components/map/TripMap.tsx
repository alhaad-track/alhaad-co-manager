"use client";

import dynamic from "next/dynamic";

const TripMapComponent = dynamic(() => import("./TripMapComponent"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Loading Map...</div>
});

interface TripMapProps {
    route: { latitude: number; longitude: number; speed?: number; address?: string; fixTime?: string }[];
    tripDetails?: {
        startAddress?: string;
        endAddress?: string;
        startTime?: string;
        endTime?: string;
    };
    showAllMarkers?: boolean;
}

export default function TripMap({ route, tripDetails, showAllMarkers }: TripMapProps) {
    return <TripMapComponent route={route} tripDetails={tripDetails} showAllMarkers={showAllMarkers} />;
}
