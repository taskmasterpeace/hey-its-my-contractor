'use client';

import { useState, useEffect } from 'react';
import { Document as DocType, DocumentAnnotation } from '@contractor-platform/types';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Share2, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  File,
} from 'lucide-react';

// Set up PDF.js worker for React-PDF v10
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  document: DocType;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>(document.annotations || []);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  const isPDF = document.mime_type === 'application/pdf';
  const isImage = document.mime_type?.startsWith('image/');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.3, prev - 0.2));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    // In a real app, this would download from the storage_key
    const link = window.document.createElement('a');
    link.href = `/api/documents/${document.id}/download`;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isPDF) return <FileText className="w-5 h-5" />;
    if (isImage) return <ImageIcon className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      plan: 'bg-blue-100 text-blue-800',
      permit: 'bg-green-100 text-green-800',
      contract: 'bg-purple-100 text-purple-800',
      invoice: 'bg-orange-100 text-orange-800',
      photo: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="text-gray-600 mr-3">
              {getFileIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {document.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(document.type)}`}>
                  {document.type}
                </span>
                <span className="text-xs text-gray-500">
                  v{document.version}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {document.description && (
          <p className="text-sm text-gray-600 mt-2">
            {document.description}
          </p>
        )}

        {document.expiration_date && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="text-yellow-800 font-medium">
              Expires: {new Date(document.expiration_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {(isPDF || isImage) && (
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isPDF && (
              <>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600 px-2">
                  {currentPage} of {numPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 px-2">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRotate}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {annotations.length > 0 && (
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-1 ${showAnnotations ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button className="p-1 text-gray-600 hover:text-gray-800">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="p-6 bg-gray-100 min-h-96 max-h-[600px] overflow-auto">
        <div className="flex justify-center">
          {isPDF && (
            <div className="relative">
              <Document
                file={`/api/documents/${document.id}/preview`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-64 text-red-600">
                    Failed to load PDF
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={showAnnotations}
                  loading={
                    <div className="flex items-center justify-center h-64 bg-white border">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  }
                />
              </Document>

              {/* Custom Annotations Overlay */}
              {showAnnotations && annotations.filter(ann => ann.page_number === currentPage).map(annotation => (
                <div
                  key={annotation.id}
                  className="absolute border-2 border-yellow-400 bg-yellow-100 bg-opacity-50 pointer-events-auto cursor-pointer group"
                  style={{
                    left: `${annotation.x * scale}px`,
                    top: `${annotation.y * scale}px`,
                    width: `${(annotation.width || 100) * scale}px`,
                    height: `${(annotation.height || 20) * scale}px`,
                  }}
                  title={annotation.content}
                >
                  <div className="absolute -top-8 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {annotation.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isImage && (
            <img
              src={`/api/documents/${document.id}/preview`}
              alt={document.name}
              className="max-w-full h-auto"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          )}

          {!isPDF && !isImage && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {getFileIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview not available
              </h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Annotations Panel */}
      {annotations.length > 0 && (
        <div className="border-t bg-gray-50">
          <div className="px-6 py-3">
            <h4 className="font-medium text-gray-900 mb-2">
              Annotations ({annotations.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {annotations.map(annotation => (
                <div
                  key={annotation.id}
                  className="flex items-start space-x-2 p-2 bg-white rounded border text-sm"
                >
                  <MessageSquare className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-900">{annotation.content}</p>
                    {annotation.page_number && (
                      <p className="text-gray-500 text-xs">
                        Page {annotation.page_number}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Info */}
      <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            Created {new Date(document.created_at).toLocaleDateString()}
            {document.linked_to && (
              <span className="ml-2">
                • Linked to {document.linked_to.meeting_id ? 'meeting' : 'task'}
              </span>
            )}
          </div>
          <div>
            Last updated {new Date(document.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}