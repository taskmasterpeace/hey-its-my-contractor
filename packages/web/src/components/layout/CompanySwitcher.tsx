"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Check } from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
}

interface CompanySwitcherProps {
  companies: Array<{
    company: Company;
    companyRole: "admin" | "project_manager" | "member";
  }>;
  selectedCompanyId: string;
  onCompanySelect: (companyId: string) => void;
}

export function CompanySwitcher({
  companies,
  selectedCompanyId,
  onCompanySelect,
}: CompanySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show if user only belongs to one company
  if (companies.length <= 1) {
    return null;
  }

  const selectedCompany = companies.find(
    (c) => c.company.id === selectedCompanyId
  );

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      project_manager: "bg-blue-100 text-blue-800",
      member: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`ml-2 text-xs ${colors[role as keyof typeof colors]}`}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[200px] justify-between bg-white border-gray-200 hover:bg-gray-50"
      >
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-gray-600" />
          <span className="truncate max-w-[140px]">
            {selectedCompany?.company.name || "Select Company"}
          </span>
          {selectedCompany && getRoleBadge(selectedCompany.companyRole)}
        </div>
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-1 left-0 w-[280px] bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 px-2 py-1">
                Switch Company
              </h3>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {companies.map((companyData) => (
                <button
                  key={companyData.company.id}
                  onClick={() => {
                    onCompanySelect(companyData.company.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {companyData.company.name}
                        </p>
                        {companyData.company.industry && (
                          <p className="text-xs text-gray-500 truncate">
                            {companyData.company.industry}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center ml-2">
                    {getRoleBadge(companyData.companyRole)}
                    {companyData.company.id === selectedCompanyId && (
                      <Check className="w-4 h-4 ml-2 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
