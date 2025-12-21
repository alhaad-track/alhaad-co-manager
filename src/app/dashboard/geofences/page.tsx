"use client";

import { useState, useRef, useEffect } from "react";
import { initialGeofences, Geofence } from "@/lib/data";
import { traccarApi } from "@/lib/api";
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
    const [geofences, setGeofences] = useState<Geofence[]>([]);

    useEffect(() => {
        const fetchGeofences = async () => {
            try {
                const response = await traccarApi("/api/geofences");
                if (response.ok) {
                    const data = await response.json();

                    const mappedGeofences: Geofence[] = data.map((g: any) => {
                        let type: "polygon" | "circle" = "polygon";
                        let coordinates: any = [];
                        let radius = 0;

                        // Basic WKT Parser
                        // Example: POLYGON ((33.6 73.1, 33.6 73.2, ...)) or CIRCLE (33.6 73.1, 500)
                        const wkt = g.area || "";

                        if (wkt.startsWith("POLYGON")) {
                            type = "polygon";
                            const content = wkt.substring(wkt.indexOf("((") + 2, wkt.lastIndexOf("))"));
                            const pairs = content.split(",");
                            coordinates = pairs.map((pair: string) => {
                                const [lat, lng] = pair.trim().split(" ").map(parseFloat);
                                return [lat, lng]; // Leaflet uses [lat, lng]
                            });
                        } else if (wkt.startsWith("CIRCLE")) {
                            type = "circle";
                            // Basic Circle parsing - Traccar syntax might vary slightly
                            // Assuming CIRCLE (lat lng, radius) or similar
                            // Actually Traccar usually sends `area` as proper WKT. Standard WKT doesn't have CIRCLE but Traccar extends it.
                            // Traccar stores key params in attributes or encoded area.
                            // Let's look for standard patterns: "CIRCLE (33.633 72.918, 150)"
                            const content = wkt.substring(wkt.indexOf("(") + 1, wkt.lastIndexOf(")"));
                            const parts = content.split(",");
                            if (parts.length >= 2) {
                                const latLngParts = parts[0].trim().split(" ");
                                const radiusPart = parts[1].trim();
                                if (latLngParts.length === 2) {
                                    const lat = parseFloat(latLngParts[0]); // Traccar often does LAT then LNG for circle center in common descriptions, or LNG LAT.
                                    // Usually WKT is LON LAT. Let's assume LON LAT order for standard WKT consistency unless proven otherwise.
                                    // Wait, for standard WKT POLYGON it is LON LAT.
                                    // Let's assume parsed coords: [lat, lng] from [p1, p2].

                                    // RE-CHECK: Typically WKT is LON LAT.
                                    // So [p1(lon), p2(lat)] -> return [p2, p1] for Leaflet.

                                    const p1 = parseFloat(latLngParts[0]);
                                    const p2 = parseFloat(latLngParts[1]);

                                    // Assuming LAT LON
                                    coordinates = [p1, p2];
                                    radius = parseFloat(radiusPart);
                                }
                            }
                        }

                        return {
                            id: g.id.toString(),
                            name: g.name,
                            description: g.description,
                            type,
                            coordinates,
                            radius: type === "circle" ? radius : undefined
                        };
                    });

                    setGeofences(mappedGeofences);
                }
            } catch (error) {
                console.error("Failed to fetch geofences", error);
            }
        };

        fetchGeofences();
    }, []);
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
                        <Button onClick={saveGeofence} className="bg-orange-600 hover:bg-orange-700 text-white">Save Geofence</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
