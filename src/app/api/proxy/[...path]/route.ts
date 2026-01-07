import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(request, (await params).path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(request, (await params).path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(request, (await params).path);
}

async function proxy(request: NextRequest, path: string[]) {
    const baseUrl = process.env.NEXT_PUBLIC_TRACCAR_API_URL;
    const targetUrl = `${baseUrl}/${path.join("/")}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const finalUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;

    console.log(`Proxying ${request.method} ${finalUrl}`);

    try {
        const headers = new Headers(request.headers);
        // Remove Host to allow target to see its own Host
        headers.delete("host");
        // Ensure content-type is passed

        // Forward the request
        const response = await fetch(finalUrl, {
            method: request.method,
            headers: headers,
            body: request.body,
            // Important: do not follow redirects automatically if we want to pass them back effectively? 
            // explicit 'manual' might be needed for auth redirects but usually API returns JSON.
            redirect: "manual",
            // @ts-ignore - Required for Node.js fetch with stream body
            duplex: "half",
        });

        console.log(`Target responded with ${response.status}`);

        // Create response headers
        const resHeaders = new Headers(response.headers);

        // Handle Cookies
        // Explicitly log Set-Cookie header for debugging
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
            console.log("Got Set-Cookie from Traccar:", setCookie);
            // Headers object from fetch response is iterable, and NextResponse should handle it,
            // but let's be explicit if needed. The `resHeaders` copy above should suffice.
        } else {
            console.log("No Set-Cookie header received from Traccar.");
        }

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Proxy Failed" }, { status: 502 });
    }
}
