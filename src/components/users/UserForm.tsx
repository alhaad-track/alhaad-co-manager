"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, User as UserIcon, Shield, Settings, Activity, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { User } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

interface UserFormProps {
    initialData?: User;
    isEditing?: boolean;
    readOnly?: boolean;
}

export default function UserForm({ initialData, isEditing = false, readOnly = false }: UserFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Helper to get date 1 year from now
    const getDefaultExpiration = () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState<Partial<User>>({
        id: initialData?.id || "",
        name: initialData?.name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        readonly: initialData?.readonly || false,
        administrator: initialData?.administrator || false,
        map: initialData?.map || "",
        latitude: initialData?.latitude || 0,
        longitude: initialData?.longitude || 0,
        zoom: initialData?.zoom || 0,
        coordinateFormat: initialData?.coordinateFormat || "",
        disabled: initialData?.disabled || false,
        deviceLimit: initialData?.deviceLimit !== undefined ? initialData.deviceLimit : 0,
        userLimit: initialData?.userLimit !== undefined ? initialData.userLimit : 0,
        expirationTime: initialData?.expirationTime
            ? initialData.expirationTime.split('T')[0]
            : (isEditing ? "" : getDefaultExpiration()),
        attributes: initialData?.attributes || {},
        poiLayer: initialData?.poiLayer || "",
        limitCommands: initialData?.limitCommands || false,
        deviceReadonly: initialData?.deviceReadonly || false,
        disableReports: initialData?.disableReports || false,
    });

    const [password, setPassword] = useState("");

    // Attributes state
    const [speedUnit, setSpeedUnit] = useState(initialData?.attributes?.speedUnit || "");
    const [distanceUnit, setDistanceUnit] = useState(initialData?.attributes?.distanceUnit || "");
    const [timezone, setTimezone] = useState(initialData?.attributes?.timezone || "Asia/Karachi");
    const [twelveHourFormat, setTwelveHourFormat] = useState(initialData?.attributes?.twelveHourFormat || false);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[0-9+]*$/.test(value)) {
            setFormData({ ...formData, phone: value });
        }
    };

    const handleReview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsReviewOpen(true);
    };

    const handleError = (message: string) => {
        setErrorMessage(message);
        setErrorDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        setIsLoading(true);
        setDeleteDialogOpen(false);

        try {
            const { deleteUser } = await import("@/lib/api");
            await deleteUser(initialData.id);
            router.push("/dashboard/users");
        } catch (error) {
            console.error("Failed to delete user", error);
            handleError("Failed to delete user. Please try again.");
            setIsLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        setIsLoading(true);
        setIsReviewOpen(false);

        const payload: any = {
            ...formData,
            attributes: {
                ...formData.attributes,
                twelveHourFormat: twelveHourFormat,
            }
        };

        if (password) payload.password = password;
        if (speedUnit) payload.attributes.speedUnit = speedUnit;
        if (distanceUnit) payload.attributes.distanceUnit = distanceUnit;
        if (timezone) payload.attributes.timezone = timezone;

        if (formData.expirationTime) {
            payload.expirationTime = new Date(formData.expirationTime).toISOString();
        } else {
            payload.expirationTime = null;
        }

        try {
            const { createUser, updateUser } = await import("@/lib/api");

            if (isEditing && initialData?.id) {
                await updateUser(initialData.id, payload);
            } else {
                await createUser(payload);
            }
            router.push("/dashboard/users");
        } catch (error) {
            console.error("Failed to save user", error);
            handleError("Failed to save user. Please check your inputs and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Review Summary Component
    const SummaryRow = ({ label, value }: { label: string, value: any }) => (
        <div className="flex justify-between py-1 border-b last:border-0 text-sm">
            <span className="font-medium text-gray-600">{label}</span>
            <span className="text-gray-900 font-semibold">{value?.toString() || "-"}</span>
        </div>
    );

    return (
        <div className="flex flex-col w-full">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/dashboard/users">
                        <Button variant="ghost" size="sm" className="mr-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">
                        {readOnly ? "User Details" : isEditing ? "Edit User" : "Add New User"}
                    </h1>
                </div>
                {/* Delete button removed from here */}
            </div>

            <form onSubmit={handleReview} className="space-y-4 max-w-5xl mx-auto w-full">

                {/* Account Information */}
                <Card className="border-t-4 border-t-blue-500 shadow-sm overflow-hidden">
                    <Accordion type="single" collapsible defaultValue="account">
                        <AccordionItem value="account" className="border-0">
                            <AccordionTrigger className="bg-blue-50/50 px-6 py-4 hover:no-underline">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <UserIcon className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-lg">Account Information</div>
                                        <div className="text-sm text-gray-500 font-normal">Basic user identity details</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={readOnly} maxLength={128} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={readOnly} maxLength={255} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="+1234567890" disabled={readOnly} maxLength={20} />
                                    </div>
                                    {!readOnly && (
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password {isEditing && "(Leave blank to keep)"}</Label>
                                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditing} disabled={readOnly} maxLength={128} />
                                        </div>
                                    )}
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>

                {/* Permissions & Limits */}
                <Card className="border-t-4 border-t-red-500 shadow-sm overflow-hidden">
                    <Accordion type="single" collapsible defaultValue="permissions">
                        <AccordionItem value="permissions" className="border-0">
                            <AccordionTrigger className="bg-red-50/50 px-6 py-4 hover:no-underline">
                                <div className="flex items-center gap-2 text-red-700">
                                    <Shield className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-lg">Permissions & Limits</div>
                                        <div className="text-sm text-gray-500 font-normal">Access control and resource limitations</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-gray-900 border-b pb-2">Access Control</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-2"><Checkbox id="admin" checked={formData.administrator} onCheckedChange={(c) => setFormData({ ...formData, administrator: !!c })} disabled={readOnly} /> <Label htmlFor="admin">Administrator</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="readonly" checked={formData.readonly} onCheckedChange={(c) => setFormData({ ...formData, readonly: !!c })} disabled={readOnly} /> <Label htmlFor="readonly">Read Only</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="deviceReadonly" checked={formData.deviceReadonly} onCheckedChange={(c) => setFormData({ ...formData, deviceReadonly: !!c })} disabled={readOnly} /> <Label htmlFor="deviceReadonly">Device Read Only</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="limitCommands" checked={formData.limitCommands} onCheckedChange={(c) => setFormData({ ...formData, limitCommands: !!c })} disabled={readOnly} /> <Label htmlFor="limitCommands">Limit Commands</Label></div>
                                            <div className="flex items-center space-x-2"><Checkbox id="disableReports" checked={formData.disableReports} onCheckedChange={(c) => setFormData({ ...formData, disableReports: !!c })} disabled={readOnly} /> <Label htmlFor="disableReports">Disable Reports</Label></div>
                                            <div className="flex items-center space-x-2 text-red-600"><Checkbox id="disabled" checked={formData.disabled} onCheckedChange={(c) => setFormData({ ...formData, disabled: !!c })} disabled={readOnly} /> <Label htmlFor="disabled" className="text-red-600 font-medium">Account Disabled</Label></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-gray-900 border-b pb-2">Resource Limits</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="deviceLimit">Device Limit (-1 for unlimited)</Label>
                                            <Input id="deviceLimit" type="number" min="-1" value={formData.deviceLimit} onChange={(e) => setFormData({ ...formData, deviceLimit: parseInt(e.target.value) })} disabled={readOnly} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="userLimit">User Limit</Label>
                                            <Input id="userLimit" type="number" min="0" value={formData.userLimit} onChange={(e) => setFormData({ ...formData, userLimit: parseInt(e.target.value) })} disabled={readOnly} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expiration">Expiration Date (1 Year Default)</Label>
                                            <Input id="expiration" type="date" value={formData.expirationTime} onChange={(e) => setFormData({ ...formData, expirationTime: e.target.value })} disabled={readOnly} />
                                        </div>
                                    </div>
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>

                {/* Preferences */}
                <Card className="border-t-4 border-t-green-500 shadow-sm overflow-hidden">
                    <Accordion type="single" collapsible defaultValue="preferences">
                        <AccordionItem value="preferences" className="border-0">
                            <AccordionTrigger className="bg-green-50/50 px-6 py-4 hover:no-underline">
                                <div className="flex items-center gap-2 text-green-700">
                                    <Settings className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-lg">Preferences</div>
                                        <div className="text-sm text-gray-500 font-normal">Map settings and display options</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="map">Map Layer</Label>
                                        <Select value={formData.map} onValueChange={(v) => setFormData({ ...formData, map: v })} disabled={readOnly}>
                                            <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="carto">Carto</SelectItem>
                                                <SelectItem value="osm">OpenStreetMap</SelectItem>
                                                <SelectItem value="google">Google Maps</SelectItem>
                                                <SelectItem value="bing">Bing Maps</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="poiLayer">POI Layer</Label>
                                        <Input id="poiLayer" value={formData.poiLayer} onChange={(e) => setFormData({ ...formData, poiLayer: e.target.value })} placeholder="e.g. http://..." disabled={readOnly} maxLength={512} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="coordinateFormat">Coordinate Format</Label>
                                        <Select value={formData.coordinateFormat} onValueChange={(v) => setFormData({ ...formData, coordinateFormat: v })} disabled={readOnly}>
                                            <SelectTrigger><SelectValue placeholder="Decimal Degrees" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dd">Decimal Degrees</SelectItem>
                                                <SelectItem value="ddm">Degrees Decimal Minutes</SelectItem>
                                                <SelectItem value="dms">Degrees Minutes Seconds</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <Checkbox id="12h" checked={twelveHourFormat} onCheckedChange={(c) => setTwelveHourFormat(!!c)} disabled={readOnly} />
                                        <Label htmlFor="12h">12-Hour Format</Label>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4 pt-2">
                                        <div className="space-y-2"><Label htmlFor="lat">Latitude (-90 to 90)</Label><Input id="lat" type="number" min="-90" max="90" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} disabled={readOnly} /></div>
                                        <div className="space-y-2"><Label htmlFor="lng">Longitude (-180 to 180)</Label><Input id="lng" type="number" min="-180" max="180" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} disabled={readOnly} /></div>
                                        <div className="space-y-2"><Label htmlFor="zoom">Zoom Level (0-22)</Label><Input id="zoom" type="number" min="0" max="22" value={formData.zoom} onChange={(e) => setFormData({ ...formData, zoom: parseFloat(e.target.value) })} disabled={readOnly} /></div>
                                    </div>
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>

                {/* Attributes */}
                <Card className="border-t-4 border-t-purple-500 shadow-sm overflow-hidden">
                    <Accordion type="single" collapsible defaultValue="attributes">
                        <AccordionItem value="attributes" className="border-0">
                            <AccordionTrigger className="bg-purple-50/50 px-6 py-4 hover:no-underline">
                                <div className="flex items-center gap-2 text-purple-700">
                                    <Activity className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-lg">Attributes</div>
                                        <div className="text-sm text-gray-500 font-normal">Measurement units and timezone overrides</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="speedUnit">Speed Unit</Label>
                                        <Select value={speedUnit} onValueChange={setSpeedUnit} disabled={readOnly}>
                                            <SelectTrigger><SelectValue placeholder="Default (kn)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kn">Knots</SelectItem>
                                                <SelectItem value="kmh">Km/h</SelectItem>
                                                <SelectItem value="mph">Mph</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="distanceUnit">Distance Unit</Label>
                                        <Select value={distanceUnit} onValueChange={setDistanceUnit} disabled={readOnly}>
                                            <SelectTrigger><SelectValue placeholder="Default (km)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="km">Kilometers</SelectItem>
                                                <SelectItem value="mi">Miles</SelectItem>
                                                <SelectItem value="nmi">Nautical Miles</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone (Override)</Label>
                                        <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. Asia/Dubai" disabled={readOnly} maxLength={64} />
                                    </div>
                                </CardContent>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>

                <div className="pt-6 flex justify-between gap-4">
                    {isEditing && !readOnly && (
                        <Button
                            type="button"
                            variant="danger"
                            size="lg"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" /> Delete User
                        </Button>
                    )}
                    <div className="flex gap-4 ml-auto">
                        <Link href="/dashboard/users">
                            <Button variant="outline" type="button" size="lg">{readOnly ? "Back" : "Cancel"}</Button>
                        </Link>
                        {!readOnly && (
                            <Button type="submit" size="lg" disabled={isLoading} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white min-w-[150px]">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isLoading ? "Saving..." : isEditing ? "Review & Update" : "Review & Save"}
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review User Details</DialogTitle>
                        <DialogDescription>
                            Please review the information before creating the user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        <div>
                            <h4 className="font-semibold text-blue-600 border-b mb-2">Account</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                <SummaryRow label="Name" value={formData.name} />
                                <SummaryRow label="Email" value={formData.email} />
                                <SummaryRow label="Phone" value={formData.phone} />
                                <SummaryRow label="Password" value={password ? "******" : "(Unchanged)"} />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-red-600 border-b mb-2">Access & Permissions</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                <SummaryRow label="Administrator" value={formData.administrator ? "Yes" : "No"} />
                                <SummaryRow label="Read Only" value={formData.readonly ? "Yes" : "No"} />
                                <SummaryRow label="Disabled" value={formData.disabled ? "Yes" : "No"} />
                                <SummaryRow label="Device Limit" value={formData.deviceLimit === -1 ? "Unlimited" : formData.deviceLimit} />
                                <SummaryRow label="Expiration" value={formData.expirationTime || "Never"} />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-green-600 border-b mb-2">Preferences</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                <SummaryRow label="Map Layer" value={formData.map || "Default"} />
                                <SummaryRow label="Coordinates" value={formData.coordinateFormat || "Decimal Degrees"} />
                                <SummaryRow label="12-Hour Format" value={twelveHourFormat ? "Yes" : "No"} />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-purple-600 border-b mb-2">Attributes</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                <SummaryRow label="Speed Unit" value={speedUnit || "Default"} />
                                <SummaryRow label="Distance Unit" value={distanceUnit || "Default"} />
                                <SummaryRow label="Timezone" value={timezone} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Edit</Button>
                        <Button onClick={handleConfirmSubmit} className="bg-orange-600 hover:bg-orange-700 text-white">
                            Confirm {isEditing ? "Update" : "Create"} User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? "Deleting..." : "Delete User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Error
                        </DialogTitle>
                        <DialogDescription>
                            {errorMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
