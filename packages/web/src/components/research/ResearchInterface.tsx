"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface ResearchInterfaceProps {
  onSearch: (query: string, type?: string, context?: any) => void;
  isSearching: boolean;
  currentQuery: string;
}

export function ResearchInterface({
  onSearch,
  isSearching,
  currentQuery,
}: ResearchInterfaceProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  };

  const handleQuickSearch = (quickQuery: string, type: string) => {
    setQuery(quickQuery);
    setSearchType(type);
    onSearch(quickQuery, type);
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about suppliers, building codes, materials, installation techniques..."
            rows={3}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        {/* Quick Search Options */}
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

        {/* Search Button */}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            !query.trim() || isSearching
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Researching...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Get Research</span>
            </>
          )}
        </button>
      </form>

      {/* Current Search Status */}
      {currentQuery && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Current search:</strong> {currentQuery}
          </p>
        </div>
      )}
    </div>
  );
}
