"use client";

import { useState } from "react";
import { ExternalLink, Download, Heart, Wand2 } from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";
import type { ImageSearchResult } from "@contractor-platform/types";
import { SaveImageDialog, type SaveImageData } from "./SaveImageDialog";
import { useToast } from "@/hooks/use-toast";

export function SearchResultsGrid() {
  const { toast } = useToast();
  const {
    searchResults,
    setShowMagicWand,
    setMagicWandSource,
    fetchLibraryImages,
    currentProjectId,
  } = useImagesStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [imageToSave, setImageToSave] = useState<ImageSearchResult | null>(
    null
  );
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set());

  const handleSaveClick = (searchResult: ImageSearchResult) => {
    setImageToSave(searchResult);
    setShowSaveDialog(true);
  };

  const handleSaveToLibrary = async (saveData: SaveImageData) => {
    if (!imageToSave || !currentProjectId) return;

    // Add to saving set
    setSavingImages((prev) => new Set(prev).add(imageToSave.id));

    try {
      // Use project-scoped API endpoint
      const response = await fetch(`/api/project/${currentProjectId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageToSave.url,
          title: saveData.title,
          categoryId: saveData.categoryId,
          categoryName: saveData.categoryName,
          tags: saveData.tags,
          description: saveData.description,
          source: "search_result",
          retailer: imageToSave.retailer,
          originalUrl: imageToSave.originalUrl,
          metadata: imageToSave.metadata || {},
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save image");
      }

      // Show success toast
      toast({
        title: "Image Saved Successfully!",
        description: `"${saveData.title}" has been saved to your project library.`,
      });

      // Refresh library images to show the new saved image (project-scoped)
      await fetchLibraryImages(currentProjectId);
    } catch (error) {
      console.error("Save to library failed:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save image. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      // Remove from saving set
      setSavingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageToSave.id);
        return newSet;
      });
    }
  };

  const handleMagicWandClick = (image: ImageSearchResult) => {
    setMagicWandSource({
      ...image,
      sourceType: "search",
    });
    setShowMagicWand(true);
  };

  const getRetailerLogo = (retailer: string) => {
    const logos = {
      homedepot: "🏠",
      lowes: "🔨",
      menards: "🏪",
      custom: "🌐",
    };
    return logos[retailer as keyof typeof logos] || "🌐";
  };

  if (searchResults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">No search results</div>
        <p className="text-gray-500">
          Enter a search term above to find design inspiration
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Search Results ({searchResults.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {searchResults.map((result) => (
          <div
            key={result.id}
            className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.03] border border-gray-100"
          >
            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
              <img
                src={result.url}
                alt={result.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    result.thumbnail || result.url;
                }}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center space-x-3">
                  <button
                    onClick={() => handleSaveClick(result)}
                    disabled={savingImages.has(result.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-white/95 hover:bg-white rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      savingImages.has(result.id)
                        ? "Saving..."
                        : "Save to Library"
                    }
                  >
                    {savingImages.has(result.id) ? (
                      <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Download className="w-4 h-4 text-gray-700 mr-1" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {savingImages.has(result.id) ? "Saving..." : "Save"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleMagicWandClick(result)}
                    className="p-2 bg-purple-600/90 hover:bg-purple-600 rounded-lg transition-colors duration-200 shadow-lg"
                    title="AI Magic Wand"
                  >
                    <Wand2 className="w-5 h-5 text-white" />
                  </button>

                  <a
                    href={result.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600/90 hover:bg-blue-600 rounded-lg transition-colors duration-200 shadow-lg"
                    title="View Original"
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {getRetailerLogo(result.retailer)}
                  </span>
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {result.retailer}
                  </span>
                </div>
                {result.price && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {result.price}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight mb-2">
                {result.title}
              </h4>

              {result.rating && (
                <div className="flex items-center">
                  <div className="flex text-yellow-400 text-sm">
                    {"★".repeat(Math.floor(result.rating))}
                    {"☆".repeat(5 - Math.floor(result.rating))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ({result.rating})
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Dialog */}
      <SaveImageDialog
        isOpen={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setImageToSave(null);
        }}
        image={imageToSave}
        onSave={handleSaveToLibrary}
        currentProjectId={currentProjectId || undefined}
      />
    </div>
  );
}
