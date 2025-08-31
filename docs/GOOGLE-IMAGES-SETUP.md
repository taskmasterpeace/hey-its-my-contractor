# Google Images Integration Setup Guide

## Overview

FieldTime uses **Google Custom Search Engine** to provide contractors with targeted image search capabilities. This allows searching Home Depot and Lowe's by default, with contractor customization for additional sites.

## Current Configuration

### **Custom Search Engine Details**
- **Name**: contractor
- **Search Engine ID (cx)**: `23de2758e19a541ef`
- **Default Sites**: homedepot.com, lowes.com
- **Image Search**: Enabled
- **Daily Quota**: Up to 10,000 image queries/day
- **Public Demo**: https://cse.google.com/cse?cx=23de2758e19a541ef

## Step-by-Step Integration

### **Step 1: Get Google API Key**

1. **Visit Google Cloud Console**: https://console.cloud.google.com
2. **Create new project** or select existing project
3. **Enable Custom Search API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key
5. **Add to Environment Variables**:
   ```bash
   # Add to .env.local
   GOOGLE_SEARCH_API_KEY=your_api_key_here
   ```

### **Step 2: Configure Search Engine**

Your search engine is already created with:
- **Engine ID**: `23de2758e19a541ef`
- **Sites**: homedepot.com, lowes.com configured
- **Image search**: Enabled

**To modify search sites**:
1. Visit: https://cse.google.com/cse/setup/basic?cx=23de2758e19a541ef
2. **Add/remove sites** in "Sites to search" section
3. **Enable/disable** "Search the entire web" option

### **Step 3: Test API Integration**

```bash
# Test the API endpoint
curl "http://localhost:4001/api/google-images?q=purple+door&retailers=homedepot,lowes"

# Expected response includes:
{
  "query": "purple door",
  "results": [...],
  "source": "google-custom-search" // vs "mock-data"
}
```

## Contractor Control Features

### **Retailer Management**
Contractors can control which sites to search:

```typescript
// Default retailers (checkboxes)
const enabledRetailers = {
  homedepot: true,  // ✅ Home Depot
  lowes: true,      // ✅ Lowe's
  menards: false,   // ☐ Menards
};

// Custom sites contractors can add
const customRetailers = [
  'amazon.com',
  'build.com', 
  'wayfair.com',
  'ferguson.com'
];

// Search entire web option
const searchEntireWeb = false; // Restrict to specific sites
```

### **Search Options**

#### **Restricted Search (Default)**
- **Home Depot + Lowe's only** by default
- **Custom sites** added by contractor
- **Site filtering** using `site:homedepot.com OR site:lowes.com`
- **Quality results** from trusted retailers

#### **Web-Wide Search**
- **Entire web** search when enabled
- **No site restrictions** applied
- **Broader results** but lower relevance
- **Mixed quality** from various sources

### **API Query Structure**

```typescript
// Restricted search example
const restrictedQuery = `purple door (site:homedepot.com OR site:lowes.com OR site:amazon.com)`;

// Web-wide search example  
const webQuery = `purple door`;
```

## Implementation Details

### **API Endpoint**: `/api/google-images`

#### **Parameters**:
- `q` (required): Search query (2-100 characters)
- `retailers`: Comma-separated list (homedepot,lowes,menards)
- `customSites`: Comma-separated custom domains
- `searchWeb`: "true" for entire web, "false" for site restrictions

#### **Response Format**:
```typescript
interface GoogleImagesResponse {
  query: string;
  results: ImageSearchResult[];
  total: number;
  retailers: string[];
  customSites: string[];
  searchEntireWeb: boolean;
  source: 'google-custom-search' | 'mock-data';
  timestamp: string;
}

interface ImageSearchResult {
  id: string;
  title: string;
  url: string;           // Direct image URL
  thumbnail: string;     // Smaller preview URL
  source: string;        // "Home Depot", "Lowe's", etc.
  retailer: string;      // "homedepot", "lowes", etc.
  originalUrl: string;   // Product page URL for purchasing
  description: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}
```

### **Security Features**

