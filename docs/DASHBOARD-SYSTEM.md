# FieldTime Dashboard System Documentation

## Overview

The FieldTime Dashboard System provides a **customizable, widget-based interface** that serves as the primary landing page for all users. It intelligently displays relevant information based on user roles and allows complete customization through drag-and-drop layouts, preset configurations, and user-savable preferences.

## Design Philosophy

### User-Centric Information Architecture
The dashboard follows the principle of **"Right Information, Right Time, Right Person"**:

- **Clients see project-focused content**: Latest photos, payment status, upcoming milestones
- **Contractors see operation-focused content**: Today's schedule, team status, cash flow
- **Project Managers see oversight content**: Multi-project analytics, resource allocation

### Customization-First Approach
Unlike static dashboards, FieldTime's system treats customization as a core feature:
- **Drag-and-drop widget arrangement** for personal workflow optimization
- **Preset layouts** for quick setup based on role and industry best practices
- **Savable configurations** with unlimited custom layouts per user
- **Role-appropriate widgets** automatically filtered based on permissions

## Widget Architecture

### Core Widget Types

#### **1. Latest Photos Widget**
**Purpose**: Show recent project photos with AI enhancement capabilities  
**Users**: All roles  
**Key Features**:
- Grid view of 4-8 most recent photos
- Click for full-screen viewing with native aspect ratios
- Magic wand (✨) button for AI enhancement on each photo
- Timestamp and project association
- Direct link to full photo gallery

**Technical Implementation**:
```typescript
interface LatestPhotosWidget {
  photos: ProjectPhoto[];
  onPhotoClick: (photo: ProjectPhoto) => void;
  onAIEnhance: (photoId: string) => void;
  maxPhotos: number; // Configurable per widget size
}
```

**Data Source**: Real-time photo uploads from field logs and chat messages

#### **2. Message Center Widget**
**Purpose**: Display unread messages and recent communications  
**Users**: All roles  
**Key Features**:
- Unread message count with visual indicators
- Recent message preview with sender avatars
- Role-based message filtering (clients see only their project messages)
- Quick reply functionality
- Direct link to full chat interface

**Technical Implementation**:
```typescript
interface MessageCenterWidget {
  messages: ChatMessage[];
  unreadCount: number;
  onMessageClick: (messageId: string) => void;
  onQuickReply: (content: string) => void;
}
```

**Data Source**: Real-time chat messages from Rocket.Chat integration

#### **3. Today's Schedule Widget**
**Purpose**: Display calendar events with weather-aware intelligence  
**Users**: Contractors, Staff  
**Key Features**:
- Timeline view of today's events
- Weather alerts affecting outdoor work
- Travel time calculations between job sites
- Event status indicators (confirmed, pending, cancelled)
- Quick event creation and modification

**Technical Implementation**:
```typescript
interface TodaysScheduleWidget {
  events: CalendarEvent[];
  weatherConditions: WeatherData;
  onEventClick: (eventId: string) => void;
  onCreateEvent: () => void;
}
```

**Data Source**: FullCalendar events with OpenWeatherMap correlation

#### **4. Project Progress Widget**
**Purpose**: Visual progress tracking with milestone management  
**Users**: All roles  
**Key Features**:
- Progress bars with percentage completion
- Next milestone highlighting
- Budget vs. spent tracking
- Timeline projection with delay alerts
- Role-specific action buttons (Update Progress vs. View Details)

**Technical Implementation**:
```typescript
interface ProjectProgressWidget {
  projects: Project[];
  onProgressUpdate: (projectId: string, progress: number) => void;
  onMilestoneClick: (milestoneId: string) => void;
  showBudgetInfo: boolean; // Role-dependent
}
```

**Data Source**: Project management system with calendar milestone integration

#### **5. Payment Status Widget**
**Purpose**: Financial overview with actionable payment information  
**Users**: All roles (different views)  
**Key Features**:
- **For Clients**: Outstanding payments, payment history, next due date
- **For Contractors**: Cash flow forecast, pending collections, profit margins
- One-click payment processing via Stripe
- Invoice generation from milestones
- QuickBooks sync status

