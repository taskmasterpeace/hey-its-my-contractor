import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  users,
  companies,
  companyUsers,
  companySubscriptions,
  projectUsers,
  projects,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
 * GET /api/team?companyId=xxx
 * Get team members for a company
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const userMembership = await db
      .select()
      .from(companyUsers)
      .where(
        and(
          eq(companyUsers.userId, user.id),
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true)
        )
      )
      .limit(1);

    if (!userMembership.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied to this company",
        },
        { status: 403 }
      );
    }

    // Get all company members with their details
    const teamMembers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        systemRole: users.systemRole,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        companyRole: companyUsers.companyRole,
        joinedAt: companyUsers.joinedAt,
      })
      .from(companyUsers)
      .innerJoin(users, eq(companyUsers.userId, users.id))
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true)
        )
      );

    // Get project assignments for team members
    const teamMembersWithProjects = await Promise.all(
      teamMembers.map(async (member) => {
        const projectAssignments = await db
          .select({
            projectId: projects.id,
            projectName: projects.name,
            projectRole: projectUsers.projectRole,
          })
          .from(projectUsers)
          .innerJoin(projects, eq(projectUsers.projectId, projects.id))
          .where(
            and(
              eq(projectUsers.userId, member.id),
              eq(projects.companyId, companyId)
            )
          );

        return {
          ...member,
          projects: projectAssignments,
        };
      })
    );

    // Get subscription info for this company
    const subscription = await db
      .select({
        maxSeats: companySubscriptions.maxSeats,
        usedSeats: companySubscriptions.usedSeats,
        plan: companySubscriptions.plan,
        status: companySubscriptions.status,
      })
      .from(companySubscriptions)
      .where(eq(companySubscriptions.companyId, companyId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: teamMembersWithProjects,
      subscription: subscription[0] || null,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.message === "Authentication required" ? 401 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
