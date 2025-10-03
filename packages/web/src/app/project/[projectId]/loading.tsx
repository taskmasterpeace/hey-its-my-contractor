export default function ProjectLoading() {
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
        <div className="space-y-6">
          {/* Page header */}
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Content cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
              >
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-36 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="pt-2">
                  <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading message */}
          <div className="text-center py-8">
            <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
