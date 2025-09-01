'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, FileText, X } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File, metadata: any) => void;
  isUploading: boolean;
}

export function DocumentUpload({ onUpload, isUploading }: DocumentUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    project_id: '',
    type: 'other' as const,
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(Array.from(files));
      setShowModal(true);
    }
  };

  const handleUpload = () => {
    selectedFiles.forEach(file => {
      onUpload(file, metadata);
    });
    setShowModal(false);
    setSelectedFiles([]);
    setMetadata({
      project_id: '',
      type: 'other',
      description: '',
    });
  };

  const documentTypes = [
    { value: 'plan', label: 'Plan/Drawing' },
    { value: 'permit', label: 'Permit' },
    { value: 'contract', label: 'Contract' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'photo', label: 'Photo' },
    { value: 'other', label: 'Other' },
  ];

  const projects = [
    { id: 'proj-1', name: 'Johnson Kitchen Remodel' },
    { id: 'proj-2', name: 'Wilson Bathroom' },
    { id: 'proj-3', name: 'Davis Deck Construction' },
  ];

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
          isUploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
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
              <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
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
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        {file.type.startsWith('image/') ? (
                          <Camera className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">{file.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={metadata.project_id}
                  onChange={(e) => setMetadata(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={metadata.type}
                  onChange={(e) => setMetadata(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {documentTypes.map(type => (
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
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}