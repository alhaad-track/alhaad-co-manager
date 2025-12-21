"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { reverseGeocode } from "@/lib/api";

// Fix Leaflet icon issue
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";

// Helper for speed color
// Helper for speed color
const getSpeedColor = (speed: number, maxSpeed?: number) => {
    // If speed exceeds device limit, show RED
    if (maxSpeed && speed > maxSpeed) return '#ef4444';

    // Green Line: Stopped or moving very slowly (< 10)
    if (speed < 10) return '#22c55e';
    // Yellow Line: Medium speed (10 - 40)
    if (speed < 40) return '#eab308';
    // Red Line: Fast moving (> 40)
    return '#ef4444';
};

// Start Icon
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// End Icon (Standard Red)
const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Stop Icon (Blue)
const stopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to fetch and display address
const AddressDisplay = ({ lat, lng, initialAddress }: { lat: number, lng: number, initialAddress?: string }) => {
    const [address, setAddress] = useState<string | undefined>(initialAddress);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ((!address || address === "Unknown Location") && !loading) {
            setLoading(true);
            reverseGeocode(lat, lng)
                .then((addr) => setAddress(addr))
                .catch((err) => {
                    console.error("Geocoding failed", err);
                    setAddress("Address lookup failed");
                })
                .finally(() => setLoading(false));
        }
    }, [lat, lng, address, loading]);

    if (loading) return <span className="text-gray-400 italic">Resolving...</span>;
    return <span>{address || "Unknown location"}</span>;
};

interface TripMapComponentProps {
    route: { latitude: number; longitude: number; speed?: number; course?: number; address?: string; fixTime?: string }[];
    tripDetails?: {
        startAddress?: string;
        endAddress?: string;
        startTime?: string;
        endTime?: string;
    };
    showAllMarkers?: boolean;
    maxSpeed?: number;
}

function MapController({ route }: { route: any[] }) {
    // ... (same as before)
    const map = useMap();

    useEffect(() => {
        if (route && route.length > 0) {
            const bounds = L.latLngBounds(route.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);

    return null;
}

export default function TripMapComponent({ route, tripDetails, showAllMarkers = false, maxSpeed }: TripMapComponentProps) {
    // 1. Filter out invalid points to prevent crashes (Invalid LatLng object)
    const validRoute = route?.filter(p =>
        p.latitude !== undefined &&
        p.longitude !== undefined &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    ) || [];

    if (validRoute.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No valid route data</div>;

    // For stops, we might not have a "start" and "end" concept in the same way, or we just want to show all.
    // However, we strictly rely on validRoute now.

    const startPoint = validRoute[0];
    const endPoint = validRoute[validRoute.length - 1];

    // Optimize route segments for color (only if NOT in showAllMarkers mode purely, implies movement)
    const segments = [];
    if (!showAllMarkers) {
        let currentSegment = [validRoute[0]];
        let currentColor = getSpeedColor(validRoute[0].speed || 0, maxSpeed);

        for (let i = 1; i < validRoute.length; i++) {
            const point = validRoute[i];
            const pointColor = getSpeedColor(point.speed || 0, maxSpeed);

            // Maintain continuity
            currentSegment.push(point);

            if (pointColor !== currentColor || i === validRoute.length - 1) {
                segments.push({
                    positions: currentSegment.map(p => [p.latitude, p.longitude] as [number, number]),
                    color: currentColor
                });
                currentSegment = [point];
                currentColor = pointColor;
            }
        }
    }

    return (
        <MapContainer center={[startPoint.latitude, startPoint.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Google Maps (Standard)">
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        attribution="Google Maps"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Google Maps (Satellite)">
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                        attribution="Google Maps"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            <MapController route={validRoute} />

            {/* Colored Speed Segments */}
            {!showAllMarkers && segments.map((seg, idx) => (
                <Polyline
                    key={idx}
                    positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 4, opacity: 0.8 }}
                />
            ))}

            {/* If showAllMarkers is true, render a marker for EVERY point */}
            {showAllMarkers && validRoute.map((point, idx) => (
                <Marker key={idx} position={[point.latitude, point.longitude]} icon={stopIcon}>
                    <Popup>
                        <div className="p-1 min-w-[200px]">
                            <strong className="block text-sm mb-2 border-b pb-1">Stop Info</strong>
                            <div className="grid grid-cols-[60px_1fr] gap-1 text-xs">
                                <span className="text-gray-500 font-medium">Time:</span>
                                <span>{point.fixTime ? new Date(point.fixTime).toLocaleString() : "-"}</span>
                                <span className="text-gray-500 font-medium">Address:</span>
                                <AddressDisplay lat={point.latitude} lng={point.longitude} initialAddress={point.address} />
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Standard Route Visualization (Arrows & Start/End) - Only if NOT showAllMarkers */}
            {!showAllMarkers && (
                <>
                    {validRoute.map((point, idx) => {
                        if (idx % 20 !== 0 || idx === 0 || idx === validRoute.length - 1) return null;
                        const rotation = point.course || 0;
                        const arrowIcon = L.divIcon({
                            className: 'bg-transparent',
                            html: `<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: rotate(${rotation}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        });
                        return (
                            <Marker key={idx} position={[point.latitude, point.longitude]} icon={arrowIcon} zIndexOffset={-100}>
                                <Popup>
                                    <div className="p-1 min-w-[200px]">
                                        <strong className="block text-sm mb-2 border-b pb-1">Trip Point</strong>
                                        <div className="grid grid-cols-[60px_1fr] gap-1 text-xs">
                                            <span className="text-gray-500 font-medium">Time:</span>
                                            <span>{point.fixTime ? new Date(point.fixTime).toLocaleString() : "-"}</span>
                                            <span className="text-gray-500 font-medium">Speed:</span>
                                            <span>{point.speed ? `${(point.speed * 1.852).toFixed(1)} km/h` : "0 km/h"}</span>
                                            <span className="text-gray-500 font-medium">Course:</span>
                                            <span>{point.course}°</span>
                                            <span className="text-gray-500 font-medium">Address:</span>
                                            <AddressDisplay lat={point.latitude} lng={point.longitude} initialAddress={point.address} />
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {startPoint && (
                        <Marker position={[startPoint.latitude, startPoint.longitude]} icon={startIcon}>
                            <Popup>
                                <div className="p-1">
                                    <strong className="block text-sm mb-1 text-green-700">Start Point</strong>
                                    <div className="text-xs text-gray-600 mb-1">{tripDetails?.startTime || startPoint.fixTime || "Time unknown"}</div>
                                    <div className="text-xs">{tripDetails?.startAddress || "Address not resolved"}</div>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {endPoint && (
                        <Marker position={[endPoint.latitude, endPoint.longitude]} icon={endIcon}>
                            <Popup>
                                <div className="p-1">
                                    <strong className="block text-sm mb-1 text-red-700">End Point</strong>
                                    <div className="text-xs text-gray-600 mb-1">{tripDetails?.endTime || endPoint.fixTime || "Time unknown"}</div>
                                    <div className="text-xs">{tripDetails?.endAddress || "Address not resolved"}</div>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </>
            )}

        </MapContainer>
    );
}
