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

// ---------------------------------------------------------------------------
// Go API (alhaad-go-api) — JWT auth, fast reads straight from the Traccar DB
// ---------------------------------------------------------------------------

export const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8080";
export const GO_TOKEN_KEY = "go_token";

export async function goApi(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        "Accept": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (typeof window !== "undefined") {
        const token = localStorage.getItem(GO_TOKEN_KEY);
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${GO_API_URL}${endpoint}`, { cache: "no-store", ...options, headers });

    // Expired/invalid JWT -> back to login
    if (response.status === 401 && typeof window !== "undefined" && !endpoint.startsWith("/api/v1/auth/login")) {
        localStorage.removeItem(GO_TOKEN_KEY);
        localStorage.removeItem("user");
        window.location.href = "/login";
    }

    return response;
}

async function goJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await goApi(endpoint, options);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Go API request to ${endpoint} failed with status ${res.status}`);
    }
    if (res.status === 204) {
        return {} as T;
    }
    return res.json();
}

function goSend<T>(endpoint: string, method: string, body: unknown): Promise<T> {
    return goJson<T>(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function goPost<T>(endpoint: string, body: unknown): Promise<T> {
    return goSend<T>(endpoint, "POST", body);
}

// Traccar-style params (repeated `deviceId`) -> numeric id array
function deviceIdsFrom(params: URLSearchParams): number[] {
    return params.getAll("deviceId").map(Number).filter(id => !Number.isNaN(id));
}

export async function goLogin(email: string, password: string) {
    const res = await goApi("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || (res.status === 401 ? "Invalid email or password" : "Login failed"));
    }
    return data as { token: string; expiresAt: string; user: { id: number; name: string; email: string; administrator: boolean } };
}

export async function getDevices(params?: URLSearchParams) {
    const query = new URLSearchParams();
    if (params?.get("userId")) query.set("userId", params.get("userId")!);
    if (params?.get("groupId")) query.set("groupId", params.get("groupId")!);
    if (params?.get("driverId")) query.set("driverId", params.get("driverId")!);
    const qs = query.toString();

    const data = await goJson<{ count: number; devices: any[] }>(`/api/v1/devices${qs ? `?${qs}` : ""}`);
    let devices = data.devices || [];

    // Traccar supports `?id=`; the Go API doesn't, so filter here
    const ids = params?.getAll("id");
    if (ids && ids.length > 0) {
        devices = devices.filter(d => ids.includes(d.id.toString()));
    }
    return devices;
}

// Latest position for each device (replaces Traccar's GET /api/positions)
export async function getLatestPositions(deviceIds: number[]) {
    if (deviceIds.length === 0) return [];
    const data = await goPost<{ count: number; positions: any[] }>("/api/v1/positions/latest", { deviceIds });
    return data.positions || [];
}

export async function getDevice(id: string | number) {
    return goJson<any>(`/api/v1/devices/${id}`).catch(() => null);
}

export async function createDevice(device: any) {
    return goSend<any>("/api/v1/devices", "POST", device);
}

export async function updateDevice(id: string | number, device: any) {
    return goSend<any>(`/api/v1/devices/${id}`, "PUT", device);
}

export async function deleteDevice(id: string | number) {
    return goJson<any>(`/api/v1/devices/${id}`, { method: "DELETE" });
}

// Drivers come from the Go API, scoped to the caller
export async function getDrivers(query?: string) {
    const data = await goJson<{ count: number; drivers: any[] }>(`/api/v1/drivers${query ? `?${query}` : ""}`);
    return data.drivers || [];
}

export async function getDriver(id: string | number) {
    return goJson<any>(`/api/v1/drivers/${id}`).catch(() => null);
}

export async function createDriver(driver: any) {
    return goSend<any>("/api/v1/drivers", "POST", driver);
}

export async function updateDriver(id: string | number, driver: any) {
    return goSend<any>(`/api/v1/drivers/${id}`, "PUT", driver);
}

// Users come from the Go API, scoped to the caller (admins: all, managers: their users)
export async function getUsers(query?: string) {
    const data = await goJson<{ count: number; users: any[] }>(`/api/v1/users${query ? `?${query}` : ""}`);
    return data.users || [];
}

export async function getUser(id: string | number) {
    return goJson<any>(`/api/v1/users/${id}`).catch(() => null);
}

export async function createUser(user: any) {
    return goSend<any>("/api/v1/users", "POST", user);
}

export async function updateUser(id: string | number, user: any) {
    return goSend<any>(`/api/v1/users/${id}`, "PUT", user);
}

export async function deleteUser(id: string | number) {
    return goJson<any>(`/api/v1/users/${id}`, { method: "DELETE" });
}

// Geofences come from the Go API, scoped to the caller
export async function getGeofences(query?: string) {
    const data = await goJson<{ count: number; geofences: any[] }>(`/api/v1/geofences${query ? `?${query}` : ""}`);
    return data.geofences || [];
}

export async function createGeofence(geofence: any) {
    return goSend<any>("/api/v1/geofences", "POST", geofence);
}

export async function updateGeofence(id: string | number, geofence: any) {
    return goSend<any>(`/api/v1/geofences/${id}`, "PUT", geofence);
}

export async function deleteGeofence(id: string | number) {
    return goJson<any>(`/api/v1/geofences/${id}`, { method: "DELETE" });
}

export async function getEvents(params: URLSearchParams) {
    const deviceIds = deviceIdsFrom(params);
    if (deviceIds.length === 0) return [];
    const types = params.getAll("type").filter(t => t && t !== "allEvents");
    const data = await goPost<{ count: number; events: any[] }>("/api/v1/reports/events", {
        deviceIds,
        types: types.length > 0 ? types : undefined,
        from: params.get("from") || undefined,
        to: params.get("to") || undefined,
        limit: 5000,
    });
    // Go returns the event time as `serverTime`; the UI reads Traccar's `eventTime`
    return (data.events || []).map(e => ({ ...e, eventTime: e.serverTime }));
}

// Trips and stops are computed by the Go API with Traccar's default thresholds
function reportRange(params: URLSearchParams) {
    return {
        deviceIds: deviceIdsFrom(params),
        from: params.get("from") || undefined,
        to: params.get("to") || undefined,
    };
}

export async function getTrips(params: URLSearchParams) {
    const body = reportRange(params);
    if (body.deviceIds.length === 0) return [];
    const data = await goPost<{ count: number; trips: any[] }>("/api/v1/reports/trips", body);
    return data.trips || [];
}

export async function getRoute(params: URLSearchParams) {
    const deviceIds = deviceIdsFrom(params);
    if (deviceIds.length === 0) return [];
    const data = await goPost<{ count: number; positions: any[] }>("/api/v1/positions/history", {
        deviceIds,
        from: params.get("from") || undefined,
        to: params.get("to") || undefined,
        limit: 10000,
    });
    return data.positions || [];
}

export async function getStops(params: URLSearchParams) {
    const body = reportRange(params);
    if (body.deviceIds.length === 0) return [];
    const data = await goPost<{ count: number; stops: any[] }>("/api/v1/reports/stops", body);
    return data.stops || [];
}

export async function getSummary(params: URLSearchParams) {
    const deviceIds = deviceIdsFrom(params);
    if (deviceIds.length === 0) return [];
    const query = new URLSearchParams();
    if (params.get("from")) query.set("from", params.get("from")!);
    if (params.get("to")) query.set("to", params.get("to")!);
    // Note: the Go API has no `daily` breakdown; it returns one row per device
    const data = await goPost<{ summaries: any[] }>(`/api/v1/reports/summary?${query.toString()}`, { deviceIds });
    return data.summaries || [];
}

// A single position by ID (Traccar's GET /api/positions?id=)
export async function getPosition(id: string | number) {
    return goJson<any>(`/api/v1/positions/${id}`);
}

export async function reverseGeocode(latitude: number, longitude: number) {
    const res = await goApi(`/api/v1/geocode?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) throw new Error("Geocoding failed");
    return res.text();
}

type Permission = { userId?: number; deviceId?: number; groupId?: number; geofenceId?: number; driverId?: number; managedUserId?: number };

export async function addPermission(permission: Permission) {
    return goSend<any>("/api/v1/permissions", "POST", permission);
}

export async function removePermission(permission: Permission) {
    return goSend<any>("/api/v1/permissions", "DELETE", permission);
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


