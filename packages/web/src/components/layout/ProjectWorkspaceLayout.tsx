"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  MessageSquare,
  FolderOpen,
  FileText,
  CreditCard,
  Users,
  Settings,
  Bell,
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  address: string;
  status: "planning" | "active" | "paused" | "completed" | "cancelled" | null;
  companyId: string;
  homeownerName: string | null;
  homeownerEmail: string | null;
}

interface ProjectWorkspaceLayoutProps {
  children: React.ReactNode;
  project: Project;
  userRole: "project_manager" | "contractor" | "homeowner";
  user: {
    id: string;
    email: string;
  };
}

export function ProjectWorkspaceLayout({
  children,
  project,
  userRole,
  user,
}: ProjectWorkspaceLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: `/project/${project.id}/dashboard`,
      icon: Home,
    },
    {
      name: "Calendar",
      href: `/project/${project.id}/calendar`,
      icon: Calendar,
    },
    {
      name: "Meetings",
      href: `/project/${project.id}/meetings`,
      icon: FileText,
    },
    { name: "Chat", href: `/project/${project.id}/chat`, icon: MessageSquare },
    {
      name: "Documents",
      href: `/project/${project.id}/documents`,
      icon: FolderOpen,
    },
    {
      name: "Images",
      href: `/project/${project.id}/images`,
      icon: ImageIcon,
    },
    {
      name: "Change Orders",
      href: `/project/${project.id}/change-orders`,
      icon: FileText,
    },
    {
      name: "Finance",
      href: `/project/${project.id}/finance`,
      icon: CreditCard,
    },
    { name: "Team", href: `/project/${project.id}/team`, icon: Users },
    {
      name: "Research",
      href: `/project/${project.id}/research`,
      icon: Search,
    },
  ];

  const getStatusBadge = (status: Project["status"]) => {
    const variants = {
      planning: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const displayStatus = status || "active";
    return (
      <Badge className={variants[displayStatus as keyof typeof variants]}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      project_manager: "bg-blue-100 text-blue-800",
      contractor: "bg-green-100 text-green-800",
      homeowner: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={`text-xs ${colors[role as keyof typeof colors]}`}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Project Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Back to Projects */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <Link
              href={`/dashboard/${project.companyId}`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">Back to Projects</span>
            </Link>
          </div>

          {/* Project Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start">
              <Building2 className="w-8 h-8 text-blue-600 mt-1" />
              <div className="ml-3 flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {project.address}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(project.status)}
                  {getRoleBadge(userRole)}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4">
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
              href={`/project/${project.id}/settings`}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === `/project/${project.id}/settings`
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Page Title and User Info */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium text-gray-900">
                    {user.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-gray-600">{userRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
