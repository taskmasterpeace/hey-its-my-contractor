import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { chatChannelReads } from "@/db/schema/chat";
import { eq } from "drizzle-orm";

type Params = {
  params: Promise<{ projectId: string; channelId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await params;

    const reads = await db
      .select({
        userId: chatChannelReads.userId,
        lastReadAt: chatChannelReads.lastReadAt,
      })
      .from(chatChannelReads)
      .where(eq(chatChannelReads.channelId, channelId));

    return NextResponse.json({ reads });
  } catch (error) {
    console.error("Error fetching reads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await params;
    const now = new Date();

    const [read] = await db
      .insert(chatChannelReads)
      .values({
        channelId,
        userId: user.id,
        lastReadAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [chatChannelReads.channelId, chatChannelReads.userId],
        set: { lastReadAt: now, updatedAt: now },
      })
      .returning();

    return NextResponse.json({ read });
  } catch (error: unknown) {
    // Race: channel was deleted between the client deciding to mark-read and
    // this POST landing. The read marker is meaningless now — return quietly.
    const cause = (error as { cause?: { code?: string } })?.cause;
    if (cause?.code === "23503") {
      return NextResponse.json({ ok: true, skipped: "channel_gone" });
    }
    console.error("Error marking channel read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
