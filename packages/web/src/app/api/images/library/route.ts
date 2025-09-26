import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { imageLibrary, imageLibraryCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch images from database with categories
    const images = await db
      .select({
        id: imageLibrary.id,
        title: imageLibrary.title,
        description: imageLibrary.description,
        url: imageLibrary.url,
        storageKey: imageLibrary.storageKey,
        filename: imageLibrary.filename,
        mimeType: imageLibrary.mimeType,
        fileSize: imageLibrary.fileSize,
        source: imageLibrary.source,
        originalUrl: imageLibrary.originalUrl,
        retailer: imageLibrary.retailer,
        tags: imageLibrary.tags,
        metadata: imageLibrary.metadata,
        createdAt: imageLibrary.createdAt,
        categoryId: imageLibrary.categoryId,
        categoryName: imageLibraryCategories.name,
        categoryColor: imageLibraryCategories.color,
      })
      .from(imageLibrary)
      .leftJoin(
        imageLibraryCategories,
        eq(imageLibrary.categoryId, imageLibraryCategories.id)
      )
      .where(eq(imageLibrary.userId, user.id))
      .orderBy(desc(imageLibrary.createdAt));

    // Transform data to match LibraryImage interface (using stored URLs)
    const formattedImages = images.map((image) => {
      return {
        id: image.id,
        url: image.url, // Use the stored URL directly
        title: image.title,
        description: image.description,
        source: image.source,
        tags: image.tags || [],
        addedDate: image.createdAt.toISOString(),
        originalUrl: image.originalUrl,
        retailer: image.retailer,
        metadata: image.metadata || {},
        filename: image.filename,
        mimeType: image.mimeType,
        fileSize: image.fileSize,
        category: image.categoryId
          ? {
              id: image.categoryId,
              name: image.categoryName,
              color: image.categoryColor,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      images: formattedImages,
      total: formattedImages.length,
    });
  } catch (error) {
    console.error("Library fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library images" },
      { status: 500 }
    );
  }
}
