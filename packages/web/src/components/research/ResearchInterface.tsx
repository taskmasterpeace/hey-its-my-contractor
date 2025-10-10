"use client";

import { useState } from "react";
import { Search, Sparkles, Zap } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), "general");
    }
  };

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
        </div>
      </form>
    </div>
  );
}
