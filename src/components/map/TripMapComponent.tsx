"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";

// Helper for speed color
const getSpeedColor = (speed: number) => {
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

interface TripMapComponentProps {
    route: { latitude: number; longitude: number; speed?: number; course?: number; address?: string; fixTime?: string }[];
    tripDetails?: {
        startAddress?: string;
        endAddress?: string;
        startTime?: string;
        endTime?: string;
    };
}

function MapController({ route }: { route: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (route && route.length > 0) {
            const bounds = L.latLngBounds(route.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);

    return null;
}

export default function TripMapComponent({ route, tripDetails }: TripMapComponentProps) {
    if (!route || route.length === 0) return <div className="h-full flex items-center justify-center">No route data</div>;

    const startPoint = route[0];
    const endPoint = route[route.length - 1];

    // Optimize route segments for color
    const segments = [];
    let currentSegment = [route[0]];
    let currentColor = getSpeedColor(route[0].speed || 0);

    for (let i = 1; i < route.length; i++) {
        const point = route[i];
        const pointColor = getSpeedColor(point.speed || 0);

        // Always add point to current segment to maintain continuity
        currentSegment.push(point);

        // If color changes or it's the last point, push segment and start new
        if (pointColor !== currentColor || i === route.length - 1) {
            segments.push({
                positions: currentSegment.map(p => [p.latitude, p.longitude] as [number, number]),
                color: currentColor
            });
            // Start new segment overlapping with last point
            currentSegment = [point];
            currentColor = pointColor;
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

            <MapController route={route} />

            {/* Colored Speed Segments */}
            {segments.map((seg, idx) => (
                <Polyline
                    key={idx}
                    positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 4, opacity: 0.8 }}
                />
            ))}

            {/* Direction Arrows as Markers */}
            {route.map((point, idx) => {
                // Show arrow every 20th point to avoid clutter
                if (idx % 20 !== 0 || idx === 0 || idx === route.length - 1) return null;

                const rotation = point.course || 0;

                // Custom divIcon for rotated arrow
                const arrowIcon = L.divIcon({
                    className: 'bg-transparent',
                    html: `<div style="
                        background-color: #10b981; 
                        border: 2px solid white; 
                        border-radius: 50%; 
                        width: 24px; 
                        height: 24px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        transform: rotate(${rotation}deg);
                    ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    </div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12] // Center
                });

                return (
                    <Marker key={idx} position={[point.latitude, point.longitude]} icon={arrowIcon} zIndexOffset={-100} />
                );
            })}

            <Marker position={[startPoint.latitude, startPoint.longitude]} icon={startIcon}>
                <Popup>
                    <div className="p-1">
                        <strong className="block text-sm mb-1 text-green-700">Start Point</strong>
                        <div className="text-xs text-gray-600 mb-1">
                            {tripDetails?.startTime || startPoint.fixTime || "Time unknown"}
                        </div>
                        <div className="text-xs">
                            {tripDetails?.startAddress || "Address not resolved"}
                        </div>
                    </div>
                </Popup>
            </Marker>

            <Marker position={[endPoint.latitude, endPoint.longitude]} icon={endIcon}>
                <Popup>
                    <div className="p-1">
                        <strong className="block text-sm mb-1 text-red-700">End Point</strong>
                        <div className="text-xs text-gray-600 mb-1">
                            {tripDetails?.endTime || endPoint.fixTime || "Time unknown"}
                        </div>
                        <div className="text-xs">
                            {tripDetails?.endAddress || "Address not resolved"}
                        </div>
                    </div>
                </Popup>
            </Marker>

        </MapContainer>
    );
}
