import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { imageLibrary, imageLibraryCategories } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// GET: Fetch project-scoped image library
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions - filter by project and privacy
    // Private images: only visible to their creator
    // Public images: visible to all project members
    const conditions = [
      eq(imageLibrary.projectId, projectId),
      // Show public images OR private images owned by current user
      or(
        eq(imageLibrary.isPrivate, false),
        and(eq(imageLibrary.isPrivate, true), eq(imageLibrary.userId, user.id))
      ),
    ];

    if (categoryId && categoryId !== "all") {
      conditions.push(eq(imageLibrary.categoryId, categoryId));
    } else {
    }

    // Fetch images with categories, filtered by project
    const images = await db
      .select({
        id: imageLibrary.id,
        title: imageLibrary.title,
        description: imageLibrary.description,
        storageKey: imageLibrary.storageKey,
        filename: imageLibrary.filename,
        source: imageLibrary.source,
        tags: imageLibrary.tags,
        retailer: imageLibrary.retailer,
        originalUrl: imageLibrary.originalUrl,
        metadata: imageLibrary.metadata,
        createdAt: imageLibrary.createdAt,
        projectId: imageLibrary.projectId,
        categoryId: imageLibrary.categoryId,
        categoryName: imageLibraryCategories.name,
        categoryColor: imageLibraryCategories.color,
        isPrivate: imageLibrary.isPrivate,
        userId: imageLibrary.userId,
      })
      .from(imageLibrary)
      .leftJoin(
        imageLibraryCategories,
        and(
          eq(imageLibrary.categoryId, imageLibraryCategories.id),
          eq(imageLibraryCategories.projectId, projectId)
        )
      )
      .where(and(...conditions))
      .orderBy(imageLibrary.createdAt)
      .limit(limit)
      .offset(offset);

    // Add public URLs to images and format category structure
    const imagesWithUrls = images.map((image) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from("contractor").getPublicUrl(image.storageKey);

      return {
        id: image.id,
        url: publicUrl,
        title: image.title,
        description: image.description,
        source: image.source,
        tags: image.tags || [],
        addedDate: image.createdAt,
        projectId: image.projectId,
        originalUrl: image.originalUrl,
        retailer: image.retailer,
        filename: image.filename,
        mimeType: image.metadata,
        fileSize: image.metadata,
        metadata: image.metadata,
        isPrivate: image.isPrivate,
        userId: image.userId,
        // Format category as expected by LibraryImage type
        category: image.categoryId
          ? {
              id: image.categoryId,
              name: image.categoryName || "Unnamed Category",
              color: image.categoryColor || "#3B82F6",
            }
          : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      images: imagesWithUrls,
      projectId,
      pagination: {
        limit,
        offset,
        total: images.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project images" },
      { status: 500 }
    );
  }
}

// POST: Save image to project-scoped library
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const {
      imageUrl,
      fileData,
      fileName,
      fileType,

      title,
      categoryId,
      categoryName,
      tags = [],
      description,
      source = "search_result",
      retailer,
      originalUrl,
      metadata = {},
      isPrivate = false,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let imageBuffer: ArrayBuffer;
    let contentType: string;

    if (fileData) {
      // Handle uploaded file (base64 data)
      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: "File name and type are required for file uploads" },
          { status: 400 }
        );
      }

      try {
        // Convert base64 to buffer
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageBuffer = bytes.buffer;
        contentType = fileType;
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Invalid file data",
          },
          { status: 400 }
        );
      }
    } else if (imageUrl) {
      // Handle external URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image");
      }

      imageBuffer = await imageResponse.arrayBuffer();
      contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    } else {
      return NextResponse.json(
        { error: "Either image URL or file data is required" },
        { status: 400 }
      );
    }

    // Generate a unique filename with project context
    const timestamp = Date.now();
    const extension = fileName
      ? fileName.split(".").pop() || contentType.split("/")[1] || "jpg"
      : contentType.split("/")[1] || "jpg";
    const baseFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
      : title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${baseFileName}_${timestamp}.${extension}`;
    const storageKey = `projects/${projectId}/images/${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("contractor")
      .upload(storageKey, imageBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Failed to upload image");
    }

    // Generate the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("contractor")
      .getPublicUrl(storageKey);

    // Handle category creation if needed (project-scoped)
    let finalCategoryId = categoryId;
    if (categoryName && !categoryId) {
      try {
        const [newCategory] = await db
          .insert(imageLibraryCategories)
          .values({
            userId: user.id,
            projectId: projectId,
            name: categoryName,
            description: `Category created for ${title} in project ${projectId}`,
          })
          .returning();
        finalCategoryId = newCategory.id;
      } catch (error) {
        // Continue without category if creation fails
      }
    }

    // Save to database with project association
    const [savedImage] = await db
      .insert(imageLibrary)
      .values({
        userId: user.id,
        projectId: projectId, // Associate with project
        categoryId: finalCategoryId,
        title,
        description,
        url: urlData.publicUrl,
        storageKey,
        filename,
        mimeType: contentType,
        fileSize: imageBuffer.byteLength,
        source: source as any,
        originalUrl,
        retailer,
        tags,
        isPrivate,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          projectId: projectId,
          originalDimensions: metadata.originalDimensions || null,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        title: savedImage.title,
        url: urlData.publicUrl,
        storageKey: savedImage.storageKey,
        categoryId: savedImage.categoryId,
        projectId: savedImage.projectId,
        tags: savedImage.tags,
        createdAt: savedImage.createdAt,
      },
    });
  } catch (error) {
    console.error("Save project image error:", error);
    return NextResponse.json(
      {
        error: "Failed to save image to project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
