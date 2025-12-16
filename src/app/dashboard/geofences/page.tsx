"use client";

import { useState, useRef } from "react";
import { initialGeofences, Geofence } from "@/lib/data";
import GeofenceMap from "@/components/map/GeofenceMap";
import { GeofenceMapHandle } from "@/components/map/GeofenceMapComponent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List } from "lucide-react";
import Draggable from "react-draggable";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import GeofenceList from "@/components/geofences/GeofenceList";

export default function GeofencesPage() {
    const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences);
    const [newGeofenceName, setNewGeofenceName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedGeofenceIds, setSelectedGeofenceIds] = useState<string[]>([]);
    const mapRef = useRef<GeofenceMapHandle>(null);

    const filteredGeofences = geofences.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [pendingGeofence, setPendingGeofence] = useState<Omit<Geofence, "id"> | null>(null);

    const handleGeofenceCreated = (newGeofence: Omit<Geofence, "id">) => {
        setPendingGeofence(newGeofence);
        setNewGeofenceName("");
        setIsNameDialogOpen(true);
    };

    const saveGeofence = () => {
        if (!pendingGeofence) return;

        const id = Math.random().toString(36).substr(2, 9);
        const name = newGeofenceName.trim() || "Unnamed Geofence";

        setGeofences([...geofences, { ...pendingGeofence, id, name }]);
        setSelectedGeofenceIds(prev => [...prev, id]);

        setIsNameDialogOpen(false);
        setPendingGeofence(null);
        setNewGeofenceName("");
    };

    const handleAddZoneClick = () => {
        if (mapRef.current) {
            mapRef.current.startDrawing();
        }
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

    const nodeRef = useRef(null);
    const [isMobileListOpen, setIsMobileListOpen] = useState(false);

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col relative">
            {/* Removed floating input */}

            <div className="flex-1 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                {/* Map */}
                <div className="absolute inset-0 z-0">
                    <GeofenceMap
                        ref={mapRef}
                        geofences={geofences}
                        onGeofenceCreated={handleGeofenceCreated}
                        onGeofenceEdited={handleGeofenceEdited}
                        onGeofenceDeleted={handleGeofenceDeleted}
                        selectedGeofenceIds={selectedGeofenceIds}
                    />
                </div>

                {/* Mobile List Trigger */}
                <div className="absolute top-4 left-4 z-[400] md:hidden">
                    <Sheet open={isMobileListOpen} onOpenChange={setIsMobileListOpen}>
                        <SheetTrigger asChild>
                            <Button variant="secondary" className="shadow-lg bg-white/90 backdrop-blur-sm">
                                <List className="w-4 h-4 mr-2" />
                                Geofences
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] sm:w-[380px] p-0">
                            <SheetTitle className="sr-only">Geofences List</SheetTitle>
                            <GeofenceList
                                geofences={geofences}
                                selectedGeofenceIds={selectedGeofenceIds}
                                onToggleSelection={toggleSelection}
                                onDeleteGeofence={handleDeleteFromList}
                                onClearSelection={() => setSelectedGeofenceIds([])}
                                search={search}
                                onSearchChange={setSearch}
                                onAddZone={handleAddZoneClick}
                            />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Floating Sidebar */}
                <div className="hidden md:block">
                    <Draggable handle=".drag-handle" bounds="parent" nodeRef={nodeRef}>
                        <div ref={nodeRef} className="absolute top-4 left-4 z-[400] w-80 h-[calc(100%-2rem)] max-h-[600px] shadow-xl rounded-lg overflow-hidden bg-white">
                            <GeofenceList
                                geofences={geofences}
                                selectedGeofenceIds={selectedGeofenceIds}
                                onToggleSelection={toggleSelection}
                                onDeleteGeofence={handleDeleteFromList}
                                onClearSelection={() => setSelectedGeofenceIds([])}
                                search={search}
                                onSearchChange={setSearch}
                                onAddZone={handleAddZoneClick}
                            />
                        </div>
                    </Draggable>
                </div>
            </div>

            <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Name Geofence</DialogTitle>
                        <DialogDescription>
                            Enter a name for the new geofence zone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Geofence Name"
                            value={newGeofenceName}
                            onChange={(e) => setNewGeofenceName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveGeofence()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveGeofence}>Save Geofence</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
