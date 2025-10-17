# DocuSeal Integration Documentation

## 🎯 Overview

This contractor platform integrates with DocuSeal to provide enterprise-grade document signing capabilities. The integration allows users to create document templates, add signature fields, and manage the complete signing workflow directly within the platform.

## 🧹 Clean Production Architecture

This integration follows a **clean, single-purpose architecture**:

- **📄 Documents Page**: Pure document management (upload, view, organize) - NO DocuSeal functionality
- **📋 Change Orders Page**: PRIMARY DocuSeal interface for template creation and management
- **🗄️ Database**: Single dedicated `docuseal_tracking` table - no schema pollution
- **🎯 Purpose-Built**: Each page has a clear, distinct responsibility

This separation ensures maintainable, production-ready code without feature creep.

## 🏗️ Architecture

The integration follows a **production-quality architecture** with two distinct tracking approaches:

### **Immediate Tracking (Events We Control)**

- User uploads documents → Instant database storage
- User saves templates → Real-time change tracking
- User sends documents → Immediate submission logging
- All tracked via **DocuSeal Builder callbacks**

### **External Event Tracking (Events We Don't Control)**

- Recipients view documents → Webhook capture
- Recipients sign documents → Webhook completion tracking
- Document declines → Webhook logging
- All tracked via **DocuSeal webhooks**

---

## 📁 File Structure

### **Core Components**

```
src/components/documents/
├── DocuSealBuilder.tsx          # Main DocuSeal Builder wrapper component
└── DocumentsList.tsx            # Clean document listing (no DocuSeal functionality)
```

### **API Routes**

```
src/app/api/docuseal/
├── builder-token/route.ts       # JWT token generation for DocuSeal authentication
├── webhook/route.ts             # Webhook handler for external events
└── track-event/route.ts         # Immediate event tracking for callbacks

src/app/api/project/[projectId]/
└── docuseal-templates/route.ts  # API to fetch tracked templates
```

### **Database Schema**

```
src/db/schema/
├── docuseal-tracking.ts         # Dedicated DocuSeal tracking table (ONLY table needed)
├── documents.ts                 # Clean document schema
└── index.ts                     # Schema exports (change-orders removed)
```

### **Pages**

```
src/app/project/[projectId]/
├── documents/page.tsx           # Pure document management (no DocuSeal)
└── change-orders/page.tsx       # Primary DocuSeal template creation interface
```

---

## 🗄️ Database Schema

### **DocuSeal Tracking Table**

```typescript
docuseal_tracking {
  id: uuid (primary key)
  project_id: uuid (foreign key to projects)
  template_id: integer (DocuSeal template ID)
  submission_id: integer (DocuSeal submission ID)
  template_slug: varchar (DocuSeal template slug)
  submission_slug: varchar (DocuSeal submission slug)
  event_type: enum (event type - see below)
  event_data: jsonb (full DocuSeal event payload)
  document_name: varchar (document name)
  signed_document_url: text (URL to signed PDF)
  audit_log_url: text (URL to audit log)
  created_by: uuid (foreign key to users)
  created_at: timestamp
  updated_at: timestamp
}
```

### **Event Types Enum**

```typescript
docuseal_event {
  // DocuSeal webhook events
  "template.created"
  "template.updated"
  "form.viewed"
  "form.started"
  "form.completed"
  "form.declined"
  "submission.created"
  "submission.completed"

  // DocuSeal Builder callback events (immediate)
  "document.uploaded"
  "template.saved"
  "document.sent"
  "template.changed"
  "template.loaded"
}
```

---

## 🔧 Configuration

### **1. Environment Variables**

Add to your `.env` file:

```bash
DOCUSEAL_API_KEY=your_docuseal_api_key_here
```

### **2. DocuSeal Account Setup**

