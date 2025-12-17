export const TRACCAR_BASE_URL = "http://144.21.50.12";

export async function traccarApi(endpoint: string, options: RequestInit = {}) {
    const url = `${TRACCAR_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
    };

    // Inject Basic Auth if available
    if (typeof window !== "undefined") {
        const auth = localStorage.getItem("traccar_auth");
        if (auth) {
            headers["Authorization"] = auth;
        }
    }

    const newOptions = {
        ...options,
        headers,
    };

    const response = await fetch(url, newOptions);
    return response;
}
