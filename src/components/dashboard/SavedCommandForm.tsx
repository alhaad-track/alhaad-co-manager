import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCommand, updateCommand } from "@/lib/api";

interface SavedCommandFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentCommand?: any;
    onSuccess: () => void;
}

const COMMAND_TYPES = [
    { value: "custom", label: "Custom" },
    { value: "engineStop", label: "Engine Stop" },
    { value: "engineResume", label: "Engine Resume" },
    { value: "alarmArm", label: "Arm Alarm" },
    { value: "alarmDisarm", label: "Disarm Alarm" },
    { value: "requestPhoto", label: "Request Photo" },
    { value: "rebootDevice", label: "Reboot Device" },
    { value: "positionSingle", label: "Single Position" },
    { value: "positionPeriodic", label: "Periodic Position" },
];

export default function SavedCommandForm({ open, onOpenChange, currentCommand, onSuccess }: SavedCommandFormProps) {
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [type, setType] = useState("custom");
    const [attributes, setAttributes] = useState("{}");
    const [error, setError] = useState("");

    useEffect(() => {
        if (currentCommand) {
            setDescription(currentCommand.description || "");
            setType(currentCommand.type || "custom");
            setAttributes(JSON.stringify(currentCommand.attributes || {}, null, 2));
        } else {
            setDescription("");
            setType("custom");
            setAttributes("{}");
        }
        setError("");
    }, [currentCommand, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let parsedAttributes = {};
            try {
                parsedAttributes = JSON.parse(attributes);
            } catch (err) {
                throw new Error("Invalid JSON in attributes");
            }

            const commandData = {
                id: currentCommand?.id,
                description,
                type,
                attributes: parsedAttributes,
            };

            if (currentCommand) {
                await updateCommand(currentCommand.id, commandData);
            } else {
                await createCommand(commandData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Failed to save command");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{currentCommand ? "Edit Saved Command" : "New Saved Command"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Stop Engine"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMAND_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="attributes">Attributes (JSON)</Label>
                        <textarea
                            id="attributes"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={attributes}
                            onChange={(e) => setAttributes(e.target.value)}
                            placeholder='{"data": "content"}'
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide command attributes in JSON format.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
