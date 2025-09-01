'use client';

import { useState, useEffect } from 'react';
import { ResearchQuery, ResearchResult, SavedResearch } from '@contractor-platform/types';
import { ResearchInterface } from '@/components/research/ResearchInterface';
import { ResearchResults } from '@/components/research/ResearchResults';
import { SavedResearchPanel } from '@/components/research/SavedResearchPanel';
import { ResearchSuggestions } from '@/components/research/ResearchSuggestions';
import { Search, Lightbulb, BookOpen, History, Sparkles } from 'lucide-react';

export default function ResearchPage() {
  const [activeQuery, setActiveQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<ResearchResult | null>(null);
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'suggestions'>('search');
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Load saved research on component mount
  useEffect(() => {
    const loadSavedResearch = () => {
      try {
        const saved = localStorage.getItem('contractor_research');
        if (saved) {
          setSavedResearch(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load saved research:', error);
      }
    };

    loadSavedResearch();
  }, []);

  const handleSearch = async (query: string, type?: string, context?: any) => {
    setIsSearching(true);
    setActiveQuery(query);
    
    try {
      // Simulate API call to Perplexity
      setTimeout(() => {
        const mockResult: ResearchResult = {
          query,
          answer: `Based on current market research and industry standards, here's what I found about "${query}":\n\nFor ${type || 'general'} inquiries, the most important considerations include quality, cost-effectiveness, and local availability. Here are the key findings:\n\n1. **Quality Standards**: Look for materials that meet or exceed local building codes and manufacturer specifications.\n\n2. **Cost Analysis**: Current market rates vary by region, but budget 15-20% above initial estimates for contingencies.\n\n3. **Local Suppliers**: Working with established local suppliers can reduce delivery costs and provide better customer service.\n\n4. **Timeline Considerations**: Factor in lead times, especially for custom or specialized materials.\n\n5. **Regulatory Compliance**: Ensure all materials and methods comply with local building codes and permit requirements.`,
          sources: [
            {
              title: 'Building Materials Guide 2025',
              url: 'https://example.com/materials-guide',
              snippet: 'Comprehensive guide to construction materials and specifications...',
              domain: 'example.com',
            },
            {
              title: 'Local Building Code Reference',
              url: 'https://city.gov/building-codes',
              snippet: 'Official building code requirements and permit information...',
              domain: 'city.gov',
            },
            {
              title: 'Contractor Reviews & Ratings',
              url: 'https://contractors.com/reviews',
              snippet: 'Professional contractor reviews and supplier recommendations...',
              domain: 'contractors.com',
            },
          ],
          related_queries: [
            `What permits are required for ${query}?`,
            `How long does installation take for ${query}?`,
            `What tools are needed for ${query}?`,
          ],
          timestamp: new Date().toISOString(),
          confidence: 0.89,
        };

        setCurrentResult(mockResult);
        setIsSearching(false);
      }, 2000);
    } catch (error) {
      console.error('Research failed:', error);
      setIsSearching(false);
    }
  };

  const handleSaveResearch = (result: ResearchResult, tags: string[], notes?: string) => {
    const savedItem: SavedResearch = {
      id: Date.now().toString(),
      project_id: selectedProject || undefined,
      query: result.query,
      result,
      tags,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedSaved = [...savedResearch, savedItem];
    setSavedResearch(updatedSaved);
    localStorage.setItem('contractor_research', JSON.stringify(updatedSaved));
  };

  const handleDeleteSaved = (id: string) => {
    const updatedSaved = savedResearch.filter(item => item.id !== id);
    setSavedResearch(updatedSaved);
    localStorage.setItem('contractor_research', JSON.stringify(updatedSaved));
  };

  const projects = [
    { id: 'proj-1', name: 'Johnson Kitchen Remodel' },
    { id: 'proj-2', name: 'Wilson Bathroom' },
    { id: 'proj-3', name: 'Davis Deck Construction' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Research Assistant</h1>
            <p className="text-gray-600">
              Get instant answers about suppliers, building codes, materials, and techniques
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center space-x-4 mt-4">
          <label className="text-sm font-medium text-gray-700">Project:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4 mr-2" />
          Saved ({savedResearch.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'search' && (
            <div className="space-y-6">
              <ResearchInterface
                onSearch={handleSearch}
                isSearching={isSearching}
                currentQuery={activeQuery}
              />
              
              {currentResult && (
                <ResearchResults
                  result={currentResult}
                  onSave={handleSaveResearch}
                  onRelatedQuery={handleSearch}
                />
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <ResearchSuggestions
              onSelectSuggestion={(query, type) => {
                setActiveTab('search');
                handleSearch(query, type);
              }}
              selectedProject={selectedProject}
            />
          )}

          {activeTab === 'saved' && (
            <SavedResearchPanel
              savedResearch={savedResearch}
              onDelete={handleDeleteSaved}
              onResearch={(query) => {
                setActiveTab('search');
                handleSearch(query);
              }}
              selectedProject={selectedProject}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            {/* Quick Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Research Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Searches</span>
                  <span className="font-medium text-gray-900">{savedResearch.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-medium text-gray-900">
                    {savedResearch.filter(r => {
                      const thisMonth = new Date().getMonth();
                      const itemMonth = new Date(r.created_at).getMonth();
                      return thisMonth === itemMonth;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Confidence</span>
                  <span className="font-medium text-gray-900">
                    {savedResearch.length > 0 
                      ? Math.round(savedResearch.reduce((acc, r) => acc + r.result.confidence, 0) / savedResearch.length * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Popular Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Suppliers</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="w-3/4 bg-purple-600 h-2 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Regulations</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="w-1/2 bg-purple-600 h-2 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Materials</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="w-1/3 bg-purple-600 h-2 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">💡 Research Tips</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Be specific about your location for accurate results</li>
                <li>• Include budget ranges for better supplier matches</li>
                <li>• Save useful research to reference later</li>
                <li>• Use related queries to explore topics deeper</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}