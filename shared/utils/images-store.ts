import { create } from "zustand";
import type {
  ImageSearchResult,
  LibraryImage,
  RetailerSettings,
  AIModel,
  TabType,
  LibraryView,
  MagicWandSource,
} from "@contractor-platform/types";

interface ImagesState {
  // UI State
  activeTab: TabType;
  isSearching: boolean;
  isGenerating: boolean;
  isUploading: boolean;
  isLoadingLibrary: boolean;
  showMagicWand: boolean;
  showAddSite: boolean;
  showCreateFolder: boolean;

  // Data
  searchTerm: string;
  searchResults: ImageSearchResult[];
  libraryImages: LibraryImage[];
  selectedReferences: LibraryImage[];
  generatedImage: string | null;
  prompt: string;

  // Settings
  enabledRetailers: RetailerSettings;
  customRetailers: string[];
  searchEntireWeb: boolean;
  selectedModel: AIModel;
  manualModelOverride: AIModel | null;
  selectedFolder: string;
  libraryView: LibraryView;

  // Modal Data
  magicWandSource: MagicWandSource | null;
  newSite: string;
  newFolderName: string;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setSearchTerm: (term: string) => void;
  setSearchResults: (results: ImageSearchResult[]) => void;
  setLibraryImages: (images: LibraryImage[]) => void;
  addLibraryImage: (image: LibraryImage) => void;
  setSelectedReferences: (references: LibraryImage[]) => void;
  toggleReferenceSelection: (image: LibraryImage) => void;
  setGeneratedImage: (url: string | null) => void;
  setPrompt: (prompt: string) => void;
  setIsSearching: (loading: boolean) => void;
  setIsGenerating: (loading: boolean) => void;
  setIsUploading: (loading: boolean) => void;
  setIsLoadingLibrary: (loading: boolean) => void;
  fetchLibraryImages: () => Promise<void>;
  setEnabledRetailers: (retailers: Partial<RetailerSettings>) => void;
  setCustomRetailers: (retailers: string[]) => void;
  addCustomRetailer: (retailer: string) => void;
  removeCustomRetailer: (retailer: string) => void;
  setSearchEntireWeb: (enabled: boolean) => void;
  setSelectedModel: (model: AIModel) => void;
  setManualModelOverride: (model: AIModel | null) => void;
  setSelectedFolder: (folder: string) => void;
  setLibraryView: (view: LibraryView) => void;
  setShowMagicWand: (show: boolean) => void;
  setMagicWandSource: (source: MagicWandSource | null) => void;
  setShowAddSite: (show: boolean) => void;
  setNewSite: (site: string) => void;
  setShowCreateFolder: (show: boolean) => void;
  setNewFolderName: (name: string) => void;
  clearSelectedReferences: () => void;
  resetSearch: () => void;
  getSmartModel: () => AIModel;
}

export const useImagesStore = create<ImagesState>()((set, get) => ({
  // Initial UI State
  activeTab: "shopping",
  isSearching: false,
  isGenerating: false,
  isUploading: false,
  isLoadingLibrary: false,
  showMagicWand: false,
  showAddSite: false,
  showCreateFolder: false,

  // Initial Data
  searchTerm: "",
  searchResults: [],
  libraryImages: [],
  selectedReferences: [],
  generatedImage: null,
  prompt: "",

  // Initial Settings
  enabledRetailers: {
    homedepot: true,
    lowes: true,
    menards: false,
  },
  customRetailers: [],
  searchEntireWeb: false,
  selectedModel: "auto",
  manualModelOverride: null,
  selectedFolder: "all",
  libraryView: "large",

  // Initial Modal Data
  magicWandSource: null,
  newSite: "",
  newFolderName: "",

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLibraryImages: (images) => set({ libraryImages: images }),
  addLibraryImage: (image) =>
    set((state) => ({
      libraryImages: [image, ...state.libraryImages],
    })),
  setSelectedReferences: (references) =>
    set({ selectedReferences: references }),
  toggleReferenceSelection: (image) =>
    set((state) => {
      const isSelected = state.selectedReferences.find(
        (ref) => ref.id === image.id
      );
      if (isSelected) {
        return {
          selectedReferences: state.selectedReferences.filter(
            (ref) => ref.id !== image.id
          ),
        };
      } else if (state.selectedReferences.length < 3) {
        return {
          selectedReferences: [...state.selectedReferences, image],
        };
      }
      return state;
    }),
  setGeneratedImage: (url) => set({ generatedImage: url }),
  setPrompt: (prompt) => set({ prompt }),
  setIsSearching: (loading) => set({ isSearching: loading }),
  setIsGenerating: (loading) => set({ isGenerating: loading }),
  setIsUploading: (loading) => set({ isUploading: loading }),
  setIsLoadingLibrary: (loading) => set({ isLoadingLibrary: loading }),

  fetchLibraryImages: async () => {
    set({ isLoadingLibrary: true });
    try {
      const response = await fetch("/api/images/library");
      if (response.ok) {
        const data = await response.json();
        set({ libraryImages: data.images || [] });
      } else {
        console.error("Failed to fetch library images:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching library images:", error);
    } finally {
      set({ isLoadingLibrary: false });
    }
  },

  setEnabledRetailers: (retailers) =>
    set((state) => ({
      enabledRetailers: { ...state.enabledRetailers, ...retailers },
    })),
  setCustomRetailers: (retailers) => set({ customRetailers: retailers }),
  addCustomRetailer: (retailer) =>
    set((state) => ({
      customRetailers: [...state.customRetailers, retailer],
    })),
  removeCustomRetailer: (retailer) =>
    set((state) => ({
      customRetailers: state.customRetailers.filter((r) => r !== retailer),
    })),
  setSearchEntireWeb: (enabled) => set({ searchEntireWeb: enabled }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setManualModelOverride: (model) => set({ manualModelOverride: model }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setLibraryView: (view) => set({ libraryView: view }),
  setShowMagicWand: (show) => set({ showMagicWand: show }),
  setMagicWandSource: (source) => set({ magicWandSource: source }),
  setShowAddSite: (show) => set({ showAddSite: show }),
  setNewSite: (site) => set({ newSite: site }),
  setShowCreateFolder: (show) => set({ showCreateFolder: show }),
  setNewFolderName: (name) => set({ newFolderName: name }),
  clearSelectedReferences: () => set({ selectedReferences: [] }),
  resetSearch: () =>
    set({
      searchTerm: "",
      searchResults: [],
      isSearching: false,
    }),
  getSmartModel: () => {
    const state = get();
    return state.selectedReferences.length <= 1 ? "nano-banana" : "gen4-turbo";
  },
}));
