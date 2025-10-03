'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Heart, Download, Share, Sparkles, Plus, Eye, ExternalLink, Info, CheckCircle } from 'lucide-react';
import { GoogleImageResult } from './ImageSearchInterface';

interface SearchResultsGridProps {
  results: GoogleImageResult[];
  onImageSelect: (image: GoogleImageResult) => void;
  onSaveToLibrary: (image: GoogleImageResult) => Promise<void>;
  onAIEdit: (image: GoogleImageResult) => void;
  onReferenceSelect?: (image: GoogleImageResult) => void;
  savedImages?: Set<string>;
  isLoading?: boolean;
  showAIFeatures?: boolean;
  showReferenceMode?: boolean;
  selectedReferences?: Set<string>;
  className?: string;
}

interface TouchState {
  startTime: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export function SearchResultsGrid({
  results,
  onImageSelect,
  onSaveToLibrary,
  onAIEdit,
  onReferenceSelect,
  savedImages = new Set(),
  isLoading = false,
  showAIFeatures = true,
  showReferenceMode = false,
  selectedReferences = new Set(),
  className = ''
}: SearchResultsGridProps) {
  const [selectedImage, setSelectedImage] = useState<GoogleImageResult | null>(null);
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set());
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Haptic feedback for mobile
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [25],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Handle touch interactions for mobile optimization
  const handleTouchStart = useCallback((e: React.TouchEvent, image: GoogleImageResult) => {
    const touch = e.touches[0];
    setTouchState({
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);

    // If finger moved more than 10px, mark as moved
    if (deltaX > 10 || deltaY > 10) {
      setTouchState(prev => prev ? { ...prev, moved: true } : null);
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, image: GoogleImageResult) => {
    if (!touchState) return;

    const touchDuration = Date.now() - touchState.startTime;
    const wasTap = !touchState.moved && touchDuration < 500;
    const wasLongPress = !touchState.moved && touchDuration >= 500;

    if (wasTap) {
      triggerHapticFeedback('light');
      if (showReferenceMode && onReferenceSelect) {
        onReferenceSelect(image);
      } else {
        setSelectedImage(image);
      }
    } else if (wasLongPress) {
      triggerHapticFeedback('medium');
      // Long press to save to library
      handleSaveToLibrary(image);
    }

    setTouchState(null);
  }, [touchState, triggerHapticFeedback, showReferenceMode, onReferenceSelect]);

  const handleSaveToLibrary = useCallback(async (image: GoogleImageResult) => {
    if (savedImages.has(image.id)) return;

    setSavingImages(prev => new Set(prev).add(image.id));
    triggerHapticFeedback('light');

    try {
      await onSaveToLibrary(image);
      triggerHapticFeedback('medium'); // Success feedback
    } catch (error) {
      console.error('Failed to save image:', error);
      triggerHapticFeedback('heavy'); // Error feedback
    } finally {
      setSavingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.id);
        return newSet;
      });
    }
  }, [savedImages, onSaveToLibrary, triggerHapticFeedback]);

  const handleShare = useCallback(async (image: GoogleImageResult) => {
    triggerHapticFeedback('light');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: `Check out this ${image.title} from ${image.domain}`,
          url: image.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(image.url);
        alert('Image URL copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  }, [triggerHapticFeedback]);

  const handleDownload = useCallback(async (image: GoogleImageResult) => {
    triggerHapticFeedback('medium');
    
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
      triggerHapticFeedback('heavy');
    }
  }, [triggerHapticFeedback]);

  if (isLoading) {
    return (
      <div className={`search-results-loading ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="text-center py-6">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Searching images...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`search-results-empty ${className} flex flex-col items-center justify-center py-12 text-center`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
        <p className="text-gray-600 max-w-md">
          Try different search terms or check your spelling. You can also use search operators like quotes for exact phrases.
        </p>
      </div>
    );
  }

  return (
    <div className={`search-results-grid ${className}`}>
      {/* Results count and mode indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center">
          <span className="text-sm text-gray-600">
            {results.length} images found
          </span>
          {showReferenceMode && (
            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Reference Mode - Tap to select
            </span>
          )}
        </div>
        {selectedReferences.size > 0 && (
          <span className="text-sm text-purple-600 font-medium">
            {selectedReferences.size} selected for mixing
          </span>
        )}
      </div>

      {/* Image Grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4"
      >
        {results.map((image) => {
          const isSaved = savedImages.has(image.id);
          const isSaving = savingImages.has(image.id);
          const isReference = selectedReferences.has(image.id);
          const isHovered = hoveredImage === image.id;

          return (
            <div
              key={image.id}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95"
              onMouseEnter={() => setHoveredImage(image.id)}
              onMouseLeave={() => setHoveredImage(null)}
              onTouchStart={(e) => handleTouchStart(e, image)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, image)}
              onClick={() => {
                if (showReferenceMode && onReferenceSelect) {
                  onReferenceSelect(image);
                } else {
                  setSelectedImage(image);
                }
              }}
            >
              {/* Main Image */}
              <img
                src={image.thumbnailUrl}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#f3f4f6"/>
                      <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">
                        Image not available
                      </text>
                    </svg>
                  `)}`;
                }}
              />

              {/* Overlay with controls */}
              <div className={`absolute inset-0 bg-black transition-opacity duration-200 ${
                isHovered || isReference ? 'bg-opacity-40' : 'bg-opacity-0'
              }`}>
                {/* Top row badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  {/* Reference selection indicator */}
                  {isReference && (
                    <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Selected
                    </div>
                  )}
                  
                  {/* Save status */}
                  <div className="flex items-center space-x-1">
                    {isSaved && (
                      <div className="bg-green-600 text-white p-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom overlay with actions - only show on hover/touch */}
                <div className={`absolute bottom-0 left-0 right-0 p-2 transform transition-all duration-200 ${
                  isHovered || ('ontouchstart' in window) ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}>
                  <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-2">
                    {/* Image info */}
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{image.title}</p>
                      <p className="text-xs text-gray-600 truncate">{image.domain}</p>
                      <p className="text-xs text-gray-500">{image.width}×{image.height} • {image.size}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {/* Save to Library */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSaved) handleSaveToLibrary(image);
                        }}
                        disabled={isSaved || isSaving}
                        className={`p-2 rounded text-xs font-medium transition-colors ${
                          isSaved 
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : isSaving
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95'
                        }`}
                        title={isSaved ? 'Already saved' : 'Save to library'}
                      >
                        {isSaving ? (
                          <div className="animate-spin w-4 h-4 border border-gray-400 border-t-transparent rounded-full mx-auto"></div>
                        ) : isSaved ? (
                          <CheckCircle className="w-4 h-4 mx-auto" />
                        ) : (
                          <Plus className="w-4 h-4 mx-auto" />
                        )}
                      </button>

                      {/* AI Edit */}
                      {showAIFeatures && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHapticFeedback('medium');
                            onAIEdit(image);
                          }}
                          className="p-2 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors active:scale-95"
                          title="Edit with AI"
                        >
                          <Sparkles className="w-4 h-4 mx-auto" />
                        </button>
                      )}

                      {/* Share */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(image);
                        }}
                        className="p-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors active:scale-95"
                        title="Share image"
                      >
                        <Share className="w-4 h-4 mx-auto" />
                      </button>

                      {/* Download */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                        className="p-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors active:scale-95"
                        title="Download image"
                      >
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {isSaving && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-full p-2">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <ImagePreviewModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onSave={() => handleSaveToLibrary(selectedImage)}
          onAIEdit={() => {
            setSelectedImage(null);
            onAIEdit(selectedImage);
          }}
          onShare={() => handleShare(selectedImage)}
          onDownload={() => handleDownload(selectedImage)}
          isSaved={savedImages.has(selectedImage.id)}
          showAIFeatures={showAIFeatures}
        />
      )}

      {/* Mobile touch instruction */}
      <div className="md:hidden text-center py-4 text-xs text-gray-500">
        Tap to select • Long press to save
      </div>
    </div>
  );
}

