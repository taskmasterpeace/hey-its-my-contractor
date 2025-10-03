export interface ImageSearchResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  retailer: "homedepot" | "lowes" | "menards" | "custom";
  originalUrl: string;
  price?: string;
  rating?: number;
  description?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface LibraryImage {
  id: string;
  url: string;
  title: string;
  source?: string;
  tags: string[];
  addedDate: string;
  projectId?: string;
  folder?: string;
  originalUrl?: string;
  retailer?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  description?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

export interface RetailerSettings {
  homedepot: boolean;
  lowes: boolean;
  menards: boolean;
}

export type AIModel = "nano-banana" | "gen4-turbo" | "auto";
export type TabType = "shopping" | "library" | "generator";
export type LibraryView = "grid" | "large";

export interface MagicWandSource {
  sourceType: "search" | "library";
  [key: string]: any;
}

export interface GenerationRequest {
  model: string;
  prompt: string;
  sourceImage?: string;
  referenceImages?: string[];
}
