"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Car, Map, LogOut, LayoutDashboard, Hexagon, User, Bell, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StoreProvider } from "@/context/StoreContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";
import LiveAlertsListener from "@/components/dashboard/LiveAlertsListener";
import AlertsSheet from "@/components/dashboard/AlertsSheet";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                    <Car className="w-6 h-6" />
                    Alhaad Track
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {[
                    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                    { href: "/dashboard/users", label: "Users", icon: Users },
                    { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
                    { href: "/dashboard/tracking", label: "Live Tracking", icon: Map },
                    { href: "/dashboard/geofences", label: "Geofences", icon: Hexagon },
                    { href: "/dashboard/drivers", label: "Drivers", icon: User },
                    { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
                    { href: "/dashboard/reports", label: "Reports", icon: FileText },
                ].map((item) => {
                    const isActive = item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-orange-100 text-orange-900 font-medium hover:bg-orange-200"
                                : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <SocketProvider>
            <StoreProvider>
                <NotificationProvider>
                    <LiveAlertsListener />
                    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
                        {/* Mobile Header */}
                        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <Sheet open={open} onOpenChange={setOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="w-6 h-6" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="p-0 w-72">
                                        <SidebarContent />
                                    </SheetContent>
                                </Sheet>
                                <div className="flex items-center gap-2 font-bold text-orange-600">
                                    <Car className="w-6 h-6" />
                                    Alhaad Track
                                </div>
                            </div>
                            <AlertsSheet />
                        </div>

                        {/* Desktop Sidebar */}
                        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
                            <SidebarContent />
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
                            {/* Desktop Header for Quick Actions */}
                            <header className="hidden md:flex items-center justify-end p-4 bg-white border-b border-gray-200 shadow-sm">
                                <AlertsSheet />
                            </header>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-auto p-4 md:p-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </NotificationProvider>
            </StoreProvider>
        </SocketProvider>
    );
}
