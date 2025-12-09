import { useState } from "react";
import { Vehicle } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bus, Search, ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleListProps {
    vehicles: Vehicle[];
    onSelectVehicle: (vehicle: Vehicle) => void;
    selectedVehicleId?: string;
    className?: string;
}

type FilterType = "ALL" | "LIVE" | "IDLE" | "OFFLINE" | "INACTIVE";

export default function VehicleList({ vehicles, onSelectVehicle, selectedVehicleId, className }: VehicleListProps) {
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [search, setSearch] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch = vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
            vehicle.imei.includes(search);

        if (!matchesSearch) return false;

        switch (filter) {
            case "LIVE": return vehicle.status === "moving";
            case "IDLE": return vehicle.status === "online";
            case "OFFLINE": return vehicle.status === "offline";
            case "INACTIVE": return false; // TODO: Add inactive status logic
            default: return true;
        }
    });

    const getStatusColor = (status: Vehicle["status"]) => {
        switch (status) {
            case "moving": return "text-green-600 bg-green-100";
            case "online": return "text-orange-600 bg-orange-100";
            case "offline": return "text-gray-600 bg-gray-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    return (
        <div className={cn("bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-xl transition-all duration-300", className, isCollapsed ? "h-auto" : "h-[500px]")}>
            {/* Drag Handle & Header */}
            <div className="bg-gray-50 border-b p-2 flex items-center justify-between cursor-move drag-handle">
                <div className="flex items-center gap-2 text-gray-500">
                    <GripHorizontal className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Vehicles</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Tabs */}
                    <div className="flex border-b overflow-x-auto no-scrollbar">
                        {(["ALL", "LIVE", "IDLE", "OFFLINE", "INACTIVE"] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 whitespace-nowrap transition-colors",
                                    filter === f && "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by plate number"
                                className="pl-9 bg-gray-50 border-gray-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredVehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                onClick={() => onSelectVehicle(vehicle)}
                                className={cn(
                                    "p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4",
                                    selectedVehicleId === vehicle.id && "bg-blue-50 border-l-4 border-l-blue-600"
                                )}
                            >
                                <div className={cn("p-2 rounded-full", getStatusColor(vehicle.status))}>
                                    <Bus className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900 truncate">{vehicle.imei}</h4>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white",
                                            vehicle.status === "moving" ? "bg-green-500" :
                                                vehicle.status === "online" ? "bg-orange-500" : "bg-gray-500"
                                        )}>
                                            {vehicle.status === "moving" ? "DU" : "ST"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500">{vehicle.lastUpdate}</p>
                                        <span className="font-mono font-bold text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                            {vehicle.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredVehicles.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No vehicles found
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
