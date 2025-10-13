"use client";

import { useState } from "react";
import { SavedResearch } from "@contractor-platform/types";
import {
  Search,
  Trash2,
  ExternalLink,
  Tag,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Lock,
  Users,
  Edit3,
  Check,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SavedResearchPanelProps {
  savedResearch: SavedResearch[];
  onDelete: (id: string) => void;
  onResearch: (query: string) => void;
  onUpdatePrivacy: (id: string, isPrivate: boolean) => void;
  currentUserId: string | null;
  selectedProject?: string;
  isLoading?: boolean;
}

export function SavedResearchPanel({
  savedResearch,
  onDelete,
  onResearch,
  onUpdatePrivacy,
  currentUserId,
  selectedProject,
  isLoading = false,
}: SavedResearchPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingPrivacy, setEditingPrivacy] = useState<string | null>(null);

  const filteredResearch = savedResearch.filter(
    (item) => !selectedProject || item.project_id === selectedProject
  );

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600 bg-green-100";
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Loading saved research...
        </h3>
        <p className="text-gray-600">
          Please wait while we fetch your research
        </p>
      </div>
    );
  }

  if (filteredResearch.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No saved research yet
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedProject
            ? "No research saved for this project yet"
            : "Save research results to access them later"}
        </p>
        <button
          onClick={() => onResearch("Find local suppliers")}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Search className="w-4 h-4 mr-2" />
          Start Researching
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredResearch.map((item) => {
        const isExpanded = expandedItems.has(item.id);
        return (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            {/* Header - Always Visible */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.query}
                      </h3>

                      {/* Privacy Status/Editor */}
                      {editingPrivacy === item.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              onUpdatePrivacy(item.id, false);
                              setEditingPrivacy(null);
                            }}
                            className={`flex items-center px-2 py-0.5 rounded-full text-xs transition-colors ${
                              !item.isPrivate
                                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                                : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                            }`}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Shared
                          </button>
                          <button
                            onClick={() => {
                              onUpdatePrivacy(item.id, true);
                              setEditingPrivacy(null);
                            }}
                            className={`flex items-center px-2 py-0.5 rounded-full text-xs transition-colors ${
                              item.isPrivate
                                ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300"
                                : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                            }`}
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </button>
                          <button
                            onClick={() => setEditingPrivacy(null)}
                            className="p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {item.isPrivate ? (
                            <div className="flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </div>
                          ) : (
                            <div className="flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Shared
                            </div>
                          )}
                          {/* Show edit button for research owned by current user */}
                          {currentUserId &&
                            item.userId &&
                            String(currentUserId) === String(item.userId) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPrivacy(item.id);
                                }}
                                className="p-0.5 text-gray-400 hover:text-gray-600"
                                title="Edit privacy settings"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(item.created_at)}
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full ${getConfidenceColor(
                          item.result.confidence
                        )}`}
                      >
                        {Math.round(item.result.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete research"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t bg-gray-50">
                <div className="p-4 space-y-4">
                  {/* Full Answer */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        Research Answer
                      </h4>
                      <button
                        onClick={() => handleCopy(item.result.answer)}
                        className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="bg-white rounded-lg p-4 border prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.result.answer}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Sources */}
                  {item.result.sources.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Sources
                      </h4>
                      <div className="space-y-2">
                        {item.result.sources.map((source, index) => (
                          <div
                            key={index}
                            className="bg-white rounded border p-3"
                          >
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {source.title}
                            </a>
                            <p className="text-xs text-gray-500 mt-1">
                              {source.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Questions */}
                  {item.result.related_queries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Related Questions
                      </h4>
                      <div className="space-y-1">
                        {item.result.related_queries.map((query, index) => (
                          <button
                            key={index}
                            onClick={() => onResearch(query)}
                            className="block w-full text-left text-sm text-gray-600 hover:text-purple-600 hover:bg-white p-2 rounded border bg-white hover:border-purple-200 transition-colors"
                          >
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">{item.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      {item.result.sources.length} sources •{" "}
                      {item.result.related_queries.length} related
                    </span>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
