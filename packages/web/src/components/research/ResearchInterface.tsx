"use client";

import { useState } from "react";
import React from "react";
import { Search, Sparkles, Zap } from "lucide-react";

interface ResearchInterfaceProps {
  onSearch: (query: string, type?: string, context?: any) => void;
  onStopSearch?: () => void;
  isSearching: boolean;
  currentQuery: string;
  suggestedQuery?: string;
  onQueryChange?: (query: string) => void;
}

export function ResearchInterface({
  onSearch,
  onStopSearch,
  isSearching,
  currentQuery,
  suggestedQuery,
  onQueryChange,
}: ResearchInterfaceProps) {
  const [query, setQuery] = useState("");

  // Update query when suggestedQuery prop changes
  React.useEffect(() => {
    if (suggestedQuery) {
      setQuery(suggestedQuery);
      onQueryChange?.(suggestedQuery);
    }
  }, [suggestedQuery, onQueryChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), "general");
    }
  };

  const handleQuickSearch = (quickQuery: string, type: string) => {
    setQuery(quickQuery);
    // Don't auto-send, let user edit and send manually
  };

  const quickSearches = [
    {
      label: "General construction advice",
      query: "General construction best practices and techniques",
      icon: "🔍",
      type: "general",
      color: "text-blue-600",
    },
    {
      label: "Local lumber suppliers",
      query:
        "Find reliable lumber suppliers in my area with competitive pricing",
      icon: "🏪",
      type: "supplier",
      color: "text-green-600",
    },
    {
      label: "Permit requirements",
      query: "Building permit requirements for home additions",
      icon: "📋",
      type: "regulation",
      color: "text-purple-600",
    },
    {
      label: "Flooring materials",
      query: "Best flooring materials for high-traffic areas comparison",
      icon: "🧱",
      type: "material",
      color: "text-blue-600",
    },
    {
      label: "Installation techniques",
      query:
        "Professional installation techniques for common construction tasks",
      icon: "🔧",
      type: "technique",
      color: "text-green-600",
    },
    {
      label: "Electrical codes",
      query: "Current electrical code requirements for residential kitchens",
      icon: "📋",
      type: "regulation",
      color: "text-purple-600",
    },
    {
      label: "Tool recommendations",
      query: "Essential tools for professional contractors and DIY projects",
      icon: "🔧",
      type: "technique",
      color: "text-green-600",
    },
    {
      label: "Cost estimation",
      query: "Construction cost estimation methods and tools",
      icon: "🔍",
      type: "general",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about local suppliers, building codes, material recommendations, installation techniques, cost estimates..."
              rows={4}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-base placeholder-gray-500 shadow-sm"
            />
          </div>

          {/* Quick Search Suggestions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickSearch(search.query, search.type)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white border shadow-sm hover:shadow-md ${search.color}`}
                disabled={isSearching}
              >
                <span>{search.icon}</span>
                <span className="truncate">{search.label}</span>
              </button>
            ))}
          </div>

          {isSearching && onStopSearch ? (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onStopSearch}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
                title="Stop Research"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </button>
              <div className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-medium bg-gray-100 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                <span>Researching...</span>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
                !query.trim() || isSearching
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Get AI Research</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
