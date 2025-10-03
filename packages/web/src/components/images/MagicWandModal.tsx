"use client";

import { useState } from "react";
import { X, Wand2, ImageIcon, Sparkles, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImagesStore } from "@contractor-platform/utils";

interface LibraryImage {
  id: string;
  url: string;
  title: string;
  source?: string;
  tags: string[];
  addedDate: string;
  projectId?: string;
  folder?: string;
}

interface MagicWandModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImage: {
    id: string;
    url: string;
    title: string;
    source?: string;
  };
  libraryImages: LibraryImage[];
  onGenerate: (
    sourceImage: any,
    referenceImage: LibraryImage | null,
    prompt: string
  ) => void;
  onImageSaved?: () => void;
}

export function MagicWandModal({
  isOpen,
  onClose,
  sourceImage,
  libraryImages,
  onGenerate,
  onImageSaved,
}: MagicWandModalProps) {
  const { toast } = useToast();
  const { currentProjectId } = useImagesStore();
  const [selectedReference, setSelectedReference] =
    useState<LibraryImage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<string[]>([]);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPreset, setNewPreset] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const defaultPresets = [
    "Add modern window trim",
    "Change exterior color to match",
    "Add landscaping elements",
    "Upgrade to premium version",
    "Apply to entire house",
    "Enhance lighting and contrast",
  ];

  const allPresets = [...defaultPresets, ...customPresets];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for AI generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Real API call to Replicate
      const response = await fetch("/api/replicate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nano-banana", // Default to nano-banana for magic wand
          prompt,
          sourceImage: sourceImage.url, // Send the source image
          referenceImages: selectedReference ? [selectedReference.url] : [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedResult(data.imageUrl);
        setIsGenerating(false);

        // Call parent generate function
        onGenerate(sourceImage, selectedReference, prompt);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "AI generation failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedResult || !currentProjectId) return;

    setIsSaving(true);
    try {
      // Use project-scoped API endpoint
      const response = await fetch(`/api/project/${currentProjectId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: generatedResult,
          title: `Enhanced ${sourceImage.title}`,
          categoryName: "ai-generated",
          description: `AI-enhanced version of ${sourceImage.title} using prompt: "${prompt}"`,
          tags: ["ai-generated", "enhanced", "magic-wand"],
          source: "ai_generated",
          metadata: {
            originalImage: sourceImage,
            referenceImage: selectedReference,
            prompt: prompt,
            enhancementType: "magic-wand",
            generatedAt: new Date().toISOString(),
            projectId: currentProjectId,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Image Saved Successfully!",
          description: `Enhanced ${sourceImage.title} has been saved to your project's ai-generated folder with company watermark.`,
        });

        // Call the onImageSaved callback to refresh the library
        if (onImageSaved) {
          await onImageSaved();
        }

        onClose();
      } else {
        throw new Error(data.error || "Failed to save image");
      }
    } catch (error) {
      console.error("Failed to save image:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save image to library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Image Enhancement
              </h2>
              <p className="text-gray-600">Enhance and mix images with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Source & Reference */}
            <div className="space-y-6">
              {/* Source Image */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Source Image
                </h3>
                <div className="relative bg-gray-100 rounded-lg p-4">
                  <img
                    src={sourceImage.url}
                    alt={sourceImage.title}
                    className="w-full object-contain rounded-lg bg-gray-50 max-h-48"
                  />
                  <div className="mt-3">
                    <h4 className="font-medium text-gray-900">
                      {sourceImage.title}
                    </h4>
                    {sourceImage.source && (
                      <p className="text-sm text-gray-600">
                        From: {sourceImage.source}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enhancement Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to change or enhance..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Generate Button - Moved right under prompt */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Enhanced Image
                  </>
                )}
              </button>

              {/* Editable Quick Presets - Below button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Quick Presets:
                  </p>
                  <button
                    onClick={() => setShowAddPreset(!showAddPreset)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Custom
                  </button>
                </div>

                {showAddPreset && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPreset}
                        onChange={(e) => setNewPreset(e.target.value)}
                        placeholder="Enter custom preset..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          if (newPreset.trim()) {
                            setCustomPresets((prev) => [
                              ...prev,
                              newPreset.trim(),
                            ]);
                            setNewPreset("");
                            setShowAddPreset(false);
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {allPresets.map((preset, index) => (
                    <div key={preset} className="relative group">
                      <button
                        onClick={() => setPrompt(preset)}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm rounded-full transition-colors"
                      >
                        {preset}
                      </button>
                      {index >= defaultPresets.length && (
                        <button
                          onClick={() =>
                            setCustomPresets((prev) =>
                              prev.filter(
                                (_, i) => i !== index - defaultPresets.length
                              )
                            )
                          }
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Result */}
            <div className="space-y-6">
              {/* AI Generated Result */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  AI Generated Result
                </h3>

                {generatedResult ? (
                  <div className="space-y-4">
                    <div className="relative bg-gray-100 rounded-lg p-4">
                      <img
                        src={generatedResult}
                        alt="AI Enhanced"
                        className="w-full object-contain rounded-lg bg-gray-50 max-h-80"
                      />
                      {/* Company Watermark */}
                      <div className="absolute bottom-6 right-6 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded">
                        Loudon Construction
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveToLibrary}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            window.open(generatedResult || "", "_blank")
                          }
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          🔍 Full Screen
                        </button>
                        <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </button>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          ✨ AI Enhanced • 🏢 Company Branded • 📁 Ready to Save
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Sparkles className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-sm">Enhanced image will appear here</p>
                      <p className="text-xs">
                        Select reference and enter prompt above
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Image Selector - Moved here */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Select Reference Image (Optional)
                </h3>

                {/* Folder Selector */}
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="all">
                    All Library Images ({libraryImages.length})
                  </option>
                  <option value="kitchen-inspiration">Kitchen Ideas</option>
                  <option value="bathroom-ideas">Bathroom Ideas</option>
                  <option value="flooring-options">Flooring Options</option>
                </select>

                {/* Library Grid */}
                <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                  {libraryImages
                    .filter(
                      (image) =>
                        selectedFolder === "all" ||
                        image.folder === selectedFolder
                    )
                    .map((image) => (
                      <button
                        key={image.id}
                        onClick={() =>
                          setSelectedReference(
                            selectedReference?.id === image.id ? null : image
                          )
                        }
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                          selectedReference?.id === image.id
                            ? "border-purple-500 ring-2 ring-purple-200 scale-105"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full object-contain bg-gray-50 max-h-24"
                        />
                        {selectedReference?.id === image.id && (
                          <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                </div>

                {selectedReference && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">
                      Reference: {selectedReference.title}
                    </p>
                    <p className="text-xs text-purple-700">
                      AI will use this as style reference for enhancement
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
