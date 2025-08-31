import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const { imageUrl, filename, title } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Image URL is required' }, { status: 400 });
    }

    console.log('Downloading image:', imageUrl);

    // Create images directory if it doesn't exist
    const imagesDir = join(process.cwd(), 'public', 'downloaded-images');
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = imageUrl.includes('.jpg') ? 'jpg' : 
                    imageUrl.includes('.jpeg') ? 'jpeg' : 
                    imageUrl.includes('.png') ? 'png' : 'jpg';
    
    const safeFilename = filename ? 
      filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 
      `image_${timestamp}`;
    
    const fullFilename = `${safeFilename}_${timestamp}.${extension}`;
    const filePath = join(imagesDir, fullFilename);

    // Save the image
    await writeFile(filePath, Buffer.from(buffer));

    // Return the local URL
    const localUrl = `/downloaded-images/${fullFilename}`;
    
    console.log('Image saved locally:', localUrl);

    return NextResponse.json({
      success: true,
      localUrl: localUrl,
      originalUrl: imageUrl,
      filename: fullFilename,
      title: title || 'Downloaded Image'
    });

  } catch (error) {
    console.error('Image download failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to download image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}