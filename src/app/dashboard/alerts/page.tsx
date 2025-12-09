"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react";
import { initialVehicles, initialGeofences } from "@/lib/data";
import { generateAlerts, Alert } from "@/lib/geofenceUtils";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        // Generate alerts based on current mock data state
        const currentAlerts = generateAlerts(initialVehicles, initialGeofences);
        setAlerts(currentAlerts);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Geofence Alerts</h2>
                    <p className="text-muted-foreground">Monitor vehicle entry and exit events</p>
                </div>
            </div>

            <div className="grid gap-4">
                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                            <p>No active alerts. All vehicles are within expected zones.</p>
                        </CardContent>
                    </Card>
                ) : (
                    alerts.map((alert) => (
                        <Card key={alert.id} className={cn(
                            "border-l-4 transition-all hover:shadow-md",
                            alert.type === "entry" ? "border-l-green-500" : "border-l-orange-500"
                        )}>
                            <CardContent className="flex items-center p-4 gap-4">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    alert.type === "entry" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                                )}>
                                    {alert.type === "entry" ? <MapPin className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-lg">{alert.vehicleName}</h3>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {alert.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {alert.message}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
