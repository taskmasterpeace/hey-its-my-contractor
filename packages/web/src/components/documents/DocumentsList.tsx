"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Document } from "@contractor-platform/types";
import {
  FileText,
  Image as ImageIcon,
  File,
  Calendar,
  User,
  MessageCircle,
  Lock,
  Users,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentsListProps {
  documents: Document[];
  viewMode: "grid" | "list";
  onSelectDocument: (document: Document) => void;
  selectedDocument?: Document | null;
  onCommentClick?: (document: Document) => void;
  onDocumentsChange?: () => void; // Callback to refresh documents
}

export function DocumentsList({
  documents,
  viewMode,
  onSelectDocument,
  selectedDocument,
  onCommentClick,
  onDocumentsChange,
}: DocumentsListProps) {
  const { toast } = useToast();
  const params = useParams();
  const projectId = params.projectId as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedDocumentForPrivacy, setSelectedDocumentForPrivacy] =
    useState<Document | null>(null);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const supabaseModule = await import("@/utils/supabase/client");
        const supabase = supabaseModule.createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    loadCurrentUser();
  }, []);

  const handlePrivacyClick = (document: Document) => {
    setSelectedDocumentForPrivacy(document);
    setShowPrivacyModal(true);
  };

  const handleUpdatePrivacy = async (
    documentId: string,
    isPrivate: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/project/${projectId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isPrivate,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Privacy Updated",
          description: `Document is now ${
            isPrivate ? "private" : "shared with project members"
          }.`,
        });
        // Refresh the documents list
        if (onDocumentsChange) {
          onDocumentsChange();
        }
        // Close modal
        setShowPrivacyModal(false);
        setSelectedDocumentForPrivacy(null);
      } else {
        throw new Error("Failed to update privacy settings");
      }
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(
        `/api/project/${projectId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Document Deleted",
          description: "The document has been deleted successfully.",
        });
        // Refresh the documents list
        if (onDocumentsChange) {
          onDocumentsChange();
        }
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };
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

  const renderPrivacyModal = () =>
    showPrivacyModal &&
    selectedDocumentForPrivacy && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Document Privacy Settings
            </h3>
            <button
              onClick={() => {
                setShowPrivacyModal(false);
                setSelectedDocumentForPrivacy(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2 truncate">
              {selectedDocumentForPrivacy.name}
            </h4>
            <p className="text-sm text-gray-600">
              Choose who can view this document
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() =>
                handleUpdatePrivacy(selectedDocumentForPrivacy.id, false)
              }
              className={`w-full flex items-center p-4 border rounded-lg text-left transition-colors ${
                !selectedDocumentForPrivacy.is_private
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Users className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <div className="font-medium">Share with project members</div>
                <div className="text-sm text-gray-600">
                  All team members can view this document
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                handleUpdatePrivacy(selectedDocumentForPrivacy.id, true)
              }
              className={`w-full flex items-center p-4 border rounded-lg text-left transition-colors ${
                selectedDocumentForPrivacy.is_private
                  ? "border-orange-500 bg-orange-50 text-orange-900"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Lock className="w-5 h-5 mr-3 text-orange-600" />
              <div>
                <div className="font-medium">Keep private</div>
                <div className="text-sm text-gray-600">
                  Only you can view this document
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowPrivacyModal(false);
                setSelectedDocumentForPrivacy(null);
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  if (viewMode === "grid") {
    return (
      <>
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
                      (document as any).createdAt ||
                        (document as any).created_at
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {/* Privacy indicator */}
                  {document.created_by === currentUserId ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrivacyClick(document);
                      }}
                      className={`flex items-center px-2 py-1 rounded text-xs transition-colors hover:scale-105 ${
                        document.is_private
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                      title="Click to change privacy settings"
                    >
                      {document.is_private ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div
                      className={`flex items-center px-2 py-1 rounded text-xs ${
                        document.is_private
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {document.is_private ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCommentClick) {
                          onCommentClick(document);
                        } else {
                          onSelectDocument(document);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center font-medium"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {(document as any).comment_count > 0
                        ? `${(document as any).comment_count} `
                        : ""}
                      Comment{(document as any).comment_count !== 1 ? "s" : ""}
                    </button>
                    {/* Delete button - only show for document owner */}
                    {document.created_by === currentUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(document.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {renderPrivacyModal()}
      </>
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
                    {/* Privacy indicator */}
                    {document.created_by === currentUserId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrivacyClick(document);
                        }}
                        className={`flex items-center px-2 py-1 rounded text-xs transition-colors hover:scale-105 ${
                          document.is_private
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                        title="Click to change privacy settings"
                      >
                        {document.is_private ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <div
                        className={`flex items-center px-2 py-1 rounded text-xs ${
                          document.is_private
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {document.is_private ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCommentClick) {
                          onCommentClick(document);
                        } else {
                          onSelectDocument(document);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center font-medium"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {(document as any).comment_count > 0
                        ? `${(document as any).comment_count} `
                        : ""}
                      Comment{(document as any).comment_count !== 1 ? "s" : ""}
                    </button>
                    {/* Delete button - only show for document owner */}
                    {document.created_by === currentUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(document.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Selection Modal */}
      {showPrivacyModal && selectedDocumentForPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Document Privacy Settings
              </h3>
              <button
                onClick={() => {
                  setShowPrivacyModal(false);
                  setSelectedDocumentForPrivacy(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2 truncate">
                {selectedDocumentForPrivacy.name}
              </h4>
              <p className="text-sm text-gray-600">
                Choose who can view this document
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() =>
                  handleUpdatePrivacy(selectedDocumentForPrivacy.id, false)
                }
                className={`w-full flex items-center p-4 border rounded-lg text-left transition-colors ${
                  !selectedDocumentForPrivacy.is_private
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Share with project members</div>
                  <div className="text-sm text-gray-600">
                    All team members can view this document
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  handleUpdatePrivacy(selectedDocumentForPrivacy.id, true)
                }
                className={`w-full flex items-center p-4 border rounded-lg text-left transition-colors ${
                  selectedDocumentForPrivacy.is_private
                    ? "border-orange-500 bg-orange-50 text-orange-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Lock className="w-5 h-5 mr-3 text-orange-600" />
                <div>
                  <div className="font-medium">Keep private</div>
                  <div className="text-sm text-gray-600">
                    Only you can view this document
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPrivacyModal(false);
                  setSelectedDocumentForPrivacy(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
