"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Upload, Search, Filter, Grid, List } from "lucide-react";
import { Document } from "@contractor-platform/types";
import dynamic from "next/dynamic";

// Dynamically import components that use DOM APIs to avoid SSR issues
const DocumentUpload = dynamic(
  () =>
    import("@/components/documents/DocumentUpload").then((mod) => ({
      default: mod.DocumentUpload,
    })),
  { ssr: false }
);
const DocumentsList = dynamic(
  () =>
    import("@/components/documents/DocumentsList").then((mod) => ({
      default: mod.DocumentsList,
    })),
  { ssr: false }
);
const DocumentViewer = dynamic(
  () =>
    import("@/components/documents/DocumentViewer").then((mod) => ({
      default: mod.DocumentViewer,
    })),
  { ssr: false }
);

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const projectId = params.projectId as string;

  // Function to fetch documents from API
  const fetchDocuments = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/project/${projectId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        console.error("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const sortDocuments = (docs: Document[]) => {
    const sorted = [...docs];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "name-asc":
        return sorted.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          b.name.toLowerCase().localeCompare(a.name.toLowerCase())
        );
      case "size-large":
        return sorted.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
      case "size-small":
        return sorted.sort((a, b) => (a.file_size || 0) - (b.file_size || 0));
      default:
        return sorted;
    }
  };

  const handleDocumentUpload = async (file: File, metadata: any) => {
    setIsUploading(true);

    try {
      // The file has already been uploaded to Supabase Storage by the DocumentUpload component
      // Now we need to save the document metadata to the database
      const response = await fetch(
        `/api/project/${metadata.project_id}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            description: metadata.description || "",
            type: metadata.type,
            storageKey: metadata.storage_key,
            fileSize: metadata.file_size,
            mimeType: metadata.mime_type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save document metadata");
      }

      const savedDocument = await response.json();

      // Refetch documents to ensure we have complete data with all fields
      await fetchDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      // You might want to show an error message to the user
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = sortDocuments(
    documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTypeFilter = filterType === "all" || doc.type === filterType;

      // File type filter
      let matchesFileType = true;
      if (fileTypeFilter !== "all") {
        const mimeType = doc.mime_type || "";
        switch (fileTypeFilter) {
          case "pdf":
            matchesFileType = mimeType === "application/pdf";
            break;
          case "image":
            matchesFileType = mimeType.startsWith("image/");
            break;
          case "document":
            matchesFileType =
              mimeType.includes("word") ||
              mimeType.includes("document") ||
              mimeType.includes("text") ||
              mimeType.includes("msword") ||
              mimeType.includes("officedocument");
            break;
          default:
            matchesFileType = true;
        }
      }

      return matchesSearch && matchesTypeFilter && matchesFileType;
    })
  );

  const documentTypes = [
    { value: "all", label: "All Documents" },
    { value: "plan", label: "Plans" },
    { value: "permit", label: "Permits" },
    { value: "contract", label: "Contracts" },
    { value: "invoice", label: "Invoices" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
    { value: "size-large", label: "Largest First" },
    { value: "size-small", label: "Smallest First" },
  ];

  const fileTypeOptions = [
    { value: "all", label: "All Files" },
    { value: "pdf", label: "PDFs" },
    { value: "image", label: "Images" },
    { value: "document", label: "Documents" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Document Management
          </h1>
          <p className="text-gray-600">
            Manage project documents, plans, permits, and photos with version
            control
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <DocumentUpload
            onUpload={handleDocumentUpload}
            isUploading={isUploading}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>

            {/* Document Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div className="relative">
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {fileTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <span>{filteredDocuments.length} documents</span>
          <span>
            {Math.round(
              filteredDocuments.reduce(
                (acc, doc) => acc + (doc.file_size || 0),
                0
              ) /
                1024 /
                1024
            )}
            MB total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : (
            <DocumentsList
              documents={filteredDocuments}
              viewMode={viewMode}
              onSelectDocument={setSelectedDocument}
              selectedDocument={selectedDocument}
            />
          )}
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-1">
          {selectedDocument ? (
            <DocumentViewer document={selectedDocument} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a document
              </h3>
              <p className="text-gray-600">
                Choose a document from the list to view it here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
