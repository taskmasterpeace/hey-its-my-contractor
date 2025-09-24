'use client';

import React, { useState, useCallback } from 'react';
import { Search, Settings, Home, Store, Plus, X, History, Filter } from 'lucide-react';

export interface GoogleImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  source: string;
  domain: string;
  width: number;
  height: number;
  size: string;
  format: string;
}

export interface SearchConfiguration {
  defaultSites: string[];
  customSites: string[];
  safeSearch: 'strict' | 'moderate' | 'off';
  imageSize: 'any' | 'large' | 'medium' | 'small' | 'icon';
  imageType: 'any' | 'photo' | 'clipart' | 'line' | 'face';
  imageColor: 'any' | 'color' | 'blackandwhite' | 'transparent' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'white' | 'gray' | 'black' | 'brown';
  usage: 'any' | 'commercial' | 'noncommercial' | 'modify';
}

export interface SearchSyntaxHelp {
  operator: string;
  description: string;
  example: string;
}

interface ImageSearchInterfaceProps {
  onSearch: (query: string, config: SearchConfiguration) => Promise<GoogleImageResult[]>;
  onImageSelect: (image: GoogleImageResult) => void;
  onSaveToLibrary: (image: GoogleImageResult) => Promise<void>;
  searchHistory: string[];
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_SITES = [
  'homedepot.com',
  'lowes.com',
  'menards.com',
  'homedepotcanada.ca',
  'rona.ca'
];

const SEARCH_SYNTAX_HELP: SearchSyntaxHelp[] = [
  { operator: '"exact phrase"', description: 'Search for exact phrase', example: '"kitchen cabinets white"' },
  { operator: '-exclude', description: 'Exclude terms from results', example: 'cabinets -kitchen' },
  { operator: 'OR', description: 'Include either term', example: 'tile OR hardwood' },
  { operator: 'site:', description: 'Search specific site', example: 'site:homedepot.com countertops' },
  { operator: 'filetype:', description: 'Specific file type', example: 'filetype:jpg bathroom' },
  { operator: '*', description: 'Wildcard for unknown words', example: 'best * for kitchen' },
  { operator: '..', description: 'Number range', example: '$100..$500 faucet' }
];

const QUICK_SEARCH_CATEGORIES = [
  { name: 'Flooring', query: 'flooring hardwood tile laminate', icon: '🏠' },
  { name: 'Kitchen', query: 'kitchen cabinets countertops appliances', icon: '🍳' },
  { name: 'Bathroom', query: 'bathroom vanity shower tile fixtures', icon: '🛁' },
  { name: 'Exterior', query: 'siding roofing windows doors exterior', icon: '🏘️' },
  { name: 'Lighting', query: 'lighting fixtures LED recessed pendant', icon: '💡' },
  { name: 'Tools', query: 'construction tools equipment professional', icon: '🔨' },
  { name: 'Hardware', query: 'hardware screws bolts hinges handles', icon: '🔧' },
  { name: 'Paint', query: 'paint colors interior exterior primer', icon: '🎨' }
];

export function ImageSearchInterface({
  onSearch,
  onImageSelect,
  onSaveToLibrary,
  searchHistory = [],
  isLoading = false,
  className = ''
}: ImageSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchConfig, setSearchConfig] = useState<SearchConfiguration>({
    defaultSites: DEFAULT_SITES,
    customSites: [],
    safeSearch: 'strict',
    imageSize: 'any',
    imageType: 'any',
    imageColor: 'any',
    usage: 'any'
  });

