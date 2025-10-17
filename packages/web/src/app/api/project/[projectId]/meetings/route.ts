import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";

/**
 * GET /api/project/[projectId]/meetings
 * Fetch all meetings for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Get userId and status filter from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statusFilter = searchParams.get('status');

    // Fetch meetings for the project
    const projectMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.projectId, projectId));

    // Filter meetings by status if specified
    const filteredMeetings = statusFilter
      ? projectMeetings.filter(meeting => meeting.status === statusFilter)
      : projectMeetings;

    // Filter by user if specified (check if user is in participants)
    // If participants array is empty or null, show all meetings (backward compatibility)
    const userFilteredMeetings = userId
      ? filteredMeetings.filter(meeting => {
          // If no participants defined or empty array, include the meeting
          if (!meeting.participants || meeting.participants.length === 0) {
            return true;
          }
          // Otherwise, check if user is in participants
          return meeting.participants.includes(userId);
        })
      : filteredMeetings;

    // Transform meetings to match expected types
    const meetingsWithTranscripts = userFilteredMeetings.map((meeting) => {
      // Transform camelCase DB fields to snake_case for type compatibility
      return {
        id: meeting.id,
        project_id: meeting.projectId,
        user_id: meeting.userId,
        title: meeting.title,
        starts_at: meeting.startsAt.toISOString(),
        ends_at: meeting.endsAt?.toISOString() || null,
        type: meeting.type,
        participants: meeting.participants || [],
        external_provider: meeting.externalProvider,
        recording_url: meeting.recordingUrl,
        consent_given: meeting.consentGiven || false,
        status: meeting.status,
        tags: meeting.tags || [],
        transcript: meeting.transcript || "",
        created_at: meeting.createdAt.toISOString(),
        updated_at: meeting.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: meetingsWithTranscripts,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
