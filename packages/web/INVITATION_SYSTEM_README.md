# Contractor Invitation System - Production Implementation

## Overview

This document outlines the complete invitation system implementation for the contractor management platform, built following the requirements from meeting transcripts and industry best practices.

## Architecture Summary

### Database Schema

The system uses a hierarchical multi-tenant architecture:

```
Service Provider (super_admin)
├── Companies (manually created)
│   ├── Company Subscriptions (seat-based licensing)
│   ├── Company Users (junction table for multi-company support)
│   └── Projects
│       └── Project Users (role-based project access)
└── Invitations (secure token-based system)
```

### Key Schema Files

- **`/src/db/schema/users.ts`** - User management with system-wide roles
- **`/src/db/schema/invitations.ts`** - Invitation system with company/project assignment
- **`/src/db/schema/projects.ts`** - Project management with homeowner details

### User Role Hierarchy

1. **`super_admin`** - Service provider administrators
2. **`project_manager`** - Company admins who can invite contractors
3. **`contractor`** - Invited workers with project-specific access
4. **`homeowner`** - Project stakeholders with limited access

## Token Tracking System

### Solution: Industry-Standard URL Preservation

Following patterns used by GitHub, Slack, and Notion for invitation handling:

1. **URL Preservation**: When users are not authenticated, redirect to login with full invitation URL preserved
2. **Clean Redirects**: After authentication, redirect back to original invitation URL
3. **No Storage Dependencies**: No localStorage or client-side storage required
4. **Server-Safe**: Works across all environments without SSR issues

### Implementation Files

- **Invitation Page**: `src/components/invitations/AcceptInvitationPage.tsx` - Handles URL preservation
- **Login Actions**: `src/app/(auth)/login/actions.ts` - Processes redirectTo parameter
- **Auth Confirmation**: `src/app/auth/confirm/route.ts` - Handles post-auth redirects

### Token Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant IP as Invitation Page
    participant L as Login Page
    participant A as Auth System
    participant API as Accept API

    U->>IP: Clicks invitation link
    Note over IP: /invitations/accept?token=abc123

    alt User Not Authenticated
        IP->>L: Redirect to /login?redirectTo=invitationURL
        U->>A: Signs up/logs in
        A->>IP: Redirect back to original invitation URL
    end

    IP->>API: POST /api/invitations/accept
    API->>IP: Success response
    IP->>U: Redirect to dashboard
```

### Implementation Approach

```typescript
// When user not authenticated
if (!user) {
  const currentUrl = window.location.href;
  const loginUrl = `/login?redirectTo=${encodeURIComponent(currentUrl)}`;
  window.location.href = loginUrl;
  return;
}
```

### Key Benefits

1. **Reliable**: No client-side storage dependencies
2. **Universal**: Works across all browsers and environments
3. **Simple**: Clean URL-based approach
4. **Standard**: Follows industry best practices

## Complete File Structure

### Database Schema Files

```
src/db/schema/
├── invitations.ts          # Complete invitation schema with company/project relationships
├── users.ts                # User management with system roles and company memberships
├── projects.ts             # Project schema with homeowner details and contractor assignments
├── companies.ts            # Company schema with subscription and licensing
└── index.ts                # Schema exports and relationships
```

### API Route Files

```
src/app/api/
├── invitations/
│   ├── route.ts            # Create/list invitations with role validation
│   ├── accept/route.ts     # Accept invitations with proper user assignment
│   └── [id]/
│       └── resend/route.ts # Resend invitation emails
├── team/route.ts           # Team management for role-based access
└── user/profile/route.ts   # User profile management
```

### UI Component Files

```
src/components/
├── invitations/
│   ├── AcceptInvitationPage.tsx    # Main invitation acceptance with token handling
│   └── InvitationManager.tsx       # Team invitation management interface
├── admin/
│   └── SuperAdminDashboard.tsx     # Company creation and PM assignment
└── team/
    └── TeamManagement.tsx          # Role-based team management
