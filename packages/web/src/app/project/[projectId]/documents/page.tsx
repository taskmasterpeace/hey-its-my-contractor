'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Upload, Search, Filter, Grid, List } from 'lucide-react';
import { Document } from '@contractor-platform/types';
import dynamic from 'next/dynamic';

// Dynamically import components that use DOM APIs to avoid SSR issues
const DocumentUpload = dynamic(() => import('@/components/documents/DocumentUpload').then(mod => ({ default: mod.DocumentUpload })), { ssr: false });
const DocumentsList = dynamic(() => import('@/components/documents/DocumentsList').then(mod => ({ default: mod.DocumentsList })), { ssr: false });
const DocumentViewer = dynamic(() => import('@/components/documents/DocumentViewer').then(mod => ({ default: mod.DocumentViewer })), { ssr: false });

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);

  // Sample documents data
  useEffect(() => {
    const sampleDocuments: Document[] = [
      {
        id: '1',
        project_id: 'proj-1',
        name: 'Kitchen Plans v3.pdf',
        description: 'Final approved kitchen renovation plans',
        type: 'plan',
        version: 3,
        storage_key: 'projects/johnson-kitchen/plans-v3.pdf',
        file_size: 2457600,
        mime_type: 'application/pdf',
        annotations: [],
        linked_to: {
          meeting_id: 'meet-1',
        },
        created_by: 'contractor-1',
        created_at: '2025-01-15T10:30:00Z',
        updated_at: '2025-01-15T10:30:00Z',
      },
      {
        id: '2',
        project_id: 'proj-1',
        name: 'Electrical Permit',
        description: 'City electrical permit for kitchen renovation',
        type: 'permit',
        version: 1,
        storage_key: 'permits/electrical-permit-2025.pdf',
        file_size: 890000,
        mime_type: 'application/pdf',
        annotations: [],
        expiration_date: '2025-12-31',
        created_by: 'staff-1',
        created_at: '2025-01-10T14:20:00Z',
        updated_at: '2025-01-10T14:20:00Z',
      },
      {
        id: '3',
        project_id: 'proj-1',
        name: 'Progress Photo - Drywall Complete',
        description: 'Drywall installation completed in kitchen area',
        type: 'photo',
        version: 1,
        storage_key: 'photos/drywall-complete-20250218.jpg',
        file_size: 1800000,
        mime_type: 'image/jpeg',
        annotations: [],
        linked_to: {
          task_id: 'task-1',
        },
        created_by: 'contractor-1',
        created_at: '2025-02-18T16:45:00Z',
        updated_at: '2025-02-18T16:45:00Z',
      },
      {
        id: '4',
        project_id: 'proj-2',
        name: 'Bathroom Contract.pdf',
        description: 'Signed contract for bathroom renovation project',
        type: 'contract',
        version: 1,
        storage_key: 'contracts/wilson-bathroom-contract.pdf',
        file_size: 1200000,
        mime_type: 'application/pdf',
        annotations: [
          {
            id: 'ann-1',
            page_number: 1,
            x: 100,
            y: 200,
            width: 200,
            height: 50,
            type: 'highlight',
            content: 'Payment schedule section',
            created_by: 'contractor-1',
            created_at: '2025-01-12T09:15:00Z',
          },
        ],
        created_by: 'contractor-1',
        created_at: '2025-01-08T11:00:00Z',
        updated_at: '2025-01-12T09:15:00Z',
      },
      {
        id: '5',
        project_id: 'proj-1',
        name: 'Invoice #2025-001.pdf',
        description: 'First progress invoice for Johnson kitchen project',
        type: 'invoice',
        version: 1,
        storage_key: 'invoices/invoice-2025-001.pdf',
        file_size: 450000,
        mime_type: 'application/pdf',
        annotations: [],
        created_by: 'staff-1',
        created_at: '2025-02-01T10:00:00Z',
        updated_at: '2025-02-01T10:00:00Z',
      },
    ];
    setDocuments(sampleDocuments);
  }, []);

  const handleDocumentUpload = async (file: File, metadata: any) => {
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      const newDocument: Document = {
        id: Date.now().toString(),
        project_id: metadata.project_id || 'default-project',
        name: file.name,
        description: metadata.description || '',
        type: metadata.type || 'other',
        version: 1,
        storage_key: `uploads/${file.name}`,
        file_size: file.size,
        mime_type: file.type,
        annotations: [],
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      setIsUploading(false);
    }, 2000);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'plan', label: 'Plans' },
    { value: 'permit', label: 'Permits' },
    { value: 'contract', label: 'Contracts' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'photo', label: 'Photos' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Document Management
          </h1>
          <p className="text-gray-600">
            Manage project documents, plans, permits, and photos with version control
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

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
            {Math.round(filteredDocuments.reduce((acc, doc) => acc + doc.file_size, 0) / 1024 / 1024)}MB total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-2">
          <DocumentsList
            documents={filteredDocuments}
            viewMode={viewMode}
            onSelectDocument={setSelectedDocument}
            selectedDocument={selectedDocument}
          />
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