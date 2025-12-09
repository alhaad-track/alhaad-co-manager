import { Trip } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Calendar, Navigation } from "lucide-react";

interface TripHistoryProps {
    trips: Trip[];
}

export default function TripHistory({ trips }: TripHistoryProps) {
    if (!trips || trips.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-gray-50/50">
                <p>No trip history available for this vehicle.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {trips.map((trip) => (
                <Card key={trip.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                            {/* Route Info */}
                            <div className="md:col-span-2 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100" />
                                        <div className="w-0.5 h-8 bg-gray-200 my-1" />
                                        <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-100" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Start Location</p>
                                            <p className="font-medium text-sm">{trip.startLocation}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {trip.startTime}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">End Location</p>
                                            <p className="font-medium text-sm">{trip.endLocation}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {trip.endTime}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-gray-50/50 rounded-lg p-3 items-center">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                        <Navigation className="w-4 h-4" />
                                        <span className="text-xs font-medium">Distance</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{trip.distance}</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-medium">Duration</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{trip.duration}</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                        <span className="text-xs font-medium">Avg Speed</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{trip.averageSpeed}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
