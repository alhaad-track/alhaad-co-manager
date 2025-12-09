import { Geofence } from "./data";

// Calculate distance between two points in meters using Haversine formula
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]) {
    var x = point.lat, y = point.lng;
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].lat, yi = polygon[i].lng;
        var xj = polygon[j].lat, yj = polygon[j].lng;

        var intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function isVehicleInGeofence(vehicleLat: number, vehicleLng: number, geofence: Geofence): boolean {
    if (geofence.type === "circle") {
        if (!geofence.radius) return false;
        // Circle coordinates in Leaflet are [lat, lng]
        const centerLat = geofence.coordinates[0];
        const centerLng = geofence.coordinates[1];
        const distance = getDistanceFromLatLonInMeters(vehicleLat, vehicleLng, centerLat, centerLng);
        return distance <= geofence.radius;
    } else if (geofence.type === "polygon") {
        // Polygon coordinates in Leaflet are [[lat, lng], [lat, lng], ...]
        // Note: Leaflet Draw might return nested arrays depending on how it's saved, 
        // but our mock data is simple array of points.
        // Let's assume simple array of [lat, lng] for now based on mock data.
        const polygonPoints = geofence.coordinates.map((coord: any) => ({ lat: coord[0], lng: coord[1] }));
        return isPointInPolygon({ lat: vehicleLat, lng: vehicleLng }, polygonPoints);
    }
    return false;
}

export interface Alert {
    id: string;
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    type: "entry" | "exit";
    timestamp: string;
    message: string;
}

// Mock function to generate alerts based on current vehicle positions
export function generateAlerts(vehicles: any[], geofences: Geofence[]): Alert[] {
    const alerts: Alert[] = [];

    vehicles.forEach(vehicle => {
        if (!vehicle.assignedGeofenceIds || vehicle.assignedGeofenceIds.length === 0) return;

        vehicle.assignedGeofenceIds.forEach((geofenceId: string) => {
            const geofence = geofences.find(g => g.id === geofenceId);
            if (!geofence) return;

            const isInside = isVehicleInGeofence(vehicle.lat, vehicle.lng, geofence);

            // In a real system, we would compare with previous state to detect transition.
            // For this demo, we will just generate an "Inside" status alert if inside, 
            // or maybe simulate an event based on some logic.
            // Let's just say if they are inside, we show an "Entry" alert from "Just now"
            // If they are outside, we show an "Exit" alert from "5 mins ago" (mock logic)

            if (isInside) {
                alerts.push({
                    id: `alert-${vehicle.id}-${geofence.id}-entry`,
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    type: "entry",
                    timestamp: "Just now",
                    message: `${vehicle.name} is inside ${geofence.name}`
                });
            } else {
                // Optional: Don't spam exit alerts if they are just somewhere else
                // But for demo purposes, maybe we show one if they are close?
                // Let's just stick to "Entry" alerts for positive confirmation for now, 
                // or maybe show "Exit" if they are explicitly NOT in it but assigned.
                alerts.push({
                    id: `alert-${vehicle.id}-${geofence.id}-exit`,
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    type: "exit",
                    timestamp: "10 mins ago",
                    message: `${vehicle.name} is outside ${geofence.name}`
                });
            }
        });
    });

    return alerts;
}
