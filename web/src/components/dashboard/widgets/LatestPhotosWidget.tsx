'use client';

import { useState } from 'react';
import { Camera, Wand2, ExternalLink, MoreHorizontal, X } from 'lucide-react';

interface LatestPhotosWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export function LatestPhotosWidget({ onRemove, isEditMode }: LatestPhotosWidgetProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Mock latest photos data
  const latestPhotos = [
    {
      id: '1',
      url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Kitchen+Progress',
      title: 'Kitchen Cabinet Installation',
      timestamp: '2 hours ago',
      project: 'Johnson Kitchen',
      uploadedBy: 'Mike Johnson'
    },
    {
      id: '2', 
      url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Bathroom+Tile',
      title: 'Bathroom Tile Work Complete',
      timestamp: '5 hours ago',
      project: 'Wilson Bathroom',
      uploadedBy: 'Sarah Davis'
    },
    {
      id: '3',
      url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Deck+Foundation',
      title: 'Deck Foundation Pour',
      timestamp: '1 day ago', 
      project: 'Davis Deck',
      uploadedBy: 'Mike Johnson'
    },
    {
      id: '4',
      url: 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Electrical+Work',
      title: 'Electrical Rough-in Complete',
      timestamp: '2 days ago',
      project: 'Johnson Kitchen', 
      uploadedBy: 'Tom Rodriguez'
    },
  ];

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Widget Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Latest Photos</h3>
            <span className="text-sm text-gray-500">({latestPhotos.length})</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {!isEditMode && (
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            {isEditMode && onRemove && (
              <button
                onClick={onRemove}
                className="p-1 text-red-400 hover:text-red-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {latestPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-24 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                />
                
                {/* AI Magic Wand Overlay */}
                <button className="absolute top-2 right-2 p-1 bg-purple-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Wand2 className="w-3 h-3" />
                </button>
                
                {/* Photo Info */}
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {photo.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {photo.timestamp} • {photo.project}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Photos →
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Full size photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Photo Actions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
              <button className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Wand2 className="w-4 h-4 mr-1" />
                AI Enhance
              </button>
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}