'use client';

import React, { useState, useCallback } from 'react';
import { 
  RefreshCw, 
  Upload, 
  Download, 
  Link2, 
  Camera, 
  Calendar, 
  FileText, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Sparkles
} from 'lucide-react';
import { LibraryImage } from './ImageLibrary';
import { AIEditResult } from './AIMagicWand';

export interface FieldTimePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  uploadedAt: string;
  projectId: string;
  userId: string;
  metadata: {
    location?: { lat: number; lng: number };
    weather?: string;
    deviceInfo?: string;
    fileSize: number;
    dimensions: { width: number; height: number };
  };
  tags: string[];
  description?: string;
  linkedToMeeting?: string;
  linkedToTask?: string;
  linkedToLog?: string;
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'link' | 'create_timeline' | 'notify';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  image: LibraryImage | AIEditResult;
  targetProject?: string;
  targetMeeting?: string;
  targetDocument?: string;
  error?: string;
  progress: number;
}

interface FieldTimeIntegrationProps {
  projectId?: string;
  images: LibraryImage[];
  aiResults?: AIEditResult[];
  onSyncToFieldTime: (images: LibraryImage[], options: SyncOptions) => Promise<void>;
  onLinkToMeeting?: (imageId: string, meetingId: string) => Promise<void>;
  onCreateTimelineEntry?: (imageId: string, description: string) => Promise<void>;
  fieldTimePhotos?: FieldTimePhoto[];
  className?: string;
}

export interface SyncOptions {
  createTimelineEntry: boolean;
  linkToCurrentProject: boolean;
  notifyTeamMembers: boolean;
  preserveMetadata: boolean;
  addToDocuments: boolean;
  watermarkImages: boolean;
  tagWithSource: boolean;
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  createTimelineEntry: true,
  linkToCurrentProject: true,
  notifyTeamMembers: false,
  preserveMetadata: true,
  addToDocuments: true,
  watermarkImages: false,
  tagWithSource: true
};

