import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { model, prompt, sourceImage, referenceImages } = await request.json();

    console.log('=== API Request Data ===');
    console.log('Model:', model);
    console.log('Prompt:', prompt);
    console.log('Source Image:', sourceImage);
    console.log('Reference Images:', referenceImages);

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // For AAD, we need either a sourceImage OR reference images
    if (!sourceImage && (!referenceImages || referenceImages.length === 0)) {
      return NextResponse.json({ success: false, error: 'At least a source image or reference images are required' }, { status: 400 });
    }

    let output;

    // Combine sourceImage and referenceImages for the models
    const allImages = [];
    if (sourceImage) allImages.push(sourceImage);
    if (referenceImages) allImages.push(...referenceImages);
    
    // Convert local paths to full URLs for Replicate
    const imagesToUse = allImages.slice(0, 3).map(imageUrl => {
      if (imageUrl.startsWith('/downloaded-images/')) {
        // Convert local path to full URL
        const fullUrl = `${process.env.NODE_ENV === 'development' ? 'http://localhost:4007' : ''}${imageUrl}`;
        console.log('Converting local path to full URL:', imageUrl, '->', fullUrl);
        return fullUrl;
      }
      return imageUrl;
    });
    
    console.log('Images being sent to Replicate:', imagesToUse);

    if (model === 'nano-banana') {
      // Google's Nano Banana model - use create prediction to get URL directly
      const prediction = await replicate.predictions.create({
        model: "google/nano-banana",
        input: {
          prompt: prompt,
          image_input: imagesToUse,
          output_format: "jpg"
        }
      });
      
      // Wait for completion and get URL
      output = await replicate.wait(prediction);
      
    } else if (model === 'gen4-turbo') {
      // RunwayML Gen4 Image Turbo model
      const prediction = await replicate.predictions.create({
        model: "runwayml/gen4-image-turbo", 
        input: {
          prompt: prompt,
          reference_images: imagesToUse,
          resolution: "1080p",
          aspect_ratio: "16:9"
        }
      });
      
      // Wait for completion and get URL
      output = await replicate.wait(prediction);
      
    } else {
      return NextResponse.json({ success: false, error: 'Invalid model selected' }, { status: 400 });
    }

    // The output should be a URL to the generated image
    console.log('Replicate API raw output:', output);
    console.log('Output type:', typeof output);
    
    // Extract the real image URL from the prediction result
    let imageUrl;
    
    console.log('Prediction output structure:', JSON.stringify(output, null, 2));
    
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output)) {
      imageUrl = output[0];
    } else if (output && output.output) {
      // Prediction result should have an output property
      if (Array.isArray(output.output)) {
        imageUrl = output.output[0];
      } else {
        imageUrl = output.output;
      }
    } else if (output && output.urls) {
      imageUrl = Array.isArray(output.urls) ? output.urls[0] : output.urls;
    } else {
      throw new Error('Could not extract image URL from prediction result');
    }
    
    console.log('Processed imageUrl:', imageUrl);
    console.log('ImageUrl type:', typeof imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      model: model,
      prompt: prompt,
      referenceCount: referenceImages.length
    });

  } catch (error) {
    console.error('Replicate API error:', error);
    
    // Handle specific Replicate errors
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json({ 
          success: false, 
          error: 'API authentication failed. Check your Replicate API token.' 
        }, { status: 401 });
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ 
          success: false, 
          error: 'API quota exceeded. Please check your Replicate account limits.' 
        }, { status: 429 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate image. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}