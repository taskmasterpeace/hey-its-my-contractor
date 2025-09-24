'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Image, 
  Tag, 
  Search, 
  Filter, 
  Grid3X3, 
  Grid2X2, 
  List, 
  Download, 
  Share, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Calendar,
  Folder,
  Star,
  Eye,
  Sparkles,
  FolderPlus,
  Archive
} from 'lucide-react';

export interface LibraryImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  tags: string[];
  source: string;
  domain: string;
  width: number;
  height: number;
  size: string;
  format: string;
  savedAt: string;
  projectId?: string;
  projectName?: string;
  folder?: string;
  isFavorite: boolean;
  usage: 'inspiration' | 'reference' | 'materials' | 'before_after' | 'other';
}

export interface ImageFolder {
  id: string;
  name: string;
  description?: string;
  imageCount: number;
  createdAt: string;
  color: string;
}

interface ImageLibraryProps {
  images: LibraryImage[];
  folders: ImageFolder[];
  onImageSelect: (image: LibraryImage) => void;
  onImageDelete: (imageId: string) => Promise<void>;
  onImageUpdate: (imageId: string, updates: Partial<LibraryImage>) => Promise<void>;
  onFolderCreate: (folder: Omit<ImageFolder, 'id' | 'imageCount' | 'createdAt'>) => Promise<void>;
  onFolderDelete: (folderId: string) => Promise<void>;
  onAIEdit: (image: LibraryImage) => void;
  showAIFeatures?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'date' | 'name' | 'size' | 'project';
type FilterBy = 'all' | 'favorites' | 'inspiration' | 'reference' | 'materials' | 'before_after';

const USAGE_ICONS = {
  inspiration: '💡',
  reference: '📋',
  materials: '🏗️',
  before_after: '🔄',
  other: '📷'
};

const USAGE_COLORS = {
  inspiration: 'bg-yellow-100 text-yellow-800',
  reference: 'bg-blue-100 text-blue-800',
  materials: 'bg-green-100 text-green-800',
  before_after: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800'
};

export function ImageLibrary({
  images,
  folders,
  onImageSelect,
  onImageDelete,
  onImageUpdate,
  onFolderCreate,
  onFolderDelete,
  onAIEdit,
  showAIFeatures = true,
  className = ''
}: ImageLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showTagEditor, setShowTagEditor] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingImage, setEditingImage] = useState<LibraryImage | null>(null);

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let filtered = images;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(image => 
        image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        image.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (filterBy !== 'all') {
      if (filterBy === 'favorites') {
        filtered = filtered.filter(image => image.isFavorite);
      } else {
        filtered = filtered.filter(image => image.usage === filterBy);
      }
    }

    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(image => image.folder === selectedFolder);
    }

    // Sort images
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'size':
          return parseInt(b.size) - parseInt(a.size);
        case 'project':
          return (a.projectName || '').localeCompare(b.projectName || '');
        case 'date':
        default:
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
    });

    return filtered;
  }, [images, searchQuery, filterBy, selectedFolder, sortBy]);

  const handleImageToggleFavorite = useCallback(async (image: LibraryImage) => {
    await onImageUpdate(image.id, { isFavorite: !image.isFavorite });
  }, [onImageUpdate]);

  const handleImageTagsUpdate = useCallback(async (imageId: string, tags: string[]) => {
    await onImageUpdate(imageId, { tags });
    setShowTagEditor(null);
  }, [onImageUpdate]);

  const handleBulkAction = useCallback(async (action: 'delete' | 'favorite' | 'unfavorite', imageIds: string[]) => {
    if (action === 'delete') {
      await Promise.all(imageIds.map(id => onImageDelete(id)));
    } else {
      await Promise.all(imageIds.map(id => 
        onImageUpdate(id, { isFavorite: action === 'favorite' })
      ));
    }
    setSelectedImages(new Set());
  }, [onImageDelete, onImageUpdate]);

  const handleShare = useCallback(async (image: LibraryImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: `Check out this image from my library: ${image.title}`,
          url: image.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(image.url);
      alert('Image URL copied to clipboard!');
    }
  }, []);

  const handleDownload = useCallback(async (image: LibraryImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title.replace(/[^a-zA-Z0-9]/g, '_')}.${image.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  return (
    <div className={`image-library bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Image className="w-5 h-5 mr-2 text-blue-600" />
            Image Library
            <span className="ml-2 text-sm text-gray-500">({filteredImages.length})</span>
          </h2>
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images, tags, projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'compact' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* Folder Filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Folders</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Images</option>
            <option value="favorites">⭐ Favorites</option>
            <option value="inspiration">💡 Inspiration</option>
            <option value="reference">📋 Reference</option>
            <option value="materials">🏗️ Materials</option>
            <option value="before_after">🔄 Before/After</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="date">Latest First</option>
            <option value="name">Name</option>
            <option value="size">File Size</option>
            <option value="project">Project</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedImages.size > 0 && (
          <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-800">
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('favorite', Array.from(selectedImages))}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                <Star className="w-3 h-3 mr-1 inline" />
                Favorite
              </button>
              <button
                onClick={() => handleBulkAction('delete', Array.from(selectedImages))}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-3 h-3 mr-1 inline" />
                Delete
              </button>
              <button
                onClick={() => setSelectedImages(new Set())}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Folders</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedFolder === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <Folder className="w-4 h-4 mr-2" />
              All Images ({images.length})
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: folder.color }}
                />
                {folder.name} ({folder.imageCount})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Images Grid/List */}
      <div className="p-4">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try different search terms' : 'Start saving images from search results to build your library'}
            </p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' :
              viewMode === 'compact' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2' :
              'space-y-3'}
          `}>
            {filteredImages.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                viewMode={viewMode}
                isSelected={selectedImages.has(image.id)}
                onSelect={() => {
                  const newSelected = new Set(selectedImages);
                  if (newSelected.has(image.id)) {
                    newSelected.delete(image.id);
                  } else {
                    newSelected.add(image.id);
                  }
                  setSelectedImages(newSelected);
                }}
                onView={() => onImageSelect(image)}
                onFavorite={() => handleImageToggleFavorite(image)}
                onEdit={() => setEditingImage(image)}
                onDelete={() => onImageDelete(image.id)}
                onAIEdit={() => onAIEdit(image)}
                onShare={() => handleShare(image)}
                onDownload={() => handleDownload(image)}
                onEditTags={() => setShowTagEditor(image.id)}
                showAIFeatures={showAIFeatures}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showFolderModal && (
        <FolderCreateModal
          onClose={() => setShowFolderModal(false)}
          onCreate={onFolderCreate}
        />
      )}

      {showTagEditor && (
        <TagEditorModal
          image={filteredImages.find(img => img.id === showTagEditor)!}
          onClose={() => setShowTagEditor(null)}
          onSave={(tags) => handleImageTagsUpdate(showTagEditor, tags)}
        />
      )}

      {editingImage && (
        <ImageEditModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={(updates) => {
            onImageUpdate(editingImage.id, updates);
            setEditingImage(null);
          }}
        />
      )}
    </div>
  );
}

// Image Card Component
interface ImageCardProps {
  image: LibraryImage;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAIEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  onEditTags: () => void;
  showAIFeatures: boolean;
}

function ImageCard({
  image,
  viewMode,
  isSelected,
  onSelect,
  onView,
  onFavorite,
  onEdit,
  onDelete,
  onAIEdit,
  onShare,
  onDownload,
  onEditTags,
  showAIFeatures
}: ImageCardProps) {
  if (viewMode === 'list') {
    return (
      <div className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mr-3"
        />
        <img
          src={image.thumbnailUrl}
          alt={image.title}
          className="w-12 h-12 object-cover rounded cursor-pointer"
          onClick={onView}
        />
        <div className="flex-1 ml-3">
          <h4 className="font-medium text-gray-900 cursor-pointer" onClick={onView}>
            {image.title}
          </h4>
          <div className="text-xs text-gray-500 mt-1 space-x-2">
            <span>{image.width}×{image.height}</span>
            <span>•</span>
            <span>{image.size}</span>
            {image.projectName && (
              <>
                <span>•</span>
                <span>{image.projectName}</span>
              </>
            )}
          </div>
          <div className="flex items-center mt-2 space-x-1">
            <span className={`px-2 py-1 rounded-full text-xs ${USAGE_COLORS[image.usage]}`}>
              {USAGE_ICONS[image.usage]} {image.usage.replace('_', ' ')}
            </span>
            {image.isFavorite && <Star className="w-4 h-4 text-yellow-500" />}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onFavorite}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              image.isFavorite ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Star className="w-4 h-4" />
          </button>
          {showAIFeatures && (
            <button
              onClick={onAIEdit}
              className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onShare}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded transition-colors"
          >
            <Share className="w-4 h-4" />
          </button>
          <button
            onClick={onDownload}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid and compact view
  return (
    <div className={`group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
    } ${viewMode === 'compact' ? 'aspect-square' : ''}`}>
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-2 border-white shadow-sm"
        />
      </div>

      {/* Favorite badge */}
      {image.isFavorite && (
        <div className="absolute top-2 right-2 z-10">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
        </div>
      )}

      {/* Image */}
      <div className={viewMode === 'compact' ? 'aspect-square' : 'aspect-[4/3]'}>
        <img
          src={image.thumbnailUrl}
          alt={image.title}
          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
          onClick={onView}
        />
      </div>

      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
          <button
            onClick={onView}
            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            title="View image"
          >
            <Eye className="w-4 h-4" />
          </button>
          {showAIFeatures && (
            <button
              onClick={onAIEdit}
              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              title="Edit with AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onShare}
            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            title="Share image"
          >
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode !== 'compact' && (
        <div className="p-3">
          <h4 className="font-medium text-gray-900 text-sm truncate mb-1" title={image.title}>
            {image.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{image.width}×{image.height}</span>
            <span>{image.size}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs ${USAGE_COLORS[image.usage]}`}>
              {USAGE_ICONS[image.usage]} {image.usage.replace('_', ' ')}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={onFavorite}
                className={`p-1 rounded transition-colors ${
                  image.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                }`}
              >
                <Star className="w-3 h-3" />
              </button>
              <button
                onClick={onEditTags}
                className="p-1 text-gray-300 hover:text-blue-500 rounded transition-colors"
                title="Edit tags"
              >
                <Tag className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Folder Create Modal
interface FolderCreateModalProps {
  onClose: () => void;
  onCreate: (folder: Omit<ImageFolder, 'id' | 'imageCount' | 'createdAt'>) => Promise<void>;
}

function FolderCreateModal({ onClose, onCreate }: FolderCreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Create New Folder</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Kitchen Inspiration"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300"
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tag Editor Modal
interface TagEditorModalProps {
  image: LibraryImage;
  onClose: () => void;
  onSave: (tags: string[]) => void;
}

function TagEditorModal({ image, onClose, onSave }: TagEditorModalProps) {
  const [tags, setTags] = useState<string[]>(image.tags);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Tags</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <img
              src={image.thumbnailUrl}
              alt={image.title}
              className="w-16 h-16 object-cover rounded mb-2"
            />
            <p className="text-sm font-medium text-gray-900">{image.title}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tag
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Enter tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(tags)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Edit Modal
interface ImageEditModalProps {
  image: LibraryImage;
  onClose: () => void;
  onSave: (updates: Partial<LibraryImage>) => void;
}

function ImageEditModal({ image, onClose, onSave }: ImageEditModalProps) {
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description || '');
  const [usage, setUsage] = useState(image.usage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      usage
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={image.thumbnailUrl}
              alt={image.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="text-xs text-gray-500">
              <div>{image.width}×{image.height}</div>
              <div>{image.size}</div>
              <div>{image.domain}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Category
            </label>
            <select
              value={usage}
              onChange={(e) => setUsage(e.target.value as LibraryImage['usage'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="inspiration">💡 Inspiration</option>
              <option value="reference">📋 Reference</option>
              <option value="materials">🏗️ Materials</option>
              <option value="before_after">🔄 Before/After</option>
              <option value="other">📷 Other</option>
            </select>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImageLibrary;