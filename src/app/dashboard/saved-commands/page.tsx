"use client";

import SavedCommandsTable from "@/components/dashboard/SavedCommandsTable";

export default function SavedCommandsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Saved Commands</h1>
                <p className="text-muted-foreground">
                    Manage your saved commands presets.
                </p>
            </div>
            <SavedCommandsTable />
        </div>
    );
}
