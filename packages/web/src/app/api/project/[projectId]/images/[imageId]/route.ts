import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { imageLibrary } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: Update image privacy settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; imageId: string }> }
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

    const { projectId, imageId } = await params;
    const body = await request.json();
    const { isPrivate } = body;

    if (typeof isPrivate !== "boolean") {
      return NextResponse.json(
        { error: "isPrivate must be a boolean" },
        { status: 400 }
      );
    }

    // Update privacy setting - only the owner can change privacy
    const [updatedImage] = await db
      .update(imageLibrary)
      .set({
        isPrivate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imageLibrary.id, imageId),
          eq(imageLibrary.projectId, projectId),
          eq(imageLibrary.userId, user.id) // Only owner can update privacy
        )
      )
      .returning();

    if (!updatedImage) {
      return NextResponse.json(
        { error: "Image not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image: {
        id: updatedImage.id,
        isPrivate: updatedImage.isPrivate,
        updatedAt: updatedImage.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update image privacy error:", error);
    return NextResponse.json(
      {
        error: "Failed to update image privacy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete image (only owner can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; imageId: string }> }
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

    const { projectId, imageId } = await params;

    // Get image details first to get storage key
    const [imageToDelete] = await db
      .select()
      .from(imageLibrary)
      .where(
        and(
          eq(imageLibrary.id, imageId),
          eq(imageLibrary.projectId, projectId),
          eq(imageLibrary.userId, user.id) // Only owner can delete
        )
      );

    if (!imageToDelete) {
      return NextResponse.json(
        { error: "Image not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("contractor")
      .remove([imageToDelete.storageKey]);

    if (storageError) {
      console.warn("Failed to delete from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await db
      .delete(imageLibrary)
      .where(
        and(
          eq(imageLibrary.id, imageId),
          eq(imageLibrary.projectId, projectId),
          eq(imageLibrary.userId, user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
