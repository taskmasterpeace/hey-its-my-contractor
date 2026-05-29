import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  chatChannels,
  chatMessages,
  chatChannelReads,
} from "@/db/schema/chat";
import { eq, and, inArray, ne, isNull, or, gt, sql } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;

    const channels = await db
      .select({ id: chatChannels.id })
      .from(chatChannels)
      .where(eq(chatChannels.projectId, projectId));

    const channelIds = channels.map((c) => c.id);

    if (channelIds.length === 0) {
      return NextResponse.json({ unreadCount: 0, channelIds: [] });
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .leftJoin(
        chatChannelReads,
        and(
          eq(chatChannelReads.channelId, chatMessages.channelId),
          eq(chatChannelReads.userId, user.id)
        )
      )
      .where(
        and(
          inArray(chatMessages.channelId, channelIds),
          ne(chatMessages.userId, user.id),
          or(
            isNull(chatChannelReads.lastReadAt),
            gt(chatMessages.createdAt, chatChannelReads.lastReadAt)
          )
        )
      );

    return NextResponse.json({
      unreadCount: result[0]?.count ?? 0,
      channelIds,
    });
  } catch (error) {
    console.error("Error fetching unread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
