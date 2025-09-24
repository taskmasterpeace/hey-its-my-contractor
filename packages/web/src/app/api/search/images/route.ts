import { NextRequest, NextResponse } from 'next/server';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map();

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 100); // Limit length
}

// Rate limiting check
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  const userLimit = rateLimitMap.get(ip);
  
  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (userLimit.count >= maxRequests) {
    return true;
  }

  userLimit.count++;
  return false;
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = request.ip || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');
  const rawRetailers = searchParams.get('retailers');
  
  // Input validation
  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (rawQuery.length < 2 || rawQuery.length > 100) {
    return NextResponse.json({ error: 'Query must be between 2-100 characters' }, { status: 400 });
  }

  // Sanitize inputs
  const query = sanitizeInput(rawQuery);
  const allowedRetailers = ['homedepot', 'lowes', 'menards'];
  const retailers = rawRetailers
    ?.split(',')
    .map(r => sanitizeInput(r.toLowerCase()))
    .filter(r => allowedRetailers.includes(r)) || ['homedepot', 'lowes'];

  try {
    // Mock Google Images API response with retailer filtering
    // In production, this would use SerpApi or Google Custom Search JSON API
    
    const mockResults = [
      {
        id: '1',
        title: `${query} - Home Depot Premium Collection`,
        url: 'https://via.placeholder.com/600x400/FF6900/FFFFFF?text=Home+Depot+' + encodeURIComponent(query),
        thumbnail: 'https://via.placeholder.com/300x200/FF6900/FFFFFF?text=HD',
        source: 'Home Depot',
        retailer: 'homedepot',
        originalUrl: 'https://www.homedepot.com/p/example-product-12345',
        price: '$299.99',
        rating: 4.5,
        inStock: true,
        description: `Professional grade ${query} available at Home Depot`,
        metadata: {
          width: 600,
          height: 400,
          format: 'jpeg',
          size: '45KB'
        }
      },
      {
        id: '2',
        title: `${query} - Lowe's Pro Series`,
        url: 'https://via.placeholder.com/500x400/004990/FFFFFF?text=Lowes+' + encodeURIComponent(query),
        thumbnail: 'https://via.placeholder.com/250x200/004990/FFFFFF?text=LW',
        source: 'Lowe\'s',
        retailer: 'lowes',
        originalUrl: 'https://www.lowes.com/pd/example-product-67890',
        price: '$279.99',
        rating: 4.2,
        inStock: true,
        description: `Contractor series ${query} from Lowe's Professional`,
        metadata: {
          width: 500,
          height: 400,
          format: 'jpeg',
          size: '38KB'
        }
      },
      {
        id: '3',
        title: `${query} - Home Depot Builder's Choice`,
        url: 'https://via.placeholder.com/550x350/FF6900/FFFFFF?text=HD+Builder+' + encodeURIComponent(query),
        thumbnail: 'https://via.placeholder.com/275x175/FF6900/FFFFFF?text=HD+BC',
        source: 'Home Depot',
        retailer: 'homedepot',
        originalUrl: 'https://www.homedepot.com/p/builders-choice-54321',
        price: '$189.99',
        rating: 4.0,
        inStock: false,
        description: `Budget-friendly ${query} option for contractors`,
        metadata: {
          width: 550,
          height: 350,
          format: 'jpeg',
          size: '42KB'
        }
      },
      {
        id: '4',
        title: `${query} - Lowe's Signature Collection`,
        url: 'https://via.placeholder.com/650x450/004990/FFFFFF?text=Lowes+Signature+' + encodeURIComponent(query),
        thumbnail: 'https://via.placeholder.com/325x225/004990/FFFFFF?text=LW+SIG',
        source: 'Lowe\'s',
        retailer: 'lowes',
        originalUrl: 'https://www.lowes.com/pd/signature-collection-98765',
        price: '$349.99',
        rating: 4.7,
        inStock: true,
        description: `Premium ${query} from Lowe's Signature line`,
        metadata: {
          width: 650,
          height: 450,
          format: 'jpeg',
          size: '52KB'
        }
      },
    ];

    // Filter by selected retailers
    const filteredResults = mockResults.filter(result => 
      retailers.includes(result.retailer)
    );

    return NextResponse.json({
      query,
      results: filteredResults,
      total: filteredResults.length,
      retailers: retailers,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

// For future SerpApi integration:
/*
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const retailers = searchParams.get('retailers')?.split(',') || ['homedepot', 'lowes'];
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const { getJson } = require('serpapi');
    
    // Build site filter for specific retailers
    const siteFilter = retailers.map(retailer => {
      const siteMap = {
        homedepot: 'site:homedepot.com',
        lowes: 'site:lowes.com',
        menards: 'site:menards.com',
      };
      return siteMap[retailer];
    }).filter(Boolean).join(' OR ');

    const searchQuery = `${query} (${siteFilter})`;

    const response = await getJson({
      engine: "google_images",
      q: searchQuery,
      location: "United States",
      gl: "us",
      hl: "en",
      api_key: process.env.SERPAPI_KEY
    });

    const formattedResults = response.images_results?.map((result: any, index: number) => ({
      id: `serp-${index}`,
      title: result.title,
      url: result.original,
      thumbnail: result.thumbnail,
      source: result.source,
      originalUrl: result.link, // This is the retailer URL!
      metadata: {
        width: result.original_width,
        height: result.original_height,
        format: result.displayed_link?.split('.').pop(),
      }
    })) || [];

    return NextResponse.json({
      query,
      results: formattedResults,
      total: formattedResults.length,
      retailers: retailers,
    });

  } catch (error) {
    console.error('SerpApi error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
*/