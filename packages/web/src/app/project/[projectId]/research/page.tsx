"use client";

import { useState, useEffect } from "react";
import {
  ResearchQuery,
  ResearchResult,
  SavedResearch,
} from "@contractor-platform/types";
import { ResearchInterface } from "@/components/research/ResearchInterface";
import { ResearchResults } from "@/components/research/ResearchResults";
import { SavedResearchPanel } from "@/components/research/SavedResearchPanel";
import { Search, History, Sparkles } from "lucide-react";

export default function ResearchPage() {
  const [activeQuery, setActiveQuery] = useState("");
  const [currentResult, setCurrentResult] = useState<ResearchResult | null>(
    null
  );
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");

  // Load saved research on component mount
  useEffect(() => {
    const loadSavedResearch = () => {
      try {
        const saved = localStorage.getItem("contractor_research");
        if (saved) {
          setSavedResearch(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load saved research:", error);
      }
    };

    loadSavedResearch();
  }, []);

  const handleSearch = async (query: string, type?: string, context?: any) => {
    setIsSearching(true);
    setActiveQuery(query);
    setCurrentResult(null); // Clear previous results

    try {
      // Get projectId from the URL
      const projectId = window.location.pathname.split("/")[2];

      const response = await fetch(`/api/project/${projectId}/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          type,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "partial" && data.data) {
                    // Update with partial data for real-time feedback
                    const partialResult = {
                      query,
                      answer: data.data.answer || "Researching...",
                      sources: data.data.sources || [],
                      related_queries: data.data.related_queries || [],
                      timestamp: new Date().toISOString(),
                      confidence: 0.5,
                    };
                    setCurrentResult(partialResult);
                  } else if (data.type === "complete" && data.result) {
                    // Final complete result
                    setCurrentResult(data.result);
                    setIsSearching(false);
                    return;
                  } else if (data.type === "error") {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.warn("Failed to parse streaming data:", parseError);
                }
              }
            }
          }
        }
        setIsSearching(false);
      } else {
        // Fallback to regular JSON response
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setCurrentResult(data.result);
        setIsSearching(false);
      }
    } catch (error) {
      console.error("Research failed:", error);
      setIsSearching(false);

      // Show user-friendly error message
      setCurrentResult({
        query,
        answer: `Sorry, I encountered an error while researching "${query}". Please try again or contact support if the issue persists.\n\nError: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        sources: [],
        related_queries: [],
        timestamp: new Date().toISOString(),
        confidence: 0,
      });
    }
  };

  const handleSaveResearch = (
    result: ResearchResult,
    tags: string[],
    notes?: string
  ) => {
    const savedItem: SavedResearch = {
      id: Date.now().toString(),
      project_id: undefined,
      query: result.query,
      result,
      tags,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedSaved = [...savedResearch, savedItem];
    setSavedResearch(updatedSaved);
    localStorage.setItem("contractor_research", JSON.stringify(updatedSaved));
  };

  const handleDeleteSaved = (id: string) => {
    const updatedSaved = savedResearch.filter((item) => item.id !== id);
    setSavedResearch(updatedSaved);
    localStorage.setItem("contractor_research", JSON.stringify(updatedSaved));
  };

  return (
    <div className="p-6">
      {/* Research Header */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Research Assistant
              </h1>
              <p className="text-gray-600">
                Get instant answers about suppliers, building codes, materials,
                and techniques
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "search"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "saved"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4 mr-2" />
          Saved ({savedResearch.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === "search" && (
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

          {activeTab === "saved" && (
            <SavedResearchPanel
              savedResearch={savedResearch}
              onDelete={handleDeleteSaved}
              onResearch={(query) => {
                setActiveTab("search");
                handleSearch(query);
              }}
              selectedProject=""
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            {/* Current Sources */}
            {currentResult && currentResult.sources.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-4 h-4 text-blue-600 mr-2">🔗</span>
                  Current Sources
                </h3>
                <div className="space-y-3">
                  {currentResult.sources.map((source, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-blue-200 pl-3"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 block"
                      >
                        {source.domain}
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
            {currentResult && currentResult.related_queries.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-4 h-4 text-green-600 mr-2">❓</span>
                  Related Questions
                </h3>
                <div className="space-y-2">
                  {currentResult.related_queries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(query)}
                      className="text-left text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg block w-full transition-colors border border-transparent hover:border-green-200"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!currentResult ||
              (currentResult.sources.length === 0 &&
                currentResult.related_queries.length === 0)) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Ready to Research
                </h3>
                <p className="text-sm text-gray-600">
                  Start a search to see sources and related questions here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
