"use client";

import { useState } from "react";
import { initialGeofences, Geofence } from "@/lib/data";
import GeofenceMap from "@/components/map/GeofenceMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Map as MapIcon, Circle, Hexagon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

export default function GeofencesPage() {
    const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences);
    const [newGeofenceName, setNewGeofenceName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedGeofenceIds, setSelectedGeofenceIds] = useState<string[]>([]);

    const filteredGeofences = geofences.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleGeofenceCreated = (newGeofence: Omit<Geofence, "id">) => {
        const id = Math.random().toString(36).substr(2, 9);
        setGeofences([...geofences, { ...newGeofence, id, name: newGeofenceName || newGeofence.name }]);
        setNewGeofenceName("");
        // Auto-select the new geofence
        setSelectedGeofenceIds(prev => [...prev, id]);
    };

    const handleGeofenceEdited = (id: string, newShape: any) => {
        // In a real app, update the geofence coordinates
        console.log("Geofence edited:", id, newShape);
    };

    const handleGeofenceDeleted = (id: string) => {
        // In a real app, delete from backend
        // For now, we rely on the map's internal state or would need to sync back
        console.log("Geofence deleted:", id);
    };

    const handleDeleteFromList = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setGeofences(geofences.filter(g => g.id !== id));
        setSelectedGeofenceIds(prev => prev.filter(selectedId => selectedId !== id));
    };

    const toggleSelection = (id: string) => {
        setSelectedGeofenceIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Geofences</h2>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Name for next geofence..."
                        value={newGeofenceName}
                        onChange={(e) => setNewGeofenceName(e.target.value)}
                        className="w-64"
                    />
                    <div className="text-sm text-gray-500">
                        Use the map tools to draw
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* List Sidebar */}
                <Card className="w-80 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Your Geofences
                            {selectedGeofenceIds.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedGeofenceIds([])} className="text-xs text-blue-600 hover:text-blue-800">
                                    Clear ({selectedGeofenceIds.length})
                                </Button>
                            )}
                        </CardTitle>
                        <Input
                            placeholder="Search geofences..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="mt-2"
                        />
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {filteredGeofences.map((geofence) => {
                            const isSelected = selectedGeofenceIds.includes(geofence.id);
                            return (
                                <div
                                    key={geofence.id}
                                    className={`p-4 border-b hover:bg-gray-50 flex items-center justify-between group cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                    onClick={() => toggleSelection(geofence.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelection(geofence.id)}
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
                                        onClick={(e) => handleDeleteFromList(e, geofence.id)}
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
                </Card>

                {/* Map */}
                <Card className="flex-1 overflow-hidden border-0 shadow-md">
                    <GeofenceMap
                        geofences={geofences}
                        onGeofenceCreated={handleGeofenceCreated}
                        onGeofenceEdited={handleGeofenceEdited}
                        onGeofenceDeleted={handleGeofenceDeleted}
                        selectedGeofenceIds={selectedGeofenceIds}
                    />
                </Card>
            </div>
        </div>
    );
}
