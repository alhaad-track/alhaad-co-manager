"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, FeatureGroup, Circle, Polygon, Popup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { Geofence } from "@/lib/data";

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

export default function GeofenceMapComponent({
    geofences,
    onGeofenceCreated,
    onGeofenceEdited,
    onGeofenceDeleted,
    selectedGeofenceIds
}: GeofenceMapComponentProps) {
    const featureGroupRef = useRef<L.FeatureGroup>(null);

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
        }
    };

    const _onEdited = (e: any) => {
        console.log("Geofence edited", e);
    };

    const _onDeleted = (e: any) => {
        console.log("Geofence deleted", e);
    };

    const displayedGeofences = geofences.filter(g => selectedGeofenceIds.includes(g.id));

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selectedGeofenceIds={selectedGeofenceIds} geofences={geofences} />
            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={_onCreated}
                    onEdited={_onEdited}
                    onDeleted={_onDeleted}
                    draw={{
                        rectangle: false,
                        polyline: false,
                        circlemarker: false,
                        marker: false,
                        circle: true,
                        polygon: true
                    }}
                />
                {displayedGeofences.map((geofence) => {
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
                    }
                    return null;
                })}
            </FeatureGroup>
        </MapContainer>
    );
}
