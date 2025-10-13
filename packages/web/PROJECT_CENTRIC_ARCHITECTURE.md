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
│       ├── research/page.tsx  # AI research assistant
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
- `/api/project/[projectId]/research` - AI research queries
- `/api/project/[projectId]/saved-research` - Saved research management

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

## Research System

### Overview

The AI Research Assistant provides project-scoped research capabilities with privacy controls and ownership-based permissions. Users can perform AI-powered research and save results with granular privacy settings.

### Research Privacy Model

The research system implements a dual-level privacy model:

```typescript
interface SavedResearch {
  id: string;
  userId: string; // Creator/owner of the research
  projectId: string; // Project scope
  isPrivate: boolean; // Privacy setting
  // ... other fields
}
```

### Privacy Levels

1. **Private Research** (`isPrivate: true`)

   - Only visible to the creator
   - Not visible to other project members
   - Super admins cannot access private research

2. **Shared Research** (`isPrivate: false`)
   - Visible to all project members
   - Shared knowledge base for the project
   - Default setting for new research

### Ownership Permissions

The research system enforces strict ownership controls:

#### Viewing Permissions

```typescript
// API filtering logic
const research = await db
  .select()
  .from(savedResearch)
  .where(
    and(
      eq(savedResearch.projectId, projectId),
      or(
        eq(savedResearch.isPrivate, false), // Shared research
        and(
          eq(savedResearch.isPrivate, true), // Private research
          eq(savedResearch.userId, currentUserId) // owned by user
        )
      )
    )
  );
```

#### Edit/Delete Permissions

- **Edit Privacy**: Only creator can change privacy settings
- **Delete Research**: Only creator can delete their research
- **Super Admin**: Treated as regular user (no special privileges)

### Database Schema

```sql
-- Research table with privacy and ownership
CREATE TABLE saved_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Research content
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB DEFAULT '[]' NOT NULL,
  related_queries TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- User organization
  title VARCHAR(255),
  tags VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  notes TEXT,

  -- Privacy & ownership
  is_private BOOLEAN DEFAULT FALSE NOT NULL,

  -- Metadata
  confidence VARCHAR(10) DEFAULT '0.95',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### API Endpoints

#### Research Operations

```typescript
// Perform AI research
POST /api/project/[projectId]/research
{
  query: string;
  type?: string;
  context?: any;
}

// Save research with privacy setting
POST /api/project/[projectId]/saved-research
{
  query: string;
  answer: string;
  sources: Array<Source>;
  relatedQueries: string[];
  tags: string[];
  notes?: string;
  isPrivate: boolean;  // Privacy setting
}

// Update privacy settings (owner only)
PATCH /api/project/[projectId]/saved-research?id=<researchId>
{
  isPrivate: boolean;
}

// Delete research (owner only)
DELETE /api/project/[projectId]/saved-research?id=<researchId>
```

#### Security Validation

```typescript
// Ownership validation for edit/delete operations
const existingResearch = await db
  .select()
  .from(savedResearch)
  .where(eq(savedResearch.id, researchId))
  .limit(1);

if (existingResearch[0].userId !== user.id) {
  return NextResponse.json(
    {
      success: false,
      error: "You can only modify your own research",
    },
    { status: 403 }
  );
}
```

### Frontend Components

#### Research Interface Structure

```
src/components/research/
├── ResearchInterface.tsx     # AI query interface
├── ResearchResults.tsx       # Results with privacy toggle
├── SavedResearchPanel.tsx    # Saved research management
└── ResearchSuggestions.tsx   # Query suggestions
```

#### Privacy Controls

```typescript
// Save dialog with privacy toggle
<div className="privacy-controls">
  <input
    type="radio"
    checked={!isPrivate}
    onChange={() => setIsPrivate(false)}
  />
  <label>Share with project members</label>

  <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} />
  <label>Keep private</label>
</div>
```

#### Ownership-Based UI

```typescript
// Show edit/delete only for owned research
{
  currentUserId === item.userId && (
    <button onClick={() => editPrivacy(item.id)}>
      <Edit3 className="w-3 h-3" />
    </button>
  );
}

{
  currentUserId === item.userId && (
    <button onClick={() => deleteResearch(item.id)}>
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
```

### Key Features

#### Privacy Management

- ✅ Privacy toggle during save (Private vs Shared)
- ✅ Visual privacy indicators with badges
- ✅ Inline privacy editing for owned research
- ✅ Real-time updates without page refresh

#### Ownership Controls

- ✅ Edit permissions limited to creator
- ✅ Delete permissions limited to creator
- ✅ UI elements hidden for non-owned research
- ✅ API validation for all ownership operations

#### Security Implementation

- ✅ Project-scoped access validation
- ✅ Ownership-based operation permissions
- ✅ Privacy filtering in database queries
- ✅ Super admin limitations for private content

### Development Guidelines

#### Adding Research Features

1. All research data must be filtered by `projectId`
2. Implement ownership checks for modifications
3. Respect privacy settings in all queries
4. Use consistent ownership validation patterns

#### Privacy Best Practices

- Default to shared research for collaboration
- Validate ownership before any modification
- Filter private research at database level
- Provide clear privacy indicators in UI

---

This architecture provides a scalable, secure, and user-friendly foundation for the contractor management platform with proper multi-tenancy, project isolation, and advanced research privacy controls.
