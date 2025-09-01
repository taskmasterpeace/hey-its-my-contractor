'use client';

import { useState } from 'react';
import { ResearchResult } from '@contractor-platform/types';
import { ExternalLink, Save, Copy, Share2, ThumbsUp, ThumbsDown, Tag, FileText } from 'lucide-react';

interface ResearchResultsProps {
  result: ResearchResult;
  onSave: (result: ResearchResult, tags: string[], notes?: string) => void;
  onRelatedQuery: (query: string, type?: string) => void;
}

export function ResearchResults({ result, onSave, onRelatedQuery }: ResearchResultsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSave = () => {
    onSave(result, saveTags, saveNotes.trim() || undefined);
    setShowSaveDialog(false);
    setSaveNotes('');
    setSaveTags([]);
  };

  const addTag = () => {
    if (newTag.trim() && !saveTags.includes(newTag.trim())) {
      setSaveTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const getSourceFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const color = percentage >= 85 ? 'text-green-600' : percentage >= 70 ? 'text-yellow-600' : 'text-red-600';
    return { percentage, color };
  };

  const { percentage: confidencePercent, color: confidenceColor } = formatConfidence(result.confidence);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">Research Results</h3>
            <p className="text-sm text-gray-600 truncate">&ldquo;{result.query}&rdquo;</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <div className={`text-xs font-medium ${confidenceColor}`}>
              {confidencePercent}% confidence
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCopy}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Save research"
              >
                <Save className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {result.answer}
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Sources ({result.sources.length})</h4>
        <div className="space-y-2">
          {result.sources.map((source, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-white border rounded-lg">
              <img
                src={getSourceFavicon(source.domain)}
                alt={source.domain}
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm line-clamp-1"
                >
                  {source.title}
                </a>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {source.snippet}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">{source.domain}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Queries */}
      {result.related_queries.length > 0 && (
        <div className="px-6 py-4 border-t">
          <h4 className="font-medium text-gray-900 mb-3">Related Questions</h4>
          <div className="flex flex-wrap gap-2">
            {result.related_queries.map((relatedQuery, index) => (
              <button
                key={index}
                onClick={() => onRelatedQuery(relatedQuery)}
                className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm rounded-full border border-purple-200 transition-colors"
              >
                {relatedQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="px-6 py-3 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Was this helpful?</span>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Copy Success Message */}
      {copied && (
        <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          Copied to clipboard!
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Research</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {saveTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Add personal notes or context..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                <span>Save Research</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}