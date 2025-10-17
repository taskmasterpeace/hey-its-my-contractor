import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docusealTracking } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { eventType, projectId, templateData, documentData } =
      await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Only handle document.uploaded events - ignore everything else
    if (eventType !== "document.uploaded") {
      console.log(`⏭️ Ignoring non-upload event: ${eventType}`);
      return NextResponse.json({
        success: true,
        eventType,
        action: "ignored",
        message: "Only tracking document uploads",
      });
    }

    // Get current authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Extract relevant data for document uploads
    const templateId = templateData?.id;
    const templateSlug = templateData?.slug;
    const documentName = templateData?.name || documentData?.name;

    console.log(`📄 Processing document upload: ${documentName || templateId}`);

    // Check for recent duplicate uploads (last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const recentUploads = await db
      .select()
      .from(docusealTracking)
      .where(
        and(
          eq(docusealTracking.projectId, projectId),
          eq(docusealTracking.eventType, "document.uploaded"),
          eq(docusealTracking.createdBy, user.id)
        )
      );

    // Filter for very recent uploads
    const veryRecentUploads = recentUploads.filter(
      (entry) => entry.createdAt > twoMinutesAgo
    );

    if (veryRecentUploads.length > 0) {
      console.log(
        `⏭️ Skipping duplicate upload - found ${veryRecentUploads.length} recent uploads`
      );
      return NextResponse.json({
        success: true,
        eventType,
        action: "skipped_duplicate",
        message: "Document upload already tracked recently",
      });
    }

    // Create new upload entry
    const result = await db.insert(docusealTracking).values({
      projectId,
      templateId,
      templateSlug,
      eventType: "document.uploaded",
      eventData: templateData || documentData || {},
      documentName,
      createdBy: user.id,
    });

    console.log(`✅ Tracked document upload: ${documentName || templateId}`);

    return NextResponse.json({
      success: true,
      eventType,
      templateId,
      documentName,
      action: "created",
    });
  } catch (error) {
    console.error("Error tracking DocuSeal event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
