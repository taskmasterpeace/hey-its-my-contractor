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
    <div className="min-h-screen bg-white">
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="w-full bg-white border-b border-gray-100">
          <div className="px-8">
            <TabNavigation />
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full px-8 py-8">
          <div className="space-y-8 transition-all duration-300 ease-in-out">
            {activeTab === "shopping" && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <SearchInterface />
                <SearchResultsGrid />
              </div>
            )}

            {activeTab === "library" && (
              <div className="animate-in fade-in-50 duration-500">
                <LibraryView />
              </div>
            )}

            {activeTab === "generator" && (
              <div className="animate-in fade-in-50 duration-500">
                <AIGeneratorView />
              </div>
            )}
          </div>
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
