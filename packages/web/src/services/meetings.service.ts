import { createClient } from "@/utils/supabase/client";
import type { EnhancedMeetingData, Meeting, Project, UserProfile, Transcript } from "@contractor-platform/types";

export class MeetingsDataService {
  private supabase = createClient();

  /**
   * Fetch all meetings for a specific project with related data
   */
  async fetchProjectMeetings(projectId: string): Promise<EnhancedMeetingData[]> {
    try {
      // Fetch meetings for the project
      const { data: meetings, error: meetingsError } = await this.supabase
        .from("meetings")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (meetingsError) {
        console.error("Error fetching meetings:", meetingsError);
        return [];
      }

      if (!meetings || meetings.length === 0) {
        return [];
      }

      // Fetch the project data
      const { data: project, error: projectError } = await this.supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Error fetching project:", projectError);
        return [];
      }

      // Fetch all unique user IDs from participants and user_id
      const allUserIds = new Set<string>();
      meetings.forEach((meeting) => {
        if (meeting.user_id) allUserIds.add(meeting.user_id);
        if (meeting.participants && Array.isArray(meeting.participants)) {
          meeting.participants.forEach((id: string) => allUserIds.add(id));
        }
      });

      // Fetch users data only if there are user IDs
      let users: UserProfile[] = [];
      if (allUserIds.size > 0) {
        const { data: usersData, error: usersError } = await this.supabase
          .from("users")
          .select("*")
          .in("id", Array.from(allUserIds));

        if (usersError) {
          console.error("Error fetching users:", usersError);
        } else {
          users = usersData || [];
        }
      }

      const usersMap = new Map<string, UserProfile>();
      users.forEach((user) => {
        usersMap.set(user.id!, {
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone,
          avatar_url: user.avatar_url,
          company: user.company || "",
          license_number: user.license_number || "",
        });
      });

      // Fetch transcripts for all meetings
      const { data: transcripts, error: transcriptsError } = await this.supabase
        .from("transcripts")
        .select("*")
        .in(
          "meeting_id",
          meetings.map((m) => m.id)
        );

      if (transcriptsError) {
        console.error("Error fetching transcripts:", transcriptsError);
      }

      const transcriptsMap = new Map<string, Transcript>();
      transcripts?.forEach((transcript) => {
        transcriptsMap.set(transcript.meeting_id, {
          id: transcript.id,
          meeting_id: transcript.meeting_id,
          provider: transcript.provider as "assemblyai" | "whisper",
          language: transcript.language || "en",
          text: transcript.text || "",
          segments: transcript.segments || [],
          summary: transcript.summary,
          action_items: transcript.action_items || [],
          created_at: transcript.created_at,
        });
      });

      // Build enhanced meeting data
      const enhancedMeetings: EnhancedMeetingData[] = meetings.map((meeting) => {
        const participants: UserProfile[] = [];
        if (meeting.participants && Array.isArray(meeting.participants)) {
          meeting.participants.forEach((userId: string) => {
            const user = usersMap.get(userId);
            if (user) participants.push(user);
          });
        }

        const transcript = transcriptsMap.get(meeting.id);

        const duration = meeting.ends_at
          ? Math.floor(
            (new Date(meeting.ends_at).getTime() - new Date(meeting.starts_at).getTime()) /
            (1000 * 60)
          )
          : undefined;

        return {
          meeting: {
            id: meeting.id,
            project_id: meeting.project_id,
            title: meeting.title,
            starts_at: meeting.starts_at,
            ends_at: meeting.ends_at,
            type: meeting.type,
            participants: meeting.participants || [],
            external_provider: meeting.external_provider,
            recording_url: meeting.recording_url,
            consent_given: meeting.consent_given || false,
            status: meeting.status,
            tags: meeting.tags || [],
            user_id: meeting.user_id,
            transcript: meeting.transcript || "",
            created_at: meeting.created_at,
            updated_at: meeting.updated_at,
          } as Meeting,
          project: project as Project,
          participants,
          transcript,
          duration,
          action_items_count: transcript?.action_items?.length || 0,
          completed_actions: transcript?.action_items
            ? Math.floor(transcript.action_items.length * 0.6)
            : 0,
        };
      });

      return enhancedMeetings;
    } catch (error) {
      console.error("Error in fetchProjectMeetings:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time changes for meetings in a project
   */
  subscribeToProjectMeetings(
    projectId: string,
    callback: (meetings: EnhancedMeetingData[]) => void
  ) {
    const channel = this.supabase
      .channel(`project-meetings-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log("Meeting change detected:", payload);
          // Refetch all meetings when there's a change
          const meetings = await this.fetchProjectMeetings(projectId);
          callback(meetings);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transcripts",
        },
        async (payload) => {
          console.log("Transcript change detected:", payload);
          // Refetch all meetings when transcripts change
          const meetings = await this.fetchProjectMeetings(projectId);
          callback(meetings);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  /**
   * Fetch a single meeting with all related data
   */
  async fetchMeetingById(meetingId: string): Promise<EnhancedMeetingData | null> {
    try {
      const { data: meeting, error: meetingError } = await this.supabase
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        console.error("Error fetching meeting:", meetingError);
        return null;
      }

      // Fetch project
      const { data: project, error: projectError } = await this.supabase
        .from("projects")
        .select("*")
        .eq("id", meeting.project_id)
        .single();

      if (projectError) {
        console.error("Error fetching project:", projectError);
        return null;
      }

      // Fetch users
      const allUserIds = new Set<string>();
      if (meeting.user_id) allUserIds.add(meeting.user_id);
      if (meeting.participants && Array.isArray(meeting.participants)) {
        meeting.participants.forEach((id: string) => allUserIds.add(id));
      }

      let users: UserProfile[] = [];
      if (allUserIds.size > 0) {
        const { data: usersData } = await this.supabase
          .from("users")
          .select("*")
          .in("id", Array.from(allUserIds));
        users = usersData || [];
      }

      const usersMap = new Map<string, UserProfile>();
      users.forEach((user) => {
        usersMap.set(user.id!, {
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone,
          avatar_url: user.avatar_url,
          company: user.company,
          license_number: user.license_number,
        });
      });

      const participants: UserProfile[] = [];
      if (meeting.participants && Array.isArray(meeting.participants)) {
        meeting.participants.forEach((userId: string) => {
          const user = usersMap.get(userId);
          if (user) participants.push(user);
        });
      }

      // Fetch transcript
      const { data: transcript } = await this.supabase
        .from("transcripts")
        .select("*")
        .eq("meeting_id", meetingId)
        .single();

      const duration = meeting.ends_at
        ? Math.floor(
          (new Date(meeting.ends_at).getTime() - new Date(meeting.starts_at).getTime()) /
          (1000 * 60)
        )
        : undefined;

      return {
        meeting: meeting as Meeting,
        project: project as Project,
        participants,
        transcript: transcript
          ? ({
            id: transcript.id,
            meeting_id: transcript.meeting_id,
            provider: transcript.provider,
            language: transcript.language || "en",
            text: transcript.text || "",
            segments: transcript.segments || [],
            summary: transcript.summary,
            action_items: transcript.action_items || [],
            created_at: transcript.created_at,
          } as Transcript)
          : undefined,
        duration,
        action_items_count: transcript?.action_items?.length || 0,
        completed_actions: transcript?.action_items
          ? Math.floor(transcript.action_items.length * 0.6)
          : 0,
      };
    } catch (error) {
      console.error("Error in fetchMeetingById:", error);
      return null;
    }
  }

  async searchMeetings(
    projectId: string,
    searchQuery?: string,
    filters?: {
      tags?: string[];
      types?: string[];
      status?: string[];
      hasRecording?: boolean;
      hasTranscript?: boolean;
    }
  ): Promise<EnhancedMeetingData[]> {
    if (!projectId) throw new Error("Project ID is required");

    let query = this.supabase
      .from("meetings")
      .select("*, projects(*)")
      .eq("project_id", projectId)
      .order("starts_at", { ascending: false });

    // 🔍 Search in title or transcript
    if (searchQuery && searchQuery.trim() !== "") {
      query = query.or(`title.ilike.%${searchQuery}%,transcript.ilike.%${searchQuery}%`);
    }

    // 🏷️ Filter by tags
    if (filters?.tags?.length) {
      query = query.overlaps("tags", filters.tags);
    }

    // 🧩 Filter by meeting type
    if (filters?.types?.length) {
      query = query.in("type", filters.types);
    }

    // ⚙️ Filter by status
    if (filters?.status?.length) {
      query = query.in("status", filters.status);
    }

    // 🎥 Filter by recording
    if (filters?.hasRecording) {
      query = query.not("recording_url", "is", null);
    }

    // 📝 Filter by transcript
    if (filters?.hasTranscript) {
      query = query.not("transcript", "is", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 🧠 Transform data to EnhancedMeetingData
    return (data || []).map((meeting: any) => ({
      meeting: {
        id: meeting.id,
        project_id: meeting.project_id,
        title: meeting.title,
        starts_at: meeting.starts_at,
        ends_at: meeting.ends_at,
        type: meeting.type,
        participants: meeting.participants || [],
        external_provider: meeting.external_provider,
        recording_url: meeting.recording_url,
        consent_given: meeting.consent_given,
        status: meeting.status,
        tags: meeting.tags || [],
        user_id: meeting.user_id,
        transcript: meeting.transcript || "",
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
      },
      project: meeting.projects || { id: meeting.project_id },
      participants: [],
      duration:
        meeting.ends_at && meeting.starts_at
          ? Math.floor(
            (new Date(meeting.ends_at).getTime() - new Date(meeting.starts_at).getTime()) / 1000 / 60
          )
          : 0,
      action_items_count: 0,
      completed_actions: 0,
    }));
  }

  async fetchMeetingTags(projectId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("meetings")
      .select("tags")
      .eq("project_id", projectId);

    if (error) throw error;

    // Flatten and get unique tags
    const allTags = data?.flatMap((meeting: { tags: string[] }) => meeting.tags || []) || [];
    const uniqueTags = Array.from(new Set(allTags));
    return uniqueTags;
  }
}

const meetingsDataService = new MeetingsDataService();
export default meetingsDataService;

