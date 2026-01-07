"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline, CircleMarker, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { reverseGeocode } from "@/lib/api";
import { Vehicle, mockTripPaths } from "@/lib/data";
import { Car, Truck, Bus, Bike, Box, Anchor, Plane, User, Leaf, Tractor, Ship, Navigation } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import MapSearchControl from "./MapSearchControl";

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

const ManualAddressDisplay = ({ lat, lng }: { lat: number, lng: number }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const fetchAddress = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent map click propagation
        e.preventDefault();

        setLoading(true);
        setError(false);

        reverseGeocode(lat, lng)
            .then((addr) => setAddress(addr || "Address not found"))
            .catch(() => {
                setError(true);
                setAddress(null);
            })
            .finally(() => setLoading(false));
    };

    if (address) {
        return <p className="text-xs text-gray-700 mt-1 border-t pt-1 break-words">{address}</p>;
    }

    if (loading) {
        return <p className="text-xs text-blue-500 italic mt-1">Resolving location...</p>;
    }

    if (error) {
        return (
            <div className="mt-1">
                <p className="text-xs text-red-500 mb-1">Failed to resolve</p>
                <button
                    onClick={fetchAddress}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={fetchAddress}
            className="mt-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors w-full text-center"
        >
            Show Address
        </button>
    );
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
    onDoubleClickVehicle?: (vehicle: Vehicle) => void;
    livePath?: TripPoint[];
    showFullHistory?: boolean;
    onSendCommand?: (vehicle: Vehicle) => void;
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

// Navigation Arrow Icon for Moving State
const createNavigationArrowIcon = (rotation: number = 0) => {
    // A clean white circle with a blue directional arrow
    const iconHtml = renderToStaticMarkup(
        <div style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.3s linear', // Smooth CSS rotation
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}>
                <path d="M20 2L35 35L20 28L5 35L20 2Z" fill="#2563EB" stroke="white" strokeWidth="3" strokeLinejoin="round" />
            </svg>
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: "custom-nav-icon", // Use a class that doesn't add default styles
        iconSize: [40, 40],
        iconAnchor: [20, 20], // Center it
        popupAnchor: [0, -20]
    });
};

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
        <div className="bg-white rounded-full p-1.5 border-2 border-gray-100 shadow-md">
            <IconComponent className="w-5 h-5 text-gray-700" />
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: "custom-vehicle-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
};

