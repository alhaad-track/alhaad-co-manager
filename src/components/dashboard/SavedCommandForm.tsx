import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCommand, updateCommand } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

interface SavedCommandFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentCommand?: any;
    onSuccess: () => void;
}

const COMMAND_TYPES = [
    { value: "custom", label: "Custom" },
    { value: "deviceIdentification", label: "Device Identification" },
    { value: "positionSingle", label: "Single Position" },
    { value: "positionPeriodic", label: "Periodic Position" },
    { value: "engineStop", label: "Engine Stop" },
    { value: "engineResume", label: "Engine Resume" },
    { value: "alarmArm", label: "Arm Alarm" },
    { value: "alarmDisarm", label: "Disarm Alarm" },
    { value: "setTimezone", label: "Set Timezone" },
    { value: "requestPhoto", label: "Request Photo" },
    { value: "rebootDevice", label: "Reboot Device" },
    { value: "sendSms", label: "Send SMS" },
    { value: "sendUssd", label: "Send USSD" },
    { value: "sosNumber", label: "SOS Number" },
    { value: "silenceTime", label: "Silence Time" },
    { value: "message", label: "Message" },
    { value: "voiceMessage", label: "Voice Message" },
    { value: "outputControl", label: "Output Control" },
    { value: "driverUniqueId", label: "Driver Custom ID" },
];

export default function SavedCommandForm({ open, onOpenChange, currentCommand, onSuccess }: SavedCommandFormProps) {
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [type, setType] = useState("custom");
    const [attributes, setAttributes] = useState<Record<string, any>>({});
    const { addNotification } = useNotification();

    useEffect(() => {
        if (currentCommand) {
            setDescription(currentCommand.description || "");
            setType(currentCommand.type || "custom");
            setAttributes(currentCommand.attributes || {});
        } else {
            setDescription("");
            setType("custom");
            setAttributes({});
        }
    }, [currentCommand, open]);

    const handleAttributeChange = (key: string, value: any) => {
        setAttributes(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const commandData = {
                id: currentCommand?.id,
                description,
                type,
                attributes,
            };

            if (currentCommand) {
                await updateCommand(currentCommand.id, commandData);
            } else {
                await createCommand(commandData);
            }
            addNotification("success", "Success", "Command saved successfully");
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            addNotification("error", "Error", err.message || "Failed to save command");
        } finally {
            setLoading(false);
        }
    };

    const renderAttributeFields = () => {
        switch (type) {
            case "positionPeriodic":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Input
                                id="frequency"
                                type="number"
                                value={attributes.frequency || ""}
                                onChange={(e) => handleAttributeChange("frequency", parseInt(e.target.value))}
                                placeholder="Value"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select
                                value={attributes.unit || "minute"}
                                onValueChange={(val) => handleAttributeChange("unit", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="second">Seconds</SelectItem>
                                    <SelectItem value="minute">Minutes</SelectItem>
                                    <SelectItem value="hour">Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case "custom":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="data">Data</Label>
                        <Input
                            id="data"
                            value={attributes.data || ""}
                            onChange={(e) => handleAttributeChange("data", e.target.value)}
                            placeholder="Command data"
                        />
                    </div>
                );
            case "sendSms":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={attributes.phone || ""}
                                onChange={(e) => handleAttributeChange("phone", e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Input
                                id="message"
                                value={attributes.message || ""}
                                onChange={(e) => handleAttributeChange("message", e.target.value)}
                                placeholder="SMS Content"
                            />
                        </div>
                    </>
                );
            case "message":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Input
                            id="message"
                            value={attributes.message || ""}
                            onChange={(e) => handleAttributeChange("message", e.target.value)}
                            placeholder="Message Content"
                        />
                    </div>
                );
            case "outputControl":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="index">Index</Label>
                            <Input
                                id="index"
                                type="number"
                                value={attributes.index !== undefined ? attributes.index : ""}
                                onChange={(e) => handleAttributeChange("index", parseInt(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="data">Action</Label>
                            <Select
                                value={attributes.data || "on"}
                                onValueChange={(val) => handleAttributeChange("data", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">On</SelectItem>
                                    <SelectItem value="0">Off</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case "setTimezone":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                            id="timezone"
                            value={attributes.timezone || ""}
                            onChange={(e) => handleAttributeChange("timezone", e.target.value)}
                            placeholder="e.g., UTC, America/New_York"
                        />
                    </div>
                );
            case "sendUssd":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Input
                            id="content"
                            value={attributes.content || ""}
                            onChange={(e) => handleAttributeChange("content", e.target.value)}
                            placeholder="USSD Code"
                        />
                    </div>
                );
            case "videoRecording":
            case "voiceMessage":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="data">Data</Label>
                        <Input
                            id="data"
                            value={attributes.data || ""}
                            onChange={(e) => handleAttributeChange("data", e.target.value)}
                            placeholder="Data"
                        />
                    </div>
                );
            case "sosNumber":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="index">Index</Label>
                            <Input
                                id="index"
                                type="number"
                                value={attributes.index !== undefined ? attributes.index : ""}
                                onChange={(e) => handleAttributeChange("index", parseInt(e.target.value))}
                                placeholder="1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={attributes.phone || ""}
                                onChange={(e) => handleAttributeChange("phone", e.target.value)}
                                placeholder="Phone Number"
                            />
                        </div>
                    </div>
                );
            case "silenceTime":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                                id="startTime"
                                value={attributes.startTime || ""}
                                onChange={(e) => handleAttributeChange("startTime", e.target.value)}
                                placeholder="HH:mm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={attributes.duration || ""}
                                onChange={(e) => handleAttributeChange("duration", parseInt(e.target.value))}
                                placeholder="Minutes"
                            />
                        </div>
                    </div>
                );

            case "engineStop":
            case "engineResume":
            case "alarmArm":
            case "alarmDisarm":
            case "deviceIdentification":
            case "positionSingle":
            case "rebootDevice":
            case "requestPhoto":
                return (
                    <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">
                        This command requires no additional attributes.
                    </div>
                );

            default:
                // Fallback for types not explicitly handled or "driverUniqueId" etc.
                return (
                    <div className="space-y-2">
                        <Label htmlFor="rawAttributes">Attributes (JSON)</Label>
                        <textarea
                            id="rawAttributes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={JSON.stringify(attributes, null, 2)}
                            onChange={(e) => {
                                try {
                                    setAttributes(JSON.parse(e.target.value));
                                } catch (err) {
                                    // Handle invalid JSON gracefully (maybe don't update state until valid?)
                                    // For simplicity in fallback, we might just let it be invalid for now or separate string state
                                }
                            }}
                            placeholder='{"key": "value"}'
                        />
                        <p className="text-xs text-muted-foreground">
                            Advanced: Enter attributes as JSON.
                        </p>
                    </div>
                );
        }
    }

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
                        <Select value={type} onValueChange={(t) => {
                            setType(t);
                            setAttributes({}); // Reset attributes when type changes
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {COMMAND_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-4 border rounded-md bg-white">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Command Attributes</h4>
                        {renderAttributeFields()}
                    </div>

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
