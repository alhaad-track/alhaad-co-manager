"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-polylinedecorator";
import PolylineDecorator from "./PolylineDecorator";

// Fix Leaflet icon issue
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";

const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Flag icon for end point
const endIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972106.png', // Checkered flag (finish)
    shadowUrl: shadowUrl,
    iconSize: [32, 32],
    iconAnchor: [4, 32],
    popupAnchor: [12, -32],
    shadowSize: [32, 32]
});

interface TripMapComponentProps {
    route: { latitude: number; longitude: number; speed?: number; address?: string; fixTime?: string }[];
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

    const path = route.map(p => [p.latitude, p.longitude] as [number, number]);
    const startPoint = route[0];
    const endPoint = route[route.length - 1];

    return (
        <MapContainer center={[startPoint.latitude, startPoint.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
            {/* ... layers ... */}
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

            <Polyline
                positions={path}
                color="blue"
                weight={4}
                opacity={0.7}
            />
            <PolylineDecorator
                positions={path}
                patterns={[
                    {
                        offset: '5%',
                        repeat: '10%',
                        symbol: L.Symbol.arrowHead({
                            pixelSize: 12,
                            polygon: false,
                            pathOptions: { stroke: true, color: 'blue', weight: 2 }
                        })
                    }
                ]}
            />

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
