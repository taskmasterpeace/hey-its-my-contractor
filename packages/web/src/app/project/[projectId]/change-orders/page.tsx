"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Plus, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import DocuSeal components
const DocuSealBuilderComponent = dynamic(
  () =>
    import("@/components/documents/DocuSealBuilder").then((mod) => ({
      default: mod.DocuSealBuilderComponent,
    })),
  { ssr: false }
);

interface DocuSealTemplate {
  id: string;
  templateId: number;
  templateSlug: string;
  documentName: string;
  eventType: string;
  signedDocumentUrl?: string;
  auditLogUrl?: string;
  createdAt: string;
}

export default function ChangeOrdersPage() {
  const [showDocuSealBuilder, setShowDocuSealBuilder] = useState(false);
  const [templates, setTemplates] = useState<DocuSealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const projectId = params.projectId as string;

  useEffect(() => {
    fetchTemplates();
  }, [projectId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/project/${projectId}/docuseal-templates`
      );
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error("Failed to fetch DocuSeal templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocuSealClose = () => {
    setShowDocuSealBuilder(false);
    fetchTemplates(); // Refresh templates
  };

  const handleTemplateCreated = (templateData: any) => {
    console.log("Template created:", templateData);
    // Don't close the modal - let user continue working in DocuSeal
    fetchTemplates(); // Just refresh templates in background
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Document Templates
          </h1>
          <p className="text-gray-600">
            Create and send documents for signature with DocuSeal
          </p>
        </div>

        <Button
          onClick={() => setShowDocuSealBuilder(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Document Template</span>
        </Button>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Templates Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first document template with DocuSeal
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {template.documentName ||
                          `Template ${template.templateId}`}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {template.eventType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>ID: {template.templateId}</span>
                      <span>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {template.signedDocumentUrl && (
                      <div className="mt-2">
                        <a
                          href={template.signedDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          📄 View Signed Document
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {template.templateSlug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://docuseal.com/d/${template.templateSlug}`,
                            "_blank"
                          )
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Template
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DocuSeal Builder Modal */}
      {showDocuSealBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                DocuSeal Document Builder
              </h2>
              <button
                onClick={handleDocuSealClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <DocuSealBuilderComponent
                projectId={projectId}
                onTemplateCreated={handleTemplateCreated}
                onClose={handleDocuSealClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
