import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  Shield,
  Camera,
  Clock,
  ArrowRight,
  Play,
  Zap,
  Smartphone,
  Cloud,
  Lock,
  Hammer,
} from "lucide-react";
import { PortalLens } from "@/components/landing/PortalLens";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ overflowX: 'clip' }}>
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '12px 12px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation — Sticky */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Image src="/images/logos/myfieldtime-icon.png" alt="MyFieldTime" width={40} height={40} />
              <div>
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-[#0056D2]">My</span>
                  <span className="text-[#FFDD00]">Field</span>
                  <span className="text-[#0056D2]">Time</span>
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#see-every-phase" className="text-sm text-gray-400 hover:text-white transition-colors">See it in action</a>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#why" className="text-sm text-gray-400 hover:text-white transition-colors">Why we built it</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/25"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Honest "New" badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-300">New — built in the open, free to try</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">Run Your Jobs.</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Not Your Inbox.
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              See every phase of every project. Keep your crew coordinated, your clients in the loop,
              and the chaos out of your email. <span className="text-gray-300">Drag the lens below.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/signup"
                className="group flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-yellow-500/25 hover:-translate-y-0.5"
              >
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                disabled
                className="group flex items-center gap-2 text-gray-500 cursor-not-allowed px-6 py-4 opacity-70"
                title="Coming soon"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                Watch Demo
                <span className="text-xs uppercase tracking-wider bg-white/10 text-gray-400 px-2 py-0.5 rounded">Coming Soon</span>
              </button>
            </div>
          </div>

          {/* Portal Lens Hero Image */}
          <div className="max-w-6xl mx-auto">
            <PortalLens
              baseImage="/images/house-finished.png"
              revealImage="/images/house-construction.png"
              lensSize={300}
            />
          </div>
        </div>
      </section>

      {/* See Every Phase — Lens-led storytelling */}
      <section id="see-every-phase" className="relative py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-6">
              <Hammer className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400 font-medium">Construction made visible</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Every project tells
              <span className="block text-gray-500">a story under the surface.</span>
            </h2>
            <p className="text-lg text-gray-400">
              Drywall hides framing. Tile hides plumbing. Finishes hide weeks of decisions.
              MyFieldTime keeps a visual record of every phase — so you and your client can revisit any moment, any time.
            </p>
          </div>

          {/* Single featured lens (more category lenses land as we capture real builds) */}
          <div className="max-w-5xl mx-auto">
            <PortalLens
              baseImage="/images/house-finished.png"
              revealImage="/images/house-construction.png"
              lensSize={260}
            />
          </div>

          <p className="text-center text-sm text-gray-500 mt-8 max-w-xl mx-auto">
            More project lenses (kitchens, baths, exteriors, additions) are coming as we capture real builds with the contractors using MyFieldTime today.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400 font-medium">Built for the field</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Everything you need to
              <span className="block text-gray-500">run jobs like a pro</span>
            </h2>
            <p className="text-lg text-gray-400">
              From first client contact to final walkthrough, MyFieldTime keeps your entire operation running smooth.
            </p>
          </div>

          {/* Feature Cards - Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Feature - Photo Documentation */}
            <div className="lg:col-span-2 group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-8 border border-white/5 hover:border-yellow-500/30 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Photo Documentation & Markup</h3>
                <p className="text-gray-400 mb-6 max-w-lg">
                  Capture site photos, annotate them with arrows and notes, and share with clients instantly.
                  Build visual proof of progress every step of the way.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Before/After</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Markup Tools</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Auto-Organize</span>
                </div>
              </div>
            </div>

            {/* Team Management */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-500">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Team Management</h3>
              <p className="text-gray-400 text-sm">
                Assign crews, track hours, manage subcontractors. Everyone knows where to be and when.
              </p>
            </div>

            {/* Scheduling */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-6 border border-white/5 hover:border-green-500/30 transition-all duration-500">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Scheduling</h3>
              <p className="text-gray-400 text-sm">
                Drag-and-drop calendar with conflict detection. Never double-book a job again.
              </p>
            </div>

            {/* Documents */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-500">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Document Hub</h3>
              <p className="text-gray-400 text-sm">
                Contracts, permits, plans, change orders. All in one place, accessible anywhere.
              </p>
            </div>

            {/* Communication */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-6 border border-white/5 hover:border-pink-500/30 transition-all duration-500">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Client Portal</h3>
              <p className="text-gray-400 text-sm">
                Give clients their own dashboard. They see progress, approve changes, and stay informed.
              </p>
            </div>

            {/* Large Feature - Progress Tracking */}
            <div className="lg:col-span-2 group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-8 border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Real-Time Progress Tracking</h3>
                <p className="text-gray-400 mb-6 max-w-lg">
                  See every project at a glance. Budget vs actual, timeline status, open tasks.
                  Make decisions with confidence, not guesswork.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Live Dashboard</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Cost Tracking</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">Reports</span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-6 border border-white/5 hover:border-yellow-500/30 transition-all duration-500">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bank-Level Security</h3>
              <p className="text-gray-400 text-sm">
                Your data is encrypted and backed up. Role-based access keeps sensitive info protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Built This — honest founder note */}
      <section id="why" className="relative py-32 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-sm text-blue-300 font-medium">Why MyFieldTime exists</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Most contractor software
              <span className="block text-gray-500">looks like it was built in 2008.</span>
            </h2>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-gray-950 rounded-2xl p-8 md:p-12 border border-white/5 space-y-6 text-gray-300 leading-relaxed">
            <p>
              We watched contractors run six-figure jobs out of group texts, sticky notes, and email chains
              with attachments named <span className="text-gray-500 italic">final_FINAL_v3.pdf</span>.
              Homeowners felt left in the dark. Project managers spent half their week chasing updates.
              Crews showed up to the wrong site. Nobody knew where the change order went.
            </p>
            <p>
              The existing tools either felt like enterprise dashboards built for billion-dollar GCs,
              or like spreadsheets in a trench coat. None of them respected the way a real job actually runs —
              messy, visual, multi-stakeholder, mobile.
            </p>
            <p>
              <span className="text-white font-semibold">MyFieldTime is the tool we wished existed.</span>{" "}
              Built for solo contractors and small crews. Designed so homeowners and PMs feel like first-class users,
              not bolt-ons. AI-native where it matters (meetings, photos, research) and dead-simple where it doesn&apos;t.
            </p>
            <p className="text-gray-400">
              We&apos;re early. We&apos;re shipping fast. We&apos;d rather have one contractor running their whole business on this
              than fake logos on a landing page. If that&apos;s you — <Link href="/signup" className="text-yellow-400 hover:text-yellow-300 underline underline-offset-4">come build with us</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">Works Everywhere</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                In the office.
                <span className="block text-gray-500">On the job site.</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Full-featured web app for the office, mobile app for the field.
                Everything syncs in real-time so your team is always on the same page.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Real-Time Sync</h4>
                    <p className="text-sm text-gray-400">Changes appear instantly across all devices. No refresh needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Offline Mode</h4>
                    <p className="text-sm text-gray-400">Keep working in basements and dead zones. Syncs when you&apos;re back online.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Time Tracking Built In</h4>
                    <p className="text-sm text-gray-400">Crew clocks in from their phone. Hours flow right into payroll.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-blue-500/10 to-yellow-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-8 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  {/* Desktop mockup */}
                  <div className="col-span-2 bg-black rounded-xl p-3 border border-white/5">
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/60" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                      <div className="w-2 h-2 rounded-full bg-green-500/60" />
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                      <div className="h-4 w-32 bg-blue-500/20 rounded" />
                      <div className="grid grid-cols-4 gap-2">
                        <div className="h-16 bg-white/5 rounded-lg" />
                        <div className="h-16 bg-white/5 rounded-lg" />
                        <div className="h-16 bg-white/5 rounded-lg" />
                        <div className="h-16 bg-white/5 rounded-lg" />
                      </div>
                      <div className="h-24 bg-white/5 rounded-lg" />
                    </div>
                  </div>

                  {/* Phone mockup */}
                  <div className="bg-black rounded-2xl p-2 border border-white/5">
                    <div className="bg-gray-900 rounded-xl p-3 space-y-2">
                      <div className="h-3 w-16 bg-blue-500/20 rounded mx-auto" />
                      <div className="h-20 bg-white/5 rounded-lg" />
                      <div className="h-8 bg-yellow-500/20 rounded-lg" />
                    </div>
                  </div>

                  {/* Tablet mockup */}
                  <div className="bg-black rounded-xl p-2 border border-white/5">
                    <div className="bg-gray-900 rounded-lg p-3 space-y-2">
                      <div className="h-3 w-20 bg-blue-500/20 rounded" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 bg-white/5 rounded" />
                        <div className="h-12 bg-white/5 rounded" />
                      </div>
                      <div className="h-6 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-blue-600/20 via-gray-900 to-gray-950 rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-blue-500/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Ready to run jobs
                <span className="block bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">like a pro?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Free while we&apos;re building this with you. No credit card. No fake testimonials. Just the tool.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-yellow-500/25"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/api/dev-login?demo=true"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all"
                >
                  Try the Demo
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6">No credit card required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/images/logos/myfieldtime-icon.png" alt="MyFieldTime" width={32} height={32} />
              <span className="font-semibold">
                <span className="text-[#0056D2]">My</span>
                <span className="text-[#FFDD00]">Field</span>
                <span className="text-[#0056D2]">Time</span>
              </span>
            </div>
            <a
              href="https://machinekinglabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors group"
            >
              <span>A</span>
              <span className="font-semibold text-gray-400 group-hover:text-white transition-colors">Machine King Labs</span>
              <span>product</span>
            </a>
            <p className="text-sm text-gray-500">
              &copy; 2026 MyFieldTime. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
