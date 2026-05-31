import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { chatChannels } from "@/db/schema/chat";
import { eq, and } from "drizzle-orm";

type Params = {
  params: Promise<{ projectId: string; channelId: string }>;
};

async function loadChannel(channelId: string, projectId: string) {
  const [channel] = await db
    .select()
    .from(chatChannels)
    .where(
      and(eq(chatChannels.id, channelId), eq(chatChannels.projectId, projectId))
    )
    .limit(1);
  return channel ?? null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, channelId } = await params;
    const channel = await loadChannel(channelId, projectId);
    if (!channel)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (channel.type === "project") {
      return NextResponse.json(
        { error: "The project channel cannot be edited" },
        { status: 400 }
      );
    }
    if (channel.type === "direct") {
      return NextResponse.json(
        { error: "Direct messages cannot be edited" },
        { status: 400 }
      );
    }
    // group
    if (channel.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Only the group creator can change this" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: { name?: string; participants?: string[]; updatedAt?: Date } =
      {};

    if (typeof body.name === "string") {
      const trimmed = body.name.trim();
      if (!trimmed)
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      updates.name = trimmed;
    }

    if (Array.isArray(body.participants)) {
      const set = new Set<string>(body.participants);
      // Creator is always a member.
      set.add(user.id);
      updates.participants = Array.from(set);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ channel });
    }

    updates.updatedAt = new Date();
    const [updated] = await db
      .update(chatChannels)
      .set(updates)
      .where(eq(chatChannels.id, channelId))
      .returning();

    return NextResponse.json({ channel: updated });
  } catch (error) {
    console.error("Error patching channel:", error);
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

    const { projectId, channelId } = await params;
    const channel = await loadChannel(channelId, projectId);
    if (!channel)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (channel.type === "project") {
      return NextResponse.json(
        { error: "The project channel cannot be deleted" },
        { status: 400 }
      );
    }
    if (channel.type === "group" && channel.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Only the group creator can delete this" },
        { status: 403 }
      );
    }
    // 'direct' channels: either participant can delete (they're equal owners).
    if (channel.type === "direct") {
      const isMember = (channel.participants ?? []).includes(user.id);
      if (!isMember)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(chatChannels).where(eq(chatChannels.id, channelId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
