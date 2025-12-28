"use client";

import { use, useEffect, useState } from "react";
import UserForm from "@/components/users/UserForm";
import { Loader2 } from "lucide-react";
import { User, initialUsers } from "@/lib/data";

export default function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [user, setUser] = useState<User | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Dynamically import api to avoid server/client issues during build if direct import causes trouble, though standard import is fine usually.
                const { getUsers } = await import("@/lib/api");
                const users = await getUsers(); // TODO: Implement getUser(id) for efficiency, currently filtering list
                const found = users.find((u: any) => u.id.toString() === resolvedParams.id);

                if (found) {
                    setUser(found);
                } else {
                    // Fallback to mock data if API fails or not found (for dev/demo)
                    const mock = initialUsers.find(u => u.id === resolvedParams.id);
                    setUser(mock);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                // Fallback
                const mock = initialUsers.find(u => u.id === resolvedParams.id);
                setUser(mock);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [resolvedParams.id]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">User Not Found</h2>
                <p className="text-gray-500">The user you are looking for does not exist.</p>
            </div>
        );
    }

    return (
        <UserForm
            initialData={user}
            readOnly={true}
        />
    );
}
