import { Card } from "@/components/ui/card";
import { Vehicle } from "@/lib/data";
import { Bus, Car, Truck, AlertCircle } from "lucide-react";

interface TrackingStatsProps {
    vehicles: Vehicle[];
}

export default function TrackingStats({ vehicles }: TrackingStatsProps) {
    const stats = {
        live: vehicles.filter(v => v.status === "moving").length,
        idle: vehicles.filter(v => v.status === "online").length,
        offline: vehicles.filter(v => v.status === "offline").length,
        inactive: 0, // Assuming inactive is another status we might add later
        noData: 0
    };

    return (
        <div className="grid grid-cols-5 gap-4 mb-4">
            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <Bus className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{stats.live}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Live</div>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-orange-500">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                    <Bus className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{stats.idle}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Idle</div>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-gray-500">
                <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                    <Bus className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{stats.offline}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Offline</div>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-yellow-500">
                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                    <Bus className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{stats.inactive}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Inactive</div>
                </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <Bus className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{stats.noData}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">No-Data</div>
                </div>
            </Card>
        </div>
    );
}
