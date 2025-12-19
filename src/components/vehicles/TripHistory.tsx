import { useState } from "react";
import { Trip } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reverseGeocode } from "@/lib/api";

interface TripHistoryProps {
    trips: Trip[];
    onViewTrip?: (trip: Trip) => void;
    selectedTripId?: string;
}

export default function TripHistory({ trips, onViewTrip, selectedTripId }: TripHistoryProps) {
    const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});
    const [loadingAddresses, setLoadingAddresses] = useState<Record<string, boolean>>({});

    const handleShowAddress = async (tripId: string, type: 'start' | 'end', lat?: number, lng?: number) => {
        if (!lat || !lng) return;

        const key = `${tripId}-${type}`;
        setLoadingAddresses(prev => ({ ...prev, [key]: true }));

        try {
            const address = await reverseGeocode(lat, lng);
            setResolvedAddresses(prev => ({ ...prev, [key]: address }));
        } catch (error) {
            console.error("Failed to geocode", error);
        } finally {
            setLoadingAddresses(prev => ({ ...prev, [key]: false }));
        }
    };

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
                                            <div className="font-medium text-sm">
                                                {resolvedAddresses[`${trip.id}-start`] || trip.startLocation || (
                                                    (trip.startLat && trip.startLon) ? (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-orange-600 font-normal hover:bg-transparent hover:underline"
                                                            onClick={() => handleShowAddress(trip.id, 'start', trip.startLat, trip.startLon)}
                                                            disabled={loadingAddresses[`${trip.id}-start`]}
                                                        >
                                                            {loadingAddresses[`${trip.id}-start`] ? (
                                                                <>
                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                                                                    Loading address...
                                                                </>
                                                            ) : "Show Address"}
                                                        </Button>
                                                    ) : "Unknown Location"
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {trip.startTime}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">End Location</p>
                                            <div className="font-medium text-sm">
                                                {resolvedAddresses[`${trip.id}-end`] || trip.endLocation || (
                                                    (trip.endLat && trip.endLon) ? (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-orange-600 font-normal hover:bg-transparent hover:underline"
                                                            onClick={() => handleShowAddress(trip.id, 'end', trip.endLat, trip.endLon)}
                                                            disabled={loadingAddresses[`${trip.id}-end`]}
                                                        >
                                                            {loadingAddresses[`${trip.id}-end`] ? (
                                                                <>
                                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                                                                    Loading address...
                                                                </>
                                                            ) : "Show Address"}
                                                        </Button>
                                                    ) : "Unknown Location"
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {trip.endTime}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="md:col-span-2 flex flex-col gap-3">
                                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 rounded-lg p-3 items-center">
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
                                {onViewTrip && (
                                    <Button
                                        size="sm"
                                        className={`w-full transition-colors ${trip.id === selectedTripId
                                            ? "bg-orange-500 text-white hover:bg-orange-600 border-transparent shadow-sm"
                                            : "hover:bg-orange-500 hover:text-white border-gray-200 hover:border-orange-500 text-orange-600"
                                            }`}
                                        variant="outline"
                                        onClick={() => onViewTrip(trip)}
                                    >
                                        {trip.id === selectedTripId ? "Currently Viewing" : "View Trip Route"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
