import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { sendCommand } from "@/lib/api";
import { Vehicle } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface CommandDialogProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
}

const COMMAND_TYPES = [
    { value: "engineStop", label: "Stop Engine" },
    { value: "engineResume", label: "Resume Engine" },
    { value: "custom", label: "Custom Command" },
    { value: "positionPeriodic", label: "Periodic Reporting" },
    { value: "rebootDevice", label: "Reboot Device" },
];

export default function CommandDialog({ isOpen, onClose, vehicle }: CommandDialogProps) {
    const [type, setType] = useState<string>("engineStop");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // For custom commands or specific attributes
    const [customData, setCustomData] = useState("");

    const handleSend = async () => {
        if (!vehicle) return;

        setLoading(true);
        setResult(null);

        try {
            const commandPayload: any = {
                deviceId: parseInt(vehicle.id),
                type: type,
            };

            if (type === "custom") {
                commandPayload.attributes = { data: customData };
            }

            // Traccar API call
            await sendCommand(commandPayload);

            setResult({ success: true, message: "Command sent successfully!" });

            // Close after short delay on success
            setTimeout(() => {
                onClose();
                setResult(null);
                setLoading(false);
            }, 1500);

        } catch (error) {
            console.error(error);
            setResult({ success: false, message: "Failed to send command." });
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Command to {vehicle?.name}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Command Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select command" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMAND_TYPES.map((cmd) => (
                                    <SelectItem key={cmd.value} value={cmd.value}>
                                        {cmd.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "custom" && (
                        <div className="grid gap-2">
                            <Label>Command Data</Label>
                            <Input
                                value={customData}
                                onChange={(e) => setCustomData(e.target.value)}
                                placeholder="e.g. reset, setparam..."
                            />
                        </div>
                    )}

                    {result && (
                        <div className={`text-sm p-2 rounded ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {result.message}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSend} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
