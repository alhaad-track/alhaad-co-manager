export const TRACCAR_BASE_URL = "/api/proxy";

export async function traccarApi(endpoint: string, options: RequestInit = {}) {
    const url = `${TRACCAR_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
        "Accept": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    // Inject Basic Auth if available
    if (typeof window !== "undefined") {
        const auth = localStorage.getItem("traccar_auth");
        if (auth) {
            headers["Authorization"] = auth;
        }
    }

    const newOptions: RequestInit = {
        credentials: "include", // Required for cookies (JSESSIONID)
        ...options,
        headers,
    };

    const response = await fetch(url, newOptions);
    return response;
}

// Helper to handle JSON responses
async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await traccarApi(endpoint, options);
    if (!res.ok) {
        throw new Error(`API request to ${endpoint} failed with status ${res.status}`);
    }
    return res.json();
}

export async function getDevices() {
    return fetchJson<any[]>("/api/devices");
}

export async function createDevice(device: any) {
    return fetchJson<any>("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
    });
}

export async function updateDevice(id: string, device: any) {
    return fetchJson<any>(`/api/devices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
    });
}

export async function getDrivers() {
    return fetchJson<any[]>("/api/drivers");
}

export async function getUsers() {
    return fetchJson<any[]>("/api/users");
}

export async function getGeofences() {
    return fetchJson<any[]>("/api/geofences");
}

export async function getEvents(params: URLSearchParams) {
    return fetchJson<any[]>(`/api/reports/events?${params.toString()}`);
}

export async function getTrips(params: URLSearchParams) {
    return fetchJson<any[]>(`/api/reports/trips?${params.toString()}`);
}

export async function getRoute(params: URLSearchParams) {
    return fetchJson<any[]>(`/api/reports/route?${params.toString()}`);
}

export async function getStops(params: URLSearchParams) {
    return fetchJson<any[]>(`/api/reports/stops?${params.toString()}`);
}

export async function getSummary(params: URLSearchParams) {
    return fetchJson<any[]>(`/api/reports/summary?${params.toString()}`);
}

export async function getPosition(id: string) {
    return fetchJson<any[]>(`/api/positions?id=${id}`);
}

export async function reverseGeocode(latitude: number, longitude: number) {
    const res = await traccarApi(`/api/server/geocode?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) throw new Error("Geocoding failed");
    return res.text();
}
