'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Search, 
  Image as ImageIcon, 
  Sparkles, 
  Settings, 
  Library, 
  Layers,
  Download,
  Share,
  RefreshCw
} from 'lucide-react';

// Import our components
import ImageSearchInterface, { GoogleImageResult, SearchConfiguration } from './ImageSearchInterface';
import SearchResultsGrid from './SearchResultsGrid';
import ImageLibrary, { LibraryImage, ImageFolder } from './ImageLibrary';
import AIMagicWand, { AIEditResult } from './AIMagicWand';
import ReferenceImageMixer, { MixingLayer } from './ReferenceImageMixer';
import CompanyWatermark, { WatermarkSettings } from './CompanyWatermark';

interface ImageSearchAppProps {
  projectId?: string;
  companyInfo?: {
    name: string;
    logo?: string;
    brandColors: string[];
    website?: string;
    phone?: string;
  };
  currentUser?: {
    id: string;
    role: 'contractor' | 'client' | 'staff';
    name: string;
  };
  onIntegrateWithFieldTime?: (images: LibraryImage[]) => void;
  className?: string;
}

type AppMode = 'search' | 'library' | 'ai-edit' | 'reference-mixer' | 'watermark-settings';

// Demo data for development
const DEMO_SEARCH_HISTORY = [
  'kitchen cabinets white shaker',
  'bathroom tile subway white',
  'hardwood flooring oak',
  'exterior window trim black',
  'granite countertops dark',
  'pendant lighting kitchen island'
];

const DEMO_LIBRARY_IMAGES: LibraryImage[] = [
  {
    id: 'lib-1',
    url: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/400/300?random=1',
    title: 'White Shaker Kitchen Cabinets',
    description: 'Classic white shaker style cabinets with brushed nickel hardware',
    tags: ['kitchen', 'cabinets', 'white', 'shaker', 'traditional'],
    source: 'search',
    domain: 'homedepot.com',
    width: 800,
    height: 600,
    size: '245 KB',
    format: 'jpg',
    savedAt: '2024-01-15T10:30:00Z',
    projectId: 'project-1',
    projectName: 'Johnson Kitchen Remodel',
    folder: 'inspiration',
    isFavorite: true,
    usage: 'inspiration'
  },
  {
    id: 'lib-2',
    url: 'https://picsum.photos/800/600?random=2',
    thumbnailUrl: 'https://picsum.photos/400/300?random=2',
    title: 'Subway Tile Backsplash',
    description: 'Classic white subway tile with dark grout',
    tags: ['tile', 'backsplash', 'subway', 'white', 'kitchen'],
    source: 'search',
    domain: 'lowes.com',
    width: 800,
    height: 600,
    size: '189 KB',
    format: 'jpg',
    savedAt: '2024-01-14T15:45:00Z',
    projectId: 'project-1',
    projectName: 'Johnson Kitchen Remodel',
    folder: 'materials',
    isFavorite: false,
    usage: 'materials'
  }
];

const DEMO_FOLDERS: ImageFolder[] = [
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Ideas and design inspiration',
    imageCount: 12,
    createdAt: '2024-01-01T00:00:00Z',
    color: '#FFD700'
  },
  {
    id: 'materials',
    name: 'Materials',
    description: 'Product and material references',
    imageCount: 8,
    createdAt: '2024-01-02T00:00:00Z',
    color: '#32CD32'
  },
  {
    id: 'before-after',
    name: 'Before/After',
    description: 'Project transformation photos',
    imageCount: 6,
    createdAt: '2024-01-03T00:00:00Z',
    color: '#9370DB'
  }
];

