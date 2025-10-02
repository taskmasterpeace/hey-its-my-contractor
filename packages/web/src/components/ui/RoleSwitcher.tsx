"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Building2,
  User,
  Crown,
  Shield,
  Briefcase,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CompanyMembership {
  id: string;
  companyId: string;
  companyRole: "admin" | "project_manager" | "member";
  isActive: boolean;
  joinedAt: string;
  company: {
    id: string;
    name: string;
    industry: string | null;
    logoUrl: string | null;
  };
}

interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  profile: any;
  systemRole: "super_admin" | "project_manager" | "contractor" | "homeowner";
}

interface UserCompaniesResponse {
  user: UserProfile;
  companies: CompanyMembership[];
}

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndCompanies();
  }, []);

  const fetchUserAndCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/companies", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, redirect to login
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch user companies: ${response.status}`);
      }

      const data: UserCompaniesResponse = await response.json();

      setCurrentUser(data.user);
      setCompanies(data.companies);

      // Set current company from URL path or default to first company
      const pathSegments = window.location.pathname.split("/");
      const dashboardIndex = pathSegments.indexOf("dashboard");

      if (dashboardIndex !== -1 && pathSegments[dashboardIndex + 1]) {
        const urlCompanyId = pathSegments[dashboardIndex + 1];
        if (
          data.companies.some(
            (c: CompanyMembership) => c.companyId === urlCompanyId
          )
        ) {
          setCurrentCompanyId(urlCompanyId);
          return;
        }
      }

      // Default to first company if no valid company in URL
      if (data.companies.length > 0) {
        setCurrentCompanyId(data.companies[0].companyId);
      }
    } catch (error) {
      console.error("Error in fetchUserAndCompanies:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load companies"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "project_manager":
        return <Shield className="w-4 h-4 text-green-500" />;
      case "member":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-yellow-700";
      case "project_manager":
        return "text-green-700";
      case "member":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  const getDisplayName = (user: UserProfile) => {
    if (user.fullName) {
      return user.fullName;
    }

    // Try to get name from profile
    const profile = user.profile || {};
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }

    // Fallback to email username
    if (user.email) {
      return user.email.split("@")[0];
    }

    return "User";
  };

  const getInitials = (user: UserProfile) => {
    const displayName = getDisplayName(user);

    // If we have a full name or first/last name, use first letters
    const nameParts = displayName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    // For single names or email usernames, use first two characters
    if (displayName.length >= 2) {
      return displayName.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  const handleCompanySwitch = (companyId: string) => {
    setCurrentCompanyId(companyId);
    setIsOpen(false);

    // Navigate to the company dashboard
    router.push(`/dashboard/${companyId}`);
  };

  const currentCompany = companies.find(
    (c: CompanyMembership) => c.companyId === currentCompanyId
  );

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-1">
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-2 text-red-600">
        <User className="w-8 h-8" />
        <div className="text-sm">
          <div className="font-medium">Error loading profile</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (!currentUser || companies.length === 0) {
    return (
      <div className="flex items-center space-x-3 p-2 text-gray-500">
        <User className="w-8 h-8" />
        <div className="text-sm">
          <div className="font-medium">No companies</div>
          <div className="text-xs">Contact admin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current User/Company Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {getInitials(currentUser)}
        </div>

        {/* User Info */}
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">
            {getDisplayName(currentUser)}
          </p>
          {currentCompany && (
            <div className="flex items-center space-x-1">
              {getRoleIcon(currentCompany.companyRole)}
              <span
                className={`text-xs capitalize ${getRoleColor(
                  currentCompany.companyRole
                )}`}
              >
                {currentCompany.companyRole.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Switch Company
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Select a company to view its projects and data
            </p>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {companies.map((membership: CompanyMembership) => (
              <button
                key={membership.id}
                onClick={() => handleCompanySwitch(membership.companyId)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  currentCompanyId === membership.companyId
                    ? "bg-blue-50 border border-blue-200"
                    : ""
                }`}
              >
                {/* Company Logo or Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  {membership.company.logoUrl ? (
                    <img
                      src={membership.company.logoUrl}
                      alt={membership.company.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {/* Company Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {membership.company.name}
                    </p>
                    {currentCompanyId === membership.companyId && (
                      <span className="text-xs text-blue-600 font-medium">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mb-1">
                    {getRoleIcon(membership.companyRole)}
                    <span
                      className={`text-xs capitalize ${getRoleColor(
                        membership.companyRole
                      )}`}
                    >
                      {membership.companyRole.replace("_", " ")}
                    </span>
                  </div>

                  {membership.company.industry && (
                    <p className="text-xs text-gray-500 capitalize">
                      {membership.company.industry}
                    </p>
                  )}
                </div>

                {/* Current Company Indicator */}
                {currentCompanyId === membership.companyId && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Help Text */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Each company has its own projects, team
              members, and settings. Switch between companies to access
              different workspaces.
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
