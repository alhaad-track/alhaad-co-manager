export interface User {
    id: string;
    name: string;
    email: string;
    role: "manager" | "user";
    createdAt: string;
}

export interface Vehicle {
    id: string;
    name: string;
    model: string;
    imei: string;
    userId?: string;
    status: "online" | "offline" | "moving";
    lastUpdate: string;
    lat: number;
    lng: number;
    driverId?: string;
    assignedGeofenceIds?: string[];
    icon: "truck" | "car" | "van" | "bus" | "motorcycle" | "default";
    positionId?: string;
    maxSpeed?: number;
}

export interface Geofence {
    id: string;
    name: string;
    type: "polygon" | "circle";
    coordinates: any; // Leaflet format
    radius?: number; // For circles
    description?: string;
}

export interface Trip {
    id: string;
    vehicleId: string;
    startLocation: string;
    endLocation: string;
    startTime: string;
    endTime: string;
    distance: string; // e.g., "120 km"
    duration: string; // e.g., "2h 15m"
    averageSpeed: string; // e.g., "65 km/h"
    startLat?: number;
    startLon?: number;
    endLat?: number;
    endLon?: number;
}

export interface Driver {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone: string;
    email: string;
    status: "active" | "inactive";
    avatar?: string;
}

// Mock Data
export const initialUsers: User[] = [
    { id: "1", name: "Manager User", email: "manager@example.com", role: "manager", createdAt: "2023-01-01" },
    { id: "2", name: "John Doe", email: "john@example.com", role: "user", createdAt: "2023-02-15" },
    { id: "3", name: "Jane Smith", email: "jane@example.com", role: "user", createdAt: "2023-03-20" },
];

export const initialDrivers: Driver[] = [
    { id: "d1", firstName: "Ali", lastName: "Ahmed", licenseNumber: "LIC-12345", phone: "+1234567890", email: "ali@example.com", status: "active" },
    { id: "d2", firstName: "Mohammed", lastName: "Khan", licenseNumber: "LIC-67890", phone: "+0987654321", email: "mohammed@example.com", status: "active" },
    { id: "d3", firstName: "Sarah", lastName: "Connor", licenseNumber: "LIC-11223", phone: "+1122334455", email: "sarah@example.com", status: "inactive" },
];

export const initialVehicles: Vehicle[] = [
    { id: "v1", name: "Truck 001", model: "Volvo FH16", imei: "123456789012345", userId: "2", driverId: "d1", status: "moving", lastUpdate: "Just now", lat: 51.505, lng: -0.09, assignedGeofenceIds: ["g1"], icon: "truck" },
    { id: "v2", name: "Van 002", model: "Ford Transit", imei: "987654321098765", userId: "3", driverId: "d2", status: "online", lastUpdate: "5 mins ago", lat: 51.51, lng: -0.1, assignedGeofenceIds: ["g2"], icon: "van" },
    { id: "v3", name: "Car 003", model: "Toyota Prius", imei: "112233445566778", status: "offline", lastUpdate: "2 hours ago", lat: 51.49, lng: -0.08, icon: "car" },
];

export const initialGeofences: Geofence[] = [
    {
        id: "g1",
        name: "Main Warehouse",
        type: "circle",
        coordinates: [51.505, -0.09],
        radius: 500,
        description: "Central logistics hub"
    },
    {
        id: "g2",
        name: "City Center Zone",
        type: "polygon",
        coordinates: [
            [51.51, -0.1],
            [51.51, -0.12],
            [51.53, -0.12],
            [51.53, -0.1]
        ],
        description: "Restricted access area"
    }
];

export const initialTrips: Trip[] = [
    {
        id: "t1",
        vehicleId: "v1",
        startLocation: "Main Warehouse",
        endLocation: "Distribution Center North",
        startTime: "2023-10-25 08:00",
        endTime: "2023-10-25 10:30",
        distance: "150 km",
        duration: "2h 30m",
        averageSpeed: "60 km/h",
        startLat: 51.505,
        startLon: -0.09,
        endLat: 51.515,
        endLon: -0.1
    },
    {
        id: "t2",
        vehicleId: "v1",
        startLocation: "Distribution Center North",
        endLocation: "Main Warehouse",
        startTime: "2023-10-25 14:00",
        endTime: "2023-10-25 16:45",
        distance: "155 km",
        duration: "2h 45m",
        averageSpeed: "56 km/h",
        startLat: 51.515,
        startLon: -0.1,
        endLat: 51.505,
        endLon: -0.09
    },
    {
        id: "t3",
        vehicleId: "v2",
        startLocation: "City Center Zone",
        endLocation: "Customer Site A",
        startTime: "2023-10-26 09:15",
        endTime: "2023-10-26 09:45",
        distance: "12 km",
        duration: "30m",
        averageSpeed: "24 km/h",
        startLat: 51.51,
        startLon: -0.1,
        endLat: 51.53,
        endLon: -0.12
    }
];

export const mockTripPaths: Record<string, { path: [number, number][], stops: { lat: number, lng: number, duration: string, time: string }[] }> = {
    "v1": {
        path: [
            [51.515, -0.1],
            [51.514, -0.099],
            [51.513, -0.098],
            [51.512, -0.097],
            [51.511, -0.096],
            [51.51, -0.095],
            [51.509, -0.094],
            [51.508, -0.093],
            [51.507, -0.092],
            [51.506, -0.091],
            [51.505, -0.09]
        ],
        stops: [
            { lat: 51.508, lng: -0.093, duration: "15m", time: "10:30 AM" },
            { lat: 51.512, lng: -0.097, duration: "45m", time: "11:15 AM" }
        ]
    },
    "v2": {
        path: [
            [51.515, -0.105],
            [51.514, -0.104],
            [51.513, -0.103],
            [51.512, -0.102],
            [51.511, -0.101],
            [51.51, -0.1]
        ],
        stops: [
            { lat: 51.513, lng: -0.103, duration: "10m", time: "09:45 AM" }
        ]
    },
    "v3": {
        path: [],
        stops: []
    }
};
