import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  chatChannels,
  chatMessages,
  chatChannelReads,
} from "@/db/schema/chat";
import { projectUsers } from "@/db/schema";
import { eq, desc, and, or, ne, isNull, gt, sql, inArray } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string }> };

const DEFAULT_CHANNELS = [
  { name: "General", type: "project" },
] as const;

async function getProjectParticipantIds(projectId: string): Promise<string[]> {
  const members = await db
    .select({ userId: projectUsers.userId })
    .from(projectUsers)
    .where(eq(projectUsers.projectId, projectId));

  return members.map((m) => m.userId);
}

async function createDefaultChannels(projectId: string) {
  const participantIds = await getProjectParticipantIds(projectId);

  const channels = await db
    .insert(chatChannels)
    .values(
      DEFAULT_CHANNELS.map((ch) => ({
        projectId,
        name: ch.name,
        type: ch.type,
        participants: participantIds,
        // Project default channel has no individual creator.
        createdBy: null,
      }))
    )
    .returning();

  return channels;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;

    let allChannels = await db
      .select()
      .from(chatChannels)
      .where(eq(chatChannels.projectId, projectId));

    if (allChannels.length === 0) {
      allChannels = await createDefaultChannels(projectId);
    }

    // Visibility rule: 'project' channels visible to all project members;
    // 'group' / 'direct' channels visible only to listed participants.
    const channels = allChannels.filter((c) => {
      if (c.type === "project") return true;
      return (c.participants ?? []).includes(user.id);
    });

    if (channels.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    const channelIds = channels.map((c) => c.id);

    // Pull every message in these channels once, then take the latest per channel.
    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(inArray(chatMessages.channelId, channelIds))
      .orderBy(desc(chatMessages.createdAt));

    const latestByChannel = new Map<string, (typeof allMessages)[0]>();
    for (const msg of allMessages) {
      if (!latestByChannel.has(msg.channelId)) {
        latestByChannel.set(msg.channelId, msg);
      }
    }

    // Per-channel unread for the current user.
    const unreadRows = await db
      .select({
        channelId: chatMessages.channelId,
        count: sql<number>`count(*)::int`,
      })
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
      )
      .groupBy(chatMessages.channelId);

    const unreadByChannel = new Map<string, number>();
    for (const r of unreadRows) {
      unreadByChannel.set(r.channelId, r.count);
    }

    const channelsWithMeta = channels.map((channel) => ({
      ...channel,
      lastMessage: latestByChannel.get(channel.id) ?? null,
      unreadCount: unreadByChannel.get(channel.id) ?? 0,
    }));

    // Sort: pinned project channels first, then by last-activity desc.
    channelsWithMeta.sort((a, b) => {
      if (a.type === "project" && b.type !== "project") return -1;
      if (b.type === "project" && a.type !== "project") return 1;
      const at = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime();
      const bt = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.updatedAt).getTime();
      return bt - at;
    });

    return NextResponse.json({ channels: channelsWithMeta });
  } catch (error) {
    console.error("Error fetching chat channels:", error);
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

    const { projectId } = await params;
    const body = await request.json();
    const type: "project" | "group" | "direct" = body.type ?? "group";
    const requestedName: string | undefined = body.name;
    const requestedParticipants: string[] = Array.isArray(body.participants)
      ? body.participants
      : [];

    // Always include the creator.
    const participantSet = new Set<string>(requestedParticipants);
    participantSet.add(user.id);
    const participants = Array.from(participantSet);

    if (type === "direct") {
      if (participants.length !== 2) {
        return NextResponse.json(
          { error: "Direct messages must have exactly two participants" },
          { status: 400 }
        );
      }

      // Dedupe: find an existing DM with the same 2-participant set in this project.
      const existing = await db
        .select()
        .from(chatChannels)
        .where(
          and(
            eq(chatChannels.projectId, projectId),
            eq(chatChannels.type, "direct")
          )
        );

      const sorted = [...participants].sort();
      const match = existing.find((c) => {
        const cs = [...(c.participants ?? [])].sort();
        return cs.length === 2 && cs[0] === sorted[0] && cs[1] === sorted[1];
      });
      if (match) {
        return NextResponse.json({ channel: match }, { status: 200 });
      }

      const [channel] = await db
        .insert(chatChannels)
        .values({
          projectId,
          name: "",
          type: "direct",
          participants,
          createdBy: user.id,
        })
        .returning();

      return NextResponse.json({ channel }, { status: 201 });
    }

    // group / project
    if (!requestedName || !requestedName.trim()) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }
    if (type === "group" && participants.length < 2) {
      return NextResponse.json(
        { error: "A group needs at least one other person" },
        { status: 400 }
      );
    }

    const [channel] = await db
      .insert(chatChannels)
      .values({
        projectId,
        name: requestedName.trim(),
        type,
        participants,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
