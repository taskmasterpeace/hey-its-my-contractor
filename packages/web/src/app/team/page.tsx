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
import { eq, and } from "drizzle-orm";
import { TeamManagement } from "@/components/team/TeamManagement";

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's system role and company memberships
  const userData = await db
    .select({
      id: users.id,
      systemRole: users.systemRole,
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const userRecord = userData[0];

  if (!userRecord) {
    redirect("/error");
  }

  // Only project managers and contractors should access team management
  if (!["project_manager", "contractor"].includes(userRecord.systemRole)) {
    redirect("/dashboard"); // Redirect homeowners and others to dashboard
  }

  // Get user's company memberships
  const userCompanies = await db
    .select({
      company: {
        id: companies.id,
        name: companies.name,
      },
      companyRole: companyUsers.companyRole,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.userId, user.id));

  // Get user's projects (for contractors)
  const userProjects = await db
    .select({
      project: {
        id: projects.id,
        name: projects.name,
        address: projects.address,
      },
      projectRole: projectUsers.projectRole,
    })
    .from(projectUsers)
    .innerJoin(projects, eq(projectUsers.projectId, projects.id))
    .where(eq(projectUsers.userId, user.id));

  // Determine what the user can do based on their role
  const canInviteContractors =
    userRecord.systemRole === "project_manager" ||
    userCompanies.some(
      (c) => c.companyRole === "admin" || c.companyRole === "project_manager"
    );

  const canInviteHomeowners =
    userRecord.systemRole === "contractor" ||
    userProjects.some((p) => p.projectRole === "contractor");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamManagement
          currentUser={{
            id: userRecord.id,
            systemRole: userRecord.systemRole as
              | "project_manager"
              | "contractor",
            fullName: userRecord.fullName,
            email: userRecord.email,
          }}
          companies={userCompanies}
          projects={userProjects}
          canInviteContractors={canInviteContractors}
          canInviteHomeowners={canInviteHomeowners}
        />
      </div>
    </div>
  );
}
