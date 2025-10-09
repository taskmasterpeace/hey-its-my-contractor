"use client";

import { Document } from "@contractor-platform/types";
import {
  FileText,
  Image as ImageIcon,
  File,
  Calendar,
  User,
  MessageCircle,
} from "lucide-react";

interface DocumentsListProps {
  documents: Document[];
  viewMode: "grid" | "list";
  onSelectDocument: (document: Document) => void;
  selectedDocument?: Document | null;
}

export function DocumentsList({
  documents,
  viewMode,
  onSelectDocument,
  selectedDocument,
}: DocumentsListProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf")
      return <FileText className="w-5 h-5 text-red-600" />;
    if (mimeType?.startsWith("image/"))
      return <ImageIcon className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Unknown date";
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No documents found
        </h3>
        <p className="text-gray-600">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            onClick={() => onSelectDocument(document)}
            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedDocument?.id === document.id
                ? "ring-2 ring-blue-500 border-blue-300"
                : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-gray-600">
                {getFileIcon(document.mime_type)}
              </div>
              <span className="text-xs text-gray-500 capitalize">
                {document.type}
              </span>
            </div>

            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {document.name}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {document.description || "No description"}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {formatFileSize(
                    (document as any).fileSize || (document as any).file_size
                  )}
                </span>
                <span>
                  {formatDate(
                    (document as any).createdAt || (document as any).created_at
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-blue-600 font-medium">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span>{(document as any).comment_count || 0} comments</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDocument(document);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center font-medium"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Comment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="divide-y">
        {documents.map((document) => (
          <div
            key={document.id}
            onClick={() => onSelectDocument(document)}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedDocument?.id === document.id
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon(document.mime_type)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {document.name}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {document.description || "No description"}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center capitalize">
                      <User className="w-3 h-3 mr-1" />
                      {document.type}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(
                        (document as any).createdAt ||
                          (document as any).created_at
                      )}
                    </span>
                    <span>
                      {formatFileSize(
                        (document as any).fileSize ||
                          (document as any).file_size
                      )}
                    </span>
                    <span className="flex items-center text-blue-600 font-medium">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {(document as any).comment_count || 0} comments
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDocument(document);
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center font-medium"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
