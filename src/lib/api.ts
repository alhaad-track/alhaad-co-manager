export const TRACCAR_BASE_URL = "http://144.21.50.12";

export async function traccarApi(endpoint: string, options: RequestInit = {}) {
    const url = `${TRACCAR_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Default headers can be added here if needed
    // For x-www-form-urlencoded, the browser/fetch sets it automatically if body is URLSearchParams

    const response = await fetch(url, options);
    return response;
}
