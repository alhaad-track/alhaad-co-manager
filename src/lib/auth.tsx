"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { traccarApi } from "@/lib/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: "manager" | "user";
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage for persisted user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const params = new URLSearchParams();
        params.append("email", email);
        params.append("password", password);

        try {
            const response = await traccarApi("/api/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Invalid email or password");
                }
                throw new Error("Login failed");
            }

            const data = await response.json();

            const authenticatedUser: User = {
                id: data.id.toString(),
                name: data.name,
                email: data.email,
                role: data.administrator ? "manager" : "user",
            };

            setUser(authenticatedUser);
            localStorage.setItem("user", JSON.stringify(authenticatedUser));

            // Store Basic Auth credentials
            const basicAuth = 'Basic ' + btoa(email + ':' + password);
            localStorage.setItem("traccar_auth", basicAuth);

            router.push("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Optional: Call Traccar logout API if needed, but primarily clear local state
            // await fetch("http://144.21.50.12/api/session", { method: "DELETE" });
        } catch (error) {
            console.error("Logout error", error);
        }
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("traccar_auth");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
