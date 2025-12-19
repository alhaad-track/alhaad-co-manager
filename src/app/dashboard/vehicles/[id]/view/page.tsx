"use client";

import { use, useState, useEffect } from "react";
import { initialVehicles } from "@/lib/data";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { notFound } from "next/navigation";
import { getDevices, getPosition, getTrips } from "@/lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Removed unused date-fns import

function VehicleTripHistory({ deviceId }: { deviceId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetched, setFetched] = useState(false);

    const handleOpenChange = (value: string) => {
        const open = value === "trips";
        setIsOpen(open);
        if (open && !fetched && !loading) {
            fetchTrips();
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        try {
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - 7);

            const tripParams = new URLSearchParams({
                deviceId: deviceId,
                from: from.toISOString(),
                to: to.toISOString()
            });

            console.log("Fetching trips with params:", tripParams.toString());
            const tripsData = await getTrips(tripParams);
            console.log("Trips data received:", tripsData);

            if (Array.isArray(tripsData)) {
                setTrips(tripsData);
            } else {
                // Handle case where API might return error object or null
                setTrips([]);
                console.warn("Unexpected trips data format:", tripsData);
            }
            setFetched(true);
        } catch (e) {
            console.error("Failed to load trips", e);
            setError("Failed to load trip history.");
            // We do NOT set fetched to true on error, so opening again might retry? 
            // Or we allow retry via button.
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion type="single" collapsible onValueChange={handleOpenChange}>
            <AccordionItem value="trips" className="bg-white border rounded-lg shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Trip History (Last 7 Days)</span>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                    <div className="pt-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Loading trips...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-md bg-red-50 p-4 mb-4">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        ) : !fetched ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Click to load trip history
                            </div>
                        ) : trips.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-8">No trips recorded in the last 7 days.</p>
                        ) : (
                            <div className="relative overflow-x-auto rounded-md border max-h-[400px]">
                                <table className="w-full text-sm text-left relative">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3">Start Time</th>
                                            <th className="px-4 py-3">End Time</th>
                                            <th className="px-4 py-3">Distance</th>
                                            <th className="px-4 py-3">Duration</th>
                                            <th className="px-4 py-3">Start Address</th>
                                            <th className="px-4 py-3">End Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {trips.map((trip: any) => (
                                            <tr key={trip.id || Math.random()} className="bg-white hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {trip.startTime ? new Date(trip.startTime).toLocaleString() : "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {trip.endTime ? new Date(trip.endTime).toLocaleString() : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {trip.distance ? `${(trip.distance / 1000).toFixed(2)} km` : "0 km"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {trip.duration ? `${(trip.duration / 60000).toFixed(0)} min` : "-"}
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate" title={trip.startAddress}>
                                                    {trip.startAddress || "-"}
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate" title={trip.endAddress}>
                                                    {trip.endAddress || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end border-t pt-4">
                            <Button variant="outline" size="sm" onClick={fetchTrips} disabled={loading}>
                                <Loader2 className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh Report
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export default function ViewVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [vehicle, setVehicle] = useState<any>(null); // Use any or Vehicle type
    const [position, setPosition] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Vehicle Details to get positionId
                // We could fetch list and find, or assume we have an endpoint for single vehicle
                // Traccar API: /api/devices?id=X (returns array) or just filtered list
                // For simplicity, let's just fetch all and find (or optimize later if needed)
                // Actually Traccar allows /api/devices?id=X

                const devicesData = await getDevices();
                const devices = Array.isArray(devicesData) ? devicesData : [];
                // The API /api/devices returns all devices if no ID, but our getDevices doesn't take params yet?
                // Wait, getDevices() fetches ALL. We should filter or update getDevices to take ID.
                // But for now, let's just find from the list as the previous code did (effectively).
                // Actually previous code did `traccarApi("/api/devices?id=...")`.
                // Our getDevices() in lib currently fetches ALL: `return fetchJson<any[]>("/api/devices");`
                // Let's just find it in the list for now to avoid breaking lib change or just use the ID if we add param support.
                // Ideally we update getDevices to accept params, but let's stick to client filtering for safety/speed unless list is huge.
                // Or better, let's just manually fetch for this specific one using the general getDevices if it accepted params.
                // Since getDevices has no params, we filter on client.

                const device = devices.find((d: any) => d.id.toString() === resolvedParams.id);

                if (!device) throw new Error("Vehicle not found");
                setVehicle(device);

                // 2. Fetch Position if positionId exists
                if (device.positionId) {
                    try {
                        const positionData = await getPosition(device.positionId.toString());
                        const positions = Array.isArray(positionData) ? positionData : [positionData];
                        if (positions && positions.length > 0) {
                            setPosition(positions[0]);
                        }
                    } catch (e) {
                        console.error("Failed to load position", e);
                    }
                }



            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load vehicle data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resolvedParams.id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!vehicle) return <div className="p-8">Vehicle not found</div>;

    return (
        <div className="space-y-6">
            <VehicleForm
                initialData={{
                    id: vehicle.id.toString(),
                    name: vehicle.name,
                    model: vehicle.model || "Unknown",
                    imei: vehicle.uniqueId,
                    status: vehicle.status,
                    lastUpdate: vehicle.lastUpdate,
                    lat: position?.latitude || 0,
                    lng: position?.longitude || 0,
                    icon: "truck"
                }}
                readOnly={true}
                positionData={position}
            />

            <VehicleTripHistory deviceId={vehicle.id.toString()} />
        </div>
    );
}
