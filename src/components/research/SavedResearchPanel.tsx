'use client';

import { SavedResearch } from '@contractor-platform/types';
import { Search, Trash2, ExternalLink, Tag, Calendar, BookOpen } from 'lucide-react';

interface SavedResearchPanelProps {
  savedResearch: SavedResearch[];
  onDelete: (id: string) => void;
  onResearch: (query: string) => void;
  selectedProject?: string;
}

export function SavedResearchPanel({ 
  savedResearch, 
  onDelete, 
  onResearch, 
  selectedProject 
}: SavedResearchPanelProps) {
  const filteredResearch = savedResearch.filter(item => 
    !selectedProject || item.project_id === selectedProject
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (filteredResearch.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No saved research yet
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedProject 
            ? 'No research saved for this project yet'
            : 'Save research results to access them later'
          }
        </p>
        <button
          onClick={() => onResearch('Find local suppliers')}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Search className="w-4 h-4 mr-2" />
          Start Researching
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredResearch.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {item.query}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(item.created_at)}
                </div>
                <div className={`px-2 py-1 rounded-full ${getConfidenceColor(item.result.confidence)}`}>
                  {Math.round(item.result.confidence * 100)}% confidence
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Answer Preview */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3">
              {item.result.answer.substring(0, 200)}...
            </p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notes:</strong> {item.notes}
              </p>
            </div>
          )}

          {/* Sources Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{item.result.sources.length} sources</span>
              <span>{item.result.related_queries.length} related queries</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onResearch(item.query)}
                className="flex items-center px-3 py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded text-sm"
              >
                <Search className="w-3 h-3 mr-1" />
                Research again
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}