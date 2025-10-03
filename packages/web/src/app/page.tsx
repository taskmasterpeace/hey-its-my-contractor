import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard (let dashboard handle routing)
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Hey, It&apos;s My Contractor
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-blue-600"> Construction </span>
            Projects
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The all-in-one contractor management platform that helps
            construction teams collaborate, track progress, and deliver projects
            on time and on budget.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {/* {user ? (
              <Link
                href={dashboardUrl}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/login"
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
                >
                  Sign In
                </Link>
              </>
            )} */}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Team Management
            </h3>
            <p className="text-gray-600">
              Invite and manage contractors, homeowners, and project managers
              with role-based permissions.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Project Scheduling
            </h3>
            <p className="text-gray-600">
              Track project timelines, milestones, and deadlines with integrated
              calendar management.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Real-time Communication
            </h3>
            <p className="text-gray-600">
              Keep everyone in the loop with project-based chat, notifications,
              and updates.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Document Management
            </h3>
            <p className="text-gray-600">
              Store and share project documents, plans, permits, and photos in
              one secure place.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-600">
              Monitor project progress, budget utilization, and timeline
              adherence with detailed analytics.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure & Compliant
            </h3>
            <p className="text-gray-600">
              Enterprise-grade security with role-based access control and data
              protection compliance.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Construction Projects?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of construction teams who trust our platform to
            manage their projects efficiently and deliver exceptional results.
          </p>
          {/* {user ? (
            <Link
              href={dashboardUrl}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg inline-flex items-center"
            >
              <Zap className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg inline-flex items-center"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Your Free Trial
            </Link>
          )} */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6" />
              <span className="font-semibold">
                Hey, It&apos;s My Contractor
              </span>
            </div>
            <p className="text-sm">
              © 2025 Hey, It&apos;s My Contractor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
