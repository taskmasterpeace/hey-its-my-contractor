import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { imageLibraryCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Fetch user's categories
export async function GET(request: NextRequest) {
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

    const categories = await db
      .select()
      .from(imageLibraryCategories)
      .where(eq(imageLibraryCategories.userId, user.id))
      .orderBy(imageLibraryCategories.name);

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, color = "#3B82F6" } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const [newCategory] = await db
      .insert(imageLibraryCategories)
      .values({
        userId: user.id,
        name: name.trim(),
        description: description?.trim(),
        color,
      })
      .returning();

    return NextResponse.json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
