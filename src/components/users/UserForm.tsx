"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { User } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFormProps {
    initialData?: User;
    isEditing?: boolean;
    readOnly?: boolean;
}

export default function UserForm({ initialData, isEditing = false, readOnly = false }: UserFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<User>>({
        id: initialData?.id || "",
        name: initialData?.name || "",
        email: initialData?.email || "",
        role: initialData?.role || "user",
    });

    // Password field state (only for new users or if editing password)
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("User Data:", { ...formData, password });

        router.push("/dashboard/users");
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex items-center">
                <Link href="/dashboard/users">
                    <Button variant="ghost" size="sm" className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">
                    {readOnly ? "User Details" : isEditing ? "Edit User" : "Add New User"}
                </h1>
            </div>

            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="John Doe"
                                disabled={readOnly}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="john@example.com"
                                disabled={readOnly}
                            />
                        </div>

                        {!readOnly && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Password {isEditing && "(Leave blank to keep current)"}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={!isEditing}
                                    disabled={readOnly}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: "manager" | "user") => setFormData({ ...formData, role: value })}
                                disabled={readOnly}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <Link href="/dashboard/users">
                                <Button variant="outline" type="button">{readOnly ? "Back" : "Cancel"}</Button>
                            </Link>
                            {!readOnly && (
                                <Button type="submit" disabled={isLoading} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    {isLoading ? "Saving..." : "Save User"}
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
