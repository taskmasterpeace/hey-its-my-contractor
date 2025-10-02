import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users, projects, projectUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasCompanyPermission } from "@/lib/auth/permissions";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
  companyId: z.string().uuid("Invalid company ID"),
  homeownerName: z.string().optional(),
  homeownerEmail: z.string().email().optional().or(z.literal("")),
  budget: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  estimatedEndDate: z.string().optional().or(z.literal("")),
});

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
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // 🔒 SECURITY: Check if user can create projects in this company
    const canCreate = await hasCompanyPermission(
      user.id,
      validatedData.companyId,
      ["admin", "project_manager"]
    );

    if (!canCreate) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to create projects in this company",
        },
        { status: 403 }
      );
    }

    // Create the project
    const [newProject] = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        address: validatedData.address,
        description: validatedData.description || null,
        companyId: validatedData.companyId,
        homeownerName: validatedData.homeownerName || null,
        homeownerEmail: validatedData.homeownerEmail || null,
        budget: validatedData.budget ? validatedData.budget : null,
        startDate: validatedData.startDate || null,
        estimatedEndDate: validatedData.estimatedEndDate || null,
        status: "active",
        createdBy: user.id,
      })
      .returning();

    // Assign the creator as project manager
    await db.insert(projectUsers).values({
      projectId: newProject.id,
      userId: user.id,
      projectRole: "project_manager",
    });

    // If homeowner email is provided, invite them to the project
    if (validatedData.homeownerEmail && validatedData.homeownerEmail.trim()) {
      // TODO: Create invitation for homeowner
      console.log(
        "TODO: Create homeowner invitation for",
        validatedData.homeownerEmail
      );
    }

    return NextResponse.json({
      success: true,
      data: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project data",
          details: error.issues,
        },
        { status: 400 }
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