1. Sign up at [DocuSeal.com](https://docuseal.com)
2. Generate API key in account settings
3. Configure webhook URL (see Webhook Setup section)

### **3. Database Migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 🚀 How to Use

### **For End Users:**

#### **Documents Page:**

1. Navigate to project documents
2. Upload PDF documents
3. Click green "Edit" button on any PDF
4. DocuSeal Builder opens → Add signature fields, text inputs, etc.
5. Save template for reuse

#### **Change Orders Page:**

1. Navigate to project change orders
2. Click "Create Document Template"
3. DocuSeal Builder opens → Upload PDFs, create templates
4. Add recipients and send for signing
5. Track progress in real-time

### **For Developers:**

#### **Using DocuSeal Builder Component:**

```typescript
import { DocuSealBuilderComponent } from "@/components/documents/DocuSealBuilder";

function MyPage() {
  const handleTemplateCreated = (data: any) => {
    console.log("Template created:", data);
    // Handle template creation
  };

  return (
    <DocuSealBuilderComponent
      projectId={projectId}
      documentUrl={documentUrl} // Optional: pre-load document
      onTemplateCreated={handleTemplateCreated}
      onClose={() => setModalOpen(false)}
    />
  );
}
```

#### **Fetching Tracked Templates:**

```typescript
const response = await fetch(`/api/project/${projectId}/docuseal-templates`);
const templates = await response.json();
```

---

## 🔗 API Endpoints

### **1. Builder Token Generation**

```http
POST /api/docuseal/builder-token
Content-Type: application/json

{
  "email": "user@example.com",
  "projectId": "uuid"
}
```

**Response:**

```json
{
  "token": "jwt_token_here"
}
```

### **2. Event Tracking**

```http
POST /api/docuseal/track-event
Content-Type: application/json

{
  "eventType": "document.uploaded",
  "projectId": "uuid",
  "templateData": { /* DocuSeal template data */ }
}
```

### **3. Webhook Handler**

```http
POST /api/docuseal/webhook
Content-Type: application/json

{
  "event_type": "form.completed",
  "data": { /* DocuSeal webhook payload */ }
}
```

### **4. Get Templates**

```http
GET /api/project/{projectId}/docuseal-templates
```

**Response:**

```json
[
  {
    "id": "uuid",
    "templateId": 1958805,
    "templateSlug": "zNqLDKTL1BhiYx",
    "documentName": "Contract Template",
    "eventType": "document.uploaded",
    "signedDocumentUrl": "https://...", // When signed
    "auditLogUrl": "https://...", // When completed
    "createdAt": "2025-10-16T19:24:18Z"
  }
]
```

---

## 🔌 Webhook Setup Guide

### **Step 1: Access DocuSeal Dashboard**

1. **Log into DocuSeal**: Go to [DocuSeal.com](https://docuseal.com) and sign in
2. **Navigate to Settings**: Click your profile/avatar in the top right → **Settings**
3. **Find Webhooks**: In the left sidebar, click **"Webhooks"** or **"API & Webhooks"**

### **Step 2: Create New Webhook**

1. **Click "Add Webhook"** or **"New Webhook"** button
2. **Enter Webhook URL**:
   - **Production**: `https://yourdomain.com/api/docuseal/webhook`
   - **Development**: Use ngrok tunnel (see below)
3. **Set HTTP Method**: Select **POST**
4. **Content Type**: Select **application/json**

### **Step 3: Configure Event Subscriptions**

**Required Events** (check these boxes):

| Event                     | Purpose                | When Triggered                   |
| ------------------------- | ---------------------- | -------------------------------- |
| ✅ `template.created`     | Track new templates    | User creates template in Builder |
| ✅ `template.updated`     | Track template changes | User modifies existing template  |
| ✅ `form.viewed`          | Track document opens   | Recipient opens signing link     |
| ✅ `form.started`         | Track signing start    | Recipient begins filling form    |
| ✅ `form.completed`       | Track signatures       | Document fully signed            |
| ✅ `form.declined`        | Track rejections       | Recipient declines to sign       |
| ✅ `submission.created`   | Track new submissions  | Document sent for signing        |
| ✅ `submission.completed` | Track completion       | All recipients signed            |

### **Step 4: Test Webhook (Recommended)**

1. **Save webhook configuration**
2. **Use DocuSeal's test feature**:
   - Look for "Test Webhook" or "Send Test Event" button
   - Send a test event to verify connectivity
3. **Check your application logs** to confirm events are received

### **Step 5: Local Development Setup**

For testing during development:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, create ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use: https://abc123.ngrok.io/api/docuseal/webhook
```

### **Step 6: Verify Setup**

1. **Create a test template** in your app
2. **Check database** for new entries in `docuseal_tracking` table
3. **Send document for signing** and verify webhook events arrive
4. **Monitor logs** for any webhook errors

### **Troubleshooting**

| Issue                        | Solution                                        |
| ---------------------------- | ----------------------------------------------- |
| Webhook not receiving events | Verify URL is publicly accessible               |
| 404 errors                   | Check API route path: `/api/docuseal/webhook`   |
| 500 errors                   | Check application logs for database/auth issues |
| Events not saved             | Verify database connection and schema           |
| Missing events               | Ensure all required events are subscribed       |

### **Security Notes**

- **HTTPS Required**: DocuSeal only sends to HTTPS URLs in production
- **Webhook Verification**: Consider implementing webhook signature verification
- **Rate Limiting**: DocuSeal respects reasonable rate limits
- **Retry Logic**: DocuSeal will retry failed webhooks automatically

---

## 🎛️ Component Usage

### **DocuSealBuilder Props:**

```typescript
interface DocuSealBuilderProps {
  documentUrl?: string; // Optional: Pre-load document
  projectId?: string; // Project context for tracking
  onTemplateCreated?: (data: any) => void; // Template creation callback
  onClose?: () => void; // Modal close handler
}
```

### **Available Callbacks:**

```typescript
// Immediate tracking callbacks
onUpload: (data) => {}; // Document uploaded
onSave: (data) => {}; // Template saved
onSend: (data) => {}; // Document sent for signing
onChange: (data) => {}; // Template modified
onLoad: (data) => {}; // Template loaded
```

---

## 📊 Data Flow

### **1. Template Creation Flow:**

```
User clicks "Create Template"
→ JWT token generated
→ DocuSeal Builder opens
→ User uploads PDF
→ onUpload callback → Database tracking
→ User adds fields
→ onChange callback → Database tracking
→ User saves template
→ onSave callback → Database tracking
```

### **2. Signing Flow:**

```
User sends document for signing
→ onSend callback → Database tracking
→ DocuSeal emails recipients
→ Recipient opens → form.viewed webhook
→ Recipient signs → form.completed webhook
→ Database updated with signed PDF URL
```

---

## 🛡️ Security & Best Practices

### **JWT Token Security:**

- Tokens generated server-side using API key
- 1-hour expiration for security
- Project ID embedded for context
- User email validation required

### **Authentication:**

- All API calls require authenticated user
- User context properly tracked in database
- Project-level access control maintained

### **Error Handling:**

- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages
- Production-ready validation

---

## 🔮 Future Development

### **Adding New Event Types:**

1. Update `docusealEventEnum` in [`docuseal-tracking.ts`](packages/web/src/db/schema/docuseal-tracking.ts)
2. Add new callback in [`DocuSealBuilder.tsx`](packages/web/src/components/documents/DocuSealBuilder.tsx)
3. Update webhook handler if needed
4. Generate and apply database migration

### **Extending Templates Display:**

1. Update [`docuseal-templates/route.ts`](packages/web/src/app/api/project/[projectId]/docuseal-templates/route.ts) for new data
2. Modify [`change-orders/page.tsx`](packages/web/src/app/project/[projectId]/change-orders/page.tsx) UI
3. Add filtering, sorting, search as needed

### **Custom Styling:**

DocuSeal supports custom CSS via `customCss` prop:

```typescript
<DocusealBuilder
  token={token}
  customCss={`
    .submit-form-button { 
      background-color: #your-brand-color; 
    }
  `}
/>
```

### **Multi-tenant Support:**

- Project ID already embedded in JWT tokens
- Database schema supports project-level isolation
- Webhook handler extracts project context
- Ready for multi-tenant scaling

---

## 🐛 Troubleshooting

### **Common Issues:**

**1. Database Enum Errors:**

```
Error: invalid input value for enum docuseal_event
```

**Solution:** Add new event type to enum and run migration

**2. JWT Authentication Errors:**

```
Error: User not authenticated
```

**Solution:** Ensure user is logged in and Supabase session is valid

**3. Webhook Not Firing:**

```
No database updates on signing
```

**Solution:** Verify webhook URL configured in DocuSeal dashboard

**4. Template Not Loading:**

```
Empty templates list
```

**Solution:** Check project ID in URL and database records

---

## 📈 Monitoring & Analytics

### **Key Metrics to Track:**

- Template creation rate
- Document upload frequency
- Signing completion rate
- Time to signature completion
- User engagement with DocuSeal features

### **Database Queries:**

```sql
-- Templates created per project
SELECT project_id, COUNT(*)
FROM docuseal_tracking
WHERE event_type = 'template.saved'
GROUP BY project_id;

-- Signing completion rate
SELECT
  COUNT(CASE WHEN event_type = 'document.sent' THEN 1 END) as sent,
  COUNT(CASE WHEN event_type = 'form.completed' THEN 1 END) as completed
FROM docuseal_tracking;

-- Average time to signature
SELECT AVG(
  EXTRACT(EPOCH FROM completed.created_at - sent.created_at)
) as avg_seconds_to_sign
FROM docuseal_tracking sent
JOIN docuseal_tracking completed
  ON sent.template_id = completed.template_id
WHERE sent.event_type = 'document.sent'
  AND completed.event_type = 'form.completed';
```

---

## ✅ Testing Checklist

### **Basic Functionality:**

- [ ] User can open DocuSeal Builder
- [ ] PDF upload works in DocuSeal
- [ ] Template saving creates database record
- [ ] Templates appear in platform
- [ ] Signing workflow functions end-to-end

### **Integration Testing:**

- [ ] JWT token generation works
- [ ] User authentication proper
- [ ] Project context maintained
- [ ] Database records created
- [ ] Webhook events captured

### **Production Readiness:**

- [ ] Error handling comprehensive
- [ ] Performance acceptable
- [ ] Security properly implemented
- [ ] Monitoring in place
- [ ] Documentation complete

---

## 🚀 Deployment Notes

### **Production Environment:**

1. Set `DOCUSEAL_API_KEY` environment variable
2. Configure webhook URL: `https://yourdomain.com/api/docuseal/webhook`
3. Run database migrations
4. Test end-to-end workflow
5. Monitor webhook delivery

### **Environment-Specific URLs:**

- **Development:** `http://localhost:3000/api/docuseal/webhook` (via ngrok)
- **Staging:** `https://staging.yourdomain.com/api/docuseal/webhook`
- **Production:** `https://yourdomain.com/api/docuseal/webhook`

---

## 📋 Integration Summary

### **What DocuSeal Handles:**

- PDF document upload and processing
- Drag-and-drop signature field placement
- Recipient management and email workflows
- Document signing interface
- Signed document storage and delivery
- Audit logging and compliance

### **What Our Platform Handles:**

- User authentication and project context
- Real-time event tracking and storage
- Template management and display
- Integration UI and user experience
- Database relationships and reporting
- Business logic and workflow orchestration

### **Data Captured:**

- **Template Information:** IDs, slugs, names, creation dates
- **Document Metadata:** File info, preview images, processing status
- **Signing Progress:** View, start, complete, decline events
- **Final Outputs:** Signed document URLs, audit log URLs
- **User Context:** Real user attribution, project relationships

This integration provides a seamless, enterprise-grade document signing experience while maintaining full control over data, user relationships, and business workflows.
