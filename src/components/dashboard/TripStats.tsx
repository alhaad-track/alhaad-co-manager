import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialTrips, initialVehicles } from "@/lib/data";
import { Activity, MapPin, Truck, Clock } from "lucide-react";

export default function TripStats() {
    // Calculate Stats
    const totalTrips = initialTrips.length;

    const totalDistance = initialTrips.reduce((acc, trip) => {
        const distance = parseFloat(trip.distance.replace(/[^0-9.]/g, ''));
        return acc + (isNaN(distance) ? 0 : distance);
    }, 0);

    const activeVehicles = initialVehicles.filter(v => v.status !== 'offline').length;
    const totalVehicles = initialVehicles.length;

    // Calculate total duration roughly (assuming format "Xh Ym" or "Xm")
    const totalDurationMinutes = initialTrips.reduce((acc, trip) => {
        let minutes = 0;
        const parts = trip.duration.split(' ');
        parts.forEach(part => {
            if (part.includes('h')) minutes += parseInt(part) * 60;
            if (part.includes('m')) minutes += parseInt(part);
        });
        return acc + minutes;
    }, 0);

    const hours = Math.floor(totalDurationMinutes / 60);
    const minutes = totalDurationMinutes % 60;
    const totalDurationString = `${hours}h ${minutes}m`;

    const stats = [
        {
            title: "Total Trips",
            value: totalTrips,
            icon: MapPin,
            description: "Completed trips",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Total Distance",
            value: `${totalDistance.toLocaleString()} km`,
            icon: Activity,
            description: "Distance covered",
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            title: "Active Vehicles",
            value: `${activeVehicles} / ${totalVehicles}`,
            icon: Truck,
            description: "Vehicles currently active",
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "Total Duration",
            value: totalDurationString,
            icon: Clock,
            description: "Time on road",
            color: "text-purple-600",
            bg: "bg-purple-100"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stat.bg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
