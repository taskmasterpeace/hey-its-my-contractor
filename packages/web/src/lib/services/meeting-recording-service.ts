import { createClient } from "@/utils/supabase/client";

export class MeetingRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingBlob: Blob | null = null;

  /**
   * Start recording audio from the microphone
   */
  async startAudioRecording(stream: MediaStream): Promise<void> {
    try {
      // Reset previous recording
      this.audioChunks = [];
      this.recordingBlob = null;

      // Create MediaRecorder with optimal settings
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps
      });

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording - collect data every 1 second
      this.mediaRecorder.start(1000);

      console.log("🎙️ Audio recording started with mime type:", mimeType);
    } catch (error) {
      console.error("Failed to start audio recording:", error);
      throw new Error("Failed to start audio recording");
    }
  }

  /**
   * Stop recording and create audio blob
   */
  async stopAudioRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No active recording"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          // Create blob from collected chunks
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          this.recordingBlob = new Blob(this.audioChunks, { type: mimeType });

          console.log("🎙️ Audio recording stopped. Size:", this.recordingBlob.size, "bytes");
          resolve(this.recordingBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Upload recording to Supabase Storage
   */
  async uploadRecording(
    meetingId: string,
    projectId: string,
    audioBlob: Blob
  ): Promise<string> {
    try {
      const supabase = createClient();

      // Generate unique filename
      const timestamp = Date.now();
      const extension = this.getFileExtension(audioBlob.type);
      // Include meeting-recordings in the path, not the bucket name
      const filename = `meeting-recordings/${projectId}/${meetingId}_${timestamp}.${extension}`;
      const bucketName = "contractor";

      console.log("📤 Uploading recording:", filename, "to bucket:", bucketName);
      console.log("📤 Audio blob type:", audioBlob.type, "size:", audioBlob.size);

      // Upload file
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filename, audioBlob, {
          contentType: audioBlob.type || "audio/webm",
          cacheControl: "3600",
          upsert: false,
        });
      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      console.log("✅ Recording uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload recording:", error);
      throw error;
    }
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ""; // Browser will use default
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("mpeg")) return "mp3";
    return "webm"; // default
  }

  /**
   * Get the current recording blob (if available)
   */
  getRecordingBlob(): Blob | null {
    return this.recordingBlob;
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingBlob = null;
  }
}

const meetingRecordingService = new MeetingRecordingService();
export default meetingRecordingService;
