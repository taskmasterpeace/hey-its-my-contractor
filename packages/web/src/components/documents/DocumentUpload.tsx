"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Upload, Camera, FileText, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface DocumentUploadProps {
  onUpload: (file: File, metadata: any) => void;
  isUploading: boolean;
}

export function DocumentUpload({ onUpload, isUploading }: DocumentUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    type: "other" as const,
    description: "",
    isPrivate: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const projectId = params.projectId as string;

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(Array.from(files));
      setShowModal(true);
    }
  };

  const handleUpload = async () => {
    if (!projectId || selectedFiles.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    try {
      for (const file of selectedFiles) {
        // Generate unique filename with timestamp and sanitize filename
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop();

        // Sanitize filename: remove special characters, replace spaces with underscores
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
          .replace(/_{2,}/g, "_") // Replace multiple underscores with single
          .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

        const fileName = `${timestamp}-${sanitizedName}`;
        const storagePath = `projects/${projectId}/documents/${metadata.type}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        // Call the onUpload callback with file and metadata including storage info
        const uploadMetadata = {
          ...metadata,
          project_id: projectId,
          storage_key: storagePath,
          file_size: file.size,
          mime_type: file.type,
        };

        onUpload(file, uploadMetadata);
      }

      // Reset form
      setShowModal(false);
      setSelectedFiles([]);
      setMetadata({
        type: "other",
        description: "",
        isPrivate: false,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      // You might want to show an error message to the user here
    } finally {
      setUploading(false);
    }
  };

  const documentTypes = [
    { value: "plan", label: "Plans" },
    { value: "permit", label: "Permits" },
    { value: "contract", label: "Contracts" },
    { value: "invoice", label: "Invoices" },
    { value: "other", label: "Other" },
  ];

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
          isUploading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
      />

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Documents
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Selected Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({selectedFiles.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center">
                        {file.type.startsWith("image/") ? (
                          <Camera className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={metadata.type}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              {/* Privacy Settings */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sharing & Privacy
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!metadata.isPrivate}
                      onChange={() =>
                        setMetadata((prev) => ({ ...prev, isPrivate: false }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        Share with project members
                      </div>
                      <div className="text-xs text-gray-500">
                        All team members can view this document
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={metadata.isPrivate}
                      onChange={() =>
                        setMetadata((prev) => ({ ...prev, isPrivate: true }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        Keep private
                      </div>
                      <div className="text-xs text-gray-500">
                        Only you can view this document
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className={`px-4 py-2 rounded-lg font-medium ${
                  uploading || selectedFiles.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    Upload {selectedFiles.length} file
                    {selectedFiles.length > 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