// Smoothly moving marker with buffering
const MovingMarker = ({ position, rotation, icon, timestamp, children, onSelect, onDoubleClick }: {
    position: [number, number],
    rotation: number,
    icon: L.DivIcon,
    timestamp?: number, // Timestamp of the point in ms
    children: React.ReactNode,
    onSelect?: () => void,
    onDoubleClick?: () => void
}) => {
    const markerRef = useRef<L.Marker>(null);

    // Queue of target positions: { lat, lng, time, rotation }
    const bufferRef = useRef<{ lat: number; lng: number; time: number; rotation: number }[]>([]);

    // Current animation state
    const animationRef = useRef<{
        startLat: number;
        startLng: number;
        startTime: number;
        duration: number;
        targetLat: number;
        targetLng: number;
        targetRotation: number;
        startRotation: number;
    } | null>(null);

    const requestRef = useRef<number | null>(null);
    const lastPositionRef = useRef(position);

    // Initial setup: ensure marker is placed at initial position
    // Use initialProps to avoid re-rendering marker when position prop changes, we handle it manually
    const initialProps = useRef({ position, icon });

    // Handle Icon Updates independently
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setIcon(icon);
        }
    }, [icon]);

    // Add new position to buffer when props change
    useEffect(() => {
        const [lat, lng] = position;
        const [prevLat, prevLng] = lastPositionRef.current;

        // Determine if this is a "new" point or just a re-render
        // If exact same position, we might skip unless we want to force buffer consistency
        // But for live tracking, we usually get different timestamps.

        const now = Date.now();
        const time = timestamp || now;

        // Push to buffer
        // Prevent duplicate adjacent points in buffer to avoid zero-duration moves, unless rotation changed?
        const lastInBuffer = bufferRef.current.length > 0 ? bufferRef.current[bufferRef.current.length - 1] : null;
        if (lastInBuffer && lastInBuffer.lat === lat && lastInBuffer.lng === lng && lastInBuffer.time === time) {
            return;
        }

        bufferRef.current.push({ lat, lng, time, rotation });
        lastPositionRef.current = position;

    }, [position[0], position[1], rotation, timestamp]);

    // Track the time of the point we are currently AT (or started animation from)
    const lastProcessedTimeRef = useRef<number>(timestamp || Date.now());

    // Track current rotation for smooth transitions
    const lastRotationRef = useRef<number>(rotation);

    // Stable event handlers
    const onSelectRef = useRef(onSelect);
    const onDoubleClickRef = useRef(onDoubleClick);
    useEffect(() => {
        onSelectRef.current = onSelect;
        onDoubleClickRef.current = onDoubleClick;
    }, [onSelect, onDoubleClick]);

    const eventHandlers = useMemo(() => ({
        click: (e: any) => {
            if (onSelectRef.current) onSelectRef.current();
        },
        dblclick: (e: any) => {
            if (onDoubleClickRef.current) onDoubleClickRef.current();
        }
    }), []); // Empty dependency array = stable handlers

    // Animation Loop
    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        const animate = (currentTime: number) => {
            // 1. If no animation running, try to pick next segment
            if (!animationRef.current) {
                // User requested "jump back 2 points" / smooth gliding.
                // We enforce a buffer lag: We need at least 2 points ([Start, End]) to animate a segment physically.
                // We do NOT consume the buffer until we have enough points to maintain a flow?
                // Or simply: If buffer has [A, B], we animate A -> B.
                // To prevent "stop-start", we ideally want [A, B, C] so when A->B finishes, we immediately have B->C.
                // But [A, B] is the minimum to move at all.

                if (bufferRef.current.length > 1) {
                    const startPoint = bufferRef.current[0];
                    const targetPoint = bufferRef.current[1];

                    // We remove startPoint, as we are now "departing" it.
                    bufferRef.current.shift();

                    // Calculate Duration
                    // For live tracking, we want to be responsive. We shouldn't use the historical `timeDelta` (e.g. 30s) as the visual duration.
                    // Instead, we glide to the new point quickly (e.g. 1.5s or faster if backlog exists).

                    const backlog = bufferRef.current.length;

                    // Base duration for a "nice" glide
                    let duration = 1500;

                    // If we have a backlog (more points coming in than we are showing), speed up!
                    if (backlog > 2) {
                        // processing 5 points? do each in 200ms
                        duration = 1000 / (backlog / 2);
                    } else if (backlog > 5) {
                        duration = 100; // Super fast catchup
                    }

                    // Lower bound (don't go instantly unless huge lag) and Upper bound (don't take forever)
                    duration = Math.max(150, Math.min(duration, 2000));

                    // Special case: If the distance is TINY, don't take 1.5s
                    // const dist = Math.sqrt(Math.pow(targetPoint.lat - startPoint.lat, 2) + Math.pow(targetPoint.lng - startPoint.lng, 2));
                    // if (dist < 0.0001) duration = 500; // Short hop

                    // Note: We ignore targetPoint.time - startPoint.time for duration calculation
                    // because we want "Live Sync", not "Historical Replay".

                    animationRef.current = {
                        startLat: startPoint.lat,
                        startLng: startPoint.lng,
                        startTime: currentTime,
                        duration: duration,
                        targetLat: targetPoint.lat,
                        targetLng: targetPoint.lng,
                        targetRotation: targetPoint.rotation,
                        startRotation: startPoint.rotation // animate from A's rotation to B's rotation
                    };

                    // Snap to start position perfectly before moving (fixes drift from previous interpolation errors)
                    marker.setLatLng([startPoint.lat, startPoint.lng]);

                    lastProcessedTimeRef.current = targetPoint.time;
                }
            }

            // 2. If animation IS running, progress it
            if (animationRef.current) {
                const anim = animationRef.current;
                const elapsed = currentTime - anim.startTime;
                let progress = elapsed / anim.duration;

                if (progress >= 1) {
                    progress = 1;
                    marker.setLatLng([anim.targetLat, anim.targetLng]);

                    // Final rotation ensure
                    const iconEl = marker.getElement();
                    if (iconEl) {
                        const inner = iconEl.querySelector('div') as HTMLElement;
                        if (inner) inner.style.transform = `rotate(${anim.targetRotation}deg)`;
                    }

                    lastRotationRef.current = anim.targetRotation;
                    animationRef.current = null;
                } else {
                    // Linear interpolation (could use ease-out for smoother feel, but linear is best for continuous tracking)
                    const lat = anim.startLat + (anim.targetLat - anim.startLat) * progress;
                    const lng = anim.startLng + (anim.targetLng - anim.startLng) * progress;
                    marker.setLatLng([lat, lng]);

                    // Interpolate rotation (shortest path)
                    let startRot = anim.startRotation;
                    let endRot = anim.targetRotation;
                    // Handle wrap around 360
                    if (endRot - startRot > 180) endRot -= 360;
                    if (startRot - endRot > 180) startRot -= 360;

                    const currentRot = startRot + (endRot - startRot) * progress;

                    const iconEl = marker.getElement();
                    if (iconEl) {
                        const inner = iconEl.querySelector('div') as HTMLElement;
                        if (inner) inner.style.transform = `rotate(${currentRot}deg)`;
                    }
                }
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []); // Run effect once, internal refs handle state

    return (
        <Marker
            ref={markerRef}
            position={initialProps.current.position}
            icon={initialProps.current.icon}
            eventHandlers={eventHandlers}
        >
            {children}
        </Marker>
    );
};

