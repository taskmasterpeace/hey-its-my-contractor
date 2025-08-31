// AssemblyAI Integration for Meeting Transcription
// Based on architecture documentation requirements

export interface AssemblyAIConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface TranscriptionRequest {
  audio_url: string;
  speaker_labels?: boolean;
  auto_highlights?: boolean;
  auto_chapters?: boolean;
  summarization?: boolean;
  summary_model?: 'informative' | 'conversational' | 'catchy';
  summary_type?: 'bullets' | 'bullets_verbose' | 'gist' | 'headline' | 'paragraph';
  auto_highlights_result?: boolean;
  webhook_url?: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  speaker?: string;
}

export interface TranscriptionResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  confidence?: number;
  audio_duration?: number;
  language_code?: string;
  acoustic_model?: string;
  audio_url: string;
  utterances?: TranscriptSegment[];
  chapters?: Array<{
    summary: string;
    gist: string;
    headline: string;
    start: number;
    end: number;
  }>;
  summary?: string;
  auto_highlights?: {
    status: string;
    results: Array<{
      count: number;
      rank: number;
      text: string;
      timestamps: Array<{ start: number; end: number }>;
    }>;
  };
  error?: string;
}

export class AssemblyAIService {
  private config: AssemblyAIConfig;
  private baseUrl: string;

  constructor(config: AssemblyAIConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.assemblyai.com/v2';
  }

