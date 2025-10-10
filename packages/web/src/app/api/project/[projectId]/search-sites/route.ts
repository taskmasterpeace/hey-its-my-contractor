import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projectSearchSites } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/project/[projectId]/search-sites
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Get all custom search sites for this project
    const searchSites = await db
      .select()
      .from(projectSearchSites)
      .where(eq(projectSearchSites.projectId, projectId));

    return NextResponse.json({
      success: true,
      searchSites,
    });
  } catch (error) {
    console.error("Error fetching project search sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch search sites" },
      { status: 500 }
    );
  }
}

// POST /api/project/[projectId]/search-sites
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { siteDomain, displayName, description } = body;

    // Validate required fields
    if (!siteDomain || !displayName) {
      return NextResponse.json(
        { error: "siteDomain and displayName are required" },
        { status: 400 }
      );
    }

    // Check if site already exists for this project
    const existing = await db
      .select()
      .from(projectSearchSites)
      .where(
        and(
          eq(projectSearchSites.projectId, projectId),
          eq(projectSearchSites.siteDomain, siteDomain)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Search site already exists for this project" },
        { status: 409 }
      );
    }

    // Create new search site
    const [newSearchSite] = await db
      .insert(projectSearchSites)
      .values({
        projectId,
        userId: user.id,
        siteDomain,
        displayName,
        description,
      })
      .returning();

    return NextResponse.json({
      success: true,
      searchSite: newSearchSite,
    });
  } catch (error) {
    console.error("Error creating project search site:", error);
    return NextResponse.json(
      { error: "Failed to create search site" },
      { status: 500 }
    );
  }
}

// DELETE /api/project/[projectId]/search-sites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const siteDomain = searchParams.get("siteDomain");

    if (!siteDomain) {
      return NextResponse.json(
        { error: "siteDomain parameter is required" },
        { status: 400 }
      );
    }

    // Delete the search site
    const deleted = await db
      .delete(projectSearchSites)
      .where(
        and(
          eq(projectSearchSites.projectId, projectId),
          eq(projectSearchSites.siteDomain, siteDomain)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Search site not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: deleted[0],
    });
  } catch (error) {
    console.error("Error deleting project search site:", error);
    return NextResponse.json(
      { error: "Failed to delete search site" },
      { status: 500 }
    );
  }
}
