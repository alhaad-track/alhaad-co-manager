"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { reverseGeocode } from "@/lib/api";
import { Vehicle, mockTripPaths } from "@/lib/data";
import { Car, Truck, Bus, Bike, Box, Anchor, Plane, User, Leaf, Tractor, Ship } from "lucide-react";
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

const stopIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to fetch and display address
const AddressDisplay = ({ lat, lng }: { lat: number, lng: number }) => {
    const [address, setAddress] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address && !loading) {
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
            // Use setView with current zoom to prevent auto-zoom out
            // animation: true makes it smooth (pan)
            map.setView([selectedVehicle.lat, selectedVehicle.lng], map.getZoom(), {
                animate: true
            });
        }
    }, [selectedVehicle, map]);

    return null;
}



function ZoomHandler({ setZoom }: { setZoom: (z: number) => void }) {
    const map = useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
        }
    });
    return null;
}

// Helper to create custom marker icon
const createVehicleIcon = (type: string, category?: string) => {
    // Use category if available, otherwise fallback to icon (legacy) or default
    const iconType = (category || type || "default").toLowerCase().trim();

    let IconComponent = Truck; // Default fallback

    switch (iconType) {
        case "car":
        case "pickup": IconComponent = Car; break;

        case "truck":
        case "lorry": IconComponent = Truck; break;

        case "camper":
        case "van":
        case "ambulance": IconComponent = Box; break;

        case "bus":
        case "minibus":
        case "trolleybus":
        case "tram": IconComponent = Bus; break;

        case "motorcycle":
        case "motorbike":
        case "scooter":
        case "bicycle": IconComponent = Bike; break;

        case "boat":
        case "ship": IconComponent = Anchor; break;

        case "plane":
        case "helicopter": IconComponent = Plane; break;

        case "tractor":
        case "crane":
        case "offroad": IconComponent = Tractor; break;

        case "person": IconComponent = User; break;

        case "animal": IconComponent = Leaf; break;

        case "train": IconComponent = Truck; break;

        default: IconComponent = Truck;
    }

    // Specific overrides if needed (e.g. Tractor)
    if (iconType === 'tractor') IconComponent = Tractor;
    if (iconType === 'ship' || iconType === 'boat') IconComponent = Ship;

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

// Smoothly moving marker
const MovingMarker = ({ position, icon, children, onSelect, onDoubleClick }: { position: [number, number], icon: L.DivIcon, children: React.ReactNode, onSelect?: () => void, onDoubleClick?: () => void }) => {
    const markerRef = useRef<L.Marker>(null);
    // We only pass the initial position to the Marker component to prevent React Leaflet from forcing updates.
    // We handle all position updates manually via setLatLng for animation.
    const [initialPos] = useState(position);

    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const duration = 2000; // 2 seconds animation (Matches socket throttle)

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        // Cancel previous animation
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        // Get current visual position to start animation from
        // This prevents jumping back if an update arrives mid-animation
        const currentLatLng = marker.getLatLng();
        const startLat = currentLatLng.lat;
        const startLng = currentLatLng.lng;

        // Target (new position)
        const targetLat = position[0];
        const targetLng = position[1];

        // If practically same, skip
        if (Math.abs(startLat - targetLat) < 0.000001 && Math.abs(startLng - targetLng) < 0.000001) {
            return;
        }

        startTimeRef.current = null;

        const animate = (time: number) => {
            if (startTimeRef.current === null) startTimeRef.current = time;
            const elapsed = time - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Linear interpolation
            const lat = startLat + (targetLat - startLat) * progress;
            const lng = startLng + (targetLng - startLng) * progress;

            marker.setLatLng([lat, lng]);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                startTimeRef.current = null;
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [position[0], position[1]]); // Trigger only when coordinates change

    // Update icon if it changes
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(icon);
        }
    }, [icon]);

    // Click handling with debounce to separate click vs dblclick
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    return (
        <Marker
            ref={markerRef}
            position={initialPos} // Static initial position
            icon={icon}
            eventHandlers={{
                click: () => {
                    if (clickTimeoutRef.current) {
                        clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                        return;
                    }

                    clickTimeoutRef.current = setTimeout(() => {
                        if (onSelect) onSelect();
                        clickTimeoutRef.current = null;
                    }, 300);
                },
                dblclick: () => {
                    if (clickTimeoutRef.current) {
                        clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                    }
                    if (onDoubleClick) onDoubleClick();
                }
            }}
        >
            {children}
        </Marker>
    );
};

export interface MapComponentProps {
    vehicles: Vehicle[];
    selectedVehicle?: Vehicle | null;
    onSelectVehicle?: (vehicle: Vehicle) => void;
    onDoubleClickVehicle?: (vehicle: Vehicle) => void;
    livePath?: TripPoint[];
}

