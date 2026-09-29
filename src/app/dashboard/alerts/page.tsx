"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Filter, Gauge, Info, Calendar } from "lucide-react";
import { initialVehicles, initialGeofences } from "@/lib/data";
import { generateAlerts, Alert } from "@/lib/geofenceUtils";
import { cn } from "@/lib/utils";
import { getDevices, getGeofences, getEvents, getPosition, reverseGeocode } from "@/lib/api";

function AlertPositionDetails({ positionId, isOpen }: { positionId: string, isOpen: boolean }) {
    const [position, setPosition] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);

    useEffect(() => {
        if (!isOpen || !positionId || position) return;

        const fetchPosition = async () => {
            setLoading(true);
            try {
                const data = await getPosition(positionId);
                const pos = Array.isArray(data) ? data[0] : data;
                setPosition(pos);
                // Initialize address if available
                if (pos?.address) setAddress(pos.address);
            } catch (err) {
                console.error(err);
                setError("Failed to load details");
            } finally {
                setLoading(false);
            }
        };

        fetchPosition();
    }, [isOpen, positionId, position]);

    const handleShowAddress = async () => {
        if (!position) return;
        setLoadingAddress(true);
        try {
            // User requested /api/server/geocode
            const text = await reverseGeocode(position.latitude, position.longitude);
            // Geocoding usually returns a string address? 
            // Or maybe the user meant a specific custom endpoint.
            // Let's assume text for now as it's an address.
            setAddress(text);
        } catch (e) {
            console.error(e);
            setAddress("Error fetching address");
        } finally {
            setLoadingAddress(false);
        }
    };

    if (!positionId) return null;

    return (
        <div className="mt-4 border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Position Details</h4>
            {loading ? (
                <div className="text-xs text-gray-500 animate-pulse">Loading position data...</div>
            ) : error ? (
                <div className="text-xs text-red-500">Error loading position: {error}</div>
            ) : position ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                        <span className="text-gray-500">Address:</span>
                        {address ? (
                            <span className="font-medium truncate" title={address}>{address}</span>
                        ) : (
                            <button
                                onClick={handleShowAddress}
                                disabled={loadingAddress}
                                className="text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                            >
                                {loadingAddress ? "Loading..." : "Show Address"}
                            </button>
                        )}
                    </div>
                    <div><span className="text-gray-500">Speed:</span> <span className="font-medium">{position.speed ? `${position.speed.toFixed(1)} km/h` : "0 km/h"}</span></div>
                    <div><span className="text-gray-500">Lat/Lon:</span> <span className="font-mono">{position.latitude?.toFixed(5)}, {position.longitude?.toFixed(5)}</span></div>
                    <div><span className="text-gray-500">Altitude:</span> <span className="font-medium">{position.altitude?.toFixed(0)} m</span></div>
                    <div><span className="text-gray-500">Course:</span> <span className="font-medium">{position.course?.toFixed(0)}°</span></div>
                </div>
            ) : null}
        </div>
    );
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState<"all" | "entry" | "exit" | "warning" | "speed" | "other">("all");
    const [openAlertId, setOpenAlertId] = useState<string | undefined>(undefined);

    // New Filter State
    const [timeRange, setTimeRange] = useState<"24h" | "today" | "yesterday" | "week" | "7days" | "custom">("24h");
    const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
    const [availableDevices, setAvailableDevices] = useState<any[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // 1. Fetch Dependencies (Devices, Geofences)
                const [devicesData, geofencesData] = await Promise.all([
                    getDevices(),
                    getGeofences()
                ]);

                // Assign data directly (api lib handles parsing)
                let devices: any[] = Array.isArray(devicesData) ? devicesData : [];
                let geofences: any[] = Array.isArray(geofencesData) ? geofencesData : [];

                setAvailableDevices(devices);

                // 2. Fetch Events based on Time Range
                let to = new Date();
                let from = new Date();

                switch (timeRange) {
                    case "today":
                        from.setHours(0, 0, 0, 0);
                        break;
                    case "yesterday":
                        // Rigid 00:00 to 00:00 (next day)
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        to = todayStart;

                        from = new Date(todayStart);
                        from.setDate(from.getDate() - 1);
                        break;
                    case "week": // This week (starting Monday or Sunday)
                        // Let's do simple "start of current week" or last 7 days? user asked for "day, week".
                        // interpreted as "Last 7 Days" is usually safer/easier.
                        // But let's implement strict "This Week" (from last Monday/Sunday) if desired, 
                        // or just stick to "Last 7 Days" which is often what "Week" means in filters.
                        // Let's stick to strict 7 days ago.
                        from.setDate(from.getDate() - 7);
                        break;
                    case "7days":
                        from.setDate(from.getDate() - 7);
                        break;
                    case "custom":
                        if (customDate) {
                            // customDate is YYYY-MM-DD
                            const [y, m, d] = customDate.split('-').map(Number);
                            // Create local date for start of that day
                            from = new Date(y, m - 1, d, 0, 0, 0, 0);
                            // End is start of next day
                            to = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
                        }
                        break;
                    case "24h":
                    default:
                        from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
                        break;
                }

                // ISO String format for query parameters
                const params = new URLSearchParams({
                    from: from.toISOString(),
                    to: to.toISOString()
                });

                console.log(`[DEBUG] Fetching events: Range=${timeRange} From=${from.toISOString()} To=${to.toISOString()} Devices=${devices.length}`);

                // If a specific device is selected, only send that ID.
                if (selectedDeviceId && selectedDeviceId !== "all") {
                    params.append("deviceId", selectedDeviceId);
                } else {
                    // Otherwise verify if we need to send ALL IDs. 
                    // Usually /api/reports/events returns nothing if no devices specified.
                    // devices.forEach(d => params.append("deviceId", d.id));
                    // Keep existing logic
                    devices.forEach(d => params.append("deviceId", d.id));
                }

                const events = await getEvents(params);

                // 3. Map Events to Alerts
                const mappedAlerts: Alert[] = events.map((event: any) => {
                    const device = devices.find(d => d.id === event.deviceId);
                    const geofence = event.geofenceId ? geofences.find(g => g.id === event.geofenceId) : null;

                    let type: "entry" | "exit" | "warning" | "speed" | "other" = "other";
                    let message = `Event: ${event.type}`;

                    if (event.type === "geofenceEnter") {
                        type = "entry";
                        message = `${device?.name || "Vehicle"} entered ${geofence?.name || "Geofence"}`;
                    } else if (event.type === "geofenceExit") {
                        type = "exit";
                        message = `${device?.name || "Vehicle"} exited ${geofence?.name || "Geofence"}`;
                    } else if (event.type === "deviceOverspeed" || (event.type === "alarm" && event.attributes?.alarm === "overspeed")) {
                        type = "speed";
                        message = `${device?.name || "Vehicle"} exceeded speed limit`;
                    } else if (event.type === "deviceOnline") {
                        type = "entry"; // Reusing green for online
                        message = `${device?.name || "Vehicle"} is online`;
                    } else if (event.type === "deviceOffline") {
                        type = "warning"; // Offline is a warning
                        message = `${device?.name || "Vehicle"} is offline`;
                    } else {
                        // Fallback for other types
                        type = "other";
                    }

                    // Fix: Ensure positionId is mapped. It's usually `event.positionId`.
                    const positionId = event.positionId ? event.positionId.toString() : "";

                    return {
                        id: event.id.toString(),
                        vehicleId: event.deviceId,
                        vehicleName: device?.name || "Unknown Vehicle",
                        geofenceId: event.geofenceId || "",
                        geofenceName: geofence?.name || "",
                        positionId,
                        type,
                        originalType: event.type,
                        timestamp: event.eventTime ? new Date(event.eventTime).toLocaleString() : "Unknown Time",
                        message,
                        attributes: event.attributes || {}
                    };
                });

                // Sort by new first
                setAlerts(mappedAlerts.reverse());

            } catch (error) {
                console.error("Error loading alerts:", error);
            }
        };

        fetchEvents();
    }, [timeRange, selectedDeviceId, customDate]); // Re-fetch on filter change

    // Compute Stats
    const stats = {
        total: alerts.length,
        entry: alerts.filter(a => a.type === "entry").length,
        exit: alerts.filter(a => a.type === "exit").length,
        warning: alerts.filter(a => a.type === "warning").length,
        speed: alerts.filter(a => a.type === "speed").length,
        other: alerts.filter(a => a.type === "other").length
    };

    // Filter Alerts
    const filteredAlerts = alerts.filter(alert => {
        if (filter === "all") return true;
        return alert.type === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
                        <p className="text-muted-foreground">Monitor vehicle alert events</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="custom">Custom Date</SelectItem>
                            </SelectContent>
                        </Select>

                        {timeRange === "custom" && (
                            <Input
                                type="date"
                                className="w-[150px] bg-white"
                                value={customDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDate(e.target.value)}
                            />
                        )}

                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                            <SelectTrigger className="w-[200px] bg-white">
                                <SelectValue placeholder="Select Device" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Devices</SelectItem>
                                {availableDevices.map(d => (
                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card
                        className={cn("bg-white border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md", filter === "all" && "ring-2 ring-blue-500 ring-offset-2")}
                        onClick={() => setFilter("all")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total</p>
                                <h3 className="text-2xl font-bold">{stats.total}</h3>
                            </div>
                            <Clock className="w-6 h-6 text-blue-100 text-blue-500/20" />
                        </CardContent>
                    </Card>
                    <Card
                        className={cn("bg-white border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-md", filter === "entry" && "ring-2 ring-green-500 ring-offset-2")}
                        onClick={() => setFilter("entry")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Entry</p>
                                <h3 className="text-2xl font-bold text-green-600">{stats.entry}</h3>
                            </div>
                            <MapPin className="w-6 h-6 text-green-500/20" />
                        </CardContent>
                    </Card>
                    <Card
                        className={cn("bg-white border-l-4 border-l-orange-500 cursor-pointer transition-all hover:shadow-md", filter === "exit" && "ring-2 ring-orange-500 ring-offset-2")}
                        onClick={() => setFilter("exit")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Exit</p>
                                <h3 className="text-2xl font-bold text-orange-600">{stats.exit}</h3>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-orange-500/20" />
                        </CardContent>
                    </Card>
                    <Card
                        className={cn("bg-white border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md", filter === "speed" && "ring-2 ring-red-500 ring-offset-2")}
                        onClick={() => setFilter("speed")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Speed</p>
                                <h3 className="text-2xl font-bold text-red-600">{stats.speed}</h3>
                            </div>
                            <Gauge className="w-6 h-6 text-red-500/20" />
                        </CardContent>
                    </Card>
                    <Card
                        className={cn("bg-white border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:shadow-md", filter === "warning" && "ring-2 ring-yellow-500 ring-offset-2")}
                        onClick={() => setFilter("warning")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Warning</p>
                                <h3 className="text-2xl font-bold text-yellow-600">{stats.warning}</h3>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-yellow-500/20" />
                        </CardContent>
                    </Card>
                    <Card
                        className={cn("bg-white border-l-4 border-l-gray-500 cursor-pointer transition-all hover:shadow-md", filter === "other" && "ring-2 ring-gray-500 ring-offset-2")}
                        onClick={() => setFilter("other")}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Other</p>
                                <h3 className="text-2xl font-bold text-gray-600">{stats.other}</h3>
                            </div>
                            <Info className="w-6 h-6 text-gray-500/20" />
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 pb-2 overflow-x-auto">
                    <Button
                        variant={filter === "all" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="gap-2 shrink-0"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "entry" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("entry")}
                        className={cn("gap-2 shrink-0", filter === "entry" && "bg-green-600 hover:bg-green-700")}
                    >
                        Entry
                    </Button>
                    <Button
                        variant={filter === "exit" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("exit")}
                        className={cn("gap-2 shrink-0", filter === "exit" && "bg-orange-500 hover:bg-orange-600")}
                    >
                        Exit
                    </Button>
                    <Button
                        variant={filter === "speed" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("speed")}
                        className={cn("gap-2 shrink-0", filter === "speed" && "bg-red-600 hover:bg-red-700")}
                    >
                        Speed
                    </Button>
                    <Button
                        variant={filter === "warning" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("warning")}
                        className={cn("gap-2 shrink-0", filter === "warning" && "bg-yellow-500 hover:bg-yellow-600")}
                    >
                        Warning
                    </Button>
                    <Button
                        variant={filter === "other" ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setFilter("other")}
                        className={cn("gap-2 shrink-0", filter === "other" && "bg-gray-600 hover:bg-gray-700")}
                    >
                        Other
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredAlerts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                            <p>No active alerts. All vehicles are within expected zones.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-2"
                        value={openAlertId}
                        onValueChange={setOpenAlertId}
                    >
                        {filteredAlerts.map((alert) => (
                            <AccordionItem key={alert.id} value={alert.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                <div className={cn(
                                    "border-l-4",
                                    alert.type === "entry" ? "border-l-green-500" :
                                        alert.type === "exit" ? "border-l-orange-500" :
                                            alert.type === "speed" ? "border-l-red-600" :
                                                alert.type === "warning" ? "border-l-yellow-500" :
                                                    "border-l-gray-500"
                                )}>
                                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                                        <div className="flex items-center gap-4 w-full text-left">
                                            <div className={cn(
                                                "p-2 rounded-full shrink-0",
                                                alert.type === "entry" ? "bg-green-100 text-green-600" :
                                                    alert.type === "exit" ? "bg-orange-100 text-orange-600" :
                                                        alert.type === "speed" ? "bg-red-100 text-red-600" :
                                                            alert.type === "warning" ? "bg-yellow-100 text-yellow-600" :
                                                                "bg-gray-100 text-gray-600"
                                            )}>
                                                {alert.type === "entry" ? <MapPin className="w-5 h-5" /> :
                                                    alert.type === "speed" ? <Gauge className="w-5 h-5" /> :
                                                        alert.type === "other" ? <Info className="w-5 h-5" /> :
                                                            <AlertTriangle className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-lg">{alert.vehicleName}</h3>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {alert.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {alert.message}
                                                </p>

                                                {/* Attributes displayed vertically/grid in the trigger */}
                                                {alert.attributes && Object.keys(alert.attributes).length > 0 && (
                                                    <div className="mt-2 text-sm grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                                        {Object.entries(alert.attributes).map(([key, value]) => (
                                                            <div key={key} className="flex flex-row items-center gap-1">
                                                                <span className="text-gray-500 text-xs capitalize whitespace-nowrap">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                <span className="font-medium truncate text-xs">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-0">
                                        <div className="bg-gray-50 p-3 rounded-md mt-2 border-t pt-2">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Event Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div><span className="text-gray-500">Event ID:</span> <span className="font-mono">{alert.id}</span></div>
                                                <div><span className="text-gray-500">Type:</span> <span>{alert.type}</span></div>
                                                <div><span className="text-gray-500">Original Type:</span> <span className="font-mono">{alert.originalType}</span></div>
                                                <div><span className="text-gray-500">Vehicle ID:</span> <span>{alert.vehicleId}</span></div>
                                                <div><span className="text-gray-500">Geofence ID:</span> <span>{alert.geofenceId || "N/A"}</span></div>
                                                <div><span className="text-gray-500">Geofence Name:</span> <span>{alert.geofenceName || "N/A"}</span></div>
                                            </div>

                                            {/* Position Details Fetched on Demand */}
                                            <AlertPositionDetails positionId={alert.positionId} isOpen={openAlertId === alert.id} />
                                        </div>
                                    </AccordionContent>
                                </div>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </div>
    );
}
