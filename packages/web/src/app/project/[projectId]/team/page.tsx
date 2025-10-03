import { Suspense } from "react";
import { TeamDataFetcher } from "./components/TeamDataFetcher";

interface ProjectTeamPageProps {
  params: Promise<{ projectId: string }>;
}

// Loading fallback component for the team data
function TeamLoadingFallback() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded"></div>
      </div>

      {/* Team Management Controls */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>

        {/* Team Member Cards */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-48 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      <div className="space-y-4">
        <div className="h-6 w-56 bg-gray-200 animate-pulse rounded"></div>

        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading text */}
      <div className="text-center py-4">
        <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mx-auto"></div>
      </div>
    </div>
  );
}

export default async function ProjectTeamPage({
  params,
}: ProjectTeamPageProps) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<TeamLoadingFallback />}>
      <TeamDataFetcher projectId={projectId} />
    </Suspense>
  );
}