**Technical Implementation**:
```typescript
interface PaymentStatusWidget {
  invoices: Invoice[];
  paymentSummary: PaymentSummary;
  onPayNow: (invoiceId: string) => void;
  onCreateInvoice: () => void;
  userRole: UserRole;
}
```

**Data Source**: Stripe + InvoicePlane integration with real-time sync

### Advanced Widget Types

#### **6. Weather Intelligence Widget**
**Purpose**: Multi-location weather with work recommendations  
**Features**:
- Current conditions across all job sites
- Work suitability analysis (concrete, roofing, painting)
- 7-day forecast for project planning
- Automatic rescheduling suggestions

#### **7. Change Order Pipeline Widget**
**Purpose**: Change order status tracking and approvals  
**Features**:
- Pending approvals requiring action
- Cost impact visualization
- E-signature status tracking
- Payment processing integration

#### **8. Meeting Intelligence Widget**
**Purpose**: Meeting summaries and transcript insights  
**Features**:
- Recent meeting highlights
- Outstanding action items with due dates
- Transcript search functionality
- Upcoming meeting preparation

#### **9. Document Activity Widget**
**Purpose**: Document management with version control  
**Features**:
- Recently uploaded documents
- Version change notifications
- Permit expiration alerts
- Insurance documentation status

#### **10. Team Status Widget**
**Purpose**: Real-time team coordination  
**Features**:
- Online/offline status indicators
- Current job site locations
- Availability for emergency calls
- Performance metrics (contractors only)

## Customization System

### Preset Layouts

#### **Contractor Default Layout**
```
┌─────────────────┐ ┌─────────┐ ┌─────────────┐
│  Today's        │ │ Latest  │ │   Message   │
│  Schedule       │ │ Photos  │ │   Center    │
│  (6×3)         │ │ (4×3)   │ │   (4×4)     │
└─────────────────┘ └─────────┘ └─────────────┘
┌─────────┐ ┌─────────┐ ┌──────┐ ┌─────────────┐
│Project  │ │Payment  │ │Weather│ │ Change      │
│Progress │ │Status   │ │(3×2)  │ │ Orders      │
│(4×3)    │ │(4×3)    │ │       │ │ (5×4)       │
└─────────┘ └─────────┘ └──────┘ └─────────────┘
```

#### **Client Default Layout**  
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Project Progress       │ │       Latest Photos         │
│           (6×3)            │ │           (6×3)            │
└─────────────────────────────┘ └─────────────────────────────┘
┌─────────────────┐ ┌─────────┐ ┌─────────────────────────────┐
│   Message       │ │Payment  │ │     Meeting Summary         │
│   Center        │ │Status   │ │          (4×3)             │
│    (6×4)        │ │(4×3)    │ │                             │
└─────────────────┘ └─────────┘ └─────────────────────────────┘
```

#### **Staff Default Layout**
```
┌─────────────────────────────────────────┐ ┌─────────┐
│            Today's Schedule              │ │  Team   │
│                (8×3)                    │ │ Status  │
└─────────────────────────────────────────┘ │ (3×4)   │
┌─────────────┐ ┌─────────────┐ ┌─────────┐ │         │
│   Message   │ │ Document    │ │ Weather │ │         │
│   Center    │ │ Activity    │ │ (3×2)   │ │         │
│   (4×4)     │ │   (4×3)     │ │         │ │         │
└─────────────┘ └─────────────┘ └─────────┘ └─────────┘
```

### User Customization Features

#### **Drag-and-Drop Interface**
- **Edit Mode Toggle**: Simple button to enable/disable customization
- **Visual Feedback**: Border highlights and resize handles when editing
- **Grid Snapping**: Automatic alignment to 12-column responsive grid
- **Collision Prevention**: Widgets automatically adjust when moved
- **Mobile Optimization**: Touch-friendly resize and drag on tablets

#### **Widget Management**
- **Add Widget Modal**: Gallery of available widgets with descriptions
- **Remove Widget**: X button in edit mode or context menu
- **Widget Picker**: Filtered by user role and permissions
- **Size Constraints**: Minimum and maximum sizes enforced per widget type

#### **Layout Persistence**
- **Auto-Save**: Changes saved immediately to user preferences
- **Multiple Layouts**: Users can save unlimited custom configurations
- **Layout Sharing**: Export/import layouts between team members
- **Backup & Restore**: Automatic backup with rollback capabilities

## Implementation Details

### Technical Architecture

#### **State Management**
```typescript
interface DashboardState {
  layouts: { [breakpoint: string]: Layout[] };
  activeWidgets: string[];
  isEditMode: boolean;
  savedLayouts: SavedLayout[];
  currentLayout: string;
}

