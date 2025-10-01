import { db } from "@/db";
import { companyUsers, projectUsers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type SystemRole =
  | "super_admin"
  | "project_manager"
  | "contractor"
  | "homeowner";
export type CompanyRole = "admin" | "project_manager" | "member";
export type ProjectRole = "project_manager" | "contractor" | "homeowner";

export interface UserPermissions {
  userId: string;
  systemRole: SystemRole;
  companyPermissions: Array<{
    companyId: string;
    role: CompanyRole;
  }>;
  projectPermissions: Array<{
    projectId: string;
    role: ProjectRole;
  }>;
}

/**
 * Get all permissions for a user across companies and projects
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissions> {
  // Get user's system role (only super_admin should have global privileges)
  const userData = await db
    .select({ systemRole: users.systemRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const systemRole = userData[0]?.systemRole || "homeowner";

  // Get company-scoped permissions
  const companyPermissions = await db
    .select({
      companyId: companyUsers.companyId,
      role: companyUsers.companyRole,
    })
    .from(companyUsers)
    .where(
      and(eq(companyUsers.userId, userId), eq(companyUsers.isActive, true))
    );

  // Get project-scoped permissions
  const projectPermissions = await db
    .select({
      projectId: projectUsers.projectId,
      role: projectUsers.projectRole,
    })
    .from(projectUsers)
    .where(eq(projectUsers.userId, userId));

  return {
    userId,
    systemRole,
    companyPermissions,
    projectPermissions,
  };
}

/**
 * Check if user has permission to perform action in a company context
 */
export async function hasCompanyPermission(
  userId: string,
  companyId: string,
  requiredRole: CompanyRole | CompanyRole[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);

  // Super admin has all permissions
  if (permissions.systemRole === "super_admin") {
    return true;
  }

  // Check company-scoped permission
  const companyPermission = permissions.companyPermissions.find(
    (cp) => cp.companyId === companyId
  );

  if (!companyPermission) {
    return false;
  }

  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  return requiredRoles.includes(companyPermission.role);
}

/**
 * Check if user has permission to perform action in a project context
 */
export async function hasProjectPermission(
  userId: string,
  projectId: string,
  requiredRole: ProjectRole | ProjectRole[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);

  // Super admin has all permissions
  if (permissions.systemRole === "super_admin") {
    return true;
  }

  // Check project-scoped permission
  const projectPermission = permissions.projectPermissions.find(
    (pp) => pp.projectId === projectId
  );

  if (!projectPermission) {
    return false;
  }

  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  return requiredRoles.includes(projectPermission.role);
}

/**
 * Check if user can invite others to a company
 */
export async function canInviteToCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  return hasCompanyPermission(userId, companyId, ["admin", "project_manager"]);
}

/**
 * Check if user can manage a project
 */
export async function canManageProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  return hasProjectPermission(userId, projectId, "project_manager");
}

/**
 * Check if user is super admin (global system access)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const userData = await db
    .select({ systemRole: users.systemRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return userData[0]?.systemRole === "super_admin";
}

/**
 * Get user's role in a specific company
 */
export async function getUserCompanyRole(
  userId: string,
  companyId: string
): Promise<CompanyRole | null> {
  const permissions = await getUserPermissions(userId);

  const companyPermission = permissions.companyPermissions.find(
    (cp) => cp.companyId === companyId
  );

  return companyPermission?.role || null;
}

/**
 * Get user's role in a specific project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const permissions = await getUserPermissions(userId);

  const projectPermission = permissions.projectPermissions.find(
    (pp) => pp.projectId === projectId
  );

  return projectPermission?.role || null;
}

/**
 * Get all companies where user has specified role(s)
 */
export async function getUserCompanies(
  userId: string,
  roles?: CompanyRole[]
): Promise<string[]> {
  const permissions = await getUserPermissions(userId);

  if (permissions.systemRole === "super_admin") {
    // Super admin sees all companies - you might want to fetch all company IDs here
    return [];
  }

  let companyPermissions = permissions.companyPermissions;

  if (roles) {
    companyPermissions = companyPermissions.filter((cp) =>
      roles.includes(cp.role)
    );
  }

  return companyPermissions.map((cp) => cp.companyId);
}

/**
 * Get all projects where user has specified role(s)
 */
export async function getUserProjects(
  userId: string,
  roles?: ProjectRole[]
): Promise<string[]> {
  const permissions = await getUserPermissions(userId);

  if (permissions.systemRole === "super_admin") {
    // Super admin sees all projects - you might want to fetch all project IDs here
    return [];
  }

  let projectPermissions = permissions.projectPermissions;

  if (roles) {
    projectPermissions = projectPermissions.filter((pp) =>
      roles.includes(pp.role)
    );
  }

  return projectPermissions.map((pp) => pp.projectId);
}
