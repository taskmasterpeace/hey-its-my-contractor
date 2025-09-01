'use client';

import { Lightbulb, Search, Building, Truck, Code, DollarSign } from 'lucide-react';

interface ResearchSuggestionsProps {
  onSelectSuggestion: (query: string, type: string) => void;
  selectedProject?: string;
}

export function ResearchSuggestions({ onSelectSuggestion, selectedProject }: ResearchSuggestionsProps) {
  const suggestionCategories = [
    {
      title: 'Suppliers & Materials',
      icon: <Truck className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-100',
      suggestions: [
        {
          title: 'Local lumber suppliers',
          description: 'Find reliable lumber suppliers with competitive pricing',
          query: 'Best lumber suppliers in Richmond VA with contractor discounts',
          type: 'supplier',
        },
        {
          title: 'Tile distributors',
          description: 'Professional tile suppliers for bathroom projects',
          query: 'Professional tile distributors for residential bathroom renovation',
          type: 'supplier',
        },
        {
          title: 'Electrical supplies',
          description: 'Find electrical supply stores with professional pricing',
          query: 'Professional electrical supply stores Richmond VA contractor pricing',
          type: 'supplier',
        },
      ],
    },
    {
      title: 'Building Codes & Permits',
      icon: <Code className="w-5 h-5" />,
      color: 'text-green-600 bg-green-100',
      suggestions: [
        {
          title: 'Kitchen permit requirements',
          description: 'Current permit requirements for kitchen renovations',
          query: 'Virginia building permit requirements for kitchen remodel 2025',
          type: 'regulation',
        },
        {
          title: 'Electrical code updates',
          description: 'Latest electrical code requirements',
          query: 'Virginia electrical code requirements residential kitchen 2025',
          type: 'regulation',
        },
        {
          title: 'Inspection scheduling',
          description: 'Process for scheduling required inspections',
          query: 'How to schedule building inspections Virginia process timeline',
          type: 'regulation',
        },
      ],
    },
    {
      title: 'Materials & Techniques',
      icon: <Building className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-100',
      suggestions: [
        {
          title: 'Flooring comparison',
          description: 'Compare different flooring options for durability and cost',
          query: 'Best flooring materials kitchen high traffic comparison 2025',
          type: 'material',
        },
        {
          title: 'Cabinet installation',
          description: 'Professional cabinet installation techniques',
          query: 'Professional kitchen cabinet installation techniques best practices',
          type: 'technique',
        },
        {
          title: 'Tile installation tips',
          description: 'Expert tips for bathroom tile installation',
          query: 'Professional bathroom tile installation techniques avoid mistakes',
          type: 'technique',
        },
      ],
    },
    {
      title: 'Cost & Pricing',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-100',
      suggestions: [
        {
          title: 'Labor rates 2025',
          description: 'Current market rates for construction labor',
          query: 'Construction labor rates Virginia 2025 contractor pricing',
          type: 'material',
        },
        {
          title: 'Material cost trends',
          description: 'Building material price trends and forecasts',
          query: 'Building material price trends 2025 forecast cost planning',
          type: 'material',
        },
        {
          title: 'Project estimation',
          description: 'How to accurately estimate project costs',
          query: 'Construction project cost estimation techniques accuracy tips',
          type: 'general',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Suggestions</h2>
        <p className="text-gray-600">
          Popular research topics for contractors. Click any suggestion to get instant answers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suggestionCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mr-3`}>
                {category.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
            </div>

            <div className="space-y-3">
              {category.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSelectSuggestion(suggestion.query, suggestion.type)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {suggestion.description}
                      </p>
                    </div>
                    <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-2 flex-shrink-0" />
                  </div>
                  
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      {suggestion.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popular This Week */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🔥 Popular This Week</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            'Winter construction weather guidelines',
            'Lumber price forecast 2025',
            'New electrical code changes Virginia',
          ].map((query, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(query, 'general')}
              className="text-left p-3 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg border border-purple-200 transition-colors"
            >
              <span className="text-sm font-medium text-purple-900">{query}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}