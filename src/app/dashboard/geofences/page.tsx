"use client";

import { useState, useRef, useEffect } from "react";
import { Geofence } from "@/lib/data";
import { createGeofence, deleteGeofence, getGeofences } from "@/lib/api";
import GeofenceMap from "@/components/map/GeofenceMap";
import { GeofenceMapHandle } from "@/components/map/GeofenceMapComponent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List } from "lucide-react";
import Draggable from "react-draggable";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import GeofenceList from "@/components/geofences/GeofenceList";
import { useNotification } from "@/context/NotificationContext";

export default function GeofencesPage() {
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const { addNotification } = useNotification();

    const fetchGeofencesList = async () => {
        try {
            const data = await getGeofences();

            const mappedGeofences: Geofence[] = data.map((g: any) => {
                let type: "polygon" | "circle" | "polyline" = "polygon";
                let coordinates: any = [];
                let radius = 0;

                const wkt = g.area || "";

                if (wkt.startsWith("POLYGON")) {
                    type = "polygon";
                    const content = wkt.substring(wkt.indexOf("((") + 2, wkt.lastIndexOf("))"));
                    const pairs = content.split(",");
                    coordinates = pairs.map((pair: string) => {
                        const parts = pair.trim().split(" ");
                        const [p1, p2] = parts.map(parseFloat);
                        return [p1, p2]; // Lat Lng
                    });
                } else if (wkt.startsWith("CIRCLE")) {
                    type = "circle";
                    const content = wkt.substring(wkt.indexOf("(") + 1, wkt.lastIndexOf(")"));
                    const parts = content.split(",");
                    if (parts.length >= 2) {
                        const latLngParts = parts[0].trim().split(" ");
                        const radiusPart = parts[1].trim();
                        if (latLngParts.length === 2) {
                            const p1 = parseFloat(latLngParts[0]);
                            const p2 = parseFloat(latLngParts[1]);
                            coordinates = [p1, p2];
                            radius = parseFloat(radiusPart);
                        }
                    }
                } else if (wkt.startsWith("LINESTRING")) {
                    type = "polyline";
                    const content = wkt.substring(wkt.indexOf("(") + 1, wkt.lastIndexOf(")"));
                    const pairs = content.split(",");
                    coordinates = pairs.map((pair: string) => {
                        const parts = pair.trim().split(" ");
                        const [p1, p2] = parts.map(parseFloat);
                        return [p1, p2]; // Lat Lng
                    });
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
        } catch (error) {
            console.error("Failed to fetch geofences", error);
        }
    };

    useEffect(() => {
        fetchGeofencesList();
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

    const saveGeofence = async () => {
        if (!pendingGeofence) return;

        const name = newGeofenceName.trim() || "Unnamed Geofence";
        // WKT Generation
        let area = "";
        if (pendingGeofence.type === "polygon") {
            // Construct WKT: POLYGON ((lat1 lon1, lat2 lon2, ..., lat1 lon1))
            // Ensure closed loop
            const coords = pendingGeofence.coordinates as [number, number][];
            if (coords.length > 0) {
                const points = coords.map(c => `${c[0]} ${c[1]}`).join(", ");
                // Close the loop if not already
                const first = coords[0];
                const last = coords[coords.length - 1];
                const closedPoints = (first[0] === last[0] && first[1] === last[1])
                    ? points
                    : `${points}, ${first[0]} ${first[1]}`;

                area = `POLYGON ((${closedPoints}))`;
            }
        } else if (pendingGeofence.type === "circle") {
            // CIRCLE (lat lon, radius)
            const center = pendingGeofence.coordinates as [number, number];
            const radius = pendingGeofence.radius || 0;
            area = `CIRCLE (${center[0]} ${center[1]}, ${radius})`;
        } else if (pendingGeofence.type === "polyline") {
            // LINESTRING (lat1 lon1, lat2 lon2, ...)
            const coords = pendingGeofence.coordinates as [number, number][];
            if (coords.length > 0) {
                const points = coords.map(c => `${c[0]} ${c[1]}`).join(", ");
                area = `LINESTRING (${points})`;
            }
        }

        try {
            await createGeofence({
                name,
                area,
                description: ""
            });
            addNotification("success", "Geofence Created", `Geofence "${name}" has been saved.`);
            fetchGeofencesList(); // Refresh
        } catch (e) {
            console.error("Error creating geofence", e);
            addNotification("error", "Error", "Failed to save geofence.");
        }

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

    const [geofenceToDelete, setGeofenceToDelete] = useState<string | null>(null);

    const handleDeleteFromList = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setGeofenceToDelete(id);
    };

    const confirmDelete = async () => {
        if (!geofenceToDelete) return;

        try {
            await deleteGeofence(geofenceToDelete);
            addNotification("success", "Geofence Deleted", "Geofence has been removed.");
            fetchGeofencesList();
        } catch (e) {
            console.error("Delete failed", e);
            addNotification("error", "Error", "Failed to delete geofence.");
        } finally {
            setGeofenceToDelete(null);
        }
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!geofenceToDelete} onOpenChange={(open) => !open && setGeofenceToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Geofence</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this geofence? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGeofenceToDelete(null)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
