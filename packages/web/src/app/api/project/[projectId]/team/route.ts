import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, projectUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserProjectRole, isSuperAdmin } from "@/lib/auth/permissions";

async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * GET /api/project/[projectId]/team
 * Get team members for a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Check if user has access to this project
    const isSuper = await isSuperAdmin(user.id);
    const userProjectRole = await getUserProjectRole(user.id, projectId);

    if (!isSuper && !userProjectRole) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have access to this project",
        },
        { status: 403 }
      );
    }

    // Get team members for this project
    const teamMembers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        projectRole: projectUsers.projectRole,
        joinedAt: projectUsers.assignedAt,
      })
      .from(projectUsers)
      .innerJoin(users, eq(projectUsers.userId, users.id))
      .where(eq(projectUsers.projectId, projectId));

    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error("Error fetching project team:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
