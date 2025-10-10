import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { documentComments, documents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/documents/[id]/comments - Get all comments for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // Get the current user for authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify document exists and user has access
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Get comments with user information
    const comments = await db
      .select({
        id: documentComments.id,
        content: documentComments.content,
        created_at: documentComments.createdAt,
        updated_at: documentComments.updatedAt,
        user: {
          id: users.id,
          full_name: users.fullName,
          email: users.email,
          avatar_url: users.avatarUrl,
        },
      })
      .from(documentComments)
      .leftJoin(users, eq(documentComments.userId, users.id))
      .where(eq(documentComments.documentId, id))
      .orderBy(desc(documentComments.createdAt));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST /api/documents/[id]/comments - Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // Get the current user for authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify document exists
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Get comment content from request body
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return new NextResponse("Comment content is required", { status: 400 });
    }

    // Insert new comment
    const [newComment] = await db
      .insert(documentComments)
      .values({
        documentId: id,
        userId: user.id,
        content: content.trim(),
      })
      .returning();

    // Get the comment with user information
    const [commentWithUser] = await db
      .select({
        id: documentComments.id,
        content: documentComments.content,
        created_at: documentComments.createdAt,
        updated_at: documentComments.updatedAt,
        user: {
          id: users.id,
          full_name: users.fullName,
          email: users.email,
          avatar_url: users.avatarUrl,
        },
      })
      .from(documentComments)
      .leftJoin(users, eq(documentComments.userId, users.id))
      .where(eq(documentComments.id, newComment.id));

    return NextResponse.json(commentWithUser);
  } catch (error) {
    console.error("Error creating comment:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
