"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { MapContainer, TileLayer, FeatureGroup, Circle, Polygon, Polyline, Popup, useMap, LayersControl, ZoomControl } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { Geofence } from "@/lib/data";
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

interface GeofenceMapComponentProps {
    geofences: Geofence[];
    onGeofenceCreated: (geofence: Omit<Geofence, "id">) => void;
    onGeofenceEdited: (id: string, newShape: any) => void;
    onGeofenceDeleted: (id: string) => void;
    selectedGeofenceIds: string[];
}

function MapController({ selectedGeofenceIds, geofences }: { selectedGeofenceIds: string[], geofences: Geofence[] }) {
    const map = useMap();

    useEffect(() => {
        if (selectedGeofenceIds.length > 0) {
            const selected = geofences.filter(g => selectedGeofenceIds.includes(g.id));
            if (selected.length > 0) {
                const group = L.featureGroup(selected.map(g => {
                    if (g.type === 'circle') {
                        return L.circle(g.coordinates, { radius: g.radius });
                    } else {
                        return L.polygon(g.coordinates);
                    }
                }));
                group.addTo(map);
                try {
                    map.fitBounds(group.getBounds(), { padding: [50, 50] });
                } finally {
                    group.removeFrom(map);
                }
            }
        }
    }, [selectedGeofenceIds, geofences, map]);

    return null;
}

export interface GeofenceMapHandle {
    startDrawing: () => void;
}

const GeofenceMapComponent = forwardRef<GeofenceMapHandle, GeofenceMapComponentProps>(({
    geofences,
    onGeofenceCreated,
    onGeofenceEdited,
    onGeofenceDeleted,
    selectedGeofenceIds
}, ref) => {
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const mapRef = useRef<L.Map | null>(null);

    useImperativeHandle(ref, () => ({
        startDrawing: () => {
            if (mapRef.current) {
                // @ts-ignore - Leaflet Draw types might be missing specific constructor
                const polygonDrawer = new L.Draw.Polygon(mapRef.current);
                polygonDrawer.enable();
            }
        }
    }));

    function MapRef() {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map;
        }, [map]);
        return null;
    }

    const _onCreated = (e: any) => {
        const type = e.layerType;
        const layer = e.layer;

        if (type === 'circle') {
            onGeofenceCreated({
                name: "New Circle Geofence",
                type: "circle",
                coordinates: [layer.getLatLng().lat, layer.getLatLng().lng],
                radius: layer.getRadius(),
                description: ""
            });
        } else if (type === 'polygon') {
            const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
            onGeofenceCreated({
                name: "New Polygon Geofence",
                type: "polygon",
                coordinates: latlngs,
                description: ""
            });
        } else if (type === 'polyline') {
            const latlngs = layer.getLatLngs().map((ll: any) => [ll.lat, ll.lng]);
            onGeofenceCreated({
                name: "New Polyline Geofence",
                type: "polyline",
                coordinates: latlngs,
                description: ""
            });
        }
    };

    const _onEdited = (e: any) => {
        console.log("Geofence edited", e);
    };

    const _onDeleted = (e: any) => {
        console.log("Geofence deleted", e);
    };

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
        >
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

            <MapRef />
            <MapSearchControl style={{ marginTop: '295px' }} />
            <MapController selectedGeofenceIds={selectedGeofenceIds} geofences={geofences} />
            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={_onCreated}
                    onEdited={_onEdited}
                    onDeleted={_onDeleted}
                    draw={{
                        rectangle: false,
                        polyline: true,
                        circlemarker: false,
                        marker: false,
                        circle: true,
                        polygon: true
                    }}
                />
                {geofences.map((geofence) => {
                    if (geofence.type === 'circle') {
                        return (
                            <Circle
                                key={geofence.id}
                                center={geofence.coordinates}
                                radius={geofence.radius || 100}
                                pathOptions={{ color: 'blue', fillColor: 'blue' }}
                            >
                                <Popup>
                                    <div className="font-bold">{geofence.name}</div>
                                    <div className="text-sm">{geofence.description}</div>
                                </Popup>
                            </Circle>
                        );
                    } else if (geofence.type === 'polygon') {
                        return (
                            <Polygon
                                key={geofence.id}
                                positions={geofence.coordinates}
                                pathOptions={{ color: 'green', fillColor: 'green' }}
                            >
                                <Popup>
                                    <div className="font-bold">{geofence.name}</div>
                                    <div className="text-sm">{geofence.description}</div>
                                </Popup>
                            </Polygon>
                        );
                    } else if (geofence.type === 'polyline') {
                        return (
                            <Polyline
                                key={geofence.id}
                                positions={geofence.coordinates}
                                pathOptions={{ color: 'orange' }}
                            >
                                <Popup>
                                    <div className="font-bold">{geofence.name}</div>
                                    <div className="text-sm">{geofence.description}</div>
                                </Popup>
                            </Polyline>
                        );
                    }
                    return null;
                })}
            </FeatureGroup>
            <ZoomControl position="topright" />
        </MapContainer>
    );
});

export default GeofenceMapComponent;
