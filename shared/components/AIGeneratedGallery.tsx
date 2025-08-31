'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Share, Filter, Calendar, Search, TrendingUp, Eye } from 'lucide-react';

interface AIGeneratedImage {
  id: string;
  url: string;
  originalUrl: string;
  prompt: string;
  context: 'field-log' | 'chat' | 'document' | 'calendar';
  confidence: number;
  createdAt: string;
  projectId?: string;
  projectName?: string;
  editMetadata: {
    processingTime: number;
    modelVersion: string;
    iterations: number;
  };
  tags?: string[];
}

interface AIUsageStats {
  totalEdits: number;
  averageConfidence: number;
  topPrompts: Array<{ prompt: string; count: number }>;
  contextBreakdown: Record<string, number>;
  timeSeriesData: Array<{ date: string; edits: number }>;
  successRate: number;
  averageProcessingTime: number;
}

interface AIGeneratedGalleryProps {
  projectId?: string;
  userId?: string;
  filter?: 'all' | 'field-logs' | 'chat' | 'documents';
  sortBy?: 'date' | 'confidence' | 'context';
  showStats?: boolean;
  className?: string;
}

export function AIGeneratedGallery({ 
  projectId, 
  userId, 
  filter = 'all', 
  sortBy = 'date',
  showStats = true,
  className = ''
}: AIGeneratedGalleryProps) {
  const [images, setImages] = useState<AIGeneratedImage[]>([]);
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState(filter);
  const [currentSort, setCurrentSort] = useState(sortBy);

  // Mock data - in real implementation, this would come from API
  const mockImages: AIGeneratedImage[] = [
    {
      id: 'ai-1',
      url: 'https://picsum.photos/400/400?random=1&ai=edited',
      originalUrl: 'https://picsum.photos/400/400?random=1',
      prompt: 'Remove background and add professional lighting',
      context: 'field-log',
      confidence: 95,
      createdAt: '2024-01-15T10:30:00Z',
      projectId: 'project-1',
      projectName: 'Johnson Kitchen Remodel',
      editMetadata: {
        processingTime: 3200,
        modelVersion: 'gemini-2.5-flash',
        iterations: 1
      },
      tags: ['background-removal', 'lighting', 'professional']
    },
    {
      id: 'ai-2',
      url: 'https://picsum.photos/400/400?random=2&ai=edited',
      originalUrl: 'https://picsum.photos/400/400?random=2',
      prompt: 'Enhance colors and brightness for better visibility',
      context: 'chat',
      confidence: 88,
      createdAt: '2024-01-14T15:45:00Z',
      projectId: 'project-2',
      projectName: 'Smith Bathroom Renovation',
      editMetadata: {
        processingTime: 2800,
        modelVersion: 'gemini-2.5-flash',
        iterations: 1
      },
      tags: ['color-enhancement', 'brightness', 'visibility']
    },
    {
      id: 'ai-3',
      url: 'https://picsum.photos/400/400?random=3&ai=edited',
      originalUrl: 'https://picsum.photos/400/400?random=3',
      prompt: 'Clean up construction site and remove clutter',
      context: 'document',
      confidence: 92,
      createdAt: '2024-01-13T09:20:00Z',
      projectId: 'project-1',
      projectName: 'Johnson Kitchen Remodel',
      editMetadata: {
        processingTime: 4100,
        modelVersion: 'gemini-2.5-flash',
        iterations: 2
      },
      tags: ['cleanup', 'construction', 'clutter-removal']
    }
  ];

  const mockStats: AIUsageStats = {
    totalEdits: 47,
    averageConfidence: 91.2,
    topPrompts: [
      { prompt: 'Remove background', count: 12 },
      { prompt: 'Enhance lighting', count: 8 },
      { prompt: 'Clean up construction site', count: 7 },
      { prompt: 'Improve image quality', count: 6 },
      { prompt: 'Add professional look', count: 5 }
    ],
    contextBreakdown: {
      'field-log': 28,
      'chat': 12,
      'document': 5,
      'calendar': 2
    },
    timeSeriesData: [
      { date: '2024-01-10', edits: 3 },
      { date: '2024-01-11', edits: 7 },
      { date: '2024-01-12', edits: 5 },
      { date: '2024-01-13', edits: 12 },
      { date: '2024-01-14', edits: 8 },
      { date: '2024-01-15', edits: 12 }
    ],
    successRate: 94.2,
    averageProcessingTime: 3.4
  };

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setImages(mockImages);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, [projectId, userId]);

  const filteredImages = images.filter(image => {
    const matchesFilter = currentFilter === 'all' || 
      (currentFilter === 'field-logs' && image.context === 'field-log') ||
      (currentFilter === 'chat' && image.context === 'chat') ||
      (currentFilter === 'documents' && image.context === 'document');
    
    const matchesSearch = !searchQuery || 
      image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    switch (currentSort) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'context':
        return a.context.localeCompare(b.context);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getContextIcon = (context: string) => {
    const icons = {
      'field-log': '🏗️',
      'chat': '💬',
      'document': '📄',
      'calendar': '📅'
    };
    return icons[context as keyof typeof icons] || '📸';
  };

  const getContextColor = (context: string) => {
    const colors = {
      'field-log': 'bg-blue-100 text-blue-800',
      'chat': 'bg-green-100 text-green-800',
      'document': 'bg-orange-100 text-orange-800',
      'calendar': 'bg-purple-100 text-purple-800'
    };
    return colors[context as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const downloadImage = async (imageUrl: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-edited-${imageId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const shareImage = async (image: AIGeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Edited Photo',
          text: `Check out this AI-edited photo: "${image.prompt}"`,
          url: image.url
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(image.url);
      alert('Image URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className={`ai-gallery-loading ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-gallery-container ${className}`}>
      {/* Usage Statistics */}
      {showStats && stats && (
        <AIUsageInsights stats={stats} />
      )}

      {/* Header with filters and search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
            AI Generated Images
          </h1>
          <p className="text-gray-600 mt-1">{filteredImages.length} AI-edited photos</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, projects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
            />
          </div>

          {/* Filter */}
          <select 
            value={currentFilter} 
            onChange={(e) => setCurrentFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Sources</option>
            <option value="field-logs">Field Logs</option>
            <option value="chat">Chat Images</option>
            <option value="documents">Documents</option>
          </select>

          {/* Sort */}
          <select 
            value={currentSort} 
            onChange={(e) => setCurrentSort(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="date">Latest First</option>
            <option value="confidence">Highest Confidence</option>
            <option value="context">By Source</option>
          </select>
        </div>
      </div>

      {/* Image Grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image.id} className="group relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={`AI edited: ${image.prompt}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => setSelectedImage(image.id)}
                />
              </div>

              {/* Image overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-sm font-medium truncate mb-1">
                    "{image.prompt}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-200">
                    <span className="flex items-center">
                      <span className="mr-1">{getContextIcon(image.context)}</span>
                      {image.context.replace('-', ' ')}
                    </span>
                    <span>{Math.round(image.confidence)}% confidence</span>
                  </div>
                  {image.projectName && (
                    <p className="text-xs text-gray-300 truncate mt-1">
                      {image.projectName}
                    </p>
                  )}
                </div>
              </div>

              {/* Context badge */}
              <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </div>

              {/* Confidence badge */}
              <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                image.confidence >= 90 ? 'bg-green-100 text-green-800' :
                image.confidence >= 80 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {Math.round(image.confidence)}%
              </div>

              {/* Quick actions */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image.url, image.id);
                    }}
                    className="p-1.5 bg-white/90 text-gray-700 rounded hover:bg-white transition-colors"
                    title="Download image"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareImage(image);
                    }}
                    className="p-1.5 bg-white/90 text-gray-700 rounded hover:bg-white transition-colors"
                    title="Share image"
                  >
                    <Share className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI-edited images yet</h3>
          <p className="text-gray-600">
            Start using the AI edit button on your photos to see them here!
          </p>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={filteredImages.find(img => img.id === selectedImage)!}
          onClose={() => setSelectedImage(null)}
          onDownload={downloadImage}
          onShare={shareImage}
        />
      )}
    </div>
  );
}

// AI Usage Statistics Component
function AIUsageInsights({ stats }: { stats: AIUsageStats }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
        AI Editing Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalEdits}</div>
          <div className="text-sm text-gray-600">Total AI Edits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.averageConfidence}%</div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.averageProcessingTime}s</div>
          <div className="text-sm text-gray-600">Avg Process Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.successRate}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular prompts */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Edit Prompts</h3>
          <div className="space-y-2">
            {stats.topPrompts.map((prompt, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate mr-2">{prompt.prompt}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {prompt.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Context breakdown */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Edit Sources</h3>
          <div className="space-y-2">
            {Object.entries(stats.contextBreakdown).map(([context, count]) => {
              const percentage = Math.round((count / stats.totalEdits) * 100);
              return (
                <div key={context} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <span className="mr-2">
                        {context === 'field-log' ? '🏗️' :
                         context === 'chat' ? '💬' :
                         context === 'document' ? '📄' : '📅'}
                      </span>
                      <span className="capitalize">{context.replace('-', ' ')}</span>
                    </span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Modal Component
function ImageModal({ 
  image, 
  onClose, 
  onDownload, 
  onShare 
}: { 
  image: AIGeneratedImage; 
  onClose: () => void;
  onDownload: (url: string, id: string) => void;
  onShare: (image: AIGeneratedImage) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Edited Photo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="text-center mb-6">
            <img
              src={image.url}
              alt={`AI edited: ${image.prompt}`}
              className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Edit Prompt</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">"{image.prompt}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium capitalize">{image.context.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{Math.round(image.confidence)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium">{(image.editMetadata.processingTime / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{image.editMetadata.modelVersion}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Project</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{image.projectName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {image.tags && image.tags.length > 0 && (
                    <div>
                      <span className="text-gray-600 block mb-1">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {image.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 mt-6 pt-6 border-t">
            <button
              onClick={() => onDownload(image.url, image.id)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={() => onShare(image)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={() => window.open(image.url, '_blank')}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Size
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIGeneratedGallery;