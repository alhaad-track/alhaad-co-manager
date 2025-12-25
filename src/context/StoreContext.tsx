"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUsers, getDrivers, getGeofences } from "@/lib/api";

interface StoreContextType {
    users: any[];
    drivers: any[];
    geofences: any[];
    isLoading: boolean;
    refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({
    users: [],
    drivers: [],
    geofences: [],
    isLoading: true,
    refreshStore: async () => { },
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [geofences, setGeofences] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersData, driversData, geofencesData] = await Promise.all([
                getUsers(),
                getDrivers(),
                getGeofences()
            ]);
            setUsers(usersData || []);
            setDrivers(driversData || []);
            setGeofences(geofencesData || []);
        } catch (error) {
            console.error("Failed to fetch store data:", error);
            // Optional: Add toast or error state here
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <StoreContext.Provider value={{
            users,
            drivers,
            geofences,
            isLoading,
            refreshStore: fetchData
        }}>
            {children}
        </StoreContext.Provider>
    );
};
