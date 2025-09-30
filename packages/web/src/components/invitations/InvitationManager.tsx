"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, RefreshCw, X, Eye } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  companyRole: "admin" | "project_manager" | "member";
  projectRole?: "project_manager" | "contractor" | "homeowner";
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  invitedByUser: {
    fullName: string | null;
    email: string | null;
  };
  project?: {
    name: string;
    address: string;
  } | null;
  createdAt: string;
  expiresAt: string;
}

interface InvitationFormData {
  email: string;
  companyRole: "admin" | "project_manager" | "member";
  projectId?: string;
  projectRole?: "project_manager" | "contractor" | "homeowner";
  customMessage?: string;
}

interface Project {
  id: string;
  name: string;
  address: string;
}

interface InvitationManagerProps {
  companyId: string;
  projects: Project[];
  currentUserRole: "admin" | "project_manager" | "member";
}

export function InvitationManager({
  companyId,
  projects,
  currentUserRole,
}: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>({
    email: "",
    companyRole: "member",
  });

  const canInvite =
    currentUserRole === "admin" || currentUserRole === "project_manager";

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations?companyId=${companyId}`);
      const result = await response.json();

      if (result.success) {
        setInvitations(result.data.invitations);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ email: "", companyRole: "member" });
        setShowForm(false);
        await loadInvitations();
      } else {
        alert(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        await loadInvitations();
      } else {
        alert(result.error || "Failed to resend invitation");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert("Failed to resend invitation");
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await loadInvitations();
      } else {
        alert(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("Failed to cancel invitation");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleDisplay = (companyRole: string, projectRole?: string) => {
    if (projectRole) {
      return `${companyRole} (${projectRole})`;
    }
    return companyRole;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Invitations</h2>
          <p className="text-gray-600">
            Manage contractor and team member invitations
          </p>
        </div>

        {canInvite && (
          <Button onClick={() => setShowForm(true)} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invitation Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Send Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contractor@example.com"
              />
            </div>

            <div>
              <Label htmlFor="companyRole">Company Role</Label>
              <select
                id="companyRole"
                value={formData.companyRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyRole: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="member">Member</option>
                {currentUserRole === "admin" && (
                  <>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Admin</option>
                  </>
                )}
              </select>
            </div>

            {projects.length > 0 && (
              <div>
                <Label htmlFor="projectId">Assign to Project (Optional)</Label>
                <select
                  id="projectId"
                  value={formData.projectId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      projectId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">No specific project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.projectId && (
              <div>
                <Label htmlFor="projectRole">Project Role</Label>
                <select
                  id="projectRole"
                  value={formData.projectRole || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      projectRole: (e.target.value as any) || undefined,
                    })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select role</option>
                  <option value="contractor">Contractor</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="homeowner">Homeowner</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <textarea
                id="customMessage"
                value={formData.customMessage || ""}
                onChange={(e) =>
                  setFormData({ ...formData, customMessage: e.target.value })
                }
                placeholder="Add a personal message to the invitation..."
                className="w-full p-2 border rounded-md h-20"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={sendInvitation}
                disabled={loading || !formData.email}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending & Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && invitations.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No invitations sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-600">
                          {getRoleDisplay(
                            invitation.companyRole,
                            invitation.projectRole || undefined
                          )}
                          {invitation.project &&
                            ` • ${invitation.project.name}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Invited by{" "}
                          {invitation.invitedByUser.fullName ||
                            invitation.invitedByUser.email}
                        </p>
                      </div>
                      {getStatusBadge(invitation.status)}
                    </div>
                  </div>

                  {invitation.status === "pending" && canInvite && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendInvitation(invitation.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelInvitation(invitation.id)}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