export function FieldTimeIntegration({
  projectId,
  images,
  aiResults = [],
  onSyncToFieldTime,
  onLinkToMeeting,
  onCreateTimelineEntry,
  fieldTimePhotos = [],
  className = ''
}: FieldTimeIntegrationProps) {
  const [syncOptions, setSyncOptions] = useState<SyncOptions>(DEFAULT_SYNC_OPTIONS);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleImageToggle = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  }, [selectedImages.size, images]);

  const handleSync = useCallback(async () => {
    if (selectedImages.size === 0) return;

    setIsSyncing(true);
    const imagesToSync = images.filter(img => selectedImages.has(img.id));
    
    try {
      // Create sync operations
      const operations: SyncOperation[] = imagesToSync.map(image => ({
        id: `sync-${image.id}-${Date.now()}`,
        type: 'upload',
        status: 'pending',
        image,
        targetProject: projectId,
        progress: 0
      }));

      setSyncOperations(operations);
      setShowSyncModal(true);

      // Simulate sync process with progress updates
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        // Update to in progress
        setSyncOperations(prev => prev.map(op => 
          op.id === operation.id ? { ...op, status: 'in_progress' } : op
        ));

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setSyncOperations(prev => prev.map(op => 
            op.id === operation.id ? { ...op, progress } : op
          ));
        }

        // Complete operation
        setSyncOperations(prev => prev.map(op => 
          op.id === operation.id ? { ...op, status: 'completed', progress: 100 } : op
        ));
      }

      // Call the actual sync function
      await onSyncToFieldTime(imagesToSync, syncOptions);
      
      // Clear selections
      setSelectedImages(new Set());
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncOperations(prev => prev.map(op => ({
        ...op,
        status: 'failed',
        error: 'Sync operation failed'
      })));
    } finally {
      setIsSyncing(false);
    }
  }, [selectedImages, images, projectId, onSyncToFieldTime, syncOptions]);

  const getImageStats = useCallback(() => {
    const totalImages = images.length;
    const aiImages = images.filter(img => img.source === 'ai').length;
    const searchImages = images.filter(img => img.source === 'search').length;
    const uploadedImages = images.filter(img => img.source === 'upload').length;
    
    return { totalImages, aiImages, searchImages, uploadedImages };
  }, [images]);

  const stats = getImageStats();

  return (
    <div className={`fieldtime-integration bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
              FieldTime Integration
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sync images to project timeline and documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {selectedImages.size} of {images.length} selected
            </div>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalImages}</div>
            <div className="text-xs text-gray-600">Total Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.aiImages}</div>
            <div className="text-xs text-gray-600">AI Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.searchImages}</div>
            <div className="text-xs text-gray-600">From Search</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.uploadedImages}</div>
            <div className="text-xs text-gray-600">Uploaded</div>
          </div>
        </div>
      </div>

      {/* Sync Options */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Sync Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.createTimelineEntry}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                createTimelineEntry: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Create Timeline Entries</span>
              <p className="text-xs text-gray-600">Add images to project timeline with context</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.linkToCurrentProject}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                linkToCurrentProject: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Link to Current Project</span>
              <p className="text-xs text-gray-600">Associate images with active project</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.addToDocuments}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                addToDocuments: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Add to Documents</span>
              <p className="text-xs text-gray-600">Include in project document library</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.notifyTeamMembers}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                notifyTeamMembers: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Notify Team</span>
              <p className="text-xs text-gray-600">Send notifications to project team</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.watermarkImages}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                watermarkImages: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Apply Watermarks</span>
              <p className="text-xs text-gray-600">Brand images before syncing</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={syncOptions.tagWithSource}
              onChange={(e) => setSyncOptions(prev => ({ 
                ...prev, 
                tagWithSource: e.target.checked 
              }))}
              className="mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Tag with Source</span>
              <p className="text-xs text-gray-600">Add source tags (AI, Search, Upload)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Images Grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Images to Sync</h3>
          <button
            onClick={handleSync}
            disabled={selectedImages.size === 0 || isSyncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Selected ({selectedImages.size})
              </>
            )}
          </button>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Images to Sync</h3>
            <p className="text-gray-600">
              Search for images or use the AI tools to generate content for your project
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map(image => (
              <div
                key={image.id}
                className={`relative group border rounded-lg overflow-hidden transition-all ${
                  selectedImages.has(image.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleImageToggle(image.id)}
                    className="w-4 h-4 text-blue-600 border-2 border-white shadow-sm rounded"
                  />
                </div>

                {/* Source badge */}
                <div className="absolute top-2 right-2 z-10">
                  {image.source === 'ai' && (
                    <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </div>
                  )}
                  {image.source === 'search' && (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                      Search
                    </div>
                  )}
                  {image.source === 'upload' && (
                    <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                      Upload
                    </div>
                  )}
                </div>

                {/* Image */}
                <div className="aspect-square">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate" title={image.title}>
                    {image.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {image.width}×{image.height} • {image.size}
                  </p>
                  {image.usage && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {image.usage.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Actions (on hover) */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                      title="View full size"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = image.url;
                        link.download = image.title;
                        link.click();
                      }}
                      className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing FieldTime Photos */}
      {fieldTimePhotos.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Existing FieldTime Photos ({fieldTimePhotos.length})
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
            {fieldTimePhotos.slice(0, 20).map(photo => (
              <div key={photo.id} className="aspect-square">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover rounded border border-gray-200"
                />
              </div>
            ))}
            {fieldTimePhotos.length > 20 && (
              <div className="aspect-square bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  +{fieldTimePhotos.length - 20}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Sync Progress</h3>
              <p className="text-sm text-gray-600 mt-1">
                Syncing {syncOperations.length} images to FieldTime
              </p>
            </div>

            <div className="p-4 space-y-4">
              {syncOperations.map(operation => (
                <div key={operation.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {operation.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {operation.status === 'failed' && (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    {operation.status === 'in_progress' && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    {operation.status === 'pending' && (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {'title' in operation.image ? operation.image.title : 'AI Generated Image'}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${operation.progress}%` }}
                      />
                    </div>
                    {operation.error && (
                      <p className="text-xs text-red-600 mt-1">{operation.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncOperations([]);
                }}
                disabled={syncOperations.some(op => op.status === 'in_progress')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncOperations.some(op => op.status === 'in_progress') ? 'Syncing...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="p-4 bg-blue-50 border-t">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">FieldTime Integration Benefits:</p>
            <ul className="space-y-1 text-xs">
              <li>• Images automatically tagged with project context</li>
              <li>• Timeline entries created for team visibility</li>
              <li>• Document library updated with searchable metadata</li>
              <li>• Team notifications for important visual updates</li>
              <li>• AI-generated images marked for easy identification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FieldTimeIntegration;