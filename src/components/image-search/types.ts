// Type definitions for Image Search and AI Integration system

// Re-export all types from individual components for convenience
export type { GoogleImageResult, SearchConfiguration } from './ImageSearchInterface';
export type { LibraryImage, ImageFolder } from './ImageLibrary';
export type { AIEditRequest, AIEditResult } from './AIMagicWand';
export type { MixingLayer, MixingPreset } from './ReferenceImageMixer';
export type { WatermarkSettings, WatermarkTemplate } from './CompanyWatermark';
export type { FieldTimePhoto, SyncOperation, SyncOptions } from './FieldTimeIntegration';

// Additional shared types
export interface ImageSearchConfig {
  defaultSites: string[];
  customSites: string[];
  enableAI: boolean;
  enableWatermark: boolean;
  mobileOptimized: boolean;
}

export interface CompanyBranding {
  name: string;
  logo?: string;
  brandColors: string[];
  website?: string;
  phone?: string;
}

export interface UserContext {
  id: string;
  role: 'contractor' | 'client' | 'staff';
  name: string;
  permissions: string[];
}

export interface ProjectContext {
  id: string;
  name: string;
  address?: string;
  status: 'active' | 'completed' | 'paused';
  clientId?: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  savedImages: number;
  aiGeneratedImages: number;
  averageSearchTime: number;
}

export interface AIProcessingStats {
  totalEdits: number;
  successRate: number;
  averageProcessingTime: number;
  popularPrompts: Array<{ prompt: string; count: number }>;
  modelVersions: Array<{ version: string; usage: number }>;
}

export interface IntegrationMetrics {
  syncedImages: number;
  timelineEntries: number;
  documentUploads: number;
  teamNotifications: number;
  watermarkedImages: number;
}