interface SavedLayout {
  id: string;
  name: string;
  layouts: { [breakpoint: string]: Layout[] };
  widgets: string[];
  createdAt: string;
  isDefault: boolean;
}
```

#### **Widget Registration System**
```typescript
interface WidgetConfig {
  id: string;
  name: string;
  component: React.ComponentType<WidgetProps>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  description: string;
  roles: UserRole[];
  category: 'essential' | 'productivity' | 'analytics' | 'communication';
}
```

#### **Responsive Breakpoints**
```typescript
const breakpoints = {
  lg: 1200,  // Desktop
  md: 996,   // Tablet landscape  
  sm: 768,   // Tablet portrait
  xs: 480,   // Phone landscape
  xxs: 0     // Phone portrait
};

const columns = {
  lg: 12,    // 12-column desktop grid
  md: 10,    // 10-column tablet
  sm: 6,     // 6-column small tablet
  xs: 4,     // 4-column phone landscape
  xxs: 2     // 2-column phone portrait
};
```

### Data Integration

#### **Real-Time Updates**
All widgets connect to live data sources:
- **Supabase Realtime**: Database changes trigger widget updates
- **WebSocket connections**: Chat messages appear instantly
- **Webhook integrations**: External services (Stripe, weather) push updates
- **Local state sync**: Changes replicated across all open browser tabs

#### **Offline Capability**
- **Cached data**: Essential information available offline
- **Sync queue**: Widget updates queued when offline, synced when connected
- **Progressive enhancement**: Basic functionality without network, enhanced with connectivity

#### **Performance Optimization**
- **Lazy loading**: Widgets load data only when visible
- **Debounced updates**: Layout changes batched to prevent excessive API calls
- **Memoization**: Widget components optimized to prevent unnecessary re-renders
- **Image optimization**: Photos resized and cached for dashboard display

## User Experience Flows

### Initial Setup Flow
```
1. User logs in → Role detected → Preset layout applied automatically
2. Welcome tour highlights customization options
3. User can immediately use default layout or customize
4. "Edit" button prominently displayed with gentle onboarding tooltip
```

### Daily Usage Flow
```
1. Dashboard loads with user's saved layout
2. Widgets display real-time, relevant information
3. Click widget content → Navigate to detailed view
4. Make changes in detailed views → Dashboard updates automatically
5. Customize layout anytime with edit mode toggle
```

### Customization Flow
```
1. Click "Edit" → Layout becomes draggable with visual feedback
2. Drag widgets to rearrange → Auto-save preserves changes
3. Click "Add Widget" → Modal shows available options
4. Resize widgets by dragging corners → Responsive grid snapping
5. Click "Save Layout" → Name and save current configuration
6. Load presets or saved layouts anytime via dropdown
```

## Business Value

### For Contractors
- **10-second project overview** replacing 5-minute email/text checking
- **Proactive alerts** for issues requiring immediate attention
- **Cash flow visibility** with actionable payment workflows
- **Weather intelligence** preventing costly weather-related delays

### For Clients  
- **Instant project status** without contacting contractor
- **Visual progress tracking** with professional photo updates
- **Payment transparency** with clear due dates and amounts
- **Communication confidence** through organized message history

### For Project Managers
- **Multi-contractor oversight** with performance analytics
- **Resource allocation intelligence** across all projects
- **Early warning system** for projects requiring intervention
- **Scalability metrics** for business growth planning

## Technical Specifications

### Required Packages
```json
{
  "react-grid-layout": "^1.5.2",
  "react-draggable": "^4.5.0", 
  "@types/react-grid-layout": "^1.3.5"
}
```

### CSS Requirements
```css
/* React Grid Layout Styles */
.react-grid-layout {
  position: relative;
}

.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}

.react-grid-item.cssTransforms {
  transition-property: transform, width, height;
}

