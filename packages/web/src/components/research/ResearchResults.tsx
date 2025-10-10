"use client";

import { useState } from "react";
import { ResearchResult } from "@contractor-platform/types";
import {
  ExternalLink,
  Save,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface ResearchResultsProps {
  result: ResearchResult;
  onSave: (result: ResearchResult, tags: string[], notes?: string) => void;
  onRelatedQuery: (query: string, type?: string) => void;
}

export function ResearchResults({
  result,
  onSave,
  onRelatedQuery,
}: ResearchResultsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNotes, setSaveNotes] = useState("");
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSave = () => {
    onSave(result, saveTags, saveNotes.trim() || undefined);
    setShowSaveDialog(false);
    setSaveNotes("");
    setSaveTags([]);
  };

  const addTag = () => {
    if (newTag.trim() && !saveTags.includes(newTag.trim())) {
      setSaveTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const getSourceFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const color =
      percentage >= 85
        ? "text-green-600"
        : percentage >= 70
        ? "text-yellow-600"
        : "text-red-600";
    return { percentage, color };
  };

  const { percentage: confidencePercent, color: confidenceColor } =
    formatConfidence(result.confidence);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">
              Research Results
            </h3>
            <p className="text-sm text-gray-600 truncate">
              &ldquo;{result.query}&rdquo;
            </p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Research
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {saveTags.map((tag) => (
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
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
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
