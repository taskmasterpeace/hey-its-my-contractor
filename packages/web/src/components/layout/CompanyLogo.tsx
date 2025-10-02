"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  logoUrl: string | null;
}

interface CompanyMembership {
  id: string;
  companyId: string;
  companyRole: "admin" | "project_manager" | "member";
  company: Company;
}

interface UserCompaniesResponse {
  user: any;
  companies: CompanyMembership[];
}

export function CompanyLogo() {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetchCurrentCompany();
  }, [pathname]);

  const fetchCurrentCompany = async () => {
    try {
      setLoading(true);

      // Get current company ID from URL
      const pathSegments = pathname.split("/");
      const dashboardIndex = pathSegments.indexOf("dashboard");
      let currentCompanyId: string | null = null;

      if (dashboardIndex !== -1 && pathSegments[dashboardIndex + 1]) {
        currentCompanyId = pathSegments[dashboardIndex + 1];
      }

      if (!currentCompanyId) {
        setLoading(false);
        return;
      }

      // Fetch company data
      const response = await fetch("/api/user/companies", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data: UserCompaniesResponse = await response.json();

      // Find the current company
      const companyMembership = data.companies.find(
        (c: CompanyMembership) => c.companyId === currentCompanyId
      );

      if (companyMembership) {
        setCurrentCompany(companyMembership.company);
      }
    } catch (error) {
      console.error("Error fetching current company:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-gray-900">
          Hey, It's My Contractor
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
        {currentCompany.logoUrl ? (
          <img
            src={currentCompany.logoUrl}
            alt={currentCompany.name}
            className="w-8 h-8 object-cover rounded-lg"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      <span className="text-lg font-semibold text-gray-900">
        {currentCompany.name}
      </span>
    </div>
  );
}
