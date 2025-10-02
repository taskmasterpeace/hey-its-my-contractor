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

    const displayStatus = status || "active";
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
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Only show project header and button when there are projects */}
        {projects.length > 0 && (
          <>
            {/* Create Project Button */}
            {canCreateProjects && (
              <div className="mb-6 flex justify-end">
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            )}

            {/* Projects Section */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Projects</h3>
            </div>
          </>
        )}

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
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to start your first project?
              </h3>
              {canCreateProjects && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-slate-300 shadow-sm bg-gradient-to-br from-slate-100 to-slate-200/80 hover:from-blue-100 hover:to-blue-50 hover:border-blue-400"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardContent className="p-6">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {getStatusBadge(project.status)}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>

                  {/* Project Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>

                  {/* Address */}
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">{project.address}</span>
                  </div>

                  {/* Key Info Grid */}
                  <div className="space-y-3">
                    {project.homeownerName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Client</span>
                        <span className="text-sm font-medium text-gray-900">
                          {project.homeownerName}
                        </span>
                      </div>
                    )}

                    {project.budget && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Budget</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    )}

                    {project.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Start Date
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Border Accent */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
