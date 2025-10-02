"use client";

import { Bell } from "lucide-react";
import { NotificationSystem } from "@/components/ui/NotificationSystem";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { CompanyLogo } from "@/components/layout/CompanyLogo";
import { useAppStore } from "@/store";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const notifications = useAppStore((state) => state.notifications);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CompanyLogo />
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
