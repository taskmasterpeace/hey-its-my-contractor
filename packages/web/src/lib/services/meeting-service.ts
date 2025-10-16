import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetings, transcripts } from "@/db/schema/meetings";
import { Meeting } from "@contractor-platform/types";

export class MeetingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "MeetingError";
  }
}

export class MeetingService {
  /**
   * Get all meetings for a project with transcripts
   */
  static async getMeetingsForProject(projectId: string): Promise<Meeting[]> {
    if (!projectId) {
      throw new MeetingError(
        "Project ID is required",
        "PROJECT_ID_REQUIRED",
        400
      );
    }

    try {
      // Fetch meetings for the project
      const projectMeetings = await db
        .select()
        .from(meetings)
        .where(eq(meetings.projectId, projectId));

      // Fetch transcripts for these meetings and transform to match expected types
      const meetingsWithTranscripts = await Promise.all(
        projectMeetings.map(async (meeting) => {
          const meetingTranscripts = await db
            .select()
            .from(transcripts)
            .where(eq(transcripts.meetingId, meeting.id));

          const transcript = meetingTranscripts[0];

          // Transform camelCase DB fields to snake_case for type compatibility
          return {
            id: meeting.id,
            project_id: meeting.projectId,
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
            transcript: transcript?.text || "",
            created_at: meeting.createdAt.toISOString(),
            updated_at: meeting.updatedAt.toISOString(),
          } as Meeting;
        })
      );

      return meetingsWithTranscripts;
    } catch (error) {
      console.error("Error fetching meetings:", error);
      throw new MeetingError(
        "Failed to fetch meetings",
        "FETCH_MEETINGS_FAILED",
        500
      );
    }
  }

  /**
   * Get a single meeting by ID with transcript
   */
  static async getMeetingById(meetingId: string): Promise<Meeting | null> {
    if (!meetingId) {
      throw new MeetingError("Meeting ID is required", "MEETING_ID_REQUIRED", 400);
    }

    try {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingId))
        .limit(1);

      if (!meeting) {
        return null;
      }

      // Fetch transcript
      const meetingTranscripts = await db
        .select()
        .from(transcripts)
        .where(eq(transcripts.meetingId, meeting.id));

      const transcript = meetingTranscripts[0];

      // Transform camelCase DB fields to snake_case for type compatibility
      return {
        id: meeting.id,
        project_id: meeting.projectId,
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
        transcript: transcript?.text || "",
        created_at: meeting.createdAt.toISOString(),
        updated_at: meeting.updatedAt.toISOString(),
      } as Meeting;
    } catch (error) {
      console.error("Error fetching meeting:", error);
      throw new MeetingError(
        "Failed to fetch meeting",
        "FETCH_MEETING_FAILED",
        500
      );
    }
  }
}
