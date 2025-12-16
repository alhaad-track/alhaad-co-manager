import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Circle, Hexagon, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Geofence } from "@/lib/data";

interface GeofenceListProps {
    geofences: Geofence[];
    selectedGeofenceIds: string[];
    onToggleSelection: (id: string) => void;
    onDeleteGeofence: (e: React.MouseEvent, id: string) => void;
    onClearSelection: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    onAddZone: () => void;
}

export default function GeofenceList({
    geofences,
    selectedGeofenceIds,
    onToggleSelection,
    onDeleteGeofence,
    onClearSelection,
    search,
    onSearchChange,
    onAddZone
}: GeofenceListProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const filteredGeofences = geofences.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card className={`flex flex-col overflow-hidden border-0 shadow-none bg-transparent transition-all duration-300 ${isCollapsed ? 'h-auto' : 'h-full'}`}>
            <CardHeader className="pb-3 px-4 pt-4 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 drag-handle cursor-move">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <CardTitle className="text-lg">Geofences</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedGeofenceIds.length > 0 && !isCollapsed && (
                            <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-xs text-blue-600 hover:text-blue-800 h-6 px-2">
                                Clear ({selectedGeofenceIds.length})
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCollapsed(!isCollapsed)}>
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                {!isCollapsed && (
                    <div className="space-y-2">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onAddZone}>
                            Add Zone
                        </Button>
                        <Input
                            placeholder="Search geofences..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                )}
            </CardHeader>
            {!isCollapsed && (
                <CardContent className="flex-1 overflow-y-auto p-0 bg-white">
                    {filteredGeofences.map((geofence) => {
                        const isSelected = selectedGeofenceIds.includes(geofence.id);
                        return (
                            <div
                                key={geofence.id}
                                className={`p-4 border-b hover:bg-gray-50 flex items-center justify-between group cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                onClick={() => onToggleSelection(geofence.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSelection(geofence.id)}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <div className={`p-2 rounded-full text-gray-600 ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100'}`}>
                                        {geofence.type === 'circle' ? <Circle className="w-4 h-4" /> : <Hexagon className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-medium">{geofence.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{geofence.type}</div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => onDeleteGeofence(e, geofence.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })}
                    {filteredGeofences.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            {search ? "No geofences match your search." : "No geofences created yet."}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
