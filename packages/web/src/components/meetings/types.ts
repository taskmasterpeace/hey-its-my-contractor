import { TRANSCRIPTION_STATUS } from "@/constants";

export interface TranscriptionStatusIndicatorProps {
    status: TranscriptionStatusType;
    isActive?: boolean;
}
export type TranscriptionStatusType =
    (typeof TRANSCRIPTION_STATUS)[keyof typeof TRANSCRIPTION_STATUS];