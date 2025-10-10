"use client";

import { useState, useEffect, useRef } from "react";
import {
  Document as DocType,
  DocumentAnnotation,
} from "@contractor-platform/types";
import {
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  MessageCircle,
  Send,
} from "lucide-react";

interface DocumentViewerProps {
  document: DocType;
  focusComments?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function DocumentViewer({
  document,
  focusComments,
}: DocumentViewerProps) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>(
    document.annotations || []
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  const isPDF = document.mime_type === "application/pdf";
  const isImage = document.mime_type?.startsWith("image/");
  const isWordDoc =
    document.mime_type?.includes("word") ||
    document.mime_type?.includes("document") ||
    document.mime_type?.includes("msword") ||
    document.mime_type?.includes("officedocument");

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch comments for the document
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/documents/${document.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/documents/${document.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");
      } else {
        console.error("Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Load comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [document.id]);

  // Auto-scroll to comments section when focusComments is true
  useEffect(() => {
    if (focusComments && commentsRef.current) {
      // Longer delay to ensure DocumentViewer is fully mounted and rendered
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
        // Add a brief highlight animation
        commentsRef.current?.classList.add(
          "ring-2",
          "ring-blue-500",
          "ring-opacity-50"
        );
        setTimeout(() => {
          commentsRef.current?.classList.remove(
            "ring-2",
            "ring-blue-500",
            "ring-opacity-50"
          );
        }, 2000);
      }, 500); // Increased delay to ensure component is fully rendered
    }
  }, [focusComments]);

  // Also auto-scroll when document changes AND focusComments is true (for new document opening)
  useEffect(() => {
    if (focusComments && commentsRef.current) {
      // Delay to ensure the new document's content has rendered
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
        // Add a brief highlight animation
        commentsRef.current?.classList.add(
          "ring-2",
          "ring-blue-500",
          "ring-opacity-50"
        );
        setTimeout(() => {
          commentsRef.current?.classList.remove(
            "ring-2",
            "ring-blue-500",
            "ring-opacity-50"
          );
        }, 2000);
      }, 800); // Even longer delay for new document mounting
    }
  }, [document.id, focusComments]);

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {isPDF && <FileText className="w-6 h-6 text-red-600" />}
              {isImage && <ImageIcon className="w-6 h-6 text-blue-600" />}
              {isWordDoc && <FileText className="w-6 h-6 text-blue-800" />}
              {!isPDF && !isImage && !isWordDoc && (
                <File className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {document.name}
              </h3>
              {document.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {document.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatFileSize(document.file_size)}</span>
                <span>{formatDate(document.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <a
              href={`/api/documents/${document.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 p-4">
        {isPDF && (
          <div className="h-full min-h-[600px]">
            <iframe
              src={`/api/documents/${document.id}/preview`}
              className="w-full h-full min-h-[600px] border border-gray-200 rounded-lg"
              title={document.name}
            />
          </div>
        )}

        {isImage && (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <img
              src={`/api/documents/${document.id}/preview`}
              alt={document.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}

        {isWordDoc && (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-800 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Word Document
              </h3>
              <p className="text-gray-600 mb-4">
                Word documents can be downloaded and opened in Microsoft Word or
                similar applications.
              </p>
              <a
                href={`/api/documents/${document.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Download & Open
              </a>
            </div>
          </div>
        )}

        {!isPDF && !isImage && !isWordDoc && (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview not available
              </h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <a
                href={`/api/documents/${document.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Open file
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Annotations Section */}
      {annotations.length > 0 && (
        <div className="border-t p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Annotations ({annotations.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="flex items-start space-x-2 text-sm"
              >
                <div className="w-1 h-4 bg-yellow-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <p className="text-gray-900">{annotation.content}</p>
                  <p className="text-xs text-gray-500">
                    Page {annotation.page_number} •{" "}
                    {formatDate(annotation.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div
        ref={commentsRef}
        className="border-t p-4 transition-all duration-300"
      >
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments ({comments.length})
        </h4>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {isLoadingComments ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {comment.user.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {comment.user.full_name?.charAt(0) ||
                          comment.user.email.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user.full_name || comment.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
