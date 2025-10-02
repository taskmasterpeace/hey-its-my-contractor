"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
}

interface Project {
  id: string;
  name: string;
  address: string;
  status: "planning" | "active" | "paused" | "completed" | "cancelled" | null;
  createdAt: Date;
  homeownerName: string | null;
  homeownerEmail: string | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  budget: string | null;
}

interface ProjectSelectorProps {
  user: {
    id: string;
    email: string;
    systemRole: "super_admin" | "project_manager" | "contractor" | "homeowner";
  };
  companies: Array<{
    company: Company;
    companyRole: "admin" | "project_manager" | "member";
  }>;
  selectedCompanyId: string;
  projects: Project[];
  userCompanyRole: "admin" | "project_manager" | "member";
  canCreateProjects: boolean;
}

export function ProjectSelector({
  user,
  companies,
  selectedCompanyId,
  projects,
  userCompanyRole,
  canCreateProjects,
}: ProjectSelectorProps) {
  const router = useRouter();
  const [selectedCompanyIdState, setSelectedCompanyIdState] =
    useState(selectedCompanyId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    address: "",
    description: "",
    homeownerName: "",
    homeownerEmail: "",
    budget: "",
    startDate: "",
    estimatedEndDate: "",
  });
  const { toast } = useToast();

  const selectedCompany = companies.find(
    (c) => c.company.id === selectedCompanyIdState
  )?.company;

  const handleCompanySelect = (companyId: string) => {
    // Navigate to URL-based company selection
    router.push(`/dashboard/${companyId}`);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}/dashboard`);
  };

  const createProject = async () => {
    try {
      setCreateLoading(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createFormData,
          companyId: selectedCompanyIdState,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Project created successfully!",
          description: `${createFormData.name} has been created`,
          variant: "default",
        });
        setCreateFormData({
          name: "",
          address: "",
          description: "",
          homeownerName: "",
          homeownerEmail: "",
          budget: "",
          startDate: "",
          estimatedEndDate: "",
        });
        setShowCreateForm(false);
        window.location.reload(); // Refresh to show new project
      } else {
        toast({
          title: "Failed to create project",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Failed to create project",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status: Project["status"]) => {
    const variants = {
      planning: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const displayStatus = status || "planning";
    return (
      <Badge className={variants[displayStatus as keyof typeof variants]}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Project Button */}
        {canCreateProjects && (
          <div className="mb-6 flex justify-end">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        )}
        {/* Company Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedCompany?.name}
          </h2>
          <p className="text-gray-600 mt-2">
            {selectedCompany?.industry || "Construction Company"} •{" "}
            {userCompanyRole.replace("_", " ")}
          </p>
        </div>

        {/* Projects Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Projects</h3>
            <div className="text-sm text-gray-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Kitchen Renovation"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={createFormData.address}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        address: e.target.value,
                      })
                    }
                    placeholder="123 Main St, Richmond VA"
                  />
                </div>

                <div>
                  <Label htmlFor="homeownerName">Homeowner Name</Label>
                  <Input
                    id="homeownerName"
                    value={createFormData.homeownerName}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        homeownerName: e.target.value,
                      })
                    }
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="homeownerEmail">Homeowner Email</Label>
                  <Input
                    id="homeownerEmail"
                    type="email"
                    value={createFormData.homeownerEmail}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        homeownerEmail: e.target.value,
                      })
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={createFormData.budget}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        budget: e.target.value,
                      })
                    }
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={createFormData.startDate}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Complete kitchen renovation including..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createProject}
                  disabled={
                    createLoading ||
                    !createFormData.name ||
                    !createFormData.address
                  }
                >
                  {createLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first project for this company.
            </p>
            {canCreateProjects && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-3">{getStatusBadge(project.status)}</div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {project.homeownerName && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{project.homeownerName}</span>
                      </div>
                    )}

                    {project.budget && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{formatCurrency(project.budget)}</span>
                      </div>
                    )}

                    {(project.startDate || project.estimatedEndDate) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {project.startDate &&
                            new Date(project.startDate).toLocaleDateString()}
                          {project.startDate &&
                            project.estimatedEndDate &&
                            " - "}
                          {project.estimatedEndDate &&
                            new Date(
                              project.estimatedEndDate
                            ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
