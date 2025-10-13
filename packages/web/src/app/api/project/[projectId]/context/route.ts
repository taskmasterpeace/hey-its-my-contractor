import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
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

// GET - Get project context for research
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

    // Check if user has access to this project
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

    // Fetch project context
    const [project] = await db
      .select({
        name: projects.name,
        address: projects.address,
        budget: projects.budget,
        startDate: projects.startDate,
        estimatedEndDate: projects.estimatedEndDate,
        metadata: projects.metadata,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    const timeline =
      project.startDate && project.estimatedEndDate
        ? `${project.startDate} to ${project.estimatedEndDate}`
        : project.startDate
        ? `Starting ${project.startDate}`
        : "Timeline not specified";

    const context = {
      name: project.name,
      address: project.address,
      budget: project.budget,
      timeline: timeline,
      formattedContext: `PROJECT CONTEXT:
- Project: ${project.name}
- Location: ${project.address}
- Budget: ${project.budget ? `$${project.budget}` : "Budget not specified"}
- Timeline: ${timeline}

Use this context to provide location-specific recommendations, budget-appropriate options, and timeline-conscious advice.`,
    };

    return NextResponse.json({
      success: true,
      data: context,
    });
  } catch (error) {
    console.error("Failed to fetch project context:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project context",
      },
      { status: 500 }
    );
  }
}

// PUT - Update project context
export async function PUT(
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

    // Check if user has access to this project
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

    const { name, address, budget, startDate, estimatedEndDate } =
      await request.json();

    // Update project with new context
    await db
      .update(projects)
      .set({
        name: name || undefined,
        address: address || undefined,
        budget: budget || undefined,
        startDate: startDate || undefined,
        estimatedEndDate: estimatedEndDate || undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // Return updated context
    const [updatedProject] = await db
      .select({
        name: projects.name,
        address: projects.address,
        budget: projects.budget,
        startDate: projects.startDate,
        estimatedEndDate: projects.estimatedEndDate,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const timeline =
      updatedProject.startDate && updatedProject.estimatedEndDate
        ? `${updatedProject.startDate} to ${updatedProject.estimatedEndDate}`
        : updatedProject.startDate
        ? `Starting ${updatedProject.startDate}`
        : "Timeline not specified";

    const context = {
      name: updatedProject.name,
      address: updatedProject.address,
      budget: updatedProject.budget,
      timeline: timeline,
      formattedContext: `PROJECT CONTEXT:
- Project: ${updatedProject.name}
- Location: ${updatedProject.address}
- Budget: ${
        updatedProject.budget
          ? `$${updatedProject.budget}`
          : "Budget not specified"
      }
- Timeline: ${timeline}

Use this context to provide location-specific recommendations, budget-appropriate options, and timeline-conscious advice.`,
    };

    return NextResponse.json({
      success: true,
      data: context,
    });
  } catch (error) {
    console.error("Failed to update project context:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project context",
      },
      { status: 500 }
    );
  }
}
