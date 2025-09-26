"use client";

import { useState, useEffect } from "react";
import { X, Folder, Plus, Tag, Upload } from "lucide-react";
import type { ImageSearchResult } from "@contractor-platform/types";

interface SaveImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageSearchResult | null;
  onSave: (data: SaveImageData) => Promise<void>;
}

export interface SaveImageData {
  title: string;
  categoryId: string | null;
  categoryName?: string; // For creating new category
  tags: string[];
  description?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export function SaveImageDialog({
  isOpen,
  onClose,
  image,
  onSave,
}: SaveImageDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from database (mock for now)
  useEffect(() => {
    if (isOpen) {
      // In real implementation, fetch from database
      const mockCategories: Category[] = [
        { id: "1", name: "Kitchen Inspiration", color: "#3B82F6" },
        { id: "2", name: "Bathroom Ideas", color: "#10B981" },
        { id: "3", name: "Flooring Options", color: "#F59E0B" },
        { id: "4", name: "Exterior Design", color: "#EF4444" },
      ];
      setCategories(mockCategories);
    }
  }, [isOpen]);

  // Reset form when image changes
  useEffect(() => {
    if (image) {
      setTitle(image.title || "");
      setTags(image.retailer ? [image.retailer] : []);
      setDescription("");
      setSelectedCategoryId(null);
      setShowNewCategory(false);
      setNewCategoryName("");
      setNewTag("");
    }
  }, [image]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        categoryId: showNewCategory ? null : selectedCategoryId,
        categoryName: showNewCategory ? newCategoryName.trim() : undefined,
        tags,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Save to Library
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div className="space-y-4">
            {/* Large Image Preview */}
            <div className="relative w-full max-w-lg mx-auto">
              <img
                src={image.url}
                alt={image.title}
                className="w-full max-h-96 object-contain rounded-xl border border-gray-200 shadow-sm bg-gray-50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    image.thumbnail || image.url;
                }}
              />
            </div>

            {/* Image Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Source:</span>
                  <p className="text-gray-600">{image.source}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Retailer:</span>
                  <p className="text-gray-600 capitalize">{image.retailer}</p>
                </div>
                {image.price && (
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <p className="text-green-600 font-semibold">
                      {image.price}
                    </p>
                  </div>
                )}
                {image.rating && (
                  <div>
                    <span className="font-medium text-gray-700">Rating:</span>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 text-sm mr-1">
                        {"★".repeat(Math.floor(image.rating))}
                        {"☆".repeat(5 - Math.floor(image.rating))}
                      </div>
                      <span className="text-gray-600">({image.rating})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a descriptive title"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>

            <div className="space-y-3">
              {/* Existing Categories */}
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setShowNewCategory(false);
                    }}
                    className={`flex items-center p-3 border rounded-lg text-left transition-colors ${
                      selectedCategoryId === category.id && !showNewCategory
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* New Category Option */}
              <div className="border-t border-gray-200 pt-3">
                {!showNewCategory ? (
                  <button
                    onClick={() => {
                      setShowNewCategory(true);
                      setSelectedCategoryId(null);
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create New Category
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryName("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              {/* Existing Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes or description..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save to Library"}
          </button>
        </div>
      </div>
    </div>
  );
}