.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA2IDYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQo8Zz48cGF0aCBmaWxsPSIjZmZmIiBkPSJtMTUuOCwzM');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}
```

### API Endpoints

#### **Dashboard Configuration**
```typescript
// Get user's dashboard configuration
GET /api/dashboard/config
Response: {
  layouts: DashboardLayouts;
  activeWidgets: string[];
  savedLayouts: SavedLayout[];
}

// Save dashboard configuration  
POST /api/dashboard/config
Body: {
  layouts: DashboardLayouts;
  widgets: string[];
  layoutName?: string;
}

// Get available widgets for user role
GET /api/dashboard/widgets
Response: {
  widgets: WidgetConfig[];
  categories: WidgetCategory[];
}
```

#### **Widget Data Endpoints**
```typescript
// Get data for specific widget
GET /api/dashboard/widget/:widgetId
Response: {
  data: any; // Widget-specific data structure
  lastUpdated: string;
  cacheKey: string;
}

// Real-time widget updates via WebSocket
WS /api/dashboard/subscribe
Events: {
  type: 'widget_update';
  widgetId: string;
  data: any;
}
```

### Database Schema

#### **Dashboard Configurations Table**
```sql
CREATE TABLE user_dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  layout_name VARCHAR(100) DEFAULT 'default',
  layouts JSONB NOT NULL, -- Responsive layouts for all breakpoints
  active_widgets TEXT[] NOT NULL, -- Array of widget IDs
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dashboard_configs_user_id ON user_dashboard_configs(user_id);
CREATE INDEX idx_dashboard_configs_default ON user_dashboard_configs(user_id, is_default);
```

#### **Widget Preferences Table**
```sql
CREATE TABLE widget_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  widget_id VARCHAR(50) NOT NULL,
  preferences JSONB DEFAULT '{}', -- Widget-specific settings
  data_filters JSONB DEFAULT '{}', -- User-specific data filtering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_widget_preferences_user_widget 
  ON widget_preferences(user_id, widget_id);
```

## Customization User Interface

### Edit Mode Interface

#### **Visual Indicators**
- **Dashed border** around entire dashboard when in edit mode
- **Resize handles** appear on widget corners when selected
- **Drop zones** highlighted when dragging widgets
- **Grid overlay** (optional) for precise alignment
- **Widget toolbar** appears on hover with options

#### **Action Buttons**
```typescript
interface EditModeActions {
  toggleEditMode: () => void;      // Edit ↔ Preview
  addWidget: () => void;           // + Add Widget
  saveLayout: () => void;          // 💾 Save Layout
  loadPreset: (preset: string) => void; // 📋 Load Preset
  resetLayout: () => void;         // ↻ Reset to Default
}
```

#### **Widget Management Modal**
- **Category tabs**: Essential, Productivity, Analytics, Communication
- **Widget cards** with preview thumbnails and descriptions
- **Role filtering**: Only show widgets available to current user
- **Search functionality**: Find widgets by name or description
- **Quick add**: Double-click to add widget to dashboard

### Responsive Behavior

#### **Desktop (≥1200px)**
- **12-column grid** for maximum flexibility
- **Full customization** with drag-and-drop
- **Detailed widget content** with expanded information
- **Side-by-side layouts** for workflow optimization

#### **Tablet (768px - 1199px)**
- **10-column grid** optimized for touch interaction
- **Touch-friendly** drag handles and resize controls
- **Simplified widgets** with essential information only
- **Portrait/landscape** automatic layout adjustment

#### **Mobile (≤767px)**
- **Stacked layout** with vertical scrolling
- **Swipe gestures** for widget reordering
- **Simplified edit mode** with basic customization
- **Essential widgets only** to prevent overwhelm

## Widget Development Guidelines

### Creating New Widgets

#### **Widget Component Structure**
```typescript
interface StandardWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
  size?: { w: number; h: number };
  userRole?: UserRole;
  projectContext?: Project;
}

