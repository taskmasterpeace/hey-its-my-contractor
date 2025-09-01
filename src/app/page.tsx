export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hey, It's My Contractor 🏗️
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Powered Contractor Management Platform
        </p>
        <div className="space-y-4">
          <a 
            href="/images" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🪄 Try AAD Generation System
          </a>
          <p className="text-sm text-gray-500">
            Magic Wand Enhancement • AI Generator • Real Replicate AI
          </p>
        </div>
      </div>
    </div>
  );
}