  const handleSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) return;

    // Build enhanced search query with site restrictions
    let enhancedQuery = searchTerm;
    
    // Add site restrictions if using default sites
    if (searchConfig.defaultSites.length > 0) {
      const siteQuery = searchConfig.defaultSites.map(site => `site:${site}`).join(' OR ');
      enhancedQuery = `${searchTerm} (${siteQuery})`;
    }

    // Add custom sites
    if (searchConfig.customSites.length > 0) {
      const customSiteQuery = searchConfig.customSites.map(site => `site:${site}`).join(' OR ');
      enhancedQuery += ` OR (${searchTerm} (${customSiteQuery}))`;
    }

    try {
      await onSearch(enhancedQuery, searchConfig);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchQuery, searchConfig, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addCustomSite = (site: string) => {
    if (site && !searchConfig.customSites.includes(site)) {
      setSearchConfig(prev => ({
        ...prev,
        customSites: [...prev.customSites, site]
      }));
    }
  };

  const removeCustomSite = (site: string) => {
    setSearchConfig(prev => ({
      ...prev,
      customSites: prev.customSites.filter(s => s !== site)
    }));
  };

  const insertSearchOperator = (operator: string) => {
    const input = document.querySelector('[data-search-input]') as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = searchQuery.slice(0, start) + operator + searchQuery.slice(end);
      setSearchQuery(newValue);
      
      // Set cursor position after the inserted operator
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + operator.length, start + operator.length);
      }, 0);
    }
  };

  return (
    <div className={`image-search-interface bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            Image Search
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Advanced Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Search Input */}
        <div className="relative">
          <input
            data-search-input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for materials, fixtures, tools... (e.g., kitchen cabinets white)"
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <button
              onClick={() => setShowSyntaxHelp(!showSyntaxHelp)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Search Syntax Help"
            >
              ?
            </button>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Default Site Indicators */}
        <div className="flex items-center mt-2 text-xs text-gray-600">
          <span className="mr-2">Searching:</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Home className="w-3 h-3 mr-1 text-orange-500" />
              <span>Home Depot</span>
            </div>
            <div className="flex items-center">
              <Store className="w-3 h-3 mr-1 text-blue-500" />
              <span>Lowe's</span>
            </div>
            {searchConfig.customSites.length > 0 && (
              <span className="text-green-600">+{searchConfig.customSites.length} custom</span>
            )}
          </div>
        </div>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 10).map((query, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(query);
                  setShowHistory(false);
                }}
                className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full hover:bg-blue-50 hover:text-blue-600 border transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Categories */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Search</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_SEARCH_CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setSearchQuery(category.query);
                handleSearch(category.query);
              }}
              className="flex items-center p-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left"
              disabled={isLoading}
            >
              <span className="text-lg mr-2">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Syntax Help */}
      {showSyntaxHelp && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Search Operators</h3>
            <button
              onClick={() => setShowSyntaxHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SEARCH_SYNTAX_HELP.map((help) => (
              <div key={help.operator} className="bg-white p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-blue-600">
                    {help.operator}
                  </code>
                  <button
                    onClick={() => insertSearchOperator(help.operator + ' ')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Insert
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-1">{help.description}</p>
                <p className="text-xs text-gray-500 font-mono">{help.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Advanced Search Settings</h3>
            <button
              onClick={() => setShowAdvanced(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom Sites */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom Sites
              </label>
              <div className="space-y-2">
                {searchConfig.customSites.map((site) => (
                  <div key={site} className="flex items-center bg-white px-2 py-1 rounded text-sm">
                    <span className="flex-1 truncate">{site}</span>
                    <button
                      onClick={() => removeCustomSite(site)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add site (e.g., amazon.com)"
                    className="flex-1 px-2 py-1 text-xs border rounded-l-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomSite((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                      addCustomSite(input.value);
                      input.value = '';
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Size */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Image Size
              </label>
              <select
                value={searchConfig.imageSize}
                onChange={(e) => setSearchConfig(prev => ({ ...prev, imageSize: e.target.value as any }))}
                className="w-full px-2 py-1 text-sm border rounded-md bg-white"
              >
                <option value="any">Any Size</option>
                <option value="large">Large</option>
                <option value="medium">Medium</option>
                <option value="small">Small</option>
                <option value="icon">Icon</option>
              </select>
            </div>

            {/* Image Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Image Type
              </label>
              <select
                value={searchConfig.imageType}
                onChange={(e) => setSearchConfig(prev => ({ ...prev, imageType: e.target.value as any }))}
                className="w-full px-2 py-1 text-sm border rounded-md bg-white"
              >
                <option value="any">Any Type</option>
                <option value="photo">Photo</option>
                <option value="clipart">Clipart</option>
                <option value="line">Line Drawing</option>
                <option value="face">Face</option>
              </select>
            </div>

            {/* Image Color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Color
              </label>
              <select
                value={searchConfig.imageColor}
                onChange={(e) => setSearchConfig(prev => ({ ...prev, imageColor: e.target.value as any }))}
                className="w-full px-2 py-1 text-sm border rounded-md bg-white"
              >
                <option value="any">Any Color</option>
                <option value="color">Full Color</option>
                <option value="blackandwhite">Black & White</option>
                <option value="transparent">Transparent</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
              </select>
            </div>

            {/* Usage Rights */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Usage Rights
              </label>
              <select
                value={searchConfig.usage}
                onChange={(e) => setSearchConfig(prev => ({ ...prev, usage: e.target.value as any }))}
                className="w-full px-2 py-1 text-sm border rounded-md bg-white"
              >
                <option value="any">Any Usage</option>
                <option value="commercial">Commercial Use</option>
                <option value="noncommercial">Non-Commercial</option>
                <option value="modify">Modify/Adapt</option>
              </select>
            </div>

            {/* Safe Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Safe Search
              </label>
              <select
                value={searchConfig.safeSearch}
                onChange={(e) => setSearchConfig(prev => ({ ...prev, safeSearch: e.target.value as any }))}
                className="w-full px-2 py-1 text-sm border rounded-md bg-white"
              >
                <option value="strict">Strict</option>
                <option value="moderate">Moderate</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageSearchInterface;