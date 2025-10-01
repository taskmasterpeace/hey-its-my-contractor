"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Crown,
  Users,
  Home,
  Mail,
  Phone,
  UserPlus,
  CheckCircle,
  Clock,
  RotateCcw,
  X,
  Building,
} from "lucide-react";

interface TeamUser {
  id: string;
  fullName: string | null;
  email: string | null;
  projectRole: string;
  phone?: string | null;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  projectRole: string;
  companyRole: string;
  status: "pending" | "accepted" | "expired";
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  customMessage?: string;
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

interface TeamStats {
  totalMembers: number;
  contractors: number;
  homeowners: number;
  projectManagers: number;
}

interface CompanySubscription {
  maxSeats: number;
  usedSeats: number;
  plan: string;
  status: string;
}

export function ProjectTeamManagement({
  currentUser,
  project,
  canInviteToProject,
}: ProjectTeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [subscription, setSubscription] = useState<CompanySubscription | null>(
    null
  );
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    contractors: 0,
    homeowners: 0,
    projectManagers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [resendingInvitationId, setResendingInvitationId] = useState<
    string | null
  >(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    string | null
  >(null);
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
        calculateTeamStats(result.data);
      }
    } catch (error) {
      console.error("Error loading team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const response = await fetch(
        `/api/invitations?companyId=${project.companyId}&projectId=${project.id}`
      );
      const result = await response.json();

      if (result.success) {
        // API returns data.invitations, not just data
        const invitationsArray = result.data?.invitations || [];
        setInvitations(invitationsArray);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      // For now, skip subscription loading if not super admin
      // We can implement a separate API endpoint for company members to get basic subscription info
      const response = await fetch(`/api/team?companyId=${project.companyId}`);
      const result = await response.json();

      if (result.success && result.subscription) {
        setSubscription(result.subscription);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      // Don't show subscription info if we can't access it
      setSubscription(null);
    }
  };

  const calculateTeamStats = (members: TeamUser[]) => {
    const stats = {
      totalMembers: members.length,
      contractors: members.filter((m) => m.projectRole === "contractor").length,
      homeowners: members.filter((m) => m.projectRole === "homeowner").length,
      projectManagers: members.filter(
        (m) => m.projectRole === "project_manager"
      ).length,
    };
    setTeamStats(stats);
  };

  useEffect(() => {
    loadTeamMembers();
    loadInvitations();
    loadSubscription();
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
        await loadInvitations();
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

  const resendInvitation = async (invitationId: string) => {
    try {
      setResendingInvitationId(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation resent successfully!",
          description: "The invitation has been sent again",
          variant: "default",
        });
        await loadInvitations();
      } else {
        toast({
          title: "Failed to resend invitation",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Failed to resend invitation",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setResendingInvitationId(null);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      setCancellingInvitationId(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitation cancelled",
          description: "The invitation has been cancelled",
          variant: "default",
        });
        await loadInvitations();
      } else {
        toast({
          title: "Failed to cancel invitation",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Failed to cancel invitation",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCancellingInvitationId(null);
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

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">
            Manage contractor and team member invitations
          </p>
        </div>

        {canInviteToProject && (
          <Button onClick={() => setShowInviteForm(true)} disabled={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Contractor
          </Button>
        )}
      </div>

      {/* Subscription and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscription Info */}
        {subscription && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Seats Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.usedSeats}/{subscription.maxSeats}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subscription.maxSeats - subscription.usedSeats} seats
                    available
                  </p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamStats.totalMembers}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contractors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamStats.contractors}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Homeowners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamStats.homeowners}
                </p>
              </div>
              <Home className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Contractor</CardTitle>
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

      {/* Team Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading invitations...</p>
            </div>
          ) : !Array.isArray(invitations) || invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invitations yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Invite contractors to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Pending & Recent Invitations
              </h3>
              {Array.isArray(invitations) &&
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">
                          {invitation.email}
                        </p>
                        <Badge
                          className={getInvitationStatusColor(
                            invitation.status
                          )}
                        >
                          {getInvitationStatusIcon(invitation.status)}
                          <span className="ml-1 capitalize">
                            {invitation.status}
                          </span>
                        </Badge>
                        <Badge className={getRoleColor(invitation.projectRole)}>
                          {getRoleIcon(invitation.projectRole)}
                          <span className="ml-1 capitalize">
                            {invitation.projectRole.replace("_", " ")}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Invited by {invitation.invitedByName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invitation.status === "accepted"
                          ? "Accepted"
                          : "Invited"}{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {invitation.status === "pending" && canInviteToProject && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitation(invitation.id)}
                          disabled={
                            resendingInvitationId === invitation.id ||
                            cancellingInvitationId === invitation.id
                          }
                        >
                          <RotateCcw
                            className={`w-4 h-4 mr-1 ${
                              resendingInvitationId === invitation.id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {resendingInvitationId === invitation.id
                            ? "Resending..."
                            : "Resend"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invitation.id)}
                          disabled={
                            resendingInvitationId === invitation.id ||
                            cancellingInvitationId === invitation.id
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          {cancellingInvitationId === invitation.id
                            ? "Cancelling..."
                            : "Cancel"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="text-sm text-gray-600">
              {teamStats.totalMembers} member
              {teamStats.totalMembers !== 1 ? "s" : ""}
            </div>
          </div>
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
            <div className="space-y-4">
              {/* Current User */}
              <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-sm font-medium text-blue-700">
                      {getUserInitials(currentUser.fullName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-blue-900">
                        {currentUser.fullName || "You"}
                      </h3>
                      <Badge className="bg-blue-200 text-blue-800 border-blue-300">
                        You
                      </Badge>
                    </div>
                    <Badge className={getRoleColor(currentUser.projectRole)}>
                      {getRoleIcon(currentUser.projectRole)}
                      <span className="ml-1 capitalize">
                        {currentUser.projectRole.replace("_", " ")}
                      </span>
                    </Badge>
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-blue-700">
                        <Mail className="w-3 h-3 mr-1" />
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Company Role:{" "}
                        {currentUser.projectRole.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Team Members */}
              <div className="grid grid-cols-1 gap-4">
                {teamMembers
                  .filter((member) => member.id !== currentUser.id)
                  .map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
