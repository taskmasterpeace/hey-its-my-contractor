"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Folder,
  Grid3X3,
  LayoutGrid,
  Wand2,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";
import type { LibraryImage } from "@contractor-platform/types";

interface Category {
  id: string;
  name: string;
  color: string;
}

export function LibraryView() {
  const {
    libraryImages,
    selectedFolder,
    setSelectedFolder,
    libraryView,
    setLibraryView,
    showCreateFolder,
    setShowCreateFolder,
    newFolderName,
    setNewFolderName,
    isUploading,
    setIsUploading,
    isLoadingLibrary,
    fetchLibraryImages,
    setShowMagicWand,
    setMagicWandSource,
  } = useImagesStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories and library images on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch("/api/images/categories");
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories([
            { id: "all", name: "All Images", color: "#6B7280" },
            ...categoriesData.categories,
          ]);
        }

        // Load library images
        await fetchLibraryImages();
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [fetchLibraryImages]);

  const handleCreateCategory = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/images/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: `Category: ${newFolderName.trim()}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories((prev) => [...prev, data.category]);
        setSelectedFolder(data.category.id);
        setNewFolderName("");
        setShowCreateFolder(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Create a local URL for the uploaded file
        const fileUrl = URL.createObjectURL(file);

        // Here you would typically upload to your storage service
        // For now, we'll just add it to the local state
        const newLibraryImage: LibraryImage = {
          id: `upload-${Date.now()}-${Math.random()}`,
          url: fileUrl,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          source: "User Upload" as any,
          tags: ["upload", "user-content"],
          addedDate: new Date().toISOString(),
        };

        // You would call your API here to save the image
        // await saveImageToLibrary(newLibraryImage);
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh library images
      await fetchLibraryImages();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMagicWandClick = (image: LibraryImage) => {
    setMagicWandSource({
      ...image,
      sourceType: "library",
    });
    setShowMagicWand(true);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      // You would call your delete API here
      // await deleteImage(imageId);

      // For now, just refresh the library
      await fetchLibraryImages();
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  // Filter images based on selected folder
  const filteredImages = libraryImages.filter((image) => {
    if (selectedFolder === "all") return true;
    return image.category?.id === selectedFolder;
  });

  if (isLoadingLibrary && libraryImages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <div className="text-gray-600">Loading your image library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Library Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Image Library</h2>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLibraryView("large")}
              className={`p-2 rounded-lg transition-colors ${
                libraryView === "large"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLibraryView("grid")}
              className={`p-2 rounded-lg transition-colors ${
                libraryView === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Upload Images"}
          </button>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedFolder(category.id)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === category.id
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor:
                    selectedFolder === category.id
                      ? undefined
                      : category.color + "20",
                }}
              >
                <Folder className="w-3 h-3 mr-1" />
                {category.name}
              </button>
            ))}

            {/* Add Category Button */}
            {!showCreateFolder ? (
              <button
                onClick={() => setShowCreateFolder(true)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Category
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Category name"
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCreateCategory()
                  }
                />
                <button
                  onClick={handleCreateCategory}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredImages.length} image
            {filteredImages.length !== 1 ? "s" : ""}
            {selectedFolder !== "all" && (
              <span className="text-gray-500 ml-1">
                in{" "}
                {categories.find((c) => c.id === selectedFolder)?.name ||
                  selectedFolder}
              </span>
            )}
          </h3>
        </div>

        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No images yet
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedFolder === "all"
                ? "Upload images or save them from search results"
                : "No images in this category"}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              libraryView === "large"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            }`}
          >
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.03] border border-gray-100"
              >
                <div className="relative">
                  <div
                    className={`w-full bg-gray-100 overflow-hidden ${
                      libraryView === "large" ? "aspect-[4/5]" : "aspect-square"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMagicWandClick(image)}
                      className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                    </button>
                    {image.originalUrl && (
                      <a
                        href={image.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Image Details */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {image.title}
                  </h4>
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {image.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{image.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(image.addedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