  /**
   * Upload audio file to AssemblyAI
   */
  async uploadAudio(audioFile: File | Buffer): Promise<string> {
    const formData = new FormData();
    
    if (audioFile instanceof File) {
      formData.append('audio', audioFile);
    } else {
      // Handle Buffer for server-side usage
      const blob = new Blob([audioFile], { type: 'audio/wav' });
      formData.append('audio', blob, 'recording.wav');
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  /**
   * Submit transcription request
   */
  async submitTranscription(request: TranscriptionRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: request.audio_url,
        speaker_labels: request.speaker_labels ?? true,
        auto_highlights: request.auto_highlights ?? true,
        auto_chapters: request.auto_chapters ?? true,
        summarization: request.summarization ?? true,
        summary_model: request.summary_model ?? 'conversational',
        summary_type: request.summary_type ?? 'bullets',
        webhook_url: request.webhook_url,
        language_code: 'en_us',
        punctuate: true,
        format_text: true,
        dual_channel: false,
        speech_model: 'best',
      }),
    });

    if (!response.ok) {
      throw new Error(`Transcription request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Get transcription result
   */
  async getTranscription(transcriptionId: string): Promise<TranscriptionResult> {
    const response = await fetch(`${this.baseUrl}/transcript/${transcriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transcription: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Poll for transcription completion
   */
  async waitForTranscription(
    transcriptionId: string,
    options: { 
      maxAttempts?: number; 
      interval?: number;
      onProgress?: (status: string) => void;
    } = {}
  ): Promise<TranscriptionResult> {
    const { maxAttempts = 60, interval = 5000, onProgress } = options;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getTranscription(transcriptionId);
      
      if (onProgress) {
        onProgress(result.status);
      }

      if (result.status === 'completed') {
        return result;
      }
      
      if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Transcription timeout - exceeded maximum attempts');
  }

  /**
   * Complete transcription workflow: upload + transcribe + wait
   */
  async transcribeAudio(
    audioFile: File | Buffer,
    options: {
      speakerLabels?: boolean;
      autoHighlights?: boolean;
      autoChapters?: boolean;
      summarization?: boolean;
      webhookUrl?: string;
      onProgress?: (status: string, progress?: number) => void;
    } = {}
  ): Promise<TranscriptionResult> {
    const {
      speakerLabels = true,
      autoHighlights = true,
      autoChapters = true,
      summarization = true,
      webhookUrl,
      onProgress,
    } = options;

    try {
      // Step 1: Upload audio
      if (onProgress) onProgress('uploading', 10);
      const audioUrl = await this.uploadAudio(audioFile);

      // Step 2: Submit transcription
      if (onProgress) onProgress('submitting', 20);
      const transcriptionId = await this.submitTranscription({
        audio_url: audioUrl,
        speaker_labels: speakerLabels,
        auto_highlights: autoHighlights,
        auto_chapters: autoChapters,
        summarization: summarization,
        summary_model: 'conversational',
        summary_type: 'bullets',
        webhook_url: webhookUrl,
      });

      // Step 3: Wait for completion
      if (onProgress) onProgress('processing', 30);
      const result = await this.waitForTranscription(transcriptionId, {
        onProgress: (status) => {
          const progressMap = {
            'queued': 40,
            'processing': 70,
            'completed': 100,
          };
          if (onProgress) onProgress(status, progressMap[status as keyof typeof progressMap] || 50);
        }
      });

      return result;
    } catch (error) {
      throw new Error(`Transcription workflow failed: ${error}`);
    }
  }

  /**
   * Extract action items from transcript using AI
   */
  extractActionItems(transcriptionResult: TranscriptionResult): string[] {
    const text = transcriptionResult.text || '';
    const actionItems: string[] = [];

    // Simple keyword-based extraction (in production, use more sophisticated AI)
    const actionKeywords = [
      'action item',
      'todo',
      'to do',
      'follow up',
      'next step',
      'we need to',
      'will do',
      'should do',
      'must do',
      'by friday',
      'by monday',
      'by next week',
      'due',
      'deadline',
      'schedule',
      'order',
      'contact',
      'call',
      'email',
      'send',
      'complete',
      'finish',
    ];

    // Split into sentences and look for action items
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Check if sentence contains action keywords
      const hasActionKeyword = actionKeywords.some(keyword => 
        lowerSentence.includes(keyword)
      );

      if (hasActionKeyword && lowerSentence.length > 10) {
        // Clean up and format the action item
        const cleanSentence = sentence.trim();
        if (cleanSentence && !actionItems.includes(cleanSentence)) {
          actionItems.push(cleanSentence);
        }
      }
    });

    // Also check auto_highlights for important points
    if (transcriptionResult.auto_highlights?.results) {
      transcriptionResult.auto_highlights.results.forEach(highlight => {
        if (highlight.rank <= 3) { // Top 3 highlights
          actionItems.push(`Key point: ${highlight.text}`);
        }
      });
    }

    return actionItems.slice(0, 10); // Limit to top 10 items
  }

  /**
   * Format transcript for display with speakers and timestamps
   */
  formatTranscriptForDisplay(transcriptionResult: TranscriptionResult): Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
    timestamp: string;
  }> {
    if (!transcriptionResult.utterances) {
      return [{
        speaker: 'Unknown',
        text: transcriptionResult.text || '',
        start: 0,
        end: transcriptionResult.audio_duration || 0,
        timestamp: '00:00',
      }];
    }

    return transcriptionResult.utterances.map(utterance => ({
      speaker: utterance.speaker || 'Unknown',
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      timestamp: this.formatTimestamp(utterance.start),
    }));
  }

  /**
   * Convert seconds to MM:SS format
   */
  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Generate meeting summary from transcript
   */
  generateMeetingSummary(transcriptionResult: TranscriptionResult): {
    duration: string;
    participantCount: number;
    keyTopics: string[];
    summary: string;
    actionItems: string[];
  } {
    const duration = transcriptionResult.audio_duration 
      ? this.formatTimestamp(transcriptionResult.audio_duration)
      : 'Unknown';

    // Count unique speakers
    const speakers = new Set();
    transcriptionResult.utterances?.forEach(utterance => {
      if (utterance.speaker) {
        speakers.add(utterance.speaker);
      }
    });

    // Extract key topics from auto_highlights
    const keyTopics = transcriptionResult.auto_highlights?.results
      ?.slice(0, 5)
      .map(highlight => highlight.text) || [];

    const summary = transcriptionResult.summary || 
      'Meeting transcript processed successfully. Review the full transcript for details.';

    const actionItems = this.extractActionItems(transcriptionResult);

    return {
      duration,
      participantCount: speakers.size || 1,
      keyTopics,
      summary,
      actionItems,
    };
  }
}