// Image Preview Modal Component
interface ImagePreviewModalProps {
  image: GoogleImageResult;
  onClose: () => void;
  onSave: () => void;
  onAIEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  isSaved: boolean;
  showAIFeatures: boolean;
}

function ImagePreviewModal({
  image,
  onClose,
  onSave,
  onAIEdit,
  onShare,
  onDownload,
  isSaved,
  showAIFeatures
}: ImagePreviewModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <div className="bg-black bg-opacity-50 p-2 rounded-full">
          <span className="text-2xl">×</span>
        </div>
      </button>

      {/* Image container */}
      <div className="max-w-4xl max-h-full w-full flex flex-col">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center mb-4">
          {!imageLoaded && (
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          )}
          <img
            src={image.url}
            alt={image.title}
            className={`max-w-full max-h-full object-contain ${imageLoaded ? 'block' : 'hidden'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </div>

        {/* Image details and actions */}
        <div className="bg-white rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{image.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Source: {image.domain}</span>
              <span>{image.width}×{image.height} • {image.size}</span>
            </div>
            {image.description && (
              <p className="text-sm text-gray-600 mt-2">{image.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              disabled={isSaved}
              className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaved
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>

            {showAIFeatures && (
              <button
                onClick={onAIEdit}
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Edit
              </button>
            )}

            <button
              onClick={onShare}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>

            <button
              onClick={onDownload}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>

          {/* View original link */}
          <div className="mt-4 pt-4 border-t">
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View original on {image.domain}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResultsGrid;