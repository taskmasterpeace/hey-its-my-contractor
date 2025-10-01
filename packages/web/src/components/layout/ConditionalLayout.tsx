"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { loading } = useAuth();

  // Check if current path is an auth route
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/error" ||
    pathname.startsWith("/auth/");

  // Check if current path is a project workspace route (should bypass MainLayout)
  const isProjectRoute = pathname.startsWith("/project/");

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For auth routes and project routes, render children without MainLayout
  if (isAuthRoute || isProjectRoute) {
    return <>{children}</>;
  }

  // For all other routes, render with MainLayout
  return <MainLayout>{children}</MainLayout>;
}
