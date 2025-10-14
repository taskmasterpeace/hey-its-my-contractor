import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH: Update document privacy settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
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

    const { projectId, documentId } = await params;
    const body = await request.json();
    const { isPrivate } = body;

    if (typeof isPrivate !== "boolean") {
      return NextResponse.json(
        { error: "isPrivate must be a boolean" },
        { status: 400 }
      );
    }

    // Update privacy setting - only the owner can change privacy
    const [updatedDocument] = await db
      .update(documents)
      .set({
        isPrivate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.projectId, projectId),
          eq(documents.createdBy, user.id) // Only owner can update privacy
        )
      )
      .returning();

    if (!updatedDocument) {
      return NextResponse.json(
        {
          error: "Document not found or you don't have permission to update it",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        isPrivate: updatedDocument.isPrivate,
        updatedAt: updatedDocument.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update document privacy error:", error);
    return NextResponse.json(
      {
        error: "Failed to update document privacy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete document (only owner can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; documentId: string }> }
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

    const { projectId, documentId } = await params;

    // Get document details first to get storage key
    const [documentToDelete] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.projectId, projectId),
          eq(documents.createdBy, user.id) // Only owner can delete
        )
      );

    if (!documentToDelete) {
      return NextResponse.json(
        {
          error: "Document not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("contractor")
      .remove([documentToDelete.storageKey]);

    if (storageError) {
      console.warn("Failed to delete from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await db
      .delete(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.projectId, projectId),
          eq(documents.createdBy, user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
