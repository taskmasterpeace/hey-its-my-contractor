"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Crown, Users, Home, Mail, Phone } from "lucide-react";
import { InvitationManager } from "@/components/invitations/InvitationManager";

interface TeamUser {
  id: string;
  fullName: string | null;
  email: string | null;
  systemRole: string;
  companyRole?: string;
  projectRole?: string;
  phone?: string | null;
}

interface Company {
  company: {
    id: string;
    name: string;
  };
  companyRole: string;
}

interface Project {
  project: {
    id: string;
    name: string;
    address: string;
  };
  projectRole: string;
}

interface CurrentUser {
  id: string;
  systemRole: "project_manager" | "contractor";
  fullName: string | null;
  email: string | null;
}

interface TeamManagementProps {
  currentUser: CurrentUser;
  companies: Company[];
  projects: Project[];
  canInviteContractors: boolean;
  canInviteHomeowners: boolean;
}

export function TeamManagement({
  currentUser,
  companies,
  projects,
  canInviteContractors,
  canInviteHomeowners,
}: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [showHomeownerInvite, setShowHomeownerInvite] = useState(false);
  const [homeownerFormData, setHomeownerFormData] = useState({
    email: "",
    name: "",
    projectId: "",
  });

  // Set default company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].company.id);
    }
  }, [companies, selectedCompany]);

  const loadTeamMembers = async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/team?companyId=${selectedCompany}`);
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
    if (selectedCompany) {
      loadTeamMembers();
    }
  }, [selectedCompany]);

  const inviteHomeowner = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: homeownerFormData.email,
          companyId: selectedCompany,
          companyRole: "member",
          projectId: homeownerFormData.projectId,
          projectRole: "homeowner",
          customMessage: `You've been invited to view the progress of your project. Welcome to our platform!`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHomeownerFormData({ email: "", name: "", projectId: "" });
        setShowHomeownerInvite(false);
        await loadTeamMembers();
      } else {
        alert(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting homeowner:", error);
      alert("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (systemRole: string, projectRole?: string) => {
    if (systemRole === "project_manager")
      return <Crown className="w-5 h-5 text-yellow-500" />;
    if (systemRole === "contractor")
      return <Users className="w-5 h-5 text-blue-500" />;
    if (systemRole === "homeowner")
      return <Home className="w-5 h-5 text-purple-500" />;
    return <Users className="w-5 h-5 text-gray-500" />;
  };

  const getRoleColor = (systemRole: string) => {
    switch (systemRole) {
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
      {/* Header with Company Selection */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-gray-600">
            {currentUser.systemRole === "project_manager"
              ? "Invite contractors and manage your team"
              : "Invite homeowners to your projects"}
          </p>
        </div>

        {companies.length > 1 && (
          <div className="w-64">
            <Label htmlFor="companySelect">Company</Label>
            <select
              id="companySelect"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {companies.map((comp) => (
                <option key={comp.company.id} value={comp.company.id}>
                  {comp.company.name} ({comp.companyRole})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Role-specific invitation sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contractor Invitations (Project Managers only) */}
        {canInviteContractors && selectedCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Invite Contractors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationManager
                companyId={selectedCompany}
                projects={projects.map((p) => ({
                  id: p.project.id,
                  name: p.project.name,
                  address: p.project.address,
                }))}
                currentUserRole={
                  (companies.find((c) => c.company.id === selectedCompany)
                    ?.companyRole as any) || "member"
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Homeowner Invitations (Contractors only) */}
        {canInviteHomeowners && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Invite Homeowners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  You need to be assigned to projects before you can invite
                  homeowners
                </p>
              ) : (
                <>
                  {!showHomeownerInvite ? (
                    <Button
                      onClick={() => setShowHomeownerInvite(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Homeowner
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="homeownerEmail">Homeowner Email</Label>
                        <Input
                          id="homeownerEmail"
                          type="email"
                          value={homeownerFormData.email}
                          onChange={(e) =>
                            setHomeownerFormData({
                              ...homeownerFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="homeowner@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="homeownerName">
                          Homeowner Name (Optional)
                        </Label>
                        <Input
                          id="homeownerName"
                          value={homeownerFormData.name}
                          onChange={(e) =>
                            setHomeownerFormData({
                              ...homeownerFormData,
                              name: e.target.value,
                            })
                          }
                          placeholder="John Smith"
                        />
                      </div>

                      <div>
                        <Label htmlFor="projectSelect">Project</Label>
                        <select
                          id="projectSelect"
                          value={homeownerFormData.projectId}
                          onChange={(e) =>
                            setHomeownerFormData({
                              ...homeownerFormData,
                              projectId: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select a project</option>
                          {projects.map((proj) => (
                            <option
                              key={proj.project.id}
                              value={proj.project.id}
                            >
                              {proj.project.name} - {proj.project.address}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowHomeownerInvite(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={inviteHomeowner}
                          disabled={
                            loading ||
                            !homeownerFormData.email ||
                            !homeownerFormData.projectId
                          }
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                      {getUserInitials(member.fullName)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {member.fullName || "Unnamed User"}
                        </h3>
                        <Badge className={getRoleColor(member.systemRole)}>
                          {getRoleIcon(member.systemRole)}
                          <span className="ml-1 capitalize">
                            {member.systemRole.replace("_", " ")}
                          </span>
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{member.email}</p>
                        {member.phone && <p>Phone: {member.phone}</p>}
                        {member.companyRole && (
                          <p>
                            Company Role: {member.companyRole.replace("_", " ")}
                          </p>
                        )}
                        {member.projectRole && (
                          <p>
                            Project Role: {member.projectRole.replace("_", " ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4" />
                    </Button>
                    {member.phone && (
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Overview (for contractors) */}
      {currentUser.systemRole === "contractor" && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div key={proj.project.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Home className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {proj.project.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {proj.project.address}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {proj.projectRole.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.length}
              </p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {
                  teamMembers.filter((m) => m.systemRole === "contractor")
                    .length
                }
              </p>
              <p className="text-sm text-gray-600">Contractors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {teamMembers.filter((m) => m.systemRole === "homeowner").length}
              </p>
              <p className="text-sm text-gray-600">Homeowners</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {projects.length}
              </p>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
