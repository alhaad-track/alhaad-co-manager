"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getUsers } from "@/lib/api";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                // Map Traccar user object to User interface
                // Traccar User: id, name, email, administrator (boolean), attributes
                const mappedUsers: User[] = data.map((u: any) => ({
                    id: u.id.toString(),
                    name: u.name || "Unknown",
                    email: u.email || "No Email",
                    role: u.administrator ? "admin" : "user",
                    createdAt: u.attributes?.createdAt || "N/A" // Traccar might not send creation date by default
                }));
                setUsers(mappedUsers);
            } catch (err) {
                console.error("Failed to fetch users", err);
                setError("Failed to load users.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-orange-600" /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">Manage system users</p>
                </div>
                <Link href="/dashboard/users/new">
                    <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4" />
                        Add User
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white border-b rounded-t-lg">
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-lg">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created At</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{user.name}</td>
                                        <td className="p-4 align-middle">{user.email}</td>
                                        <td className="p-4 align-middle capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-gray-500">{user.createdAt}</td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/users/${user.id}/view`}>
                                                    <Button size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white">View</Button>
                                                </Link>
                                                <Link href={`/dashboard/users/${user.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50">Edit</Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
