import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, projects, projectUsers, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserProjectRole, isSuperAdmin } from "@/lib/auth/permissions";
import { ProjectWorkspaceLayout } from "@/components/layout/ProjectWorkspaceLayout";

interface ProjectLayoutDataFetcherProps {
  children: React.ReactNode;
  projectId: string;
}

export async function ProjectLayoutDataFetcher({
  children,
  projectId,
}: ProjectLayoutDataFetcherProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has access to this project
  const isSuper = await isSuperAdmin(user.id);
  const userProjectRole = await getUserProjectRole(user.id, projectId);

  if (!isSuper && !userProjectRole) {
    redirect("/dashboard?error=no-project-access");
  }

  // Get current user's full name from database
  const currentUserData = await db
    .select({
      fullName: users.fullName,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const currentUser = currentUserData[0];

  // Get project details with company info
  const projectData = await db
    .select({
      id: projects.id,
      name: projects.name,
      address: projects.address,
      status: projects.status,
      companyId: projects.companyId,
      homeownerName: projects.homeownerName,
      homeownerEmail: projects.homeownerEmail,
      companyName: companies.name,
      logoUrl: companies.logoUrl,
    })
    .from(projects)
    .innerJoin(companies, eq(projects.companyId, companies.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectData[0];

  if (!project) {
    redirect("/dashboard?error=project-not-found");
  }

  return (
    <ProjectWorkspaceLayout
      project={project}
      userRole={userProjectRole || "contractor"}
      user={{
        id: user.id,
        email: user.email || "",
        fullName:
          currentUser?.fullName || user.user_metadata?.full_name || null,
      }}
    >
      {children}
    </ProjectWorkspaceLayout>
  );
}
