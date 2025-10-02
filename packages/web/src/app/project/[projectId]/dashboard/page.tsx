import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserProjectRole, isSuperAdmin } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Activity,
} from "lucide-react";

interface ProjectDashboardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDashboardPage({
  params,
}: ProjectDashboardPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;

  // Check if user has access to this project
  const isSuper = await isSuperAdmin(user.id);
  const userProjectRole = await getUserProjectRole(user.id, projectId);

  if (!isSuper && !userProjectRole) {
    redirect("/dashboard?error=no-project-access");
  }

  // Get project details
  const projectData = await db
    .select({
      id: projects.id,
      name: projects.name,
      address: projects.address,
      status: projects.status,
      description: projects.description,
      homeownerName: projects.homeownerName,
      homeownerEmail: projects.homeownerEmail,
      budget: projects.budget,
      startDate: projects.startDate,
      estimatedEndDate: projects.estimatedEndDate,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectData[0];

  if (!project) {
    redirect("/dashboard?error=project-not-found");
  }

  const getStatusBadge = (status: string | null) => {
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

  return (
    <div className="p-6 space-y-6">
      {/* Project Overview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {project.name}
              </CardTitle>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{project.address}</span>
              </div>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(project.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.homeownerName && (
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {project.homeownerName}
                  </p>
                  <p className="text-sm text-gray-600">Homeowner</p>
                </div>
              </div>
            )}

            {project.budget && (
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ${parseFloat(project.budget).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Project Budget</p>
                </div>
              </div>
            )}

            {project.startDate && (
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(project.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">Start Date</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Widgets - Placeholder for now */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Recent project activity will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Project milestones will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
