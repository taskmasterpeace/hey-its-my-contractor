import { NextRequest, NextResponse } from 'next/server';

// Rate limiting for Google API
const rateLimitMap = new Map();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 20; // 20 requests per minute (well under Google's limits)

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

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes  
    .trim()
    .substring(0, 200); // Limit length
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
  const retailers = searchParams.get('retailers')?.split(',') || ['homedepot', 'lowes'];
  const customSites = searchParams.get('customSites')?.split(',') || [];
  const searchEntireWeb = searchParams.get('searchWeb') === 'true';
  
  // Input validation
  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (rawQuery.length < 2 || rawQuery.length > 100) {
    return NextResponse.json({ error: 'Query must be between 2-100 characters' }, { status: 400 });
  }

  // Sanitize inputs
  const query = sanitizeInput(rawQuery);
  
  try {
    // Google Custom Search Engine configuration
    const GOOGLE_CSE_ID = '23de2758e19a541ef'; // Your contractor search engine
    const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      // For development, return mock data with helpful message
      const mockResponse = getMockSearchResults(query, retailers, customSites);
      return NextResponse.json({
        ...mockResponse,
        note: 'Add GOOGLE_SEARCH_API_KEY to .env.local for real Google Custom Search results'
      });
    }

    let searchQuery = query;
    
    // Build site restrictions if not searching entire web
    if (!searchEntireWeb) {
      const siteMap: { [key: string]: string } = {
        'homedepot': 'site:homedepot.com',
        'lowes': 'site:lowes.com', 
        'menards': 'site:menards.com',
      };
      
      const siteFilters = [
        ...retailers.map(retailer => siteMap[retailer]).filter(Boolean),
        ...customSites.map(site => `site:${site}`)
      ];
      
      if (siteFilters.length > 0) {
        searchQuery = `${query} (${siteFilters.join(' OR ')})`;
      }
    }

    // Call Google Custom Search API
    const googleSearchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleSearchUrl.searchParams.set('key', GOOGLE_API_KEY);
    googleSearchUrl.searchParams.set('cx', GOOGLE_CSE_ID);
    googleSearchUrl.searchParams.set('q', searchQuery);
    googleSearchUrl.searchParams.set('searchType', 'image');
    googleSearchUrl.searchParams.set('num', '10');
    googleSearchUrl.searchParams.set('safe', 'active');
    googleSearchUrl.searchParams.set('rights', 'cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial,cc_nonderived');

    console.log('Google Search URL:', googleSearchUrl.toString());

    const response = await fetch(googleSearchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Google results to our format
    const formattedResults = data.items?.map((item: any, index: number) => {
      // Extract retailer from URL
      const url = new URL(item.link);
      const hostname = url.hostname.toLowerCase();
      
      let retailer = 'custom';
      let retailerName = hostname;
      
      if (hostname.includes('homedepot')) {
        retailer = 'homedepot';
        retailerName = 'Home Depot';
      } else if (hostname.includes('lowes')) {
        retailer = 'lowes';
        retailerName = 'Lowe\'s';
      } else if (hostname.includes('menards')) {
        retailer = 'menards';
        retailerName = 'Menards';
      }

      return {
        id: `google-${index}`,
        title: item.title || `${query} - ${retailerName}`,
        url: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        source: retailerName,
        retailer: retailer,
        originalUrl: item.image?.contextLink || item.link, // Link to product page
        description: item.snippet || `${query} from ${retailerName}`,
        metadata: {
          width: item.image?.width || 0,
          height: item.image?.height || 0,
          format: item.mime?.split('/')[1] || 'unknown',
          size: item.image?.byteSize || 0
        }
      };
    }) || [];

    return NextResponse.json({
      query: query,
      searchQuery: searchQuery,
      results: formattedResults,
      total: formattedResults.length,
      retailers: retailers,
      customSites: customSites,
      searchEntireWeb: searchEntireWeb,
      timestamp: new Date().toISOString(),
      source: 'google-custom-search'
    });

  } catch (error) {
    console.error('Google Custom Search error:', error);
    
    // Fallback to mock data on error
    return getMockSearchResults(query, retailers, customSites);
  }
}

// Mock data for development/fallback
function getMockSearchResults(query: string, retailers: string[], customSites: string[]) {
  const mockResults = [
    {
      id: 'mock-1',
      title: `${query} - Home Depot Professional`,
      url: 'https://via.placeholder.com/600x400/FF6900/FFFFFF?text=Home+Depot+' + encodeURIComponent(query),
      thumbnail: 'https://via.placeholder.com/300x200/FF6900/FFFFFF?text=HD',
      source: 'Home Depot',
      retailer: 'homedepot',
      originalUrl: 'https://www.homedepot.com/p/professional-' + query.replace(/\s+/g, '-'),
      description: `Professional grade ${query} available at Home Depot`,
      metadata: {
        width: 600,
        height: 400,
        format: 'jpeg',
        size: 45000
      }
    },
    {
      id: 'mock-2',
      title: `${query} - Lowe's Pro Series`,
      url: 'https://via.placeholder.com/500x400/004990/FFFFFF?text=Lowes+' + encodeURIComponent(query),
      thumbnail: 'https://via.placeholder.com/250x200/004990/FFFFFF?text=LW',
      source: 'Lowe\'s',
      retailer: 'lowes',
      originalUrl: 'https://www.lowes.com/pd/pro-series-' + query.replace(/\s+/g, '-'),
      description: `Contractor series ${query} from Lowe's Professional`,
      metadata: {
        width: 500,
        height: 400,
        format: 'jpeg',
        size: 38000
      }
    }
  ];

  // Filter by enabled retailers
  const filteredResults = mockResults.filter(result => 
    retailers.includes(result.retailer)
  );

  return NextResponse.json({
    query: query,
    results: filteredResults,
    total: filteredResults.length,
    retailers: retailers,
    customSites: customSites,
    timestamp: new Date().toISOString(),
    source: 'mock-data',
    note: 'Set GOOGLE_SEARCH_API_KEY environment variable for real Google Custom Search results'
  });
}