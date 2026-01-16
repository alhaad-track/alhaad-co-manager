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
        cache: "no-store", // Ensure fresh data
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
    if (res.status === 204) {
        return {} as T;
    }
    return res.json();
}

export async function getDevices(params?: URLSearchParams) {
    const query = params ? `?${params.toString()}` : "";
    return fetchJson<any[]>(`/api/devices${query}`);
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

export async function deleteDevice(id: string | number) {
    return fetchJson<any>(`/api/devices/${id}`, {
        method: "DELETE",
    });
}

export async function getDrivers() {
    return fetchJson<any[]>("/api/drivers");
}

export async function getUsers(query?: string) {
    return fetchJson<any[]>(`/api/users${query ? `?${query}` : ""}`);
}

export async function getUser(id: string | number) {
    // If specific endpoint exists, use it. Otherwise standard generic get.
    // Traccar usually allows /api/users?userId=X or /api/users/id (sometimes)
    // Best to use filter if not sure, but let's try direct if supported or fall back to array find if generic
    // Actually Traccar API for single user is usually /api/users/{id} not supported always, usually /api/users?userId=
    // Let's implement robustly.
    return fetchJson<any>(`/api/users/${id}`).catch(() => null);
}

export async function createUser(user: any) {
    return fetchJson<any>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
}

export async function updateUser(id: string | number, user: any) {
    return fetchJson<any>(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
}

export async function deleteUser(id: string | number) {
    return fetchJson<any>(`/api/users/${id}`, {
        method: "DELETE",
    });
}

export async function getGeofences() {
    return fetchJson<any[]>("/api/geofences");
}

export async function createGeofence(geofence: any) {
    return fetchJson<any>("/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geofence),
    });
}

export async function updateGeofence(id: string | number, geofence: any) {
    return fetchJson<any>(`/api/geofences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geofence),
    });
}

export async function deleteGeofence(id: string | number) {
    return fetchJson<any>(`/api/geofences/${id}`, {
        method: "DELETE",
    });
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

export async function addPermission(permission: { userId?: number; deviceId?: number; driverId?: number; geofenceId?: number;[key: string]: any }) {
    return fetchJson<any>("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permission),
    });
}

export async function removePermission(permission: { userId?: number; deviceId?: number;[key: string]: any }) {
    return fetchJson<any>("/api/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permission),
    });
}

export async function getPermissions(params?: URLSearchParams) {
    const query = params ? `?${params.toString()}` : "";
    return fetchJson<any[]>(`/api/permissions${query}`);
}


export async function sendCommand(command: { deviceId: number; type: string; attributes?: any; description?: string }) {
    return fetchJson<any>("/api/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
    });
}

export async function getCommands(params?: URLSearchParams) {
    const query = params ? `?${params.toString()}` : "";
    return fetchJson<any[]>(`/api/commands${query}`);
}

export async function createCommand(command: any) {
    return fetchJson<any>("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
    });
}

export async function updateCommand(id: string | number, command: any) {
    return fetchJson<any>(`/api/commands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
    });
}

export async function deleteCommand(id: string | number) {
    return fetchJson<any>(`/api/commands/${id}`, {
        method: "DELETE",
    });
}