#### **Rate Limiting**
- **20 requests per minute** per IP address
- **Prevents API quota abuse** and reduces costs
- **Graceful degradation** to mock data if needed

#### **Input Sanitization**
- **HTML tag removal** prevents injection attacks
- **Length limits** (2-100 characters) prevent abuse
- **Retailer whitelist** ensures only trusted sites

#### **Error Handling**
- **Fallback to mock data** if Google API fails
- **Detailed error logging** for debugging
- **User-friendly error messages** for API issues

## Usage in FieldTime

### **Shopping Workflow**
```
1. Contractor opens Images → Shopping tab
2. Types "bathroom vanity" in search box
3. Checkboxes show: ✅ Home Depot ✅ Lowe's ☐ Menards
4. Custom sites show: 🌐 amazon.com 🌐 build.com
5. Click Search → Results from enabled sites only
6. Each result shows:
   - Product image with retailer logo
   - "View on Site" button → Opens original product page
   - "Save" button → Adds to contractor's image library
   - Magic wand (✨) → AI enhancement options
```

### **Contractor Customization**
```
1. Click "+ Add Custom Site"
2. Enter "ferguson.com" (plumbing supply)
3. Site added to search options
4. Future searches include Ferguson results
5. Contractors can remove sites anytime
6. "Search entire web" bypass for specialty items
```

## Integration with Existing Features

### **Calendar Integration**
- **Meeting action items** can trigger image searches
- **"Find bathroom fixtures"** automatically opens Images with pre-filled search
- **Search results** linkable to calendar events and meetings

### **Change Order Integration**
- **Visual change orders** use searched images as references
- **"Add window trim"** searches relevant trim options
- **AI generation** combines search results with current photos

### **Client Portal Integration**
- **Shared image libraries** show search sources to clients
- **Product links** allow clients to see exact items on retailer sites
- **Professional presentation** with contractor branding maintained

## Performance & Costs

### **Google API Quotas**
- **100 free queries** per day (development)
- **$5 per 1,000 queries** beyond free tier
- **10,000 queries/day maximum** via API

### **Estimated Usage**
- **Average contractor**: 50-100 searches per month
- **Monthly cost**: $15-30 per contractor for search functionality
- **ROI**: Time savings worth $500+ per month vs manual searching

### **Optimization Strategies**
- **Caching popular searches** to reduce API calls
- **Batch processing** for multiple related queries
- **Image compression** for faster loading
- **CDN integration** for search result caching

## Troubleshooting

### **Common Issues**

#### **"Mock data" instead of real results**
**Cause**: GOOGLE_SEARCH_API_KEY not set or invalid  
**Solution**: Add valid API key to environment variables

#### **"Rate limit exceeded" errors**
**Cause**: Too many requests from same IP  
**Solution**: Wait 1 minute or implement user-specific limits

#### **"No results found"**
**Cause**: Search query too specific or sites don't have matching content  
**Solution**: Try broader search terms or enable "Search entire web"

#### **Empty search results**
**Cause**: All retailers unchecked or API quota exceeded  
**Solution**: Enable at least one retailer or check API billing

### **Development Testing**
```bash
# Test API directly
curl "http://localhost:4001/api/google-images?q=kitchen+cabinet&retailers=homedepot,lowes"

# Test with custom sites
curl "http://localhost:4001/api/google-images?q=vanity&customSites=amazon.com,wayfair.com"

# Test entire web search
curl "http://localhost:4001/api/google-images?q=specialty+tool&searchWeb=true"
```

## Future Enhancements

### **Planned Features**
1. **Smart search suggestions** based on project type
2. **Price comparison** across retailers
3. **Availability checking** with store inventory APIs
4. **Bulk image operations** for multiple selections
5. **Search history** with saved queries

### **Advanced Integration**
1. **Voice search** for hands-free operation
2. **Image similarity search** using Google Vision API
3. **Product recognition** from job site photos
4. **Automatic material lists** from searched images

**The Google Custom Search integration provides contractors with powerful, customizable image discovery while maintaining professional presentation and retailer relationships.** 🔍🏗️✨