export function ImageSearchApp({
  projectId,
  companyInfo,
  currentUser,
  onIntegrateWithFieldTime,
  className = ''
}: ImageSearchAppProps) {
  // App state
  const [mode, setMode] = useState<AppMode>('search');
  const [searchResults, setSearchResults] = useState<GoogleImageResult[]>([]);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>(DEMO_LIBRARY_IMAGES);
  const [folders, setFolders] = useState<ImageFolder[]>(DEMO_FOLDERS);
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set(['result-1', 'result-2']));
  const [selectedReferences, setSelectedReferences] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(DEMO_SEARCH_HISTORY);

  // Modal states
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [showReferenceMixer, setShowReferenceMixer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GoogleImageResult | LibraryImage | null>(null);
  const [referenceImages, setReferenceImages] = useState<(GoogleImageResult | LibraryImage)[]>([]);

  // Watermark settings
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    enabled: true,
    companyName: companyInfo?.name || 'Your Company',
    position: 'bottom-right',
    size: 'medium',
    opacity: 80,
    style: 'filled',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'sans-serif',
    rotation: 0,
    margin: 16,
    showOnAllImages: false,
    showOnAIImages: true,
    brandColors: companyInfo?.brandColors || ['#000000']
  });

  // Search functionality
  const handleSearch = useCallback(async (query: string, config: SearchConfiguration): Promise<GoogleImageResult[]> => {
    setIsLoading(true);
    
    try {
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock search results
      const mockResults: GoogleImageResult[] = Array.from({ length: 24 }, (_, i) => ({
        id: `result-${Date.now()}-${i}`,
        url: `https://picsum.photos/800/600?random=${Date.now() + i}`,
        thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now() + i}`,
        title: `${query} - Result ${i + 1}`,
        description: `High-quality image related to ${query}`,
        source: i % 3 === 0 ? 'homedepot.com' : i % 3 === 1 ? 'lowes.com' : 'menards.com',
        domain: i % 3 === 0 ? 'homedepot.com' : i % 3 === 1 ? 'lowes.com' : 'menards.com',
        width: 800,
        height: 600,
        size: `${150 + Math.floor(Math.random() * 300)} KB`,
        format: 'jpg'
      }));

      setSearchResults(mockResults);
      return mockResults;
    } finally {
      setIsLoading(false);
    }
  }, [searchHistory]);

  // Image library management
  const handleSaveToLibrary = useCallback(async (image: GoogleImageResult): Promise<void> => {
    if (savedImages.has(image.id)) return;

    const libraryImage: LibraryImage = {
      id: `lib-${Date.now()}`,
      url: image.url,
      thumbnailUrl: image.thumbnailUrl,
      title: image.title,
      description: image.description,
      tags: image.title.toLowerCase().split(' ').slice(0, 5),
      source: 'search',
      domain: image.domain,
      width: image.width,
      height: image.height,
      size: image.size,
      format: image.format,
      savedAt: new Date().toISOString(),
      projectId: projectId,
      projectName: projectId ? 'Current Project' : undefined,
      folder: undefined,
      isFavorite: false,
      usage: 'inspiration'
    };

    setLibraryImages(prev => [libraryImage, ...prev]);
    setSavedImages(prev => new Set(prev).add(image.id));
  }, [savedImages, projectId]);

  const handleImageUpdate = useCallback(async (imageId: string, updates: Partial<LibraryImage>): Promise<void> => {
    setLibraryImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    ));
  }, []);

  const handleImageDelete = useCallback(async (imageId: string): Promise<void> => {
    setLibraryImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const handleFolderCreate = useCallback(async (folder: Omit<ImageFolder, 'id' | 'imageCount' | 'createdAt'>): Promise<void> => {
    const newFolder: ImageFolder = {
      id: `folder-${Date.now()}`,
      imageCount: 0,
      createdAt: new Date().toISOString(),
      ...folder
    };
    setFolders(prev => [...prev, newFolder]);
  }, []);

  const handleFolderDelete = useCallback(async (folderId: string): Promise<void> => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    // Remove folder from images
    setLibraryImages(prev => prev.map(img => 
      img.folder === folderId ? { ...img, folder: undefined } : img
    ));
  }, []);

  // AI editing functionality
  const handleAIEdit = useCallback((image: GoogleImageResult | LibraryImage) => {
    setSelectedImage(image);
    setShowAIEditor(true);
  }, []);

  const handleAIEditComplete = useCallback((result: AIEditResult) => {
    // Convert AI result to library image and save
    const libraryImage: LibraryImage = {
      id: result.id,
      url: result.editedImageUrl,
      thumbnailUrl: result.editedImageUrl,
      title: `AI Enhanced: ${result.prompt.slice(0, 50)}...`,
      description: `AI-generated image from: ${result.prompt}`,
      tags: ['ai-generated', 'enhanced', ...result.prompt.toLowerCase().split(' ').slice(0, 3)],
      source: 'ai',
      domain: 'nano-banana.ai',
      width: selectedImage?.width || 800,
      height: selectedImage?.height || 600,
      size: '350 KB',
      format: 'jpg',
      savedAt: result.createdAt,
      projectId: projectId,
      projectName: projectId ? 'Current Project' : undefined,
      folder: undefined,
      isFavorite: false,
      usage: 'other'
    };

    setLibraryImages(prev => [libraryImage, ...prev]);
    setShowAIEditor(false);
    setSelectedImage(null);
    setMode('library'); // Switch to library to show result
  }, [selectedImage, projectId]);

  // Reference mixing
  const handleReferenceSelect = useCallback((image: GoogleImageResult) => {
    if (selectedReferences.has(image.id)) {
      setSelectedReferences(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.id);
        return newSet;
      });
      setReferenceImages(prev => prev.filter(img => img.id !== image.id));
    } else {
      setSelectedReferences(prev => new Set(prev).add(image.id));
      setReferenceImages(prev => [...prev, image]);
    }
  }, [selectedReferences]);

  const handleStartReferenceMixing = useCallback((baseImage: GoogleImageResult | LibraryImage) => {
    if (referenceImages.length === 0) {
      alert('Please select reference images first');
      return;
    }
    setSelectedImage(baseImage);
    setShowReferenceMixer(true);
  }, [referenceImages]);

  const handleMixComplete = useCallback((layers: MixingLayer[], prompt: string) => {
    setShowReferenceMixer(false);
    // Start AI editing with the mixed layers
    if (selectedImage) {
      setShowAIEditor(true);
    }
  }, [selectedImage]);

  // Integration with FieldTime
  const handleFieldTimeIntegration = useCallback(() => {
    if (onIntegrateWithFieldTime) {
      const selectedLibraryImages = libraryImages.filter(img => 
        img.projectId === projectId
      );
      onIntegrateWithFieldTime(selectedLibraryImages);
    }
  }, [libraryImages, projectId, onIntegrateWithFieldTime]);

  const getPreviewImage = () => {
    return searchResults[0]?.url || libraryImages[0]?.url || 'https://picsum.photos/800/600?random=preview';
  };

  return (
    <div className={`image-search-app ${className}`}>
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <nav className="flex space-x-6">
            <button
              onClick={() => setMode('search')}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'search'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Images
            </button>
            <button
              onClick={() => setMode('library')}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'library'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Library className="w-4 h-4 mr-2" />
              My Library ({libraryImages.length})
            </button>
            <button
              onClick={() => setMode('watermark-settings')}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'watermark-settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Watermark
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {selectedReferences.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-purple-600 font-medium">
                  {selectedReferences.size} selected for mixing
                </span>
                <button
                  onClick={() => setSelectedReferences(new Set())}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Clear
                </button>
              </div>
            )}
            {onIntegrateWithFieldTime && projectId && (
              <button
                onClick={handleFieldTimeIntegration}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync to FieldTime
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {mode === 'search' && (
          <div className="space-y-6">
            <ImageSearchInterface
              onSearch={handleSearch}
              onImageSelect={(image) => setSelectedImage(image)}
              onSaveToLibrary={handleSaveToLibrary}
              searchHistory={searchHistory}
              isLoading={isLoading}
            />
            
            {searchResults.length > 0 && (
              <SearchResultsGrid
                results={searchResults}
                onImageSelect={(image) => setSelectedImage(image)}
                onSaveToLibrary={handleSaveToLibrary}
                onAIEdit={handleAIEdit}
                onReferenceSelect={handleReferenceSelect}
                savedImages={savedImages}
                isLoading={isLoading}
                showAIFeatures={true}
                showReferenceMode={referenceImages.length > 0 || selectedReferences.size > 0}
                selectedReferences={selectedReferences}
              />
            )}
          </div>
        )}

        {mode === 'library' && (
          <ImageLibrary
            images={libraryImages}
            folders={folders}
            onImageSelect={(image) => setSelectedImage(image)}
            onImageDelete={handleImageDelete}
            onImageUpdate={handleImageUpdate}
            onFolderCreate={handleFolderCreate}
            onFolderDelete={handleFolderDelete}
            onAIEdit={handleAIEdit}
            showAIFeatures={true}
          />
        )}

        {mode === 'watermark-settings' && (
          <CompanyWatermark
            currentSettings={watermarkSettings}
            onSettingsChange={setWatermarkSettings}
            companyInfo={companyInfo}
            previewImage={getPreviewImage()}
          />
        )}
      </div>

      {/* Modals */}
      {showAIEditor && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AIMagicWand
            baseImage={selectedImage}
            referenceImages={referenceImages}
            onEditComplete={handleAIEditComplete}
            onClose={() => {
              setShowAIEditor(false);
              setSelectedImage(null);
            }}
            companySettings={watermarkSettings.enabled ? {
              name: watermarkSettings.companyName,
              logo: watermarkSettings.logo,
              watermarkEnabled: watermarkSettings.showOnAIImages,
              brandColors: watermarkSettings.brandColors
            } : undefined}
          />
        </div>
      )}

      {showReferenceMixer && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ReferenceImageMixer
            baseImage={selectedImage}
            referenceImages={referenceImages}
            onMixComplete={handleMixComplete}
            onClose={() => {
              setShowReferenceMixer(false);
              setSelectedImage(null);
            }}
          />
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-50 border-t p-3 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Search Results: {searchResults.length}</span>
            <span>Library Images: {libraryImages.length}</span>
            <span>Folders: {folders.length}</span>
          </div>
          <div className="flex items-center space-x-4">
            {watermarkSettings.enabled && (
              <div className="flex items-center text-blue-600">
                <Sparkles className="w-4 h-4 mr-1" />
                <span>Watermark Active</span>
              </div>
            )}
            {selectedReferences.size > 0 && (
              <div className="flex items-center text-purple-600">
                <Layers className="w-4 h-4 mr-1" />
                <span>{selectedReferences.size} for mixing</span>
              </div>
            )}
            {currentUser && (
              <span>User: {currentUser.name} ({currentUser.role})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSearchApp;