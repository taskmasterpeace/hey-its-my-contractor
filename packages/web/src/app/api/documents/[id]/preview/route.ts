import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // Get the current user for authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch document metadata from database
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Get file from Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from("documents")
      .download(document.storageKey);

    if (storageError || !fileData) {
      console.error("Storage error:", storageError);
      return new NextResponse("File not found in storage", { status: 404 });
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the file with appropriate headers
    const encodedFilename = encodeURIComponent(document.name);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Document preview error:", error);
    return new NextResponse("Internal server error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