export default function MapComponent({ vehicles, selectedVehicle, onSelectVehicle, onDoubleClickVehicle, livePath }: MapComponentProps) {
    const selectedTrip = selectedVehicle ? mockTripPaths[selectedVehicle.id] : null;
    const [zoom, setZoom] = useState(13); // Default zoom

    // Prepare segments for colored line if livePath exists
    const segments = [];
    if (livePath && livePath.length > 1) {
        let currentSegment = [livePath[0]];
        let currentColor = getSpeedColor(livePath[0].speed || 0, selectedVehicle?.maxSpeed);

        for (let i = 1; i < livePath.length; i++) {
            const point = livePath[i];
            const pointColor = getSpeedColor(point.speed || 0, selectedVehicle?.maxSpeed);

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

    // Filter points based on zoom level (Distance in meters)
    const getMinDistance = (z: number) => {
        if (z < 10) return 50000; // 50km
        if (z < 12) return 10000; // 10km
        if (z < 13) return 5000;  // 5km
        if (z < 14) return 2000;  // 2km
        if (z < 15) return 1000;  // 1km
        if (z < 16) return 500;   // 500m
        if (z < 17) return 200;   // 200m
        return 100;               // 100m min distance at highest zoom
    };

    // Haversine formula for distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const minDistance = getMinDistance(zoom);

    const visiblePoints = (() => {
        if (!livePath || livePath.length === 0) return [];

        const latestPoint = livePath[livePath.length - 1];
        const latestTime = latestPoint.fixTime ? new Date(latestPoint.fixTime).getTime() : Date.now();
        const oneHourMs = 60 * 60 * 1000;
        const stationaryThreshold = 100; // Increased to 100 meters to be more aggressive

        // Check if vehicle has been effectively stationary for the last hour
        // We check if the maximum distance from the latest point in the last hour is small
        let isStationaryForLastHour = false;
        let maxDist = 0;

        // Scan backwards to find max deviation in last hour
        for (let i = livePath.length - 1; i >= 0; i--) {
            const p = livePath[i];
            const pTime = p.fixTime ? new Date(p.fixTime).getTime() : 0;
            if (latestTime - pTime > oneHourMs) break;

            const d = calculateDistance(p.latitude, p.longitude, latestPoint.latitude, latestPoint.longitude);
            if (d > maxDist) maxDist = d;
        }

        if (maxDist < stationaryThreshold) {
            isStationaryForLastHour = true;
        }

        const points: TripPoint[] = [];
        let lastPoint: TripPoint | null = null;

        for (let i = 0; i < livePath.length; i++) {
            const point = livePath[i];

            // Stationary Filter: If stationary for last hour, hide points from that hour
            if (isStationaryForLastHour) {
                const pTime = point.fixTime ? new Date(point.fixTime).getTime() : 0;
                if (latestTime - pTime < oneHourMs) {
                    continue;
                }
            }

            // Always include the last point (Unless it was filtered out by stationary check above)
            if (i === livePath.length - 1) {
                points.push(point);
                continue;
            }

            if (!lastPoint) {
                points.push(point);
                lastPoint = point;
                continue;
            }

            const dist = calculateDistance(lastPoint.latitude, lastPoint.longitude, point.latitude, point.longitude);
            if (dist >= minDistance) {
                points.push(point);
                lastPoint = point;
            }
        }
        return points;
    })();

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <ZoomHandler setZoom={setZoom} />
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

                    {/* Start Marker - Only show if current position is significantly different (> 50m) from start */
                        (() => {
                            const startPoint = livePath[0];
                            const currentLat = selectedVehicle.lat;
                            const currentLng = selectedVehicle.lng;
                            const dist = Math.sqrt(Math.pow(startPoint.latitude - currentLat, 2) + Math.pow(startPoint.longitude - currentLng, 2));
                            // Approx 0.0005 degrees is roughly 50m
                            if (dist > 0.0005) {
                                return (
                                    <Marker position={[startPoint.latitude, startPoint.longitude]} icon={startIcon}>
                                        <Popup>Start of History (1h ago)</Popup>
                                    </Marker>
                                );
                            }
                            return null;
                        })()}

                    {/* Interactive Points (Green Arrows) */}
                    {visiblePoints.map((point, idx) => {
                        // Use "Same Green with White Arrow" style for each mark
                        const rotation = point.course || 0;
                        const arrowIcon = L.divIcon({
                            className: 'bg-transparent',
                            html: `<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: rotate(${rotation}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        });

                        return (
                            <Marker
                                key={`point-${idx}`}
                                position={[point.latitude, point.longitude]}
                                icon={arrowIcon}
                                zIndexOffset={-50}
                            >
                                <Popup>
                                    <div className="p-1 min-w-[200px]">
                                        <strong className="block text-sm mb-2 border-b pb-1">Trip Point Info</strong>
                                        <div className="grid grid-cols-[60px_1fr] gap-1 text-xs">
                                            <span className="text-gray-500 font-medium">Time:</span>
                                            <span>{point.fixTime ? new Date(point.fixTime).toLocaleString() : "-"}</span>
                                            <span className="text-gray-500 font-medium">Speed:</span>
                                            <span>{point.speed ? `${(point.speed * 1.852).toFixed(1)} km/h` : "0 km/h"}</span>
                                            <span className="text-gray-500 font-medium">Course:</span>
                                            <span>{point.course}°</span>
                                            <span className="text-gray-500 font-medium">Address:</span>
                                            <AddressDisplay lat={point.latitude} lng={point.longitude} />
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
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

            {/* Render Vehicles with Smooth Motion */}
            {vehicles.map((vehicle) => (
                <MovingMarker
                    key={vehicle.id}
                    position={[vehicle.lat, vehicle.lng]}
                    icon={createVehicleIcon(vehicle.icon || "default", vehicle.category)}
                    onSelect={() => {
                        if (onSelectVehicle) {
                            onSelectVehicle(vehicle);
                        }
                    }}
                    onDoubleClick={() => {
                        if (onDoubleClickVehicle) {
                            onDoubleClickVehicle(vehicle);
                        }
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
                </MovingMarker>
            ))}
        </MapContainer>
    );
}