export function ExampleWidget({ 
  onRemove, 
  isEditMode, 
  size, 
  userRole,
  projectContext 
}: StandardWidgetProps) {
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border">
      {/* Standard Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <WidgetIcon className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-gray-900">Widget Title</h3>
        </div>
        {isEditMode && onRemove && (
          <button onClick={onRemove} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Content based on widget purpose */}
      </div>
      
      {/* Optional Widget Footer */}
      <div className="p-4 border-t bg-gray-50">
        {/* Action buttons or summary information */}
      </div>
    </div>
  );
}
```

#### **Widget Registration**
```typescript
// Register new widget in AVAILABLE_WIDGETS array
const AVAILABLE_WIDGETS: WidgetConfig[] = [
  // ... existing widgets
  {
    id: 'new-widget',
    name: 'New Widget',
    component: NewWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    description: 'Description of widget functionality',
    roles: ['contractor', 'staff'], // Who can access this widget
    category: 'productivity'
  }
];
```

### Widget Data Management

#### **Data Fetching Pattern**
```typescript
// Custom hook for widget data
export function useWidgetData(widgetId: string, refreshInterval?: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/dashboard/widget/${widgetId}`);
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up refresh interval if specified
    if (refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widgetId, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}
```

#### **Real-Time Subscriptions**
```typescript
// Widget real-time update subscription
export function useWidgetRealtime(widgetId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel(`dashboard-${widgetId}`)
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        onUpdate(payload.data);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [widgetId, onUpdate]);
}
```

## Performance Considerations

### Optimization Strategies
- **Virtualization**: Large datasets use react-window for performance
- **Memoization**: Widget components wrapped in React.memo
- **Debounced updates**: Layout changes debounced to 300ms
- **Incremental loading**: Non-critical widgets load after essential ones
- **Background prefetch**: Likely-needed data preloaded during idle time

### Monitoring & Analytics
- **Widget usage tracking**: Which widgets are most valuable to users
- **Performance metrics**: Load times and interaction rates per widget
- **Customization analytics**: Most popular layouts and arrangements
- **Error tracking**: Widget-specific error rates and issues

## Security & Privacy

### Data Access Control
- **Role-based widget filtering**: Users only see widgets they have permission for
- **Project-scoped data**: Clients only see data for their specific projects
- **Audit logging**: All dashboard configuration changes logged
- **Data encryption**: Sensitive widget data encrypted at rest

### Privacy Protection
- **Data minimization**: Widgets only load necessary data for display
- **Consent management**: Users control what data widgets can access
- **Anonymization**: Analytics data stripped of personal identifiers
- **Retention policies**: Dashboard usage data follows user retention settings

## Future Enhancements

### Advanced Features (Roadmap)
1. **AI-Powered Layout Suggestions**: Machine learning recommends optimal widget arrangements
2. **Collaborative Dashboards**: Shared dashboards for project teams
3. **Mobile App Integration**: Dashboard sync with React Native mobile app
4. **Voice Control**: "Show me today's schedule" voice navigation
5. **Augmented Reality**: AR overlay of dashboard information on job sites

### Integration Possibilities
1. **Third-Party Widgets**: API for external developers to create widgets
2. **Industry-Specific Widgets**: HVAC, electrical, plumbing specialized widgets
3. **Client Custom Widgets**: White-label widgets for contractor branding
4. **Marketplace**: Widget store for premium and specialized functionality

## Success Metrics

### User Engagement KPIs
- **Dashboard daily active usage**: >85% of users visit dashboard daily
- **Customization adoption**: >60% of users modify default layout within 30 days
- **Widget interaction rate**: >70% of widgets clicked/used weekly
- **Time to information**: <3 seconds to find needed project information

### Business Impact KPIs  
- **Communication efficiency**: 40% reduction in "status update" calls/messages
- **Payment acceleration**: 25% faster payment collection through payment status widget
- **Issue prevention**: 50% reduction in missed deadlines through schedule widget
- **Client satisfaction**: 4.5+ NPS improvement through transparency widgets

---

## Implementation Status

### ✅ Completed
- Widget component architecture designed
- Role-based layout presets defined
- Core widgets implemented (Photos, Messages, Schedule, Progress, Payment)
- Security and data access patterns established

### 🔄 In Progress  
- React Grid Layout SSR configuration
- Widget data integration with existing FieldTime APIs
- Mobile responsive optimization

### 📅 Planned
- Advanced widget types (Meeting Intelligence, Document Activity)
- Drag-and-drop customization interface
- Layout save/load functionality  
- Performance optimization and caching

**The dashboard system transforms FieldTime from a collection of features into a personalized command center that adapts to each user's workflow and priorities.**