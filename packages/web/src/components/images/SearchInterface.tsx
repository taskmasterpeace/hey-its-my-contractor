"use client";

import { Search, Plus, X } from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";
import { useToast } from "@/hooks/use-toast";

export function SearchInterface() {
  const { toast } = useToast();
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
      toast({
        title: "Search Failed",
        description: "Failed to search for images. Please try again.",
        variant: "destructive",
      });
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
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-sm border border-gray-100 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">
        Search Design Inspiration
      </h2>

      <div className="flex space-x-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for design elements (e.g., purple door, subway tile, kitchen cabinets)..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm hover:bg-white"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Retailer Selection */}
      <div className="space-y-5">
        {/* Default Retailers */}
        <div className="bg-white/60 rounded-lg p-4 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 mb-1">
              Search in:
            </span>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enabledRetailers.homedepot}
                  onChange={(e) =>
                    setEnabledRetailers({ homedepot: e.target.checked })
                  }
                  className="rounded-md border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <span className="text-sm group-hover:text-gray-900 transition-colors">
                  🏠 Home Depot
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enabledRetailers.lowes}
                  onChange={(e) =>
                    setEnabledRetailers({ lowes: e.target.checked })
                  }
                  className="rounded-md border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <span className="text-sm group-hover:text-gray-900 transition-colors">
                  🔨 Lowe's
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enabledRetailers.menards}
                  onChange={(e) =>
                    setEnabledRetailers({ menards: e.target.checked })
                  }
                  className="rounded-md border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <span className="text-sm group-hover:text-gray-900 transition-colors">
                  🏪 Menards
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Custom Sites */}
        {customRetailers.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4 border border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Custom sites:
              </span>
              {customRetailers.map((site, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 text-sm rounded-full border border-purple-200 shadow-sm"
                >
                  {site}
                  <button
                    onClick={() => removeCustomRetailer(site)}
                    className="ml-2 text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="bg-white/60 rounded-lg p-4 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={searchEntireWeb}
                onChange={(e) => setSearchEntireWeb(e.target.checked)}
                className="rounded-md border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              <span className="text-sm group-hover:text-gray-900 transition-colors">
                Search entire web
              </span>
            </label>

            {!showAddSite ? (
              <button
                onClick={() => setShowAddSite(true)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
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
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  onKeyPress={(e) => e.key === "Enter" && handleAddSite()}
                />
                <button
                  onClick={handleAddSite}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddSite(false);
                    setNewSite("");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
