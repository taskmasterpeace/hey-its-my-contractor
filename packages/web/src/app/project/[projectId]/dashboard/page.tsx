import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { meetings, transcripts } from "@/db/schema/meetings";
import { changeOrders } from "@/db/schema/change-orders";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getUserProjectRole, isSuperAdmin } from "@/lib/auth/permissions";
import { Sun } from "lucide-react";

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

  const isSuper = await isSuperAdmin(user.id);
  const userProjectRole = await getUserProjectRole(user.id, projectId);

  if (!isSuper && !userProjectRole) {
    redirect("/dashboard?error=no-project-access");
  }

  // ─── Queries ────────────────────────────────────────────
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

  // Today's schedule
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayMeetings = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      startsAt: meetings.startsAt,
      endsAt: meetings.endsAt,
      type: meetings.type,
      status: meetings.status,
    })
    .from(meetings)
    .where(
      and(
        eq(meetings.projectId, projectId),
        gte(meetings.startsAt, todayStart),
        lte(meetings.startsAt, todayEnd)
      )
    )
    .orderBy(meetings.startsAt);

  // Pending change orders (waiting on signature)
  const pendingOrders = await db
    .select({
      id: changeOrders.id,
      title: changeOrders.title,
      amount: changeOrders.amount,
      createdAt: changeOrders.createdAt,
    })
    .from(changeOrders)
    .where(
      and(
        eq(changeOrders.projectId, projectId),
        eq(changeOrders.status, "pending")
      )
    )
    .orderBy(changeOrders.createdAt);

  // Latest transcript with a pull quote
  const latestTranscripts = await db
    .select({
      text: transcripts.text,
      summary: transcripts.summary,
      actionItems: transcripts.actionItems,
      segments: transcripts.segments,
      meetingId: transcripts.meetingId,
      createdAt: transcripts.createdAt,
    })
    .from(transcripts)
    .innerJoin(meetings, eq(transcripts.meetingId, meetings.id))
    .where(eq(meetings.projectId, projectId))
    .orderBy(desc(transcripts.createdAt))
    .limit(1);

  const latestTranscript = latestTranscripts[0] || null;

  // Get meeting info for transcript
  let transcriptMeeting: { title: string; startsAt: Date } | null = null;
  let transcriptSpeaker = "";
  let transcriptQuote = "";

  if (latestTranscript) {
    const [mtg] = await db
      .select({ title: meetings.title, startsAt: meetings.startsAt })
      .from(meetings)
      .where(eq(meetings.id, latestTranscript.meetingId))
      .limit(1);
    transcriptMeeting = mtg || null;

    const segments = latestTranscript.segments as Array<{ speaker: string; text: string }> | null;
    if (segments && segments.length > 0) {
      const last = segments[segments.length - 1];
      transcriptSpeaker = last.speaker || "";
      transcriptQuote = last.text || "";
      // Find a more interesting quote (longer text)
      for (const seg of segments) {
        if (seg.text.length > transcriptQuote.length) {
          transcriptQuote = seg.text;
          transcriptSpeaker = seg.speaker;
        }
      }
    }
  }

  // Collect action items from recent transcripts
  const recentTranscripts = await db
    .select({
      actionItems: transcripts.actionItems,
      meetingId: transcripts.meetingId,
    })
    .from(transcripts)
    .innerJoin(meetings, eq(transcripts.meetingId, meetings.id))
    .where(eq(meetings.projectId, projectId))
    .orderBy(desc(transcripts.createdAt))
    .limit(3);

  const openItems: Array<{ text: string; source: string }> = [];
  for (const t of recentTranscripts) {
    if (t.actionItems && t.actionItems.length > 0) {
      const [mtg] = await db
        .select({ title: meetings.title })
        .from(meetings)
        .where(eq(meetings.id, t.meetingId))
        .limit(1);
      for (const item of t.actionItems) {
        openItems.push({ text: item, source: mtg?.title || "Meeting" });
      }
    }
  }

  // Current user name for greeting
  const [currentUser] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const firstName = currentUser?.fullName?.split(" ")[0] || currentUser?.email?.split("@")[0] || "there";

  // ─── Helpers ────────────────────────────────────────────
  const displayStatus = project.status || "planning";
  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(parseFloat(amount));

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const daysSince = (date: Date) =>
    Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const speakerInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const nextMeeting = todayMeetings.find(m => new Date(m.startsAt) > now);

  return (
    <div style={{ padding: "44px 48px 56px", display: "flex", flexDirection: "column", gap: 40, maxWidth: 1320 }}>

      {/* ── EDITORIAL HERO ── */}
      <div>
        <div
          className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--ft-steel-2)" }}
        >
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          {" · "}Loudoun, VA
        </div>
        <h1
          className="font-display"
          style={{ margin: "12px 0 0", fontWeight: 800, fontSize: 54, letterSpacing: "-0.025em", lineHeight: 1.08, maxWidth: 980, color: "var(--ft-ink)" }}
        >
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {firstName}.
          <br />
          <span style={{ color: "var(--ft-steel-2)" }}>
            {todayMeetings.length > 0
              ? `${todayMeetings.length} event${todayMeetings.length === 1 ? "" : "s"} today.`
              : "Nothing scheduled today."}
          </span>
        </h1>
        <div className="h-[6px] w-[96px] rounded-sm mt-4" style={{ background: "var(--ft-yellow)" }} />
        <div className="flex flex-wrap items-center gap-7 mt-5" style={{ color: "var(--ft-steel)", fontSize: 14 }}>
          <span className="inline-flex items-center gap-2">
            <Sun className="w-[18px] h-[18px]" style={{ color: "var(--ft-steel-2)" }} />
            <strong className="font-medium" style={{ color: "var(--ft-ink)" }}>72°</strong>
            <span className="mx-0.5">·</span>Partly Cloudy
          </span>
          <span>Rain holds til 3 pm</span>
          <span>Wind 8 mph</span>
          {nextMeeting && (
            <span style={{ marginLeft: "auto" }}>
              Next:{" "}
              <strong className="font-medium" style={{ color: "var(--ft-ink)" }}>
                {nextMeeting.title} · {formatTime(nextMeeting.startsAt)}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* ── PROJECT HERO — side-by-side ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          border: "1px solid var(--ft-rule)",
          borderRadius: 4,
          overflow: "hidden",
          minHeight: 320,
        }}
      >
        <div
          style={{
            padding: "30px 36px",
            background: "var(--ft-paper)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="flex justify-between items-center">
              <div
                className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--ft-steel)" }}
              >
                Active project{project.status ? ` · ${project.status}` : ""}
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                style={{ background: displayStatus === "active" ? "#e8f5ee" : "var(--ft-paper-2)", color: displayStatus === "active" ? "var(--ft-green)" : "var(--ft-steel)" }}
              >
                {displayStatus === "active" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                {displayStatus === "active" ? "On site" : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </span>
            </div>
            <h1
              className="font-display"
              style={{ marginTop: 10, fontWeight: 700, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1.05, color: "var(--ft-ink)" }}
            >
              {project.name}
            </h1>
            <div className="mt-1" style={{ color: "var(--ft-steel)", fontSize: 13 }}>
              {project.address}
            </div>
            <div className="flex gap-6 mt-5" style={{ fontSize: 12 }}>
              {project.homeownerName && (
                <div>
                  <div style={{ color: "var(--ft-steel)", fontSize: 11 }}>Client</div>
                  <div className="font-medium mt-0.5" style={{ color: "var(--ft-ink)" }}>{project.homeownerName}</div>
                </div>
              )}
              {project.startDate && (
                <div>
                  <div style={{ color: "var(--ft-steel)", fontSize: 11 }}>Start</div>
                  <div className="font-medium mt-0.5" style={{ color: "var(--ft-ink)" }}>
                    {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
              {project.estimatedEndDate && (
                <div>
                  <div style={{ color: "var(--ft-steel)", fontSize: 11 }}>Target close</div>
                  <div className="font-medium mt-0.5" style={{ color: "var(--ft-ink)" }}>
                    {new Date(project.estimatedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {project.budget && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 11, color: "var(--ft-steel)" }}>Budget</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-display" style={{ fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--ft-ink)" }}>
                  {formatCurrency(project.budget)}
                </span>
              </div>
              <div className="mt-2.5" style={{ height: 3, background: "var(--ft-paper-2)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: "100%", background: "var(--ft-ink)", borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundImage:
              'linear-gradient(180deg, rgba(0,71,171,0) 0%, rgba(0,71,171,0.7) 100%), url("https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=900&fit=crop")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute left-6 top-6">
            <div
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Project overview
            </div>
          </div>
          <Link
            href={`/project/${projectId}/images`}
            className="absolute right-5 bottom-5 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium"
            style={{
              background: "rgba(15,26,31,0.85)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 3,
              backdropFilter: "blur(8px)",
              textDecoration: "none",
            }}
          >
            Walk through →
          </Link>
        </div>
      </div>

      {/* ── TWO PANELS — schedule + signatures ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56 }}>
        {/* Today's schedule */}
        <div>
          <div className="flex justify-between items-baseline pb-3.5 mb-1" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[22px]" style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ft-ink)" }}>
              Today&apos;s schedule
            </h2>
            <Link href={`/project/${projectId}/calendar`} className="text-[12px]" style={{ color: "var(--ft-steel)", textDecoration: "none" }}>
              full calendar →
            </Link>
          </div>
          {todayMeetings.length === 0 ? (
            <div className="py-6 text-sm" style={{ color: "var(--ft-steel)" }}>No meetings scheduled for today.</div>
          ) : (
            todayMeetings.map((m, i) => (
              <Link
                key={m.id}
                href={`/project/${projectId}/meetings`}
                className="flex items-center gap-5 py-4 transition-colors hover:bg-[var(--ft-hi-vis-soft)] -mx-3 px-3 rounded"
                style={{
                  borderBottom: i < todayMeetings.length - 1 ? "1px solid var(--ft-rule)" : "none",
                  textDecoration: "none",
                }}
              >
                <div className="w-[56px] flex-shrink-0">
                  <div className="font-mono text-[13px]" style={{ color: "var(--ft-ink)", fontWeight: 600 }}>
                    {formatTime(m.startsAt)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium" style={{ color: "var(--ft-ink)" }}>{m.title}</div>
                  <div className="text-[13px] mt-0.5" style={{ color: "var(--ft-steel)" }}>
                    {m.type.replace("_", " ")}
                  </div>
                </div>
                {m.status === "in_progress" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0" style={{ background: "var(--ft-green)", color: "#fff" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ft-yellow)] animate-pulse" />
                    Joining
                  </span>
                )}
                {m.type === "inspection" && m.status !== "in_progress" && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 uppercase tracking-wide" style={{ background: "rgba(201,71,45,0.1)", color: "var(--ft-rust)" }}>
                    Inspection
                  </span>
                )}
                {m.type !== "inspection" && m.status !== "in_progress" && (
                  <span className="text-[12px] flex-shrink-0" style={{ color: "var(--ft-steel)" }}>
                    {m.type === "consultation" ? "Meeting" : "on site"}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Waiting on signature */}
        <div>
          <div className="flex justify-between items-baseline pb-3.5 mb-1" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[22px]" style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ft-ink)" }}>
              Waiting on signature
            </h2>
            <span className="font-mono text-[12px]" style={{ color: "var(--ft-steel)" }}>{pendingOrders.length}</span>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="py-6 text-sm" style={{ color: "var(--ft-steel)" }}>No pending signatures.</div>
          ) : (
            pendingOrders.map((co, i) => (
              <Link
                key={co.id}
                href={`/project/${projectId}/change-orders`}
                className="block py-4 transition-colors hover:bg-[var(--ft-hi-vis-soft)] -mx-3 px-3 rounded"
                style={{
                  borderBottom: i < pendingOrders.length - 1 ? "1px solid var(--ft-rule)" : "none",
                  textDecoration: "none",
                }}
              >
                <div className="flex justify-between items-baseline gap-2.5">
                  <div className="text-[14px] font-medium" style={{ color: "var(--ft-ink)" }}>{co.title}</div>
                  <span className="font-mono text-[14px] font-medium flex-shrink-0" style={{ color: "var(--ft-ink)" }}>
                    +{formatCurrency(co.amount)}
                  </span>
                </div>
                <div className="text-[12px] mt-1" style={{ color: "var(--ft-steel)" }}>
                  {daysSince(co.createdAt)} days · not opened
                </div>
              </Link>
            ))
          )}
          {pendingOrders.length > 0 && (
            <Link
              href={`/project/${projectId}/change-orders`}
              className="block w-full text-center py-2.5 mt-5 text-sm font-medium rounded"
              style={{ background: "var(--ft-hi-vis)", color: "#fff", textDecoration: "none" }}
            >
              Nudge the client
            </Link>
          )}
        </div>
      </div>

      {/* ── PULL QUOTE FROM A MEETING ── */}
      {transcriptQuote && transcriptMeeting && (
        <Link
          href={`/project/${projectId}/meetings`}
          className="block transition-colors hover:bg-[var(--ft-paper-2)]"
          style={{
            padding: "36px 44px",
            background: "var(--ft-paper)",
            border: "1px solid var(--ft-rule)",
            textDecoration: "none",
          }}
        >
          <div className="flex gap-8 items-start">
            <div className="font-display flex-shrink-0" style={{ fontSize: 72, lineHeight: 0.75, color: "var(--ft-hi-vis)", fontWeight: 800 }}>&ldquo;</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[26px] leading-[1.3]" style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ft-ink)" }}>
                {transcriptQuote}
              </div>
              <div className="flex items-center gap-3 mt-4" style={{ color: "var(--ft-steel)", fontSize: 13 }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: "#7A4E2A", color: "#fff" }}
                >
                  {speakerInitials(transcriptSpeaker)}
                </div>
                <span>
                  <strong className="font-medium" style={{ color: "var(--ft-ink)" }}>{transcriptSpeaker}</strong>
                  {" · "}{transcriptMeeting.title}
                  {" · "}{new Date(transcriptMeeting.startsAt).toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  {formatTime(transcriptMeeting.startsAt)}
                </span>
                <span className="ml-auto text-[13px] flex-shrink-0" style={{ color: "var(--ft-hi-vis)" }}>
                  Open transcript →
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── OPEN FROM THIS WEEK ── */}
      {openItems.length > 0 && (
        <div>
          <div className="flex justify-between items-baseline pb-3.5 mb-1" style={{ borderBottom: "1px solid var(--ft-rule)" }}>
            <h2 className="font-display text-[22px]" style={{ fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ft-ink)" }}>
              Open from this week
            </h2>
            <span className="text-[12px] italic" style={{ color: "var(--ft-steel)" }}>every line links to where it was said</span>
          </div>
          {openItems.map((item, i) => (
            <Link
              key={i}
              href={`/project/${projectId}/meetings`}
              className="flex items-baseline gap-6 py-4 transition-colors hover:bg-[var(--ft-hi-vis-soft)] -mx-3 px-3 rounded"
              style={{
                borderBottom: i < openItems.length - 1 ? "1px solid var(--ft-rule)" : "none",
                textDecoration: "none",
              }}
            >
              <div className="flex-1 text-[15px]" style={{ color: "var(--ft-ink)" }}>
                {item.text}
              </div>
              <span className="text-[12px] flex-shrink-0 whitespace-nowrap" style={{ color: "var(--ft-steel)" }}>
                {item.source}
                <span className="ml-2 font-medium" style={{ color: "var(--ft-ink)" }}>→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
