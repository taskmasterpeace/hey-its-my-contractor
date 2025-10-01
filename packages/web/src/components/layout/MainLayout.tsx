"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  FolderOpen,
  MessageSquare,
  CreditCard,
  Users,
  Settings,
  Bell,
  Search,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { NotificationSystem } from "@/components/ui/NotificationSystem";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAppStore } from "@/store";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const notifications = useAppStore((state) => state.notifications);

  const navigation: Array<{ name: string; href: string; icon: any }> = [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-6 pb-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Settings */}
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              href="/settings"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/settings"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {pathname === "/calendar"
                  ? "Calendar"
                  : pathname === "/images"
                  ? "Images & Design Library"
                  : pathname.slice(1) || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Role Switcher */}
              <RoleSwitcher />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* Notification System */}
        <NotificationSystem />
      </div>
    </div>
  );
}
