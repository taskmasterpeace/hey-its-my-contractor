import { Suspense } from "react";
import { ProjectLayoutDataFetcher } from "./components/ProjectLayoutDataFetcher";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

// Loading fallback component for the project layout
function ProjectLayoutLoadingFallback({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Project info */}
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="space-y-1">
                <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4">
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = await params;

  return (
    <Suspense
      fallback={
        <ProjectLayoutLoadingFallback>{children}</ProjectLayoutLoadingFallback>
      }
    >
      <ProjectLayoutDataFetcher projectId={projectId}>
        {children}
      </ProjectLayoutDataFetcher>
    </Suspense>
  );
}
