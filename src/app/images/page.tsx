'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Image as ImageIcon, 
  Wand2, 
  Plus,
  ExternalLink,
  Download,
  Heart,
  Settings,
  Camera
} from 'lucide-react';
import { MagicWandModal } from '@/components/images/MagicWandModal';

interface ImageSearchResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  retailer: 'homedepot' | 'lowes' | 'menards' | 'custom';
  originalUrl: string; // Link back to retailer website
  price?: string;
  rating?: number;
}

interface LibraryImage {
  id: string;
  url: string;
  title: string;
  source?: string;
  tags: string[];
  addedDate: string;
  projectId?: string;
  folder?: string;
  originalUrl?: string; // Link back to retailer website
  retailer?: string;
}

export default function ImagesPage() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'library' | 'generator'>('shopping');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<LibraryImage[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Smart model selection: 1 image = nano-banana, 2+ images = gen4-turbo
  const getSmartModel = () => {
    const totalImages = selectedReferences.length;
    return totalImages <= 1 ? 'nano-banana' : 'gen4-turbo';
  };
  
  const [selectedModel, setSelectedModel] = useState<'nano-banana' | 'gen4-turbo' | 'auto'>('auto');
  const [manualModelOverride, setManualModelOverride] = useState<'nano-banana' | 'gen4-turbo' | null>(null);
  
  // Retailer settings with contractor control
  const [enabledRetailers, setEnabledRetailers] = useState({
    homedepot: true,
    lowes: true,
    menards: false,
  });
  const [customRetailers, setCustomRetailers] = useState<string[]>(['build.com', 'ferguson.com', 'wayfair.com', 'houzz.com']);
  const [searchEntireWeb, setSearchEntireWeb] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState('');
  
  // Library organization
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [libraryView, setLibraryView] = useState<'grid' | 'large'>('large');
  
  // Magic Wand Modal State
  const [showMagicWand, setShowMagicWand] = useState(false);
  const [magicWandSource, setMagicWandSource] = useState<any>(null);
  
  // Upload functionality
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data with downloadable Unsplash URLs (these will work with Replicate)
  useEffect(() => {
    const sampleLibrary: LibraryImage[] = [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600',
        title: 'Modern White Kitchen Cabinets',
        source: 'Unsplash',
        tags: ['kitchen', 'cabinets', 'white', 'modern'],
        addedDate: '2025-01-20T10:30:00Z',
        projectId: 'proj-1',
        folder: 'kitchen-inspiration',
      },
      {
        id: '2', 
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600',
        title: 'Subway Tile Bathroom',
        source: 'Unsplash',
        tags: ['bathroom', 'tile', 'subway', 'white'],
        addedDate: '2025-01-18T14:20:00Z',
        projectId: 'proj-2',
        folder: 'bathroom-ideas',
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600',
        title: 'Hardwood Flooring Installation',
        source: 'Unsplash',
        tags: ['flooring', 'hardwood', 'oak', 'natural'],
        addedDate: '2025-01-15T09:45:00Z',
        projectId: 'proj-1',
        folder: 'flooring-options',
      },
    ];
    
    setLibraryImages(sampleLibrary);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Get enabled retailers
      const activeRetailers = Object.entries(enabledRetailers)
        .filter(([_, enabled]) => enabled)
        .map(([retailer, _]) => retailer);
      
      // Build search parameters
      const searchParams = new URLSearchParams({
        q: searchTerm,
        retailers: activeRetailers.join(','),
        customSites: customRetailers.join(','),
        searchWeb: searchEntireWeb.toString()
      });

      // Call Google Custom Search API
      const response = await fetch(`/api/google-images?${searchParams}`);
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
      } else {
        console.error('No results returned:', data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveToLibrary = async (searchResult: ImageSearchResult) => {
    try {
      // Download the image locally first
      const downloadResponse = await fetch('/api/images/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: searchResult.url,
          filename: searchResult.title,
          title: searchResult.title
        })
      });
      
      const downloadData = await downloadResponse.json();
      
      if (downloadData.success) {
        // Use the local URL for the library image
        const newLibraryImage: LibraryImage = {
          id: `lib-${Date.now()}`,
          url: downloadData.localUrl, // Use local URL instead of remote
          title: searchResult.title,
          source: searchResult.source,
          tags: [searchResult.retailer, 'shopping'],
          addedDate: new Date().toISOString(),
          originalUrl: searchResult.originalUrl, // Keep retailer link
          retailer: searchResult.retailer,
        };
        
        setLibraryImages(prev => [newLibraryImage, ...prev]);
        console.log('Image downloaded and saved locally:', downloadData.localUrl);
      } else {
        console.error('Failed to download image:', downloadData.error);
        // Fallback to remote URL if download fails
        const newLibraryImage: LibraryImage = {
          id: `lib-${Date.now()}`,
          url: searchResult.url,
          title: searchResult.title,
          source: searchResult.source,
          tags: [searchResult.retailer, 'shopping'],
          addedDate: new Date().toISOString(),
        };
        
        setLibraryImages(prev => [newLibraryImage, ...prev]);
      }
    } catch (error) {
      console.error('Save to library failed:', error);
    }
  };

  const handleSelectReference = (image: LibraryImage) => {
    if (selectedReferences.length >= 3) {
      alert('Maximum 3 reference images allowed');
      return;
    }
    
    if (selectedReferences.find(ref => ref.id === image.id)) {
      setSelectedReferences(prev => prev.filter(ref => ref.id !== image.id));
    } else {
      setSelectedReferences(prev => [...prev, image]);
    }
  };

  const handleMagicWandClick = (image: any, source: 'search' | 'library') => {
    setMagicWandSource({
      ...image,
      sourceType: source
    });
    setShowMagicWand(true);
  };

  const handleAIGeneration = (sourceImage: any, referenceImage: LibraryImage | null, prompt: string) => {
    console.log('AI Generation:', { sourceImage, referenceImage, prompt });
    // Real AI generation would happen here
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // Create a local URL for the uploaded file
        const fileUrl = URL.createObjectURL(file);
        
        // Add to library with "User Upload" source
        const newLibraryImage: LibraryImage = {
          id: `upload-${Date.now()}-${Math.random()}`,
          url: fileUrl,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          source: 'User Upload',
          tags: ['upload', 'user-content'],
          addedDate: new Date().toISOString(),
          retailer: 'user-upload',
        };
        
        setLibraryImages(prev => [newLibraryImage, ...prev]);
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for AI generation');
      return;
    }
    
    if (selectedReferences.length === 0) {
      alert('Please select at least one reference image');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/replicate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: manualModelOverride || getSmartModel(), // Use manual override or smart selection
          prompt,
          sourceImage: selectedReferences[0]?.url, // First reference becomes source
          referenceImages: selectedReferences.slice(1, 3).map(ref => ref.url) // Others become references
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Generation response:', data);
        setGeneratedImage(data.imageUrl);
        // Removed annoying popup alert
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      console.error('Full error details:', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const presetPrompts = [
    'Add modern window trim',
    'Change exterior color',
    'Add landscaping elements', 
    'Upgrade front door',
    'Add outdoor lighting',
    'Modernize siding style',
  ];

  const getRetailerLogo = (retailer: string) => {
    const logos = {
      homedepot: '🏠',
      lowes: '🔨', 
      menards: '🏪',
      custom: '🌐',
    };
    return logos[retailer as keyof typeof logos] || '🌐';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Images & Design Library</h1>
        <p className="text-gray-600">
          Search for design inspiration, manage your image library, and generate AI-enhanced visuals
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'shopping'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Shopping
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          My Library ({libraryImages.length})
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'generator'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          AI Generator
        </button>
      </div>

      {/* Shopping Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {/* Search Interface */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Design Inspiration</h2>
            
            <div className="flex space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for design elements (e.g., purple door, subway tile, kitchen cabinets)..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Retailer Selection with Contractor Controls */}
            <div className="space-y-4">
              {/* Default Retailers */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Search in:</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabledRetailers.homedepot}
                    onChange={(e) => setEnabledRetailers(prev => ({...prev, homedepot: e.target.checked}))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">🏠 Home Depot</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabledRetailers.lowes}
                    onChange={(e) => setEnabledRetailers(prev => ({...prev, lowes: e.target.checked}))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">🔨 Lowe's</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabledRetailers.menards}
                    onChange={(e) => setEnabledRetailers(prev => ({...prev, menards: e.target.checked}))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">🏪 Menards</span>
                </label>
              </div>

              {/* Custom Sites */}
              {customRetailers.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Custom sites:</span>
                  {customRetailers.map((site, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      🌐 {site}
                      <button
                        onClick={() => setCustomRetailers(prev => prev.filter((_, i) => i !== index))}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddSite(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Custom Site
                </button>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={searchEntireWeb}
                    onChange={(e) => setSearchEntireWeb(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Search entire web</span>
                </label>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results for "{searchTerm}"
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="relative mb-3">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-full object-contain rounded-lg bg-gray-50 max-h-56"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm">
                          {getRetailerLogo(result.retailer)} {result.source}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleMagicWandClick(result, 'search')}
                        className="absolute top-2 right-2 p-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                      >
                        <Wand2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                      {result.title}
                    </h4>
                    
                    {result.price && (
                      <p className="text-green-600 font-semibold text-sm mb-2">
                        {result.price}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => window.open(result.originalUrl, '_blank')}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View on Site
                      </button>
                      <button
                        onClick={() => handleSaveToLibrary(result)}
                        className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Library Tab - Enhanced with Folders */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Folders */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Folders</h3>
                <button 
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedFolder === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  📂 All Images ({libraryImages.length})
                </button>
                
                {['kitchen-inspiration', 'bathroom-ideas', 'flooring-options', 'exterior-design', 'landscaping'].map(folder => {
                  const folderCount = libraryImages.filter(img => img.folder === folder).length;
                  return (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedFolder === folder 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      📁 {folder.replace('-', ' ')} ({folderCount})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Library Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedFolder === 'all' ? 'My Image Library' : selectedFolder.replace('-', ' ')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {libraryImages.filter(img => selectedFolder === 'all' || img.folder === selectedFolder).length} images
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setLibraryView('large')}
                      className={`px-3 py-1 rounded text-sm ${
                        libraryView === 'large' ? 'bg-white shadow-sm' : ''
                      }`}
                    >
                      Large
                    </button>
                    <button
                      onClick={() => setLibraryView('grid')}
                      className={`px-3 py-1 rounded text-sm ${
                        libraryView === 'grid' ? 'bg-white shadow-sm' : ''
                      }`}
                    >
                      Grid
                    </button>
                  </div>
                  
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Image Grid */}
              <div className={`grid gap-4 ${
                libraryView === 'large' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
              }`}>
                {libraryImages
                  .filter(image => selectedFolder === 'all' || image.folder === selectedFolder)
                  .map((image) => (
                    <div key={image.id} className="bg-gray-50 rounded-lg p-3 hover:shadow-lg transition-shadow group">
                      <div className="relative mb-3">
                        <img
                          src={image.url}
                          alt={image.title}
                          className={`w-full object-contain rounded-lg cursor-pointer group-hover:scale-105 transition-transform bg-gray-50 ${
                            libraryView === 'large' ? 'h-48' : 'h-24'
                          }`}
                          onClick={() => {
                            alert(`🖼️ Full screen view: ${image.title}\n\n✨ Magic wand available\n📁 Folder: ${image.folder}\n📅 Added: ${new Date(image.addedDate).toLocaleDateString()}`);
                          }}
                        />
                        
                        {/* Magic Wand Button */}
                        <button 
                          onClick={() => handleMagicWandClick(image, 'library')}
                          className="absolute top-2 right-2 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        
                        {/* Favorite Button */}
                        <button className="absolute bottom-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Heart className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {image.title}
                        </h4>
                        
                        {image.source && (
                          <p className="text-xs text-gray-600">
                            📍 {image.source}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                          {image.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          📅 {new Date(image.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty State */}
              {libraryImages.filter(img => selectedFolder === 'all' || img.folder === selectedFolder).length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No images in this folder</h3>
                  <p className="text-gray-600 mb-4">
                    Add images by searching and saving, or upload from your device
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button 
                      onClick={() => setActiveTab('shopping')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      🔍 Search Images
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      📁 Upload Images
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Tab - Desktop Layout: References Left, Generation Right */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Reference Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reference Images (Select up to 3)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Array.from({length: 3}).map((_, index) => (
                  <div 
                    key={index}
                    className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center ${
                      selectedReferences[index] 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {selectedReferences[index] ? (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedReferences[index].url}
                          alt={selectedReferences[index].title}
                          className="w-full object-contain rounded-lg bg-gray-50 max-h-48"
                        />
                        <button
                          onClick={() => setSelectedReferences(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Reference {index + 1}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Browse Library for References */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Browse Your Library:</h3>
                
                {/* Folder Selector */}
                <div className="flex items-center space-x-2 mb-4">
                  <select 
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">All Images ({libraryImages.length})</option>
                    <option value="kitchen-inspiration">Kitchen Ideas (1)</option>
                    <option value="bathroom-ideas">Bathroom Ideas (1)</option> 
                    <option value="flooring-options">Flooring Options (1)</option>
                  </select>
                </div>
                
                {/* Clean Reference Grid */}
                <div className="grid grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                  {libraryImages
                    .filter(image => selectedFolder === 'all' || image.folder === selectedFolder)
                    .map((image) => (
                      <div key={image.id} className="space-y-1">
                        <button
                          onClick={() => handleSelectReference(image)}
                          className={`relative w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all ${
                            selectedReferences.find(ref => ref.id === image.id)
                              ? 'border-purple-500 ring-2 ring-purple-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-contain bg-gray-50"
                          />
                          {selectedReferences.find(ref => ref.id === image.id) && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                        </button>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {image.title.split(' ').slice(0, 3).join(' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {image.source}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                
                {libraryImages.filter(img => selectedFolder === 'all' || img.folder === selectedFolder).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No images in this folder</p>
                    <button 
                      onClick={() => setActiveTab('shopping')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Search & Save Images →
                    </button>
                  </div>
                )}
              </div>

              {/* Model Selection with Auto Option */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model Selection
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    const value = e.target.value as 'nano-banana' | 'gen4-turbo' | 'auto';
                    setSelectedModel(value);
                    if (value !== 'auto') {
                      setManualModelOverride(value);
                    } else {
                      setManualModelOverride(null);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="auto">🤖 Auto-Select (Recommended)</option>
                  <option value="nano-banana">🍌 Nano Banana - Style Transfer & Editing</option>
                  <option value="gen4-turbo">⚡ Gen4 Turbo - Multi-Image Combining</option>
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  {selectedModel === 'auto' ? (
                    <span>
                      Currently: <strong>
                        {getSmartModel() === 'nano-banana' ? 'Nano Banana' : 'Gen4 Turbo'}
                      </strong> ({selectedReferences.length} image{selectedReferences.length !== 1 ? 's' : ''})
                    </span>
                  ) : (
                    <span>Manual override: <strong>{selectedModel === 'nano-banana' ? 'Nano Banana' : 'Gen4 Turbo'}</strong></span>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Generation Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create (e.g., 'Add modern window trim to this house exterior')..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Preset Prompts */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {presetPrompts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setPrompt(preset)}
                      className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-sm rounded-full transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || selectedReferences.length === 0}
                  className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate AI Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Generated Result */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Result</h3>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={generatedImage}
                      alt="AI Generated"
                      className="w-full rounded-lg shadow-sm"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Loudon Construction
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                      💾 Save to Library
                    </button>
                    <button 
                      onClick={() => window.open(generatedImage || '', '_blank')}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      🔍 Full Screen
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      📤 Share
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    AI Generated • Company Watermarked
                  </div>
                </div>
              ) : (
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Wand2 className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-sm">Generated image will appear here</p>
                    <p className="text-xs">Select references and enter prompt</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Site Modal */}
      {showAddSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Website</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Domain
                </label>
                <input
                  type="text"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  placeholder="amazon.com (without https://)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: amazon.com, build.com, wayfair.com, ferguson.com
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Adding custom sites lets you search contractor supply stores, 
                  specialty retailers, or manufacturer websites for specific products.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddSite(false);
                  setNewSite('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSite.trim() && !customRetailers.includes(newSite.trim())) {
                    setCustomRetailers(prev => [...prev, newSite.trim()]);
                    setShowAddSite(false);
                    setNewSite('');
                    alert(`✅ Added ${newSite.trim()} to custom search sites!\n\nYou can now search this site along with Home Depot and Lowe's.`);
                  } else if (customRetailers.includes(newSite.trim())) {
                    alert('This site is already in your custom list.');
                  }
                }}
                disabled={!newSite.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Add Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic Wand Modal */}
      {showMagicWand && magicWandSource && (
        <MagicWandModal
          isOpen={showMagicWand}
          onClose={() => {
            setShowMagicWand(false);
            setMagicWandSource(null);
          }}
          sourceImage={magicWandSource}
          libraryImages={libraryImages}
          onGenerate={handleAIGeneration}
        />
      )}
    </div>
  );
}