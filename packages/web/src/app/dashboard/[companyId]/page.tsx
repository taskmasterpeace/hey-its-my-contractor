import { Suspense } from "react";
import { DashboardDataFetcher } from "./components/DashboardDataFetcher";

interface DashboardPageProps {
  params: Promise<{ companyId: string }>;
}

// Loading fallback component for the dashboard data
function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Selector */}
        <div className="mb-8">
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="h-12 w-80 bg-gray-200 animate-pulse rounded"></div>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
              >
                {/* Project Header */}
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
                </div>

                {/* Project Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full"></div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading message */}
          <div className="text-center py-8">
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { companyId } = await params;

  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardDataFetcher companyId={companyId} />
    </Suspense>
  );
}
