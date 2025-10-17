"use client";

import React, { useState, useEffect } from "react";
import { DocusealBuilder } from "@docuseal/react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

interface DocuSealBuilderProps {
  documentUrl?: string;
  projectId?: string;
  templateId?: number;
  onTemplateCreated?: (templateData: any) => void;
  onClose?: () => void;
}

export function DocuSealBuilderComponent({
  documentUrl,
  projectId,
  templateId,
  onTemplateCreated,
  onClose,
}: DocuSealBuilderProps) {
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [trackedEvents, setTrackedEvents] = useState<Set<string>>(new Set());
  const params = useParams();

  useEffect(() => {
    fetchBuilderToken();
  }, [documentUrl, templateId]);

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
          templateId: templateId,
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
      // Create a unique key for deduplication
      const eventKey = `${eventType}-${
        data?.id || data?.name || "unknown"
      }-${projectId}`;

      // Check if we've already tracked this event recently
      if (trackedEvents.has(eventKey)) {
        console.log(`⏭️ Skipping duplicate event: ${eventType} - ${data?.id}`);
        return;
      }

      // Add to tracked events set
      setTrackedEvents((prev) => new Set(prev).add(eventKey));

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

      // Clean up tracked events after 30 seconds to prevent memory leaks
      setTimeout(() => {
        setTrackedEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(eventKey);
          return newSet;
        });
      }, 30000);
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  const handleUpload = (data: any) => {
    console.log("📄 Document uploaded:", data);
    // ONLY track document uploads - this is all we need to fetch files later
    if (data && (data.id || data.name)) {
      trackEvent("document.uploaded", data);
    }
  };

  const handleSave = (data: any) => {
    console.log("💾 Template saved:", data);
    // Don't track saves - only uploads matter
    if (onTemplateCreated) {
      onTemplateCreated(data);
    }
  };

  const handleSend = (data: any) => {
    console.log("📧 Document sent for signing:", data);
    // Don't track sends - only uploads matter
    if (onTemplateCreated) {
      onTemplateCreated(data);
    }
  };

  const handleChange = (data: any) => {
    console.log("✏️ Template changed:", data);
    // Don't track changes - only uploads matter
  };

  const handleLoad = (data: any) => {
    console.log("📋 Template loaded:", data);
    // Don't track loads - only uploads matter
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
    <div className="w-full h-full flex flex-col">
      {token ? (
        <DocusealBuilder
          token={token}
          onUpload={handleUpload}
          onSave={handleSave}
          onSend={handleSend}
          onChange={handleChange}
          onLoad={handleLoad}
          className="w-full h-full flex-1 overflow-auto"
          style={{ height: "100%", minHeight: "100vh" }}
        />
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-600">No builder token available</p>
        </div>
      )}
    </div>
  );
}

export default DocuSealBuilderComponent;
