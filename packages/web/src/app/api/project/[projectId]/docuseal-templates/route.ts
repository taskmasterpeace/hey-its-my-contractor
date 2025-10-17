import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docusealTracking } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch DocuSeal tracking records for the project
    const templates = await db
      .select()
      .from(docusealTracking)
      .where(eq(docusealTracking.projectId, projectId))
      .orderBy(desc(docusealTracking.createdAt));

    // Group by template ID to show unique templates with latest events
    const templatesMap = new Map();

    templates.forEach((record) => {
      const key = record.templateId || `submission_${record.submissionId}`;
      if (
        !templatesMap.has(key) ||
        new Date(record.createdAt) > new Date(templatesMap.get(key).createdAt)
      ) {
        templatesMap.set(key, record);
      }
    });

    const uniqueTemplates = Array.from(templatesMap.values());

    return NextResponse.json(uniqueTemplates);
  } catch (error) {
    console.error("Error fetching DocuSeal templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
