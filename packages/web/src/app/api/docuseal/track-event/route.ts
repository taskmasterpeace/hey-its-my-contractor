import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docusealTracking } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

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

    // Extract relevant data based on event type
    const templateId = templateData?.id;
    const templateSlug = templateData?.slug;
    const documentName = templateData?.name || documentData?.name;

    // Store event in tracking table
    const result = await db.insert(docusealTracking).values({
      projectId,
      templateId,
      templateSlug,
      eventType,
      eventData: templateData || documentData || {},
      documentName,
      createdBy: user.id, // Real authenticated user ID
    });

    console.log(
      `✅ Tracked immediate event: ${eventType} - Template: ${templateId}`
    );

    return NextResponse.json({
      success: true,
      eventType,
      templateId,
    });
  } catch (error) {
    console.error("Error tracking DocuSeal event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
