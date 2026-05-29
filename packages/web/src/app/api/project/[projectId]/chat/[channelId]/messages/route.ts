import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { users } from "@/db/schema";
import { eq, asc, lt, and } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string; channelId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const before = searchParams.get("before");

    const conditions = [eq(chatMessages.channelId, channelId)];
    if (before) {
      conditions.push(lt(chatMessages.createdAt, new Date(before)));
    }

    const messages = await db
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        type: chatMessages.type,
        attachments: chatMessages.attachments,
        replyTo: chatMessages.replyTo,
        createdAt: chatMessages.createdAt,
        editedAt: chatMessages.editedAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await params;
    const { content, type, replyTo, attachments } = await request.json();

    const safeContent = typeof content === "string" ? content.trim() : "";
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    if (!safeContent && safeAttachments.length === 0) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 }
      );
    }

    const inferredType =
      type ?? (safeAttachments.length > 0 ? "file" : "text");

    const [message] = await db
      .insert(chatMessages)
      .values({
        channelId,
        userId: user.id,
        content: safeContent,
        type: inferredType,
        attachments: safeAttachments,
        replyTo: replyTo ?? null,
      })
      .returning();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
