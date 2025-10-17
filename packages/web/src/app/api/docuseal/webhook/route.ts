import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docusealTracking } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    console.log("DocuSeal webhook received:", eventData.event_type);

    // Track all DocuSeal events
    await trackDocuSealEvent(eventData);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing DocuSeal webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function trackDocuSealEvent(eventData: any) {
  try {
    const { event_type, data: payload } = eventData;

    // Extract IDs and info from event payload
    const templateId = payload.template?.id;
    const submissionId = payload.submission?.id || payload.submission_id;
    const templateSlug = payload.template?.slug;
    const submissionSlug = payload.slug;
    const documentName = payload.template?.name || payload.documents?.[0]?.name;
    const signedDocumentUrl = payload.documents?.[0]?.url;
    const auditLogUrl =
      payload.submission?.audit_log_url || payload.audit_log_url;

    // Extract project ID from JWT payload - should be included in the token
    const projectId = payload.project_id || payload.external_id;

    if (!projectId) {
      console.error(
        "No project ID found in webhook payload - check JWT token generation"
      );
      return; // Don't insert without project ID
    }

    // Store event in tracking table
    const result = await db.insert(docusealTracking).values({
      projectId,
      templateId,
      submissionId,
      templateSlug,
      submissionSlug,
      eventType: event_type,
      eventData: payload,
      documentName,
      signedDocumentUrl,
      auditLogUrl,
      createdBy: payload.created_by_user?.id?.toString() || "docuseal-user",
    });

    console.log("Database insert result:", result);

    console.log(
      `✅ Tracked: ${event_type} - Template: ${templateId}, Submission: ${submissionId}`
    );
  } catch (error) {
    console.error("Error tracking DocuSeal event:", error);
  }
}
