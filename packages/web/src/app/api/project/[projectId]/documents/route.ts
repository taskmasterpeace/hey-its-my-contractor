import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { documents, documentComments } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();

    const { name, description, type, storageKey, fileSize, mimeType } = body;

    // Validate required fields
    if (!name || !type || !storageKey) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, storageKey" },
        { status: 400 }
      );
    }

    // Insert document into database
    const [newDocument] = await db
      .insert(documents)
      .values({
        projectId,
        name,
        description: description || null,
        type,
        storageKey,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType: mimeType || null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Get documents for the project with comment counts
    const projectDocuments = await db
      .select({
        id: documents.id,
        project_id: documents.projectId,
        name: documents.name,
        description: documents.description,
        type: documents.type,
        version: documents.version,
        storage_key: documents.storageKey,
        file_size: documents.fileSize,
        mime_type: documents.mimeType,
        annotations: documents.annotations,
        linked_to: documents.linkedTo,
        expiration_date: documents.expirationDate,
        created_by: documents.createdBy,
        created_at: documents.createdAt,
        updated_at: documents.updatedAt,
        comment_count: count(documentComments.id),
      })
      .from(documents)
      .leftJoin(documentComments, eq(documents.id, documentComments.documentId))
      .where(eq(documents.projectId, projectId))
      .groupBy(documents.id)
      .orderBy(documents.createdAt);

    return NextResponse.json(projectDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
