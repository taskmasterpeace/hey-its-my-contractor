"use client";

import React, { useState, useEffect } from "react";
import { DocusealBuilder } from "@docuseal/react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

interface DocuSealBuilderProps {
  documentUrl?: string;
  projectId?: string;
  onTemplateCreated?: (templateData: any) => void;
  onClose?: () => void;
}

export function DocuSealBuilderComponent({
  documentUrl,
  projectId,
  onTemplateCreated,
  onClose,
}: DocuSealBuilderProps) {
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const params = useParams();

  useEffect(() => {
    fetchBuilderToken();
  }, [documentUrl]);

  const fetchBuilderToken = async () => {
    try {
      setLoading(true);
      setError(undefined);

      // Get user email from your auth context or wherever you store it
      // For now, using a placeholder - you should replace this with actual user email
      const userEmail = "taskmasterpeace@gmail.com"; // Using your DocuSeal account email

      const response = await fetch("/api/docuseal/builder-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          projectId: projectId,
          documentUrl: documentUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create builder token");
      }

      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error("Error fetching builder token:", error);
      setError("Failed to initialize document builder");
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, data: any) => {
    try {
      await fetch("/api/docuseal/track-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          projectId,
          templateData: data,
        }),
      });
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  const handleUpload = (data: any) => {
    console.log("📄 Document uploaded:", data);
    trackEvent("document.uploaded", data);
  };

  const handleSave = (data: any) => {
    console.log("💾 Template saved:", data);
    trackEvent("template.saved", data);
    if (onTemplateCreated) {
      onTemplateCreated(data);
    }
  };

  const handleSend = (data: any) => {
    console.log("📧 Document sent for signing:", data);
    trackEvent("document.sent", data);
    if (onTemplateCreated) {
      onTemplateCreated(data);
    }
  };

  const handleChange = (data: any) => {
    console.log("✏️ Template changed:", data);
    trackEvent("template.changed", data);
  };

  const handleLoad = (data: any) => {
    console.log("📋 Template loaded:", data);
    trackEvent("template.loaded", data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading document builder...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={fetchBuilderToken}>
              Retry
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px]">
      {onClose && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={onClose}>
            Close Builder
          </Button>
        </div>
      )}

      {token ? (
        <DocusealBuilder
          token={token}
          onUpload={handleUpload}
          onSave={handleSave}
          onSend={handleSend}
          onChange={handleChange}
          onLoad={handleLoad}
          className="w-full h-full border rounded-lg"
        />
      ) : (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">No builder token available</p>
        </div>
      )}
    </div>
  );
}

export default DocuSealBuilderComponent;
