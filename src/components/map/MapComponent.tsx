"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Vehicle, mockTripPaths } from "@/lib/data";
import PolylineDecorator from "./PolylineDecorator";
import "leaflet-polylinedecorator";
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

// Stop Icon (Red)
const stopIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapComponentProps {
    vehicles: Vehicle[];
    selectedVehicle?: Vehicle | null;
    onSelectVehicle?: (vehicle: Vehicle) => void;
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

export default function MapComponent({ vehicles, selectedVehicle, onSelectVehicle }: MapComponentProps) {
    const selectedTrip = selectedVehicle ? mockTripPaths[selectedVehicle.id] : null;

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

            {/* Render Trip Path for Selected Vehicle */}
            {selectedTrip && (
                <>
                    <Polyline
                        positions={selectedTrip.path}
                        color="blue"
                        weight={4}
                        opacity={0.7}
                        dashArray="10, 10"
                    />
                    <PolylineDecorator
                        positions={selectedTrip.path}
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
