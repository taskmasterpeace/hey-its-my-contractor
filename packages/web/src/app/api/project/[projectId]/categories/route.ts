import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  imageLibraryCategories,
  projectUsers,
  companyUsers,
  projects,
} from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// GET: Fetch project-scoped categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Validate user has access to this project
    const projectAccess = await db
      .select({ projectId: projects.id })
      .from(projects)
      .leftJoin(projectUsers, eq(projectUsers.projectId, projects.id))
      .leftJoin(companyUsers, eq(companyUsers.companyId, projects.companyId))
      .where(
        and(
          eq(projects.id, projectId),
          or(eq(projectUsers.userId, user.id), eq(companyUsers.userId, user.id))
        )
      )
      .limit(1);

    if (projectAccess.length === 0) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Fetch categories for this project (project-scoped, shared among all project members)
    const categories = await db
      .select({
        id: imageLibraryCategories.id,
        name: imageLibraryCategories.name,
        description: imageLibraryCategories.description,
        color: imageLibraryCategories.color,
        createdAt: imageLibraryCategories.createdAt,
      })
      .from(imageLibraryCategories)
      .where(eq(imageLibraryCategories.projectId, projectId))
      .orderBy(imageLibraryCategories.createdAt);

    return NextResponse.json({
      success: true,
      categories,
      projectId,
    });
  } catch (error) {
    console.error("Fetch project categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create project-scoped category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { name, description, color = "#3B82F6" } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Validate user has access to this project
    const projectAccess = await db
      .select({ projectId: projects.id })
      .from(projects)
      .leftJoin(projectUsers, eq(projectUsers.projectId, projects.id))
      .leftJoin(companyUsers, eq(companyUsers.companyId, projects.companyId))
      .where(
        and(
          eq(projects.id, projectId),
          or(eq(projectUsers.userId, user.id), eq(companyUsers.userId, user.id))
        )
      )
      .limit(1);

    if (projectAccess.length === 0) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Create new category for this project (project-scoped, shared among all project members)
    const [newCategory] = await db
      .insert(imageLibraryCategories)
      .values({
        userId: user.id,
        projectId: projectId,
        name: name.trim(),
        description: description || `Category for project ${projectId}`,
        color,
      })
      .returning();

    return NextResponse.json({
      success: true,
      category: {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        createdAt: newCategory.createdAt,
      },
      projectId,
    });
  } catch (error) {
    console.error("Create project category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
