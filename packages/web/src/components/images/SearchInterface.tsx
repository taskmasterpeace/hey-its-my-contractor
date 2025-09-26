"use client";

import { Search, Plus, X } from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";

export function SearchInterface() {
  const {
    searchTerm,
    setSearchTerm,
    isSearching,
    enabledRetailers,
    setEnabledRetailers,
    customRetailers,
    removeCustomRetailer,
    searchEntireWeb,
    setSearchEntireWeb,
    showAddSite,
    setShowAddSite,
    newSite,
    setNewSite,
    addCustomRetailer,
  } = useImagesStore();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    useImagesStore.getState().setIsSearching(true);

    try {
      const activeRetailers = Object.entries(enabledRetailers)
        .filter(([_, enabled]) => enabled)
        .map(([retailer, _]) => retailer);

      const searchParams = new URLSearchParams({
        q: searchTerm,
        retailers: activeRetailers.join(","),
        customSites: customRetailers.join(","),
        searchWeb: searchEntireWeb.toString(),
      });

      const response = await fetch(`/api/google-images?${searchParams}`);
      const data = await response.json();

      if (data.results) {
        useImagesStore.getState().setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      useImagesStore.getState().setIsSearching(false);
    }
  };

  const handleAddSite = () => {
    if (newSite.trim()) {
      addCustomRetailer(newSite.trim());
      setNewSite("");
      setShowAddSite(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Search Design Inspiration
      </h2>

      <div className="flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for design elements (e.g., purple door, subway tile, kitchen cabinets)..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Retailer Selection */}
      <div className="space-y-4">
        {/* Default Retailers */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Search in:</span>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabledRetailers.homedepot}
              onChange={(e) =>
                setEnabledRetailers({ homedepot: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">🏠 Home Depot</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabledRetailers.lowes}
              onChange={(e) => setEnabledRetailers({ lowes: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm">🔨 Lowe's</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabledRetailers.menards}
              onChange={(e) =>
                setEnabledRetailers({ menards: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">🏪 Menards</span>
          </label>
        </div>

        {/* Custom Sites */}
        {customRetailers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Custom sites:</span>
            {customRetailers.map((site, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
              >
                {site}
                <button
                  onClick={() => removeCustomRetailer(site)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Additional Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={searchEntireWeb}
              onChange={(e) => setSearchEntireWeb(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Search entire web</span>
          </label>

          {!showAddSite ? (
            <button
              onClick={() => setShowAddSite(true)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add custom site
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="example.com"
                className="px-2 py-1 text-sm border rounded"
                onKeyPress={(e) => e.key === "Enter" && handleAddSite()}
              />
              <button
                onClick={handleAddSite}
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddSite(false);
                  setNewSite("");
                }}
                className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
