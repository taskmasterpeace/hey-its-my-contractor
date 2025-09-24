import { useCallback } from 'react';
import { Document } from '@contractor-platform/types';
import { useAppStore } from '@/store';

export function useDocuments() {
  const documents = useAppStore((state) => state.documents);
  const selectedDocument = useAppStore((state) => state.selectedDocument);
  const uploadQueue = useAppStore((state) => state.uploadQueue);
  const loading = useAppStore((state) => state.loading.documents);
  const currentProject = useAppStore((state) => state.currentProject);

  const {
    setDocuments,
    addDocument,
    setSelectedDocument,
    addToUploadQueue,
    removeFromUploadQueue,
    clearUploadQueue,
    setLoading,
    addNotification,
  } = useAppStore();

  // Get user role for permission filtering
  const userRole = useAppStore((state) => state.userRole);
  const currentUser = useAppStore((state) => state.currentUser);
  
  // Helper function to get client's project ID
  const getClientProjectId = (clientId: string): string => {
    const projectMapping: Record<string, string> = {
      'client-1': 'proj-1', // John Smith → Johnson Kitchen
      'client-2': 'proj-2', // Emily Wilson → Wilson Bathroom
      'client-3': 'proj-3', // Davis → Deck Construction  
    };
    return projectMapping[clientId] || '';
  };
  
  // Filter documents based on user role and permissions
  const projectDocuments = documents.filter(doc => {
    // If project filter is active, apply it first
    if (currentProject && doc.project_id !== currentProject.id) {
      return false;
    }
    
    if (!currentUser) return false;
    
    if (userRole === 'contractor' || userRole === 'staff' || userRole === 'admin') {
      // Contractors see all documents in their tenant
      return true;
    } else if (userRole === 'homeowner') {
      // Homeowners only see documents for their projects
      const clientProjectId = getClientProjectId(currentUser.id);
      return doc.project_id === clientProjectId;
    }
    
    return false;
  });

  // Document type filtering
  const getDocumentsByType = useCallback((type: Document['type']) => {
    return projectDocuments.filter(doc => doc.type === type);
  }, [projectDocuments]);

  // Upload handling
  const handleUpload = useCallback(async (files: File[], metadata: {
    project_id: string;
    type: Document['type'];
    description?: string;
  }) => {
    setLoading(true);
    
    try {
      const uploadedDocuments: Document[] = [];
      
      for (const file of files) {
        // Add to upload queue for progress tracking
        addToUploadQueue(file);
        
        try {
          // In real app, upload to Supabase Storage
          // const uploadResult = await supabase.storage
          //   .from('documents')
          //   .upload(`${metadata.project_id}/${file.name}`, file);
          
          const newDocument: Document = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            project_id: metadata.project_id,
            name: file.name,
            description: metadata.description || '',
            type: metadata.type,
            version: 1,
            storage_key: `${metadata.project_id}/${file.name}`,
            file_size: file.size,
            mime_type: file.type,
            annotations: [],
            created_by: 'current-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          addDocument(newDocument);
          uploadedDocuments.push(newDocument);
          
          addNotification({
            type: 'success',
            message: `${file.name} uploaded successfully`,
          });

        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          addNotification({
            type: 'error',
            message: `Failed to upload ${file.name}`,
          });
        }
      }

      clearUploadQueue();
      return uploadedDocuments;

    } catch (error) {
      console.error('Upload failed:', error);
      addNotification({
        type: 'error',
        message: 'Upload failed. Please try again.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [
    addToUploadQueue,
    addDocument,
    clearUploadQueue,
    setLoading,
    addNotification,
  ]);

  // Document viewing
  const viewDocument = useCallback(async (document: Document) => {
    setSelectedDocument(document);
    
    // Track document views for analytics
    try {
      // In real app, track view
      // await api.trackDocumentView(document.id);
    } catch (error) {
      console.error('Failed to track document view:', error);
    }
  }, [setSelectedDocument]);

  // Document management
  const deleteDocument = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // In real app, delete from storage and database
      // await api.deleteDocument(id);
      
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      setDocuments(updatedDocuments);
      
      // Clear selection if deleted document was selected
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
      }

      addNotification({
        type: 'success',
        message: 'Document deleted successfully',
      });

    } catch (error) {
      console.error('Failed to delete document:', error);
      addNotification({
        type: 'error',
        message: 'Failed to delete document',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [documents, selectedDocument, setDocuments, setSelectedDocument, setLoading, addNotification]);

  const loadDocuments = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      // Sample documents
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
      ];

      setDocuments(sampleDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load documents',
      });
    } finally {
      setLoading(false);
    }
  }, [setDocuments, setLoading, addNotification]);

  // Search and filtering
  const searchDocuments = useCallback((query: string, filters?: {
    type?: Document['type'];
    project_id?: string;
  }) => {
    let filtered = documents;

    if (filters?.project_id) {
      filtered = filtered.filter(doc => doc.project_id === filters.project_id);
    }

    if (filters?.type) {
      filtered = filtered.filter(doc => doc.type === filters.type);
    }

    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [documents]);

  // Document categories for UI
  const getDocumentCounts = useCallback(() => {
    const counts = projectDocuments.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<Document['type'], number>);

    return {
      total: projectDocuments.length,
      plan: counts.plan || 0,
      permit: counts.permit || 0,
      contract: counts.contract || 0,
      invoice: counts.invoice || 0,
      photo: counts.photo || 0,
      other: counts.other || 0,
    };
  }, [projectDocuments]);

  return {
    // State
    documents: projectDocuments,
    allDocuments: documents,
    selectedDocument,
    uploadQueue,
    loading,
    
    // Computed
    documentCounts: getDocumentCounts(),
    
    // Actions
    handleUpload,
    viewDocument,
    deleteDocument,
    loadDocuments,
    setSelectedDocument,
    
    // Queue Management
    addToUploadQueue,
    removeFromUploadQueue,
    clearUploadQueue,
    
    // Utilities
    getDocumentsByType,
    searchDocuments,
  };
}