export default function MapComponent({ vehicles, selectedVehicle, onSelectVehicle, onDoubleClickVehicle, livePath, showFullHistory = false, onSendCommand }: MapComponentProps) {
    const selectedTrip = selectedVehicle ? mockTripPaths[selectedVehicle.id] : null;
    const [zoom, setZoom] = useState(13); // Default zoom

    // Live Tracking History Duration (Default 15 minutes)
    const HISTORY_DURATION_MS = 15 * 60 * 1000;

    // Filter livePath to only include points within the history duration
    const filteredLivePath = useMemo(() => {
        if (!livePath || livePath.length === 0) return [];

        // If showing full history (e.g. from double click), return all points
        if (showFullHistory) return livePath;

        const latestPoint = livePath[livePath.length - 1];
        const latestTime = latestPoint.fixTime ? new Date(latestPoint.fixTime).getTime() : Date.now();

        return livePath.filter(p => {
            const pTime = p.fixTime ? new Date(p.fixTime).getTime() : 0;
            return (latestTime - pTime) <= HISTORY_DURATION_MS;
        });
    }, [livePath, showFullHistory]);

    // Prepare segments for colored line if livePath exists
    const segments = [];
    if (filteredLivePath && filteredLivePath.length > 1) {
        let currentSegment = [filteredLivePath[0]];
        let currentColor = getSpeedColor(filteredLivePath[0].speed || 0, selectedVehicle?.maxSpeed);

        for (let i = 1; i < filteredLivePath.length; i++) {
            const point = filteredLivePath[i];
            const pointColor = getSpeedColor(point.speed || 0, selectedVehicle?.maxSpeed);

            // Add previous point to start of new segment for continuity
            // We just push current point to current segment
            currentSegment.push(point);

            if (pointColor !== currentColor || i === filteredLivePath.length - 1) {
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
        if (!filteredLivePath || filteredLivePath.length === 0) return [];

        const latestPoint = filteredLivePath[filteredLivePath.length - 1];
        const latestTime = latestPoint.fixTime ? new Date(latestPoint.fixTime).getTime() : Date.now();

        const stationaryThreshold = 100;

        // Check if vehicle has been effectively stationary for the last history duration
        let isStationary = false;
        let maxDist = 0;

        // Scan backwards to find max deviation in history window
        for (let i = filteredLivePath.length - 1; i >= 0; i--) {
            const p = filteredLivePath[i];
            const pTime = p.fixTime ? new Date(p.fixTime).getTime() : 0;
            if (latestTime - pTime > HISTORY_DURATION_MS) break;

            const d = calculateDistance(p.latitude, p.longitude, latestPoint.latitude, latestPoint.longitude);
            if (d > maxDist) maxDist = d;
        }

        if (maxDist < stationaryThreshold) {
            isStationary = true;
        }

        const points: TripPoint[] = [];
        let lastPoint: TripPoint | null = null;

        for (let i = 0; i < filteredLivePath.length; i++) {
            const point = filteredLivePath[i];

            // Stationary Filter: If stationary for duration, hide points
            if (isStationary) {
                const pTime = point.fixTime ? new Date(point.fixTime).getTime() : 0;
                if (latestTime - pTime < HISTORY_DURATION_MS) {
                    continue;
                }
            }

            // Always include the last point (Unless it was filtered out by stationary check above)
            if (i === filteredLivePath.length - 1) {
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
        <MapContainer center={[51.505, -0.09]} zoom={13} zoomControl={false} style={{ height: "100%", width: "100%" }}>
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
            <ZoomControl position="topright" />
            <ZoomHandler setZoom={setZoom} />
            <MapSearchControl />

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
                            if (!filteredLivePath || filteredLivePath.length === 0) return null;
                            const startPoint = filteredLivePath[0];
                            const currentLat = selectedVehicle.lat;
                            const currentLng = selectedVehicle.lng;
                            const dist = Math.sqrt(Math.pow(startPoint.latitude - currentLat, 2) + Math.pow(startPoint.longitude - currentLng, 2));
                            // Approx 0.0005 degrees is roughly 50m
                            if (dist > 0.0005) {
                                return (
                                    <Marker position={[startPoint.latitude, startPoint.longitude]} icon={startIcon}>
                                        <Popup>{showFullHistory ? "Start of Day History" : "Start of History (15m ago)"}</Popup>
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
            {vehicles.map((vehicle) => {
                // Determine which icon to use
                // 1. If moving (status='moving' or speed > 0), use Navigation Arrow
                // 2. Else use created Vehicle Icon

                // Note: Traccar 'status' field isn't always reliable for 'moving' vs 'online', prefer speed or assume 'moving' status means moving.
                // But let's check basic logic.
                // Check if moving: Speed > 0.5 kn (approx 1 km/h) or Status is 'moving'
                const speed = vehicle.speed || (selectedVehicle?.id === vehicle.id && livePath && livePath.length > 0 ? livePath[livePath.length - 1].speed : 0) || 0;
                const isMoving = (vehicle.status === 'moving' || speed > 1) && vehicle.course !== undefined;

                let icon;
                if (isMoving && vehicle.course !== undefined) {
                    icon = createNavigationArrowIcon(vehicle.course);
                } else {
                    icon = createVehicleIcon(vehicle.icon || "default", vehicle.category);
                }

                return (


                    <MovingMarker
                        key={vehicle.id}
                        position={[vehicle.lat, vehicle.lng]}
                        rotation={vehicle.course || 0}
                        timestamp={vehicle.lastUpdate ? new Date(vehicle.lastUpdate).getTime() : Date.now()}
                        icon={icon}
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
                        <Popup minWidth={220}>
                            <div className="p-1">
                                <div className="flex justify-between items-start mb-2 border-b pb-2">
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900">{vehicle.name}</h3>
                                        <p className="text-xs text-gray-500">{vehicle.model}</p>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${vehicle.status === 'online' ? 'bg-green-100 text-green-700' :
                                        vehicle.status === 'moving' ? 'bg-blue-100 text-blue-700' :
                                            vehicle.status === 'offline' ? 'bg-gray-100 text-gray-700' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {vehicle.status}
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Speed:</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedVehicle?.id === vehicle.id && livePath && livePath.length > 0
                                                ? ((livePath[livePath.length - 1].speed || 0) * 1.852).toFixed(1)
                                                : (vehicle.speed ? (vehicle.speed * 1.852).toFixed(1) : "0.0")} km/h
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Last Update:</span>
                                        <span className="font-medium text-gray-900 max-w-[120px] truncate text-right" title={vehicle.lastUpdate}>
                                            {vehicle.lastUpdate ? new Date(vehicle.lastUpdate).toLocaleTimeString() : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">IMEI:</span>
                                        <span className="font-medium text-gray-900">{vehicle.imei}</span>
                                    </div>
                                </div>

                                <ManualAddressDisplay lat={vehicle.lat} lng={vehicle.lng} />

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSendCommand) onSendCommand(vehicle);
                                    }}
                                    className="mt-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors w-full text-center"
                                >
                                    Send Command
                                </button>

                                {selectedVehicle?.id === vehicle.id && (
                                    <div className="mt-2 text-center bg-blue-50 py-1 rounded border border-blue-100">
                                        <p className="text-[10px] text-blue-600 font-medium">Live Tracking Active</p>
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </MovingMarker>
                );
            })}
        </MapContainer>
    );
}
