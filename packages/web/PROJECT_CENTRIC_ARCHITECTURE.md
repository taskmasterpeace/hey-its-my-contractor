# Project-Centric Architecture Documentation

## Overview

This contractor management platform uses a **project-centric architecture** similar to Supabase's dashboard, where all work happens within isolated project workspaces. This document explains the complete architecture for future developers.

## Architecture Principles

### 1. **Two-Level Hierarchy**

```
Companies → Projects → Project Workspaces
    ↓           ↓            ↓
Multi-tenant  Project     Isolated
Company       Selection   Workspaces
Management                with Features
```

### 2. **URL Structure**

```
/dashboard                    → Redirects to first company
/dashboard/[companyId]        → Company dashboard with project grid
/project/[projectId]/         → Project workspace entry
/project/[projectId]/dashboard → Project overview
/project/[projectId]/calendar  → Project calendar
/project/[projectId]/chat     → Project chat
/project/[projectId]/team     → Project team management
/project/[projectId]/...      → All other project features
```

### 3. **Layout System**

- **MainLayout**: Minimal layout for company-level pages (dashboard, admin)
- **ProjectWorkspaceLayout**: Full-featured layout for project-specific work
- **ConditionalLayout**: Routes requests to appropriate layout

## File Structure

### Core Layout Files

```
src/components/layout/
├── ConditionalLayout.tsx       # Route-based layout selection
├── MainLayout.tsx              # Minimal company-level layout
└── ProjectWorkspaceLayout.tsx  # Full project workspace layout
```

### Route Structure

```
src/app/
├── dashboard/
│   ├── page.tsx               # Redirects to /dashboard/[companyId]
│   └── [companyId]/
│       └── page.tsx           # Company dashboard with project grid
├── project/
│   └── [projectId]/
│       ├── layout.tsx         # Project context provider
│       ├── dashboard/page.tsx # Project overview
│       ├── calendar/page.tsx  # Project calendar
│       ├── chat/page.tsx      # Project chat
│       ├── team/page.tsx      # Project team
│       └── .../page.tsx       # Other project features
├── admin/
│   └── page.tsx               # Super admin company management
└── invitations/
    └── accept/page.tsx        # Invitation acceptance
```

### Key Components

```
src/components/
├── dashboard/
│   └── ProjectSelector.tsx    # Company/project selection grid
├── admin/
│   └── SuperAdminDashboard.tsx # Company creation and management
├── invitations/
│   └── AcceptInvitationPage.tsx # Multi-company invitation handling
└── team/
    └── ProjectTeamManagement.tsx # Project-scoped team management
```

## Layout Routing Logic

### ConditionalLayout Decision Tree

```typescript
// src/components/layout/ConditionalLayout.tsx

if (loading) return <LoadingSpinner />;

if (isAuthRoute) return <>{children}</>; // No layout

if (isProjectRoute) return <>{children}</>; // Direct to ProjectWorkspaceLayout

return <MainLayout>{children}</>; // Dashboard/Admin with MainLayout
```

### Route Categories

- **Auth Routes**: `/login`, `/signup`, `/auth/*` → No layout wrapper
- **Project Routes**: `/project/*` → Direct ProjectWorkspaceLayout (full width)
- **Company Routes**: `/dashboard/*`, `/admin`, `/team` → MainLayout wrapper

## Permission System

### Company-Based Permissions

```typescript
// src/lib/auth/permissions.ts

interface UserPermissions {
  systemRole: "super_admin" | "project_manager" | "contractor" | "homeowner";
  companyPermissions: Array<{
    companyId: string;
    companyRole: "admin" | "project_manager" | "member";
  }>;
  projectPermissions: Array<{
    projectId: string;
    projectRole: "project_manager" | "contractor" | "homeowner";
  }>;
}
```

### Role Hierarchy

1. **super_admin**: System-wide access to all companies and projects
2. **project_manager**: Company admin, can create projects and invite users
3. **contractor**: Project worker, access to assigned projects only
4. **homeowner**: Project stakeholder, limited access to their projects

## Database Schema

### Key Tables and Relationships

```sql
users                    -- Global user accounts
├── companyUsers        -- Company memberships (many-to-many)
│   └── companies       -- Company records
│       └── projects    -- Projects belong to companies
│           └── projectUsers -- Project memberships (many-to-many)
└── invitations         -- Company-scoped invitations
```

### Multi-Company Support

- Users can belong to **multiple companies** with different roles
- Each company manages its **own projects and invitations**
- Project access is **scoped within company context**

## Invitation System

### Company-Scoped Invitations

```typescript
// Each invitation is tied to a specific company
interface Invitation {
  companyId: string; // Specific company
  email: string; // User email
  companyRole: string; // Role in THIS company
  projectId?: string; // Optional project assignment
  projectRole?: string; // Role in specific project
}
```

### Multi-Company Invitation Flow

