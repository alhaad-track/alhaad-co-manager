"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Vehicle, mockTripPaths } from "@/lib/data";
import { Car, Truck, Bus, Bike, Box } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Fix Leaflet icon issue
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

// Stop Icon (Red)
const stopIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export interface TripPoint {
    latitude: number;
    longitude: number;
    speed?: number;
    course?: number;
    fixTime?: string;
}

export interface MapComponentProps {
    vehicles: Vehicle[];
    selectedVehicle?: Vehicle | null;
    onSelectVehicle?: (vehicle: Vehicle) => void;
    livePath?: TripPoint[];
}

function MapController({ selectedVehicle }: { selectedVehicle?: Vehicle | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedVehicle) {
            map.flyTo([selectedVehicle.lat, selectedVehicle.lng], 15, {
                duration: 1.5
            });
        }
    }, [selectedVehicle, map]);

    return null;
}

// Helper to create custom marker icon
const createVehicleIcon = (type: string) => {
    if (type === "default" || !type) {
        return customIcon;
    }

    let IconComponent = Car;
    switch (type) {
        case "truck": IconComponent = Truck; break;
        case "van": IconComponent = Box; break; // Using Box as proxy for Van
        case "bus": IconComponent = Bus; break;
        case "motorcycle": IconComponent = Bike; break;
        case "car": IconComponent = Car; break;
        default: return customIcon;
    }

    const iconHtml = renderToStaticMarkup(
        <div className="bg-white rounded-full p-1 border-2 border-blue-600 shadow-md">
            <IconComponent className="w-5 h-5 text-blue-600" />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: "custom-vehicle-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export default function MapComponent({ vehicles, selectedVehicle, onSelectVehicle, livePath }: MapComponentProps) {
    const selectedTrip = selectedVehicle ? mockTripPaths[selectedVehicle.id] : null;

    // Prepare segments for colored line if livePath exists
    const segments = [];
    if (livePath && livePath.length > 1) {
        let currentSegment = [livePath[0]];
        let currentColor = getSpeedColor(livePath[0].speed || 0);

        for (let i = 1; i < livePath.length; i++) {
            const point = livePath[i];
            const pointColor = getSpeedColor(point.speed || 0);

            // Add previous point to start of new segment for continuity
            // We just push current point to current segment
            currentSegment.push(point);

            if (pointColor !== currentColor || i === livePath.length - 1) {
                segments.push({
                    positions: currentSegment.map(p => [p.latitude, p.longitude] as [number, number]),
                    color: currentColor
                });

                // Start next segment with the last point of previous to avoid gaps
                currentSegment = [point];
                currentColor = pointColor;
            }
        }
    }

    // Determine path for default display fallback
    const pathCoordinates = selectedTrip ? selectedTrip.path : [];

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <LayersControl position="topright">
                <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
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
                <LayersControl.BaseLayer name="Google Maps (Hybrid)">
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        attribution="Google Maps"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            <MapController selectedVehicle={selectedVehicle} />

            {/* Render Live Trip Path for Selected Vehicle */}
            {selectedVehicle && livePath && livePath.length > 0 && (
                <>
                    {/* Colored Path Segments */}
                    {segments.map((seg, idx) => (
                        <Polyline
                            key={idx}
                            positions={seg.positions}
                            pathOptions={{ color: seg.color, weight: 4, opacity: 0.8 }}
                        />
                    ))}

                    {/* Direction Arrows */}
                    {livePath.map((point, idx) => {
                        // Show arrow every 20 points, but ensure first and last aren't crowded if needed
                        if (idx % 20 !== 0 || idx === 0 || idx === livePath.length - 1) return null;
                        const rotation = point.course || 0;
                        const arrowIcon = L.divIcon({
                            className: 'bg-transparent',
                            html: `<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: rotate(${rotation}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        });
                        return (
                            <Marker key={`arrow-${idx}`} position={[point.latitude, point.longitude]} icon={arrowIcon} zIndexOffset={-100} />
                        );
                    })}

                    {/* Start Marker */}
                    <Marker position={[livePath[0].latitude, livePath[0].longitude]} icon={startIcon}>
                        <Popup>Start of History (1h ago)</Popup>
                    </Marker>
                </>
            )}

            {/* Fallback to Mock Data (Blue Line) - Only if NO LIVE PATH */}
            {selectedVehicle && (!livePath || livePath.length === 0) && selectedTrip && selectedTrip.path.length > 0 && (
                <>
                    <Polyline
                        positions={selectedTrip.path}
                        color="blue"
                        weight={4}
                        opacity={0.7}
                        dashArray="10, 10"
                    />
                    {/* Temporarily removed PolylineDecorator as it's not compatible with simple array structure if we wanted uniformity, 
                        but standard polyline is fine for fallback. 
                        Actually I'll leave it out to simplify imports/dependencies if not strictly needed for fallback.
                        The user asked for Live Map to match Trip Map.
                     */}
                    {selectedTrip.stops.map((stop, idx) => (
                        <Marker key={`stop-${idx}`} position={[stop.lat, stop.lng]} icon={stopIcon}>
                            <Popup>
                                <div className="p-1 text-center">
                                    <h3 className="font-bold text-red-600">Stop #{idx + 1}</h3>
                                    <p className="text-sm font-medium">{stop.time}</p>
                                    <p className="text-xs text-gray-500">Duration: {stop.duration}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </>
            )}

            {/* Render Vehicles */}
            {vehicles.map((vehicle) => (
                <Marker
                    key={vehicle.id}
                    position={[vehicle.lat, vehicle.lng]}
                    icon={createVehicleIcon(vehicle.icon || "car")}
                    eventHandlers={{
                        click: () => {
                            if (onSelectVehicle) {
                                onSelectVehicle(vehicle);
                            }
                        },
                    }}
                >
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold">{vehicle.name}</h3>
                            <p className="text-sm text-gray-600">{vehicle.model}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: {vehicle.status}</p>
                            <p className="text-xs text-gray-500">Last update: {vehicle.lastUpdate}</p>
                            {selectedVehicle?.id === vehicle.id && (
                                <p className="text-xs text-blue-600 font-medium mt-1">Path Visible</p>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
