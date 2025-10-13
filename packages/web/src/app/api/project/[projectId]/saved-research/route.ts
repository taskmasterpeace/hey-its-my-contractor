import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { savedResearch } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
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

// GET - Retrieve saved research for a project
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

    // Get saved research for this project with privacy filtering
    // Show:
    // 1. All non-private research (shared with project members)
    // 2. Private research ONLY if created by the current user (even super admin can't see others' private research)
    const research = await db
      .select()
      .from(savedResearch)
      .where(
        and(
          eq(savedResearch.projectId, projectId),
          // Show non-private research OR private research owned by current user
          or(
            eq(savedResearch.isPrivate, false),
            and(
              eq(savedResearch.isPrivate, true),
              eq(savedResearch.userId, user.id)
            )
          )
        )
      )
      .orderBy(desc(savedResearch.createdAt));

    return NextResponse.json({
      success: true,
      data: research,
    });
  } catch (error) {
    console.error("Failed to fetch saved research:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch saved research",
      },
      { status: 500 }
    );
  }
}

// POST - Save new research
export async function POST(
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

    const {
      query,
      answer,
      sources,
      relatedQueries,
      title,
      tags,
      notes,
      confidence,
      isPrivate,
    } = await request.json();

    if (!query || !answer) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const [newResearch] = await db
      .insert(savedResearch)
      .values({
        userId: user.id, // Use authenticated user ID
        projectId,
        query,
        answer,
        sources: sources || [],
        relatedQueries: relatedQueries || [],
        title: title || query,
        tags: tags || [],
        notes,
        confidence: confidence?.toString() || "0.95",
        isPrivate: isPrivate || false, // Default to shared (false)
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newResearch,
    });
  } catch (error) {
    console.error("Failed to save research:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save research",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete saved research
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const researchId = searchParams.get("id");

    if (!projectId || !researchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID and Research ID are required",
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

    // Delete research (users can delete any research in projects they have access to)
    await db.delete(savedResearch).where(eq(savedResearch.id, researchId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete research:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete research",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update saved research privacy settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const researchId = searchParams.get("id");

    if (!projectId || !researchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID and Research ID are required",
        },
        { status: 400 }
      );
    }

    const { isPrivate } = await request.json();

    if (typeof isPrivate !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "isPrivate must be a boolean value",
        },
        { status: 400 }
      );
    }

    // Get the existing research to check ownership
    const existingResearch = await db
      .select()
      .from(savedResearch)
      .where(eq(savedResearch.id, researchId))
      .limit(1);

    if (existingResearch.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Research not found",
        },
        { status: 404 }
      );
    }

    const research = existingResearch[0];

    // Only allow the original creator to update privacy settings
    if (research.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only update your own research privacy settings",
        },
        { status: 403 }
      );
    }

    // Update the privacy setting
    await db
      .update(savedResearch)
      .set({
        isPrivate,
        updatedAt: new Date(),
      })
      .where(eq(savedResearch.id, researchId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to update research privacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update research privacy",
      },
      { status: 500 }
    );
  }
}
