"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectContextData {
  name: string;
  address: string;
  budget: number | null;
  timeline: string;
  formattedContext: string;
}

interface ProjectContextProps {
  projectId: string;
}

export function ProjectContext({ projectId }: ProjectContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [context, setContext] = useState<ProjectContextData | null>(null);
  const [editedContext, setEditedContext] = useState<ProjectContextData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Load project context on mount
  useEffect(() => {
    loadProjectContext();
  }, [projectId]);

  const loadProjectContext = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/project/${projectId}/context`);

      if (!response.ok) {
        throw new Error("Failed to load project context");
      }

      const { success, data } = await response.json();

      if (success) {
        setContext(data);
        setEditedContext(data);
      } else {
        throw new Error("Failed to load project context");
      }
    } catch (error) {
      console.error("Failed to load project context:", error);
      setError("Failed to load project context");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (context) {
      setEditedContext({ ...context });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedContext(context);
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!editedContext) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/project/${projectId}/context`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedContext.name,
          address: editedContext.address,
          budget: editedContext.budget,
          startDate: null,
          estimatedEndDate: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project context");
      }

      const { success, data } = await response.json();

      if (success) {
        setContext(data);
        setEditedContext(data);
        setIsEditing(false);
        setShowSaveConfirmation(false);
      } else {
        throw new Error("Failed to update project context");
      }
    } catch (error) {
      console.error("Failed to update project context:", error);
      setError("Failed to update project context");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof ProjectContextData,
    value: string | number
  ) => {
    if (!editedContext) return;

    setEditedContext({
      ...editedContext,
      [field]: value,
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return "Budget not set";
    return `$${budget.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-blue-100 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">
            {error || "Failed to load project context"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 rounded-lg border border-blue-200 mb-6">
        {/* Header - Always Visible */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-blue-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-blue-600" />
            )}
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {context.name} • {context.address} •{" "}
                {formatBudget(context.budget)}
              </span>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-blue-200">
            <div className="space-y-4 mt-4">
              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Project Name"
                      value={editedContext?.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Input
                      placeholder="Project Address"
                      value={editedContext?.address || ""}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      placeholder="Budget"
                      value={editedContext?.budget || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "budget",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode - Minimal
                <div className="text-sm text-blue-700">
                  <p>
                    This project info helps provide relevant recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Update Project Details?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will overwrite the project name, address, and budget.
                  These changes affect how recommendations are provided.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleConfirmSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Yes, Update"
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowSaveConfirmation(false)}
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
