import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  users,
  companies,
  companyUsers,
  projects,
  projectUsers,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUserPermissions } from "@/lib/auth/permissions";
import { ProjectSelector } from "@/components/dashboard/ProjectSelector";

interface DashboardDataFetcherProps {
  companyId: string;
}

export async function DashboardDataFetcher({
  companyId,
}: DashboardDataFetcherProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's scoped permissions
  const permissions = await getUserPermissions(user.id);

  // Get user's company memberships with scoped permissions
  const companyIds = permissions.companyPermissions.map((cp) => cp.companyId);

  type UserCompany = {
    company: { id: string; name: string; industry: string | null };
    companyRole: "admin" | "project_manager" | "member";
  };

  let userCompanies: UserCompany[] = [];

  if (permissions.systemRole === "super_admin") {
    // Super admin sees all companies
    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        industry: companies.industry,
      })
      .from(companies);

    userCompanies = allCompanies.map((company) => ({
      company,
      companyRole: "admin" as const,
    }));
  } else {
    if (companyIds.length === 0) {
      // User has no company access, redirect to account setup or contact admin
      redirect("/account?message=no-company-access");
    }

    const companyData = await db
      .select({
        company: {
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
        },
        companyRole: companyUsers.companyRole,
      })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(
        and(eq(companyUsers.userId, user.id), eq(companyUsers.isActive, true))
      );

    userCompanies = companyData;
  }

  // Validate that user has access to the selected company
  const hasAccessToCompany =
    permissions.systemRole === "super_admin" ||
    userCompanies.some((uc) => uc.company.id === companyId);

  if (!hasAccessToCompany) {
    // User doesn't have access to this company, redirect to first available company
    const firstCompanyId = userCompanies[0]?.company.id;
    if (firstCompanyId) {
      redirect(`/dashboard/${firstCompanyId}`);
    } else {
      redirect("/account?message=no-company-access");
    }
  }

  // Get projects for the selected company
  type UserProject = {
    id: string;
    name: string;
    address: string;
    status: "planning" | "active" | "paused" | "completed" | "cancelled" | null;
    createdAt: Date;
    homeownerName: string | null;
    homeownerEmail: string | null;
    startDate: string | null;
    estimatedEndDate: string | null;
    budget: string | null;
  };

  let userProjects: UserProject[] = [];

  if (permissions.systemRole === "super_admin") {
    // Super admin sees all projects in the company
    userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        address: projects.address,
        status: projects.status,
        createdAt: projects.createdAt,
        homeownerName: projects.homeownerName,
        homeownerEmail: projects.homeownerEmail,
        startDate: projects.startDate,
        estimatedEndDate: projects.estimatedEndDate,
        budget: projects.budget,
      })
      .from(projects)
      .where(eq(projects.companyId, companyId));
  } else {
    // Get user's project permissions for this company
    const projectIds = permissions.projectPermissions.map((pp) => pp.projectId);

    if (projectIds.length === 0) {
      // User has no project access in this company
      userProjects = [];
    } else {
      userProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          address: projects.address,
          status: projects.status,
          createdAt: projects.createdAt,
          homeownerName: projects.homeownerName,
          homeownerEmail: projects.homeownerEmail,
          startDate: projects.startDate,
          estimatedEndDate: projects.estimatedEndDate,
          budget: projects.budget,
        })
        .from(projects)
        .where(
          and(
            eq(projects.companyId, companyId),
            inArray(projects.id, projectIds)
          )
        );
    }
  }

  // Get user's role in the selected company
  const userCompanyRole = (userCompanies.find(
    (uc) => uc.company.id === companyId
  )?.companyRole || "member") as "admin" | "project_manager" | "member";

  // Check if user can create projects (admin or project_manager)
  const canCreateProjects =
    permissions.systemRole === "super_admin" ||
    ["admin", "project_manager"].includes(userCompanyRole);

  return (
    <ProjectSelector
      user={{
        id: user.id,
        email: user.email || "",
        systemRole: permissions.systemRole,
      }}
      companies={userCompanies}
      selectedCompanyId={companyId}
      projects={userProjects}
      userCompanyRole={userCompanyRole}
      canCreateProjects={canCreateProjects}
    />
  );
}
