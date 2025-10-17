import { StartMeetingParams, UpdateMeetingParams } from "@/services/types";

const MeetingService = {
    getToken: async () => {
        try {
            const response = await fetch("/api/assemblyai/token");
            const data = await response.json();

            // Token expires in 10 minutes, store expiry time
            const expiresAt = Date.now() + (10 * 60 * 1000);
            return {
                token: data.token,
                expiresAt
            };
        } catch (error) {
            console.error("error occurred", error)
            return null;
        }
    },
    startMeeting: async ({ projectId, title, meetingType, tags = [], userId }: StartMeetingParams) => {
        try {
            if (!userId || !projectId || !title || !meetingType) {
                console.error("Project ID, title and meeting type are required");
                return { data: null, success: false, message: "Project ID, title and meeting type are required" }
            }
            const res = await fetch("/api/meetings/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    title,
                    meetingType,
                    tags,
                    userId
                })
            });

            if (!res.ok) {
                console.error("Failed to create meeting");
                return { data: null, success: false, message: "Failed to create meeting" }
            }
            const data = await res.json();
            return { data, success: true };
        } catch (error) {
            console.error("error occurred", error)
            return { data: null, success: false, message: error instanceof Error ? error.message : "Something went wrong" };
        }
    },
    updateMeeting: async ({ meetingId, transcriptText = "", recordingUrl, status }: UpdateMeetingParams) => {
        try {
            if (!meetingId || !status) {
                console.error("Meeting ID and status are required");
                return { data: null, success: false, message: "Meeting ID and status are required" }
            }
            const res = await fetch("/api/meetings/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetingId,
                    transcriptText,
                    recordingUrl,
                    status
                })
            });

            if (!res.ok) {
                console.error("Failed to update meeting");
                return { data: null, success: false, message: "Failed to update meeting" }
            }
            const data = await res.json();
            return { data, success: true };
        } catch (error) {
            console.error("error occurred", error)
            return { data: null, success: false, message: error instanceof Error ? error.message : "Something went wrong" };
        }
    }
}

export default MeetingService
