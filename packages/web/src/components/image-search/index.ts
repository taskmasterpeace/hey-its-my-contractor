// Image Search and AI Integration UI System
// Complete professional-grade image search with AI editing capabilities for contractors

// Core Components
export { default as ImageSearchInterface, type GoogleImageResult, type SearchConfiguration } from './ImageSearchInterface';
export { default as SearchResultsGrid } from './SearchResultsGrid';
export { default as ImageLibrary, type LibraryImage, type ImageFolder } from './ImageLibrary';

// AI Integration Components  
export { default as AIMagicWand, type AIEditRequest, type AIEditResult } from './AIMagicWand';
export { default as ReferenceImageMixer, type MixingLayer, type MixingPreset } from './ReferenceImageMixer';
export { default as CompanyWatermark, type WatermarkSettings, type WatermarkTemplate } from './CompanyWatermark';

// Integration Components
export { default as FieldTimeIntegration, type FieldTimePhoto, type SyncOperation, type SyncOptions } from './FieldTimeIntegration';

// Main App Component
export { default as ImageSearchApp } from './ImageSearchApp';

// Demo Data and Utilities
export { 
  default as demoData,
  CONTRACTOR_SEARCH_HISTORY,
  generateMockSearchResults,
  DEMO_LIBRARY_IMAGES,
  DEMO_FOLDERS,
  DEFAULT_CONTRACTOR_WATERMARK,
  DEMO_COMPANY_INFO,
  CONTRACTOR_SEARCH_CATEGORIES,
  CONTRACTOR_AI_PROMPTS,
  FIELDTIME_INTEGRATION_CONFIG
} from './demo-data';

// Re-export types for external use
export type {
  GoogleImageResult,
  SearchConfiguration,
  LibraryImage,
  ImageFolder,
  AIEditRequest,
  AIEditResult,
  MixingLayer,
  MixingPreset,
  WatermarkSettings,
  WatermarkTemplate,
  FieldTimePhoto,
  SyncOperation,
  SyncOptions
} from './types';

// Component feature sets
export const IMAGE_SEARCH_FEATURES = [
  'Google Images search with Home Depot/Lowe\'s defaults',
  'Advanced search operators and syntax help',
  'Touch-optimized mobile-first grid interface',
  'One-tap save to personal library',
  'Professional client-facing presentation mode'
] as const;

export const AI_INTEGRATION_FEATURES = [
  'Nano Banana AI editing with custom prompts',
  'Reference image mixing for style application',
  'Company watermark automatic branding',
  '"Add this trim to entire house" style workflows',
  'Professional before/after mockup generation'
] as const;

export const FIELDTIME_FEATURES = [
  'Seamless integration with existing FieldTime photos',
  'Project timeline and document library sync',
  'Team collaboration and notification system',
  'Meeting and task context linking',
  'Weather and location metadata preservation'
] as const;

// Usage Examples and Documentation
export const USAGE_EXAMPLES = {
  basicSearch: `
    import { ImageSearchInterface } from '@/components/image-search';
    
    <ImageSearchInterface
      onSearch={handleSearch}
      onImageSelect={setSelectedImage}
      onSaveToLibrary={saveToLibrary}
      searchHistory={history}
    />
  `,
  
  aiEditing: `
    import { AIMagicWand } from '@/components/image-search';
    
    <AIMagicWand
      baseImage={selectedImage}
      referenceImages={references}
      onEditComplete={handleResult}
      companySettings={watermarkConfig}
    />
  `,
  
  fullApp: `
    import { ImageSearchApp } from '@/components/image-search';
    
    <ImageSearchApp
      projectId="current-project"
      companyInfo={companyDetails}
      currentUser={user}
      onIntegrateWithFieldTime={syncToFieldTime}
    />
  `
} as const;

export const MOBILE_OPTIMIZATIONS = [
  'Touch-friendly image grid with haptic feedback',
  'One-handed operation for field workers',
  'Offline queue for poor signal areas',
  'Long-press gestures for quick actions',
  'Voice-to-text prompt input support',
  'High contrast mode for outdoor visibility'
] as const;

export const PROFESSIONAL_FEATURES = [
  'Client presentation mode with clean interface',
  'Company branding and watermark system',
  'Professional AI prompt templates',
  'Before/after mockup generation',
  'Project timeline integration',
  'Team collaboration tools'
] as const;