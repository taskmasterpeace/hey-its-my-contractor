"use client";

import { useState } from "react";
import { Wand2, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";
import { useToast } from "@/hooks/use-toast";

export function AIGeneratorView() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const {
    selectedReferences,
    toggleReferenceSelection,
    clearSelectedReferences,
    prompt,
    setPrompt,
    selectedModel,
    setSelectedModel,
    manualModelOverride,
    setManualModelOverride,
    generatedImage,
    setGeneratedImage,
    isGenerating,
    setIsGenerating,
    getSmartModel,
    libraryImages,
    currentProjectId,
    fetchLibraryImages,
  } = useImagesStore();

  const presetPrompts = [
    "Add modern window trim",
    "Change exterior color",
    "Add landscaping elements",
    "Upgrade front door",
    "Add outdoor lighting",
    "Modernize siding style",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for AI generation",
        variant: "destructive",
      });
      return;
    }

    if (selectedReferences.length === 0) {
      toast({
        title: "Reference Image Required",
        description: "Please select at least one reference image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/replicate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: manualModelOverride || getSmartModel(),
          prompt,
          sourceImage: selectedReferences[0]?.url,
          referenceImages: selectedReferences.slice(1, 3).map((ref) => ref.url),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Generation Complete!",
          description: "Your AI-generated image is ready to review and save.",
        });
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "AI generation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedImage || !currentProjectId) return;

    setIsSaving(true);
    try {
      // Use project-scoped API endpoint
      const response = await fetch(`/api/project/${currentProjectId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: generatedImage,
          title: `AI Generated: ${prompt.substring(0, 50)}${
            prompt.length > 50 ? "..." : ""
          }`,
          source: "ai_generated",
          aiPrompt: prompt,
          aiModel: manualModelOverride || getSmartModel(),
          referenceImages: selectedReferences.map((ref) => ref.id),
          tags: ["ai-generated", "replicate"],
          metadata: {
            generatedAt: new Date().toISOString(),
            model: manualModelOverride || getSmartModel(),
            prompt,
            projectId: currentProjectId,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Image Saved Successfully!",
          description:
            "Generated image has been saved to your project library.",
        });
        setGeneratedImage(null);
        setPrompt("");
        clearSelectedReferences();

        // Refresh the library to show the new image
        await fetchLibraryImages(currentProjectId);
      } else {
        throw new Error(data.error || "Failed to save image");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save generated image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Generated Result */}
      {generatedImage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Result
          </h2>

          <div className="space-y-4">
            <div className="relative max-w-2xl mx-auto">
              <img
                src={generatedImage}
                alt="AI Generated"
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleSaveGenerated}
                disabled={isSaving}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Save to Library
                  </>
                )}
              </button>

              <button
                onClick={() => setGeneratedImage(null)}
                className="flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Discard
              </button>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - AI Controls */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Model
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="model"
                    value="nano-banana"
                    checked={
                      !manualModelOverride ||
                      manualModelOverride === "nano-banana"
                    }
                    onChange={() => {
                      setSelectedModel("nano-banana");
                      setManualModelOverride("nano-banana");
                    }}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Nano Banana</div>
                    <div className="text-sm text-gray-500">Fast generation</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="model"
                    value="gen4-turbo"
                    checked={manualModelOverride === "gen4-turbo"}
                    onChange={() => {
                      setSelectedModel("gen4-turbo");
                      setManualModelOverride("gen4-turbo");
                    }}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Gen4 Turbo</div>
                    <div className="text-sm text-gray-500">Higher quality</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe changes..."
              />
            </div>

            {/* Quick Prompts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Prompts
              </label>
              <div className="grid grid-cols-1 gap-2">
                {presetPrompts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPrompt(preset)}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={
                !prompt.trim() ||
                selectedReferences.length === 0 ||
                isGenerating
              }
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 font-medium"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Wand2 className="w-5 h-5 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          {/* Right Column - Library Images */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Your Library</h4>
            <p className="text-gray-600 text-sm mb-4">
              Choose up to 3 images from your library to use as references for
              AI generation.
            </p>
            {libraryImages.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {libraryImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => toggleReferenceSelection(image)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedReferences.find((ref) => ref.id === image.id)
                        ? "border-blue-500 scale-95"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={
                      selectedReferences.length >= 3 &&
                      !selectedReferences.find((ref) => ref.id === image.id)
                    }
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedReferences.find((ref) => ref.id === image.id) && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No images in your library yet. Save some images from search
                  results first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
