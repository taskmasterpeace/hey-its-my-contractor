import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { imageLibrary, imageLibraryCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      imageUrl,
      fileData,
      fileName,
      fileType,
      fileSize,
      title,
      categoryId,
      categoryName,
      tags = [],
      description,
      source = "search_result",
      retailer,
      originalUrl,
      metadata = {},
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
          { error: "Invalid file data" },
          { status: 400 }
        );
      }
    } else if (imageUrl) {
      // Handle external URL (existing functionality)
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

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = fileName
      ? fileName.split(".").pop() || contentType.split("/")[1] || "jpg"
      : contentType.split("/")[1] || "jpg";
    const baseFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")
      : title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${baseFileName}_${timestamp}.${extension}`;
    const storageKey = `user-images/${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contractor")
      .upload(storageKey, imageBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    // Generate the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("contractor")
      .getPublicUrl(storageKey);

    // Handle category creation if needed
    let finalCategoryId = categoryId;
    if (categoryName && !categoryId) {
      try {
        const [newCategory] = await db
          .insert(imageLibraryCategories)
          .values({
            userId: user.id,
            name: categoryName,
            description: `Category created for ${title}`,
          })
          .returning();
        finalCategoryId = newCategory.id;
      } catch (error) {
        console.error("Failed to create category:", error);
        // Continue without category if creation fails
      }
    }

    // Save to database
    const [savedImage] = await db
      .insert(imageLibrary)
      .values({
        userId: user.id,
        categoryId: finalCategoryId,
        title,
        description,
        url: urlData.publicUrl, // Store the complete URL
        storageKey,
        filename,
        mimeType: contentType,
        fileSize: imageBuffer.byteLength,
        source: source as any,
        originalUrl,
        retailer,
        tags,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalDimensions: metadata.originalDimensions || null,
        },
      })
      .returning();

    // Get the public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(storageKey);

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        title: savedImage.title,
        url: publicUrl,
        storageKey: savedImage.storageKey,
        categoryId: savedImage.categoryId,
        tags: savedImage.tags,
        createdAt: savedImage.createdAt,
      },
    });
  } catch (error) {
    console.error("Save image error:", error);
    return NextResponse.json(
      {
        error: "Failed to save image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Fetch user's image library
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [eq(imageLibrary.userId, user.id)];
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(imageLibrary.categoryId, categoryId));
    }

    // Fetch images with categories
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
        categoryId: imageLibrary.categoryId,
        categoryName: imageLibraryCategories.name,
        categoryColor: imageLibraryCategories.color,
      })
      .from(imageLibrary)
      .leftJoin(
        imageLibraryCategories,
        eq(imageLibrary.categoryId, imageLibraryCategories.id)
      )
      .where(and(...conditions))
      .orderBy(imageLibrary.createdAt)
      .limit(limit)
      .offset(offset);

    // Add public URLs to images
    const imagesWithUrls = images.map((image) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(image.storageKey);

      return {
        ...image,
        url: publicUrl,
      };
    });

    return NextResponse.json({
      success: true,
      images: imagesWithUrls,
      pagination: {
        limit,
        offset,
        total: images.length, // In production, you'd want a separate count query
      },
    });
  } catch (error) {
    console.error("Fetch images error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
