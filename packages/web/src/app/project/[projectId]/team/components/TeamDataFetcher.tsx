import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserProjectRole, isSuperAdmin } from "@/lib/auth/permissions";
import { ProjectTeamManagement } from "@/components/team/ProjectTeamManagement";

interface TeamDataFetcherProps {
  projectId: string;
}

export async function TeamDataFetcher({ projectId }: TeamDataFetcherProps) {
  // Handle authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check user access
  const isSuper = await isSuperAdmin(user.id);
  const userProjectRole = await getUserProjectRole(user.id, projectId);

  if (!isSuper && !userProjectRole) {
    redirect("/dashboard?error=no-project-access");
  }

  // Get project details
  const projectData = await db
    .select({
      id: projects.id,
      name: projects.name,
      address: projects.address,
      companyId: projects.companyId,
      homeownerName: projects.homeownerName,
      homeownerEmail: projects.homeownerEmail,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectData[0];

  if (!project) {
    redirect("/dashboard?error=project-not-found");
  }

  // Get user info
  const userData = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      systemRole: users.systemRole,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const userRecord = userData[0];

  if (!userRecord) {
    redirect("/login");
  }

  // Check if user can invite others to this project
  const canInviteToProject =
    isSuper ||
    userProjectRole === "project_manager" ||
    userProjectRole === "contractor";

  return (
    <div className="p-6">
      <ProjectTeamManagement
        currentUser={{
          id: userRecord.id,
          projectRole: userProjectRole || "contractor",
          fullName: userRecord.fullName,
          email: userRecord.email,
        }}
        project={project}
        canInviteToProject={canInviteToProject}
      />
    </div>
  );
}
