"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Crown, Users, Home, Mail, Phone, UserPlus } from "lucide-react";

interface TeamUser {
  id: string;
  fullName: string | null;
  email: string | null;
  projectRole: string;
  phone?: string | null;
  joinedAt: string;
}

interface ProjectTeamManagementProps {
  currentUser: {
    id: string;
    projectRole: "project_manager" | "contractor" | "homeowner";
    fullName: string | null;
    email: string | null;
  };
  project: {
    id: string;
    name: string;
    address: string;
    companyId: string;
    homeownerName: string | null;
    homeownerEmail: string | null;
  };
  canInviteToProject: boolean;
}

interface InvitationFormData {
  email: string;
  projectRole: "project_manager" | "contractor" | "homeowner";
  customMessage: string;
}

export function ProjectTeamManagement({
  currentUser,
  project,
  canInviteToProject,
}: ProjectTeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>({
    email: "",
    projectRole: "contractor",
    customMessage: "",
  });
  const { toast } = useToast();

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/project/${project.id}/team`);
      const result = await response.json();

      if (result.success) {
        setTeamMembers(result.data);
      }
    } catch (error) {
      console.error("Error loading team members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [project.id]);

  const inviteTeamMember = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          companyId: project.companyId,
          companyRole: "member",
          projectId: project.id,
          projectRole: formData.projectRole,
          customMessage:
            formData.customMessage ||
            `You've been invited to join the ${project.name} project team.`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation sent successfully!",
          description: `Invitation sent to ${formData.email}`,
          variant: "default",
        });
        setFormData({
          email: "",
          projectRole: "contractor",
          customMessage: "",
        });
        setShowInviteForm(false);
        await loadTeamMembers();
      } else {
        toast({
          title: "Failed to send invitation",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast({
        title: "Failed to send invitation",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (projectRole: string) => {
    if (projectRole === "project_manager")
      return <Crown className="w-5 h-5 text-yellow-500" />;
    if (projectRole === "contractor")
      return <Users className="w-5 h-5 text-blue-500" />;
    if (projectRole === "homeowner")
      return <Home className="w-5 h-5 text-purple-500" />;
    return <Users className="w-5 h-5 text-gray-500" />;
  };

  const getRoleColor = (projectRole: string) => {
    switch (projectRole) {
      case "project_manager":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "contractor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "homeowner":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUserInitials = (fullName: string | null) => {
    if (!fullName) return "?";
    const names = fullName.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Team</h1>
          <p className="text-gray-600 mt-1">
            Manage team members for {project.name}
          </p>
        </div>

        {canInviteToProject && (
          <Button onClick={() => setShowInviteForm(true)} disabled={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Project Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{project.name}</h3>
              <p className="text-sm text-blue-700">{project.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member to Project</CardTitle>
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
              <Label htmlFor="projectRole">Project Role</Label>
              <select
                id="projectRole"
                value={formData.projectRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectRole: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="contractor">Contractor</option>
                <option value="project_manager">Project Manager</option>
                <option value="homeowner">Homeowner</option>
              </select>
            </div>

            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Input
                id="customMessage"
                value={formData.customMessage}
                onChange={(e) =>
                  setFormData({ ...formData, customMessage: e.target.value })
                }
                placeholder="Welcome to the project team!"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={inviteTeamMember}
                disabled={loading || !formData.email}
              >
                Send Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No team members yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Invite contractors and team members to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <span className="text-sm font-medium text-gray-700">
                        {getUserInitials(member.fullName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {member.fullName || "Unnamed"}
                      </h3>
                      <Badge className={getRoleColor(member.projectRole)}>
                        {getRoleIcon(member.projectRole)}
                        <span className="ml-1 capitalize">
                          {member.projectRole.replace("_", " ")}
                        </span>
                      </Badge>
                      <div className="mt-2 space-y-1">
                        {member.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-1" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
