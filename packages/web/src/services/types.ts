export type StartMeetingParams = {
    projectId: string;
    title: string;
    meetingType: string;
    tags: string[];
    userId: string;
}

export type UpdateMeetingParams = {
    meetingId: string;
    transcriptText?: string;
    recordingUrl?: string;
    status: string;
}