1. **Company A** invites `user@example.com` → Creates invitation for Company A
2. **User accepts** → Becomes member of Company A
3. **Company B** invites `user@example.com` → Creates **separate** invitation for Company B
4. **User accepts** → Becomes member of Company B **independently**

### Key Features

- ✅ Same email can be invited to multiple companies
- ✅ Each company has independent invitation workflows
- ✅ Users can have different roles across companies
- ✅ No "already accepted" conflicts between companies

## Navigation Flow

### Company Selection Flow

```
1. User visits /dashboard
2. System redirects to /dashboard/[firstCompanyId]
3. User sees project grid for that company
4. User can switch companies via dropdown
5. Switching navigates to /dashboard/[newCompanyId]
6. URL persists company selection (no reset on refresh)
```

### Project Workspace Flow

```
1. User clicks project from company dashboard
2. Navigates to /project/[projectId]/dashboard
3. ProjectWorkspaceLayout provides full project context
4. All project features available via sidebar navigation
5. "Back to Projects" returns to /dashboard/[companyId]
```

## Development Guidelines

### Adding New Project Features

1. **Create the route**:

   ```
   src/app/project/[projectId]/new-feature/page.tsx
   ```

2. **Add to navigation**:

   ```typescript
   // src/components/layout/ProjectWorkspaceLayout.tsx
   const navigation = [
     // ... existing items
     {
       name: "New Feature",
       href: `/project/${project.id}/new-feature`,
       icon: NewIcon,
     },
   ];
   ```

3. **Implement project-scoped logic**:
   ```typescript
   export default function NewFeaturePage() {
     const params = useParams();
     const projectId = params.projectId as string;

     // Filter data by projectId
     // Use project context
   }
   ```

### Permission Checks

Always validate project access:

```typescript
// In page components
const permissions = await getUserPermissions(userId);
const hasProjectAccess = await getUserProjectRole(userId, projectId);

if (!hasProjectAccess && !isSuperAdmin(userId)) {
  redirect("/dashboard?error=no-project-access");
}
```

### API Endpoints

Create project-scoped APIs:

```
src/app/api/project/[projectId]/new-feature/route.ts
```

Filter all data by projectId:

```typescript
const data = await db
  .select()
  .from(table)
  .where(eq(table.project_id, projectId));
```

## Key Components

### ProjectSelector

**Location**: `src/components/dashboard/ProjectSelector.tsx`

Supabase-style project grid with:

- Company switcher dropdown
- Project cards with status and details
- Create new project form
- URL-based company navigation

### ProjectWorkspaceLayout

**Location**: `src/components/layout/ProjectWorkspaceLayout.tsx`

Full workspace layout with:

- Project sidebar navigation
- Project context (name, address, status, role)
- Back to Projects navigation
- User info and page titles

### SuperAdminDashboard

**Location**: `src/components/admin/SuperAdminDashboard.tsx`

System administration with:

- Company creation and management
- Project manager assignment
- Invitation status tracking
- Multi-company invitation support

## Error Handling

### Common Scenarios

- **No company access**: Redirect to `/account?message=no-company-access`
- **No project access**: Redirect to `/dashboard?error=no-project-access`
- **Invalid company ID**: Redirect to user's first company
- **Invalid project ID**: Redirect to company dashboard

### Access Validation

Every route validates:

1. **Authentication**: User is logged in
2. **Company access**: User belongs to company (for company routes)
3. **Project access**: User assigned to project (for project routes)

## API Integration

### Project-Scoped APIs

All project APIs follow this pattern:

```
/api/project/[projectId]/feature
```

Example implementations:

- `/api/project/[projectId]/team` - Project team management
- `/api/project/[projectId]/calendar` - Project calendar events
- `/api/project/[projectId]/chat` - Project chat rooms

### Company-Scoped APIs

Company management APIs:

```
/api/admin/companies        # Company CRUD
/api/invitations           # Company invitations
/api/projects              # Project creation (requires company context)
```

## Future Development

### Adding Features

1. All new features should be **project-scoped** by default
2. Use the `/project/[projectId]/feature` URL pattern
3. Add navigation items to ProjectWorkspaceLayout
4. Implement proper permission validation
5. Filter all data by projectId

### Extending Companies

- Company-level features go in MainLayout routes
- Use `/dashboard/[companyId]/feature` for company-specific features
- Validate company access in all company routes

### Security Considerations

- Always validate project access before showing content
- Use scoped permissions instead of global systemRole checks
- Implement proper data isolation between companies and projects
- Validate invitation tokens are company-specific

## Testing Strategy

### Test Categories

1. **Permission Tests**: Validate access controls work correctly
2. **Navigation Tests**: Ensure URL routing works as expected
3. **Invitation Tests**: Multi-company invitation workflows
4. **Layout Tests**: Verify layouts render correctly for each route type

### Key Test Scenarios

- User switching between multiple companies
- Project access validation
- Invitation acceptance for existing users
- Layout rendering for different route types

---

This architecture provides a scalable, secure, and user-friendly foundation for the contractor management platform with proper multi-tenancy and project isolation.
