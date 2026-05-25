import { NextResponse } from "next/server";
import { db } from "@/db";
import { transcripts } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; meetingId: string }> }
) {
  const { meetingId } = await params;

  const rows = await db
    .select({
      text: transcripts.text,
      segments: transcripts.segments,
      summary: transcripts.summary,
      actionItems: transcripts.actionItems,
    })
    .from(transcripts)
    .where(eq(transcripts.meetingId, meetingId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ transcript: null });
  }

  return NextResponse.json({ transcript: rows[0] });
}
