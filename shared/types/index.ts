// Core Data Models based on architecture documentation

export interface Tenant {
  id: string;
  name: string;
  plan: "basic" | "pro" | "enterprise";
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  timezone: string;
  retention_days: number;
  recording_consent_required: boolean;
  weather_integration: boolean;
}

export interface User {
  id: string;
  tenant_id: string;
  role: UserRole;
  profile: UserProfile;
  auth_id: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = "contractor" | "staff" | "sub" | "homeowner" | "admin";

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  company?: string;
  license_number?: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  client_user_id: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  starts_at: string;
  ends_at?: string;
  type: MeetingType;
  participants: string[]; // User IDs
  external_provider?: "zoom" | "meet" | "jitsi";
  recording_url?: string;
  consent_given: boolean;
  status: MeetingStatus;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type MeetingType =
  | "consultation"
  | "progress_review"
  | "change_order"
  | "walkthrough"
  | "inspection";
export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Transcript {
  id: string;
  meeting_id: string;
  provider: "assemblyai" | "whisper";
  language: string;
  text: string;
  segments: TranscriptSegment[];
  summary?: string;
  action_items?: string[];
  created_at: string;
}

export interface TranscriptSegment {
  start_time: number; // seconds
  end_time: number;
  speaker: string;
  text: string;
  confidence?: number;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  assignees: string[]; // User IDs
  source_meeting_id?: string;
  ack_contractor: boolean;
  ack_client: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface DailyLog {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  notes: string;
  media: MediaFile[];
  weather_data?: WeatherData;
  location?: GeoLocation;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  type: "photo" | "video" | "audio" | "image" | "file";
  url: string;
  filename: string;
  size: number;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  camera_make?: string;
  camera_model?: string;
  gps_coordinates?: GeoLocation;
  timestamp?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  wind_speed?: number;
  precipitation?: number;
  timestamp: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  type: DocumentType;
  version: number;
  storage_key: string;
  file_size: number;
  mime_type: string;
  annotations: DocumentAnnotation[];
  linked_to?: {
    meeting_id?: string;
    task_id?: string;
    change_order_id?: string;
  };
  expiration_date?: string; // For permits
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | "plan"
  | "permit"
  | "contract"
  | "invoice"
  | "photo"
  | "other";

export interface DocumentAnnotation {
  id: string;
  page_number?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: "note" | "highlight" | "drawing";
  content: string;
  created_by: string;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  status: ChangeOrderStatus;
  pdf_key?: string;
  linked_meeting_id?: string;
  approved_by_client?: string;
  approved_by_contractor?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export type ChangeOrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "implemented";

// Chat/Communication Types
export interface ChatChannel {
  id: string;
  project_id: string;
  name: string;
  type: "project" | "team" | "client";
  participants: string[]; // User IDs
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: "project" | "team" | "client" | "direct" | "general";
  project_id?: string;
  participants?: string[];
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    timestamp: string;
    type: "text" | "image" | "file";
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  attachments?: MediaFile[];
  reply_to?: string; // Message ID
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Calendar Event Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: "meeting" | "delivery" | "inspection" | "milestone";
  project_id: string;
  meeting_id?: string;
  task_id?: string;
  color?: string;
  metadata?: Record<string, any>;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export type NotificationType =
  | "meeting_reminder"
  | "task_due"
  | "message_received"
  | "document_uploaded"
  | "weather_alert"
  | "change_order_approval";

// Research Types for Perplexity Integration
export interface ResearchQuery {
  query: string;
  context?: {
    projectType?: string;
    location?: string;
    budget?: number;
    timeline?: string;
  };
  type?: "supplier" | "regulation" | "material" | "technique" | "general";
}

export interface ResearchResult {
  query: string;
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
  related_queries: string[];
  timestamp: string;
  confidence: number;
}

export interface SavedResearch {
  id: string;
  project_id?: string;
  query: string;
  result: ResearchResult;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  isPrivate?: boolean; // Privacy setting for the research
  userId?: string; // User who created the research
}

// Weather Types
export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    uv_index: number;
    wind_speed: number;
    wind_direction: number;
    conditions: string;
    description: string;
    icon: string;
  };
  timestamp: string;
  work_recommendation: {
    suitability: "excellent" | "good" | "fair" | "poor" | "dangerous";
    message: string;
    restrictions: string[];
    recommendations: string[];
  };
}

// Meeting Intelligence & Search Types
export interface MeetingSearchFilters {
  query?: string;
  tags?: string[];
  participants?: string[];
  projects?: string[];
  types?: MeetingType[];
  status?: MeetingStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  hasRecording?: boolean;
  hasTranscript?: boolean;
}

export interface MeetingSearchResult {
  meeting: Meeting;
  highlights?: {
    title?: string;
    transcript?: TranscriptSearchHighlight[];
    notes?: string;
  };
  relevanceScore: number;
}

export interface TranscriptSearchHighlight {
  segmentIndex: number;
  text: string;
  timestamp: number;
  speaker: string;
  highlightedText: string;
}

export interface MeetingTag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface EnhancedMeetingData {
  meeting: Meeting;
  project: Project;
  transcript?: Transcript;
  participants: UserProfile[];
  duration?: number;
  action_items_count?: number;
  completed_actions?: number;
}

// Image and Design Library Types
export * from "./images";
