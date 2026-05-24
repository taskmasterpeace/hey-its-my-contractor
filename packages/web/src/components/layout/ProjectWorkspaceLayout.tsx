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
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Search,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  address: string;
  status: "planning" | "active" | "paused" | "completed" | "cancelled" | null;
  companyId: string;
  homeownerName: string | null;
  homeownerEmail: string | null;
  companyName: string | null;
  logoUrl: string | null;
}

interface ProjectWorkspaceLayoutProps {
  children: React.ReactNode;
  project: Project;
  userRole: "project_manager" | "contractor" | "homeowner";
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
}

export function ProjectWorkspaceLayout({
  children,
  project,
  userRole,
  user,
}: ProjectWorkspaceLayoutProps) {
  const pathname = usePathname();

  const navGroups: Array<{
    label: string;
    items: Array<{
      name: string;
      href: string;
      icon: typeof Home;
    }>;
  }> = [
    {
      label: "Workspace",
      items: [
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
        {
          name: "Chat",
          href: `/project/${project.id}/chat`,
          icon: MessageSquare,
        },
      ],
    },
    {
      label: `Project · ${project.name.split(" ")[0]}`,
      items: [
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
          name: "Research",
          href: `/project/${project.id}/research`,
          icon: Search,
        },
      ],
    },
    {
      label: "Business",
      items: [
        {
          name: "Finance",
          href: `/project/${project.id}/finance`,
          icon: CreditCard,
        },
        { name: "Team", href: `/project/${project.id}/team`, icon: Users },
      ],
    },
  ];

  const isSettingsActive = pathname === `/project/${project.id}/settings`;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Project Sidebar — MyFieldTime deep-blue rail */}
      <aside
        className="w-[260px] flex flex-col flex-shrink-0 relative text-white"
        style={{
          background:
            "linear-gradient(180deg, var(--ft-rail) 0%, var(--ft-rail-2) 100%)",
        }}
      >
        {/* Yellow construction accent stripe */}
        <div
          className="absolute left-0 right-0 top-0 h-[3px]"
          style={{ background: "var(--ft-yellow)" }}
        />

        {/* Back to Projects */}
        <div
          className="flex items-center px-5 py-4"
          style={{ borderBottom: "1px solid var(--ft-rail-rule)" }}
        >
          <Link
            href={`/dashboard/${project.companyId}`}
            className="flex items-center rounded-md px-2 py-1 transition-colors"
            style={{ color: "var(--ft-rail-ink-soft)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ft-yellow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ft-rail-ink-soft)";
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back to Projects</span>
          </Link>
        </div>

        {/* Project Header */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid var(--ft-rail-rule)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.companyName || "Company Logo"}
                  className="w-12 h-12 object-cover rounded-md"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center"
                  style={{ background: "var(--ft-yellow)" }}
                >
                  <Building2
                    className="w-6 h-6"
                    style={{ color: "var(--ft-hi-vis-ink)" }}
                  />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-white truncate leading-tight">
                {project.name}
              </h1>
              {project.companyName && (
                <div
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--ft-rail-ink-soft)" }}
                >
                  {project.companyName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation — grouped */}
        <nav className="flex-1 overflow-y-auto py-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div
                className="px-4 pt-5 pb-2 text-[10px] font-medium uppercase"
                style={{
                  color: "var(--ft-yellow)",
                  letterSpacing: "0.16em",
                }}
              >
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm transition-colors"
                      style={{
                        background: isActive
                          ? "rgba(255,255,255,0.10)"
                          : "transparent",
                        borderLeft: `3px solid ${
                          isActive ? "var(--ft-yellow)" : "transparent"
                        }`,
                        color: isActive
                          ? "#fff"
                          : "var(--ft-rail-ink-soft)",
                        fontWeight: isActive ? 600 : 500,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.06)";
                          e.currentTarget.style.color = "#fff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color =
                            "var(--ft-rail-ink-soft)";
                        }
                      }}
                    >
                      <item.icon
                        className="w-4 h-4 flex-shrink-0"
                        style={{
                          color: isActive
                            ? "var(--ft-yellow)"
                            : "rgba(255,255,255,0.55)",
                        }}
                      />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings */}
        <div
          className="px-3 py-3"
          style={{
            borderTop: "1px solid var(--ft-rail-rule)",
            background: "var(--ft-rail-3)",
          }}
        >
          <Link
            href={`/project/${project.id}/settings`}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors"
            style={{
              background: isSettingsActive
                ? "rgba(255,255,255,0.10)"
                : "transparent",
              color: isSettingsActive ? "#fff" : "var(--ft-rail-ink-soft)",
              fontWeight: isSettingsActive ? 600 : 500,
              border: `1px solid ${
                isSettingsActive ? "var(--ft-yellow)" : "rgba(255,255,255,0.12)"
              }`,
            }}
          >
            <Settings
              className="w-4 h-4"
              style={{
                color: isSettingsActive
                  ? "var(--ft-yellow)"
                  : "rgba(255,255,255,0.55)",
              }}
            />
            <span className="flex-1">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Page Title and User Info */}
        <div
          className="bg-card px-6 py-4"
          style={{
            borderBottom: "1px solid var(--ft-rule)",
            boxShadow: "inset 0 -3px 0 var(--ft-sky-soft)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2
                className="text-lg font-semibold capitalize"
                style={{ color: "var(--ft-ink)" }}
              >
                {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--ft-yellow)",
                    color: "var(--ft-hi-vis-ink)",
                  }}
                >
                  <span className="text-sm font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-2">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--ft-ink)" }}
                  >
                    {user.fullName || user.email.split("@")[0] || "User"}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--ft-steel)" }}
                  >
                    {userRole
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
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
