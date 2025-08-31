# Quick Google API Setup for FieldTime

## ✅ What's Already Configured

You have a **Google Custom Search Engine** ready to use:
- **Search Engine ID**: `23de2758e19a541ef`
- **Sites configured**: Home Depot + Lowe's (with entire web capability)
- **Image search**: Enabled
- **Daily quota**: 10,000 image searches

## 🔑 Get Your API Key (2 minutes)

### **Step 1: Copy API Key from Google Cloud Console**
1. **Open this link**: https://console.cloud.google.com/apis/credentials
2. **Find "Contractor CSE API Key"** in the credentials list
3. **Click the key name** to view details
4. **Copy the API key** (starts with "AIza...")

### **Step 2: Add to FieldTime Environment**
1. **Create `.env.local` file** in the web directory:
   ```bash
   cd C:\git\contractor\contractor-platform\web
   echo GOOGLE_SEARCH_API_KEY=your_copied_api_key_here > .env.local
   echo GOOGLE_CSE_ID=23de2758e19a541ef >> .env.local
   ```
2. **Replace `your_copied_api_key_here`** with the actual key from Google Cloud Console

### **Step 3: Test Real Google Search**
1. **Restart FieldTime**:
   ```bash
   # Kill current server and restart
   PORT=4001 npm run dev
   ```
2. **Test API**:
   ```bash
   curl "http://localhost:4001/api/google-images?q=purple+door&retailers=homedepot,lowes"
   ```
3. **Look for**: `"source": "google-custom-search"` (instead of "mock-data")

## 🛒 How It Works

### **Contractor Shopping Flow**
```
1. Visit http://localhost:4001/images → Shopping tab
2. Type "bathroom vanity" → Click Search
3. Results show:
   🏠 Home Depot vanities with "View on Site" → homedepot.com product page
   🔨 Lowe's vanities with "View on Site" → lowes.com product page
4. Click "Save" → Adds to contractor's image library
5. Magic wand ✨ → AI enhance any image
```

### **Contractor Customization**
```
1. Check/uncheck: ✅ Home Depot ✅ Lowe's ☐ Menards
2. Click "+ Add Custom Site" → Enter "amazon.com"
3. Future searches include Amazon results
4. Toggle "Search entire web" → Bypass site restrictions for specialty items
```

### **Real vs Mock Data**
- **With API key**: Real product images from Home Depot, Lowe's with purchase links
- **Without API key**: Mock placeholder images for development/testing
- **API calls**: Up to 10,000/day ($5 per 1,000 beyond free tier)

## 🔧 Integration Status

### ✅ **Ready to Use**
- **Google Custom Search Engine**: Configured and tested
- **FieldTime API endpoint**: `/api/google-images` with full functionality
- **Contractor controls**: Site toggles, custom domains, entire web option
- **Security**: Rate limiting, input sanitization, error handling

### 🔄 **Activation Required**
- **API key**: Copy from Google Cloud Console → Add to `.env.local`
- **Restart server**: PORT=4001 npm run dev
- **Test search**: Verify real Google results vs mock data

## 🎯 Expected Results

**When properly configured, contractors will see:**
- **Real product images** from Home Depot and Lowe's
- **Product page links** for immediate purchasing
- **Professional image quality** suitable for client presentations
- **Custom site integration** for specialized contractor supplies
- **AI enhancement** capabilities on all discovered images

**This transforms FieldTime into a comprehensive design discovery and client presentation platform!** 🏗️🛒✨

---

## Quick Test Commands

```bash
# Test your CSE public demo
curl "https://cse.google.com/cse?cx=23de2758e19a541ef&q=kitchen+cabinet"

# Test FieldTime API (after adding API key)
curl "http://localhost:4001/api/google-images?q=kitchen+cabinet&retailers=homedepot,lowes"

# Test with custom sites
curl "http://localhost:4001/api/google-images?q=vanity&customSites=amazon.com,wayfair.com"
```