```

### Service Files

```
src/lib/services/
├── invitation-service.ts           # Core invitation business logic
├── invitation-token-service.ts     # Token persistence and retrieval
└── email-service.ts                # Mailgun integration with HTML templates
```

### Authentication Files

```
src/app/auth/
├── confirm/route.ts                # Email verification with invitation processing
├── signout/route.ts               # Secure logout
└── reset-password/route.ts        # Password reset flows
```

### Page Files

```
src/app/
├── admin/page.tsx                  # Super admin company management
├── team/page.tsx                   # Role-based team management
├── account/
│   ├── page.tsx                    # Account settings with token checking
│   └── account-form.tsx            # Account form with automatic token processing
├── invitations/
│   └── accept/page.tsx             # Invitation acceptance page wrapper
└── (auth)/
    ├── login/page.tsx              # Login with invitation token preservation
    └── signup/page.tsx             # Signup with invitation token integration
```

## Core Features

### 1. Manual Company Onboarding

- Companies are manually created by service provider admins
- Each company gets an administrator project manager
- Seat-based licensing controls user limits
- Subscription management for billing integration

### 2. Invitation System

#### Project Manager Capabilities

- Send invitations to contractors via email
- Assign company and project roles
- Add custom messages to invitations
- Resend or cancel pending invitations
- View invitation status and history

#### Contractor Experience

- Receive secure invitation links via email
- View invitation details before accepting
- See project assignments and role permissions
- One-click acceptance process
- Automatic account setup and project access

### 3. Security Features

- Cryptographically secure invitation tokens (64-character hex)
- Token expiration (7 days default)
- Single-use tokens (invalidated after acceptance)
- Role-based permission validation
- Rate limiting (50 pending invitations per company)
- Input validation and sanitization

## API Endpoints

### Invitation Management

```typescript
POST / api / invitations; // Create invitation
GET / api / invitations; // List company invitations
DELETE / api / invitations / [id]; // Cancel invitation
POST / api / invitations / [id] / resend; // Resend invitation
GET / api / invitations / accept; // Get invitation details
POST / api / invitations / accept; // Accept invitation
```

### Request/Response Examples

#### Create Invitation

```json
POST /api/invitations
{
  "email": "contractor@example.com",
  "companyId": "uuid",
  "companyRole": "member",
  "projectId": "uuid",
  "projectRole": "contractor",
  "customMessage": "Welcome to our team!"
}
```

#### Accept Invitation

```json
POST /api/invitations/accept
{
  "token": "64-character-hex-token"
}
```

## React Components

### 1. InvitationManager

**Location**: `/src/components/invitations/InvitationManager.tsx`

Production-ready component for project managers to:

- Send new invitations with role assignment
- View pending and completed invitations
- Resend or cancel invitations
- Filter by status and project

**Props**:

```typescript
interface InvitationManagerProps {
  companyId: string;
  projects: Project[];
  currentUserRole: "admin" | "project_manager" | "member";
}
```

### 2. AcceptInvitationPage

**Location**: `/src/components/invitations/AcceptInvitationPage.tsx`

Contractor-facing component for invitation acceptance:

- Display invitation details and permissions
- Show company and project information
- Handle acceptance workflow
- Provide clear error states

**Props**:

```typescript
interface AcceptInvitationPageProps {
  token: string;
  onAccept?: () => void;
  onDecline?: () => void;
}
```

## Business Logic Service

### InvitationService

**Location**: `/src/lib/services/invitation-service.ts`

Comprehensive service class with:

- Email validation and duplicate checking
- Permission validation (who can invite whom)
- Token generation and management
- Database operations with transactions
- Error handling with custom exception types

#### Key Methods

```typescript
// Create invitation with validation
static async createInvitation(request: CreateInvitationRequest): Promise<SelectInvitation>

// Accept invitation and create relationships
static async acceptInvitation(token: string, userId: string): Promise<AcceptResult>

// Get invitations with pagination
static async getInvitationsForCompany(companyId: string, options): Promise<PaginatedInvitations>

// Administrative actions
static async cancelInvitation(invitationId: string, cancelledBy: string): Promise<SelectInvitation>
static async resendInvitation(invitationId: string): Promise<SelectInvitation>
```

## Permission System

### Company-Level Permissions

- **Admin**: Can invite project managers and admins
- **Project Manager**: Can invite contractors and members
- **Member**: Cannot send invitations

### Project-Level Access

- **Project Manager**: Full project management access
- **Contractor**: Work on assigned projects only
- **Homeowner**: View project progress and communicate

## Integration Points

### Email Service

The system is designed to integrate with email services for sending invitations:

- Secure token generation
- Customizable email templates
- Delivery tracking capabilities

### Authentication

Compatible with Supabase Auth:

- JWT-based session management
- User creation on invitation acceptance
- Role synchronization

### Billing Integration

Ready for Stripe integration:

- Seat-based subscription tracking
- Usage monitoring
- Automatic license management

## Meeting Requirements Compliance

✅ **Manual Company Setup**: Companies created by service provider only
✅ **Hierarchical Access**: Proper role inheritance and permissions
✅ **Project-Based Navigation**: Users can switch between project workspaces
✅ **Invitation-Only Access**: No self-registration for contractors
✅ **Data Isolation**: Homeowners see only their projects
✅ **License Management**: Seat-based company subscriptions
✅ **Security First**: Token-based invitations with validation

## Development Notes

### Database Migrations

The schema includes proper foreign key relationships and cascading deletes:

- Invitation deletion when company is removed
- User cleanup when leaving companies
- Project data isolation

### Testing Strategy

Recommended test coverage:

- Unit tests for InvitationService methods
- Integration tests for API endpoints
- E2E tests for invitation flow
- Security testing for token validation

### Performance Considerations

- Database indexes on frequently queried fields
- Pagination for large invitation lists
- Efficient relationship loading with Drizzle ORM
- Connection pooling for high-traffic scenarios

## Production Deployment

### Environment Variables

```env
POSTGRES_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Security Checklist

- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Monitor invitation abuse
- [ ] Regular security audits

### Monitoring

Key metrics to track:

- Invitation acceptance rates
- Time to accept invitations
- Failed invitation attempts
- User activation rates

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Token Lost During Authentication

**Problem**: User clicks invitation link but token disappears during login/signup
**Solution**: Token is now stored immediately on page load in `AcceptInvitationPage.tsx`
**Debug**: Check browser console for "🔄 IMMEDIATE: Storing invitation token"

#### 2. Email Not Sending

**Problem**: Invitations created but emails not delivered
**Solution**:

- Verify Mailgun API key in `.env`: `MAILGUN_API_KEY`
- Check Mailgun domain in `email-service.ts`
- Monitor Mailgun dashboard for delivery status
  **Debug**: Check API logs for "📧 Sending invitation email"

#### 3. Role Assignment Issues

**Problem**: User gets wrong role after accepting invitation
**Solution**: Check invitation `companyRole` and `projectRole` mapping in `auth/confirm/route.ts`
**Debug**: Monitor console logs for "🎯 Auth: Setting system role from invitation"

#### 4. Database Connection Errors

**Problem**: "relation does not exist" errors
**Solution**: Run database migrations: `npm run db:push`
**Debug**: Verify all schema files are exported in `src/db/schema/index.ts`

### Debugging Checklist

1. **Token Flow**:

   - [ ] Token stored on invitation page load
   - [ ] Token retrieved after authentication
   - [ ] Token cleared after successful acceptance
   - [ ] Browser localStorage contains `invitation_token`

2. **Email Delivery**:

   - [ ] Mailgun API key configured
   - [ ] FROM_EMAIL environment variable set
   - [ ] Recipient email valid format
   - [ ] Check spam folder

3. **Database Operations**:
   - [ ] All migrations applied
   - [ ] Foreign key constraints valid
   - [ ] User permissions for database operations
   - [ ] Connection pool not exhausted

## Environment Setup

### Required Environment Variables

```env
# Database
POSTGRES_URL=postgresql://user:pass@host:port/db

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Email Service (Mailgun)
MAILGUN_API_KEY=key-your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL=noreply@yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Hey Its My Contractor"
```

### Database Migrations

```bash
# Apply all migrations
npm run db:push

# Generate new migration
npm run db:generate

# View migration status
npm run db:studio
```

## Production Deployment

### Pre-Deployment Checklist

1. **Security**:

   - [ ] All environment variables set securely
   - [ ] HTTPS enabled
   - [ ] Rate limiting configured
   - [ ] Email templates tested

2. **Database**:

   - [ ] Production database provisioned
   - [ ] Migrations applied
   - [ ] Backup strategy configured
   - [ ] Connection pooling optimized

3. **Email Service**:
   - [ ] Mailgun domain verified
   - [ ] DNS records configured
   - [ ] Email templates tested
   - [ ] Delivery tracking enabled

### Monitoring and Alerts

```typescript
// Key metrics to monitor
const criticalMetrics = {
  invitationAcceptanceRate: "Track conversion from sent to accepted",
  tokenLossRate: "Monitor token storage/retrieval failures",
  emailDeliveryRate: "Track successful email delivery",
  authFlowCompletionRate: "Monitor signup/login success",
  databaseQueryPerformance: "Track invitation lookup times",
};
```

## Code Maintenance Guide

### Adding New Roles

1. **Update Schema**: Add role to enum in `src/db/schema/users.ts`
2. **Update API**: Add role validation in invitation endpoints
3. **Update UI**: Add role options in invitation forms
4. **Update Middleware**: Add role permissions in `src/middleware.ts`

### Modifying Invitation Flow

1. **Token Changes**: Update `InvitationTokenService` methods
2. **Email Changes**: Modify templates in `email-service.ts`
3. **UI Changes**: Update `AcceptInvitationPage.tsx` components
4. **API Changes**: Modify validation in `invitation-service.ts`

### Database Schema Changes

1. **Create Migration**: `npm run db:generate`
2. **Test Migration**: Run on staging environment first
3. **Update Types**: Regenerate TypeScript types
4. **Update Queries**: Modify affected database queries

### Email Template Updates

1. **HTML Templates**: Located in `email-service.ts`
2. **Role-Specific Content**: Update `getRoleSpecificContent()`
3. **Styling**: Inline CSS for email client compatibility
4. **Testing**: Use Mailgun's email testing tools

## Future Enhancements

1. **Email Templates**: Rich HTML email designs with company branding
2. **Bulk Invitations**: CSV upload for multiple invitations with validation
3. **Invitation Analytics**: Detailed reporting dashboard with metrics
4. **Mobile Support**: React Native components for mobile invitation flow
5. **Advanced Permissions**: Custom role definitions and granular permissions
6. **Integration APIs**: Webhook support for external systems and notifications
7. **Token Encryption**: Additional security layer for sensitive environments
8. **Audit Logging**: Complete invitation activity tracking
9. **Multi-Language Support**: Internationalized email templates
10. **SMS Notifications**: Alternative invitation delivery method

## Implementation Notes

### Why This Architecture?

1. **Multi-Tenant Isolation**: Companies are completely isolated from each other
2. **Scalable Role System**: Supports complex organizational hierarchies
3. **Security First**: Cryptographic tokens with expiration and single-use
4. **Industry Standards**: Follows patterns from Slack, Notion, GitHub
5. **Production Ready**: Comprehensive error handling and validation

### Critical Success Factors

1. **Token Persistence**: NEVER lose invitation tokens during auth flows
2. **Email Reliability**: Robust email delivery with fallback strategies
3. **Clear UX**: Intuitive invitation acceptance flow
4. **Security**: Proper validation at every step
5. **Scalability**: Efficient database queries and caching

---

This implementation provides a solid foundation for contractor management while maintaining security, scalability, and user experience standards. The token tracking system ensures reliable invitation acceptance across all authentication scenarios.
