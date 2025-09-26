"use client";

import { useEffect } from "react";
import { useImagesStore } from "@contractor-platform/utils";
import { TabNavigation } from "@/components/images/TabNavigation";
import { SearchInterface } from "@/components/images/SearchInterface";
import { SearchResultsGrid } from "@/components/images/SearchResultsGrid";
import { LibraryView } from "@/components/images/LibraryView";
import { AIGeneratorView } from "@/components/images/AIGeneratorView";
import { MagicWandModal } from "@/components/images/MagicWandModal";

export default function ImagesPage() {
  const {
    activeTab,
    showMagicWand,
    setShowMagicWand,
    setMagicWandSource,
    magicWandSource,
    setLibraryImages,
    libraryImages,
  } = useImagesStore();

  // Load library images from database on mount
  useEffect(() => {
    const loadLibraryImages = async () => {
      try {
        const response = await fetch("/api/images/save");
        const data = await response.json();

        if (data.success && data.images) {
          // Transform database images to match LibraryImage interface
          const transformedImages = data.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            title: img.title,
            source: img.source || "Unknown",
            tags: img.tags || [],
            addedDate: img.createdAt,
            projectId: img.projectId,
            folder: img.categoryName || "uncategorized",
            originalUrl: img.originalUrl,
            retailer: img.retailer,
          }));

          setLibraryImages(transformedImages);
        }
      } catch (error) {
        console.error("Failed to load library images:", error);
      }
    };

    loadLibraryImages();
  }, [setLibraryImages]);

  const handleAIGeneration = (
    sourceImage: any,
    referenceImage: any,
    prompt: string
  ) => {
    console.log("AI Generation:", { sourceImage, referenceImage, prompt });
    // This would trigger actual AI generation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Images & Design Library
          </h1>
          <p className="text-gray-600 text-lg">
            Search for design inspiration, manage your image library, and
            generate AI-enhanced visuals for your projects
          </p>
        </div>

        {/* Tab Navigation */}
        <TabNavigation />

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "shopping" && (
            <>
              <SearchInterface />
              <SearchResultsGrid />
            </>
          )}

          {activeTab === "library" && <LibraryView />}

          {activeTab === "generator" && <AIGeneratorView />}
        </div>

        {/* Magic Wand Modal */}
        {showMagicWand && magicWandSource && (
          <MagicWandModal
            isOpen={showMagicWand}
            onClose={() => {
              setShowMagicWand(false);
              setMagicWandSource(null);
            }}
            sourceImage={{
              id: magicWandSource.id || "temp-id",
              url: magicWandSource.url || "",
              title: magicWandSource.title || "Untitled",
              source: magicWandSource.source,
            }}
            libraryImages={libraryImages}
            onGenerate={handleAIGeneration}
          />
        )}
      </div>
    </div>
  );
}
