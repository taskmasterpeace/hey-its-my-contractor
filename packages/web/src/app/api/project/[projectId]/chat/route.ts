import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { chatChannels, chatMessages } from "@/db/schema/chat";
import { projectUsers } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

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
      }))
    )
    .returning();

  return channels;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;

    let channels = await db
      .select()
      .from(chatChannels)
      .where(eq(chatChannels.projectId, projectId));

    if (channels.length === 0) {
      channels = await createDefaultChannels(projectId);
    }

    const latestMessages = await db
      .select()
      .from(chatMessages)
      .where(
        sql`${chatMessages.channelId} IN (${sql.join(
          channels.map((c) => sql`${c.id}`),
          sql`, `
        )})`
      )
      .orderBy(desc(chatMessages.createdAt));

    const latestByChannel = new Map<string, (typeof latestMessages)[0]>();
    for (const msg of latestMessages) {
      if (!latestByChannel.has(msg.channelId)) {
        latestByChannel.set(msg.channelId, msg);
      }
    }

    const channelsWithLatest = channels.map((channel) => ({
      ...channel,
      lastMessage: latestByChannel.get(channel.id) ?? null,
    }));

    return NextResponse.json({ channels: channelsWithLatest });
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
    const { name, type, participants } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const participantIds: string[] = participants ?? [];
    if (!participantIds.includes(user.id)) {
      participantIds.push(user.id);
    }

    const [channel] = await db
      .insert(chatChannels)
      .values({
        projectId,
        name,
        type: type ?? "project",
        participants: participantIds,
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
