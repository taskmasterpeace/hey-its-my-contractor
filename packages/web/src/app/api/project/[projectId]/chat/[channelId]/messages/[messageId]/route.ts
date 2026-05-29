import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { eq, and } from "drizzle-orm";

type Params = {
  params: Promise<{ projectId: string; channelId: string; messageId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId, messageId } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ userId: chatMessages.userId })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, messageId),
          eq(chatMessages.channelId, channelId)
        )
      )
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const [updated] = await db
      .update(chatMessages)
      .set({ content: content.trim(), editedAt: now, updatedAt: now })
      .where(eq(chatMessages.id, messageId))
      .returning();

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId, messageId } = await params;

    const [existing] = await db
      .select({ userId: chatMessages.userId })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.id, messageId),
          eq(chatMessages.channelId, channelId)
        )
      )
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
