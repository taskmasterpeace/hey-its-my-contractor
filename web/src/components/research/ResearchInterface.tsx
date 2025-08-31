'use client';

import { useState } from 'react';
import { Search, Mic, Sparkles, MapPin, DollarSign, Clock } from 'lucide-react';

interface ResearchInterfaceProps {
  onSearch: (query: string, type?: string, context?: any) => void;
  isSearching: boolean;
  currentQuery: string;
}

export function ResearchInterface({ onSearch, isSearching, currentQuery }: ResearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [context, setContext] = useState({
    location: '',
    budget: '',
    timeline: '',
    projectType: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType, context);
    }
  };

  const handleQuickSearch = (quickQuery: string, type: string) => {
    setQuery(quickQuery);
    setSearchType(type);
    onSearch(quickQuery, type, context);
  };

  const quickSearches = [
    {
      category: 'Suppliers',
      searches: [
        { label: 'Local lumber suppliers', query: 'Find reliable lumber suppliers in my area with competitive pricing', type: 'supplier' },
        { label: 'Tile distributors', query: 'Best tile distributors for residential projects', type: 'supplier' },
        { label: 'Electrical suppliers', query: 'Professional electrical supply stores with contractor discounts', type: 'supplier' },
      ],
    },
    {
      category: 'Regulations',
      searches: [
        { label: 'Permit requirements', query: 'Building permit requirements for home additions', type: 'regulation' },
        { label: 'Electrical codes', query: 'Current electrical code requirements for residential kitchens', type: 'regulation' },
        { label: 'Inspection process', query: 'Home inspection requirements and scheduling process', type: 'regulation' },
      ],
    },
    {
      category: 'Materials',
      searches: [
        { label: 'Flooring options', query: 'Best flooring materials for high-traffic areas comparison', type: 'material' },
        { label: 'Insulation types', query: 'Compare insulation materials for energy efficiency and cost', type: 'material' },
        { label: 'Paint selection', query: 'Professional paint recommendations for different surfaces', type: 'material' },
      ],
    },
  ];

  const searchTypes = [
    { value: 'general', label: 'General', icon: '🔍' },
    { value: 'supplier', label: 'Suppliers', icon: '🏪' },
    { value: 'regulation', label: 'Codes & Permits', icon: '📋' },
    { value: 'material', label: 'Materials', icon: '🧱' },
    { value: 'technique', label: 'Techniques', icon: '🔧' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ask Your Research Question</h2>
        <p className="text-gray-600">
          Get instant answers about suppliers, building codes, materials, and construction techniques
        </p>
      </div>

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about suppliers, building codes, materials, installation techniques..."
            rows={3}
            className="w-full pl-12 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
          <button
            type="button"
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Voice search (coming soon)"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Search Type Selection */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {searchTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSearchType(type.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                searchType === type.value
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {/* Advanced Context Options */}
        {showAdvanced && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Context (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={context.location}
                  onChange={(e) => setContext(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Richmond, VA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Budget Range
                </label>
                <input
                  type="text"
                  value={context.budget}
                  onChange={(e) => setContext(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="e.g., $5,000 - $10,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <input
                  type="text"
                  value={context.projectType}
                  onChange={(e) => setContext(prev => ({ ...prev, projectType: e.target.value }))}
                  placeholder="e.g., Kitchen Remodel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timeline
                </label>
                <input
                  type="text"
                  value={context.timeline}
                  onChange={(e) => setContext(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder="e.g., 2-3 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            !query.trim() || isSearching
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
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

      {/* Quick Search Options */}
      <div className="mt-8">
        <h3 className="font-medium text-gray-900 mb-4">Popular Searches</h3>
        <div className="space-y-4">
          {quickSearches.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>
              <div className="flex flex-wrap gap-2">
                {category.searches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(search.query, search.type)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                    disabled={isSearching}
                  >
                    {search.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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