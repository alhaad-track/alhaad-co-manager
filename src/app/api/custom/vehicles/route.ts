import { NextRequest, NextResponse } from "next/server";

const TRACCAR_URL = "http://144.21.50.12";

async function fetchTraccar(path: string, headers: HeadersInit) {
    const res = await fetch(`${TRACCAR_URL}${path}`, {
        headers,
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
}

export async function GET(request: NextRequest) {
    try {
        // Forward Authentication Headers
        const headers = new Headers();
        if (request.headers.get("cookie")) headers.set("cookie", request.headers.get("cookie")!);
        if (request.headers.get("authorization")) headers.set("authorization", request.headers.get("authorization")!);
        headers.set("Accept", "application/json");

        // 1. Fetch Core Data (Devices, Users, Drivers)
        const [devices, users, drivers] = await Promise.all([
            fetchTraccar("/api/devices", headers).catch(e => { console.error(e); return []; }),
            fetchTraccar("/api/users", headers).catch(e => { console.error(e); return []; }),
            fetchTraccar("/api/drivers", headers).catch(e => { console.error(e); return []; }),
        ]);

        // 2. Fetch Devices per User to build ownership map
        // We do this server-side so it's much faster than browser doing it
        const deviceUserMap = new Map<number, number>();
        const userDevicePromises = users.map((user: any) =>
            fetchTraccar(`/api/devices?userId=${user.id}`, headers)
                .then((userDevices: any[]) => ({ userId: user.id, devices: userDevices }))
                .catch(() => ({ userId: user.id, devices: [] }))
        );

        const allUserDevices = await Promise.all(userDevicePromises);

        allUserDevices.forEach(({ userId, devices }) => {
            devices.forEach((d: any) => {
                deviceUserMap.set(d.id, userId);
            });
        });

        // 3. Merge Data
        const enrichedVehicles = devices.map((device: any) => {
            const userId = deviceUserMap.get(device.id) || device.attributes?.userId || device.userId;
            const driverId = device.attributes?.driverId || device.driverId;

            // Resolve Names
            const user = users.find((u: any) => u.id === userId);
            const driver = drivers.find((d: any) => d.id === driverId);

            return {
                id: device.id.toString(),
                name: device.name,
                model: device.model || "Unknown Model",
                imei: device.uniqueId,
                userId: userId?.toString(),
                userName: user ? user.name : "Unassigned", // Resolved server-side
                driverId: driverId?.toString(),
                driverName: driver ? (driver.name || `${driver.firstName} ${driver.lastName}`) : "Unassigned", // Resolved server-side
                status: device.status,
                lastUpdate: device.lastUpdate, // Keep raw date string, format on client
                category: device.category,
                positionId: device.positionId?.toString(),
                attributes: device.attributes
            };
        });

        return NextResponse.json(enrichedVehicles);

    } catch (error: any) {
        console.error("Aggregation Error:", error);
        return NextResponse.json({ error: "Failed to fetch vehicle data" }, { status: 500 });
    }
}
