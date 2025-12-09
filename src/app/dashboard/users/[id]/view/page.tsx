"use client";

import { use, useState } from "react";
import { initialUsers } from "@/lib/data";
import UserForm from "@/components/users/UserForm";
import { notFound } from "next/navigation";

export default function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [user, setUser] = useState(initialUsers.find(u => u.id === resolvedParams.id));

    if (!user) {
        notFound();
    }

    return (
        <UserForm
            initialData={user}
            readOnly={true}
        />
    );
}
