"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useImagesStore } from "@contractor-platform/utils";
import { TabNavigation } from "@/components/images/TabNavigation";
import { SearchInterface } from "@/components/images/SearchInterface";
import { SearchResultsGrid } from "@/components/images/SearchResultsGrid";
import { LibraryView } from "@/components/images/LibraryView";
import { AIGeneratorView } from "@/components/images/AIGeneratorView";
import { MagicWandModal } from "@/components/images/MagicWandModal";

export default function ImagesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const {
    activeTab,
    showMagicWand,
    setShowMagicWand,
    setMagicWandSource,
    magicWandSource,
    setLibraryImages,
    libraryImages,
    fetchLibraryImages,
    setCurrentProjectId,
  } = useImagesStore();

  // Set project context and load project-scoped library images
  useEffect(() => {
    if (projectId) {
      // Set the current project ID in the store
      setCurrentProjectId(projectId);

      // Load project-scoped images using the store's fetchLibraryImages
      fetchLibraryImages(projectId);
    }
  }, [projectId, setCurrentProjectId, fetchLibraryImages]);

  const handleAIGeneration = (
    sourceImage: any,
    referenceImage: any,
    prompt: string
  ) => {
    console.log("AI Generation:", { sourceImage, referenceImage, prompt });
    // This would trigger actual AI generation
  };

  const handleImageSaved = async () => {
    // Refresh project images using the store's fetch function
    await fetchLibraryImages(projectId);
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
            onImageSaved={handleImageSaved}
          />
        )}
      </div>
    </div>
  );
}
