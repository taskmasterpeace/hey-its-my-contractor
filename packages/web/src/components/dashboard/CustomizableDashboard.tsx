'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => mod.WidthProvider(mod.Responsive)),
  { ssr: false }
);

type Layout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
import { useAppStore } from '@/store';
import { 
  Settings, 
  LayoutGrid, 
  Save, 
  RotateCcw, 
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

// Dashboard Widgets
import { 
  LatestPhotosWidget,
  MessageCenterWidget,
  TodaysScheduleWidget,
  ProjectProgressWidget,
  PaymentStatusWidget,
  WeatherWidget,
  ChangeOrderWidget,
  MeetingSummaryWidget,
  DocumentActivityWidget,
  TeamStatusWidget
} from './widgets';

// ResponsiveGridLayout imported dynamically above

interface WidgetConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  description: string;
  roles: string[];
}

const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'latest-photos',
    name: 'Latest Photos',
    component: LatestPhotosWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    description: 'Recent project photos with AI enhancement options',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'message-center',
    name: 'Message Center',
    component: MessageCenterWidget,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    description: 'Unread messages and important communications',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'todays-schedule',
    name: "Today's Schedule",
    component: TodaysScheduleWidget,
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    description: 'Calendar events with weather considerations',
    roles: ['contractor', 'staff']
  },
  {
    id: 'project-progress',
    name: 'Project Progress',
    component: ProjectProgressWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    description: 'Visual progress tracking with milestones',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'payment-status',
    name: 'Payment Status',
    component: PaymentStatusWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    description: 'Invoice status and cash flow',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'weather',
    name: 'Weather Conditions',
    component: WeatherWidget,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    description: 'Current weather affecting work',
    roles: ['contractor', 'staff']
  },
  {
    id: 'change-orders',
    name: 'Change Orders',
    component: ChangeOrderWidget,
    defaultSize: { w: 5, h: 4 },
    minSize: { w: 3, h: 3 },
    description: 'Pending change orders and approvals',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'meeting-summary',
    name: 'Meeting Summary',
    component: MeetingSummaryWidget,
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    description: 'Recent meeting highlights and action items',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'document-activity',
    name: 'Document Activity',
    component: DocumentActivityWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    description: 'Recently uploaded and modified documents',
    roles: ['contractor', 'homeowner', 'staff']
  },
  {
    id: 'team-status',
    name: 'Team Status',
    component: TeamStatusWidget,
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    description: 'Who\'s online and available',
    roles: ['contractor', 'staff']
  },
];

// Preset Layouts
const PRESET_LAYOUTS = {
  contractor: {
    name: 'Contractor Default',
    layout: [
      { i: 'todays-schedule', x: 0, y: 0, w: 6, h: 3 },
      { i: 'latest-photos', x: 6, y: 0, w: 4, h: 3 },
      { i: 'message-center', x: 10, y: 0, w: 4, h: 4 },
      { i: 'project-progress', x: 0, y: 3, w: 4, h: 3 },
      { i: 'payment-status', x: 4, y: 3, w: 4, h: 3 },
      { i: 'weather', x: 8, y: 3, w: 3, h: 2 },
      { i: 'change-orders', x: 0, y: 6, w: 5, h: 4 },
    ],
    widgets: ['todays-schedule', 'latest-photos', 'message-center', 'project-progress', 'payment-status', 'weather', 'change-orders']
  },
  homeowner: {
    name: 'Client Default',
    layout: [
      { i: 'project-progress', x: 0, y: 0, w: 6, h: 3 },
      { i: 'latest-photos', x: 6, y: 0, w: 6, h: 3 },
      { i: 'message-center', x: 0, y: 3, w: 6, h: 4 },
      { i: 'payment-status', x: 6, y: 3, w: 4, h: 3 },
      { i: 'meeting-summary', x: 10, y: 3, w: 4, h: 3 },
      { i: 'change-orders', x: 0, y: 7, w: 8, h: 4 },
    ],
    widgets: ['project-progress', 'latest-photos', 'message-center', 'payment-status', 'meeting-summary', 'change-orders']
  },
  staff: {
    name: 'Staff Default', 
    layout: [
      { i: 'todays-schedule', x: 0, y: 0, w: 8, h: 3 },
      { i: 'team-status', x: 8, y: 0, w: 3, h: 4 },
      { i: 'message-center', x: 0, y: 3, w: 4, h: 4 },
      { i: 'document-activity', x: 4, y: 3, w: 4, h: 3 },
      { i: 'weather', x: 11, y: 0, w: 3, h: 2 },
    ],
    widgets: ['todays-schedule', 'team-status', 'message-center', 'document-activity', 'weather']
  }
};

export function CustomizableDashboard() {
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);
  
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<any[]>([]);

  // Get widgets available for current user role
  const availableWidgets = AVAILABLE_WIDGETS.filter(widget => 
    widget.roles.includes(userRole || 'contractor')
  );

  // Initialize dashboard with preset layout based on user role
  useEffect(() => {
    const presetKey = userRole || 'contractor';
    const preset = PRESET_LAYOUTS[presetKey as keyof typeof PRESET_LAYOUTS];
    
    if (preset) {
      setLayouts({ lg: preset.layout });
      setActiveWidgets(preset.widgets);
    }
  }, [userRole]);

  // Load saved layouts from storage
  useEffect(() => {
    const saved = localStorage.getItem(`fieldtime-dashboard-${currentUser?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayouts(parsed.layouts || {});
        setActiveWidgets(parsed.widgets || []);
      } catch (error) {
        console.error('Failed to load saved layout:', error);
      }
    }
  }, [currentUser?.id]);

  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
    
    // Auto-save layout changes
    if (currentUser?.id) {
      const saveData = {
        layouts,
        widgets: activeWidgets,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`fieldtime-dashboard-${currentUser.id}`, JSON.stringify(saveData));
    }
  };

  const addWidget = (widgetId: string) => {
    if (activeWidgets.includes(widgetId)) return;
    
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    // Find a good position for the new widget
    const newLayout = {
      i: widgetId,
      x: 0,
      y: Math.max(...(layouts.lg || []).map(l => l.y + l.h), 0),
      w: widget.defaultSize.w,
      h: widget.defaultSize.h,
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayout]
    }));
    setActiveWidgets(prev => [...prev, widgetId]);
    setShowWidgetPicker(false);
  };

  const removeWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
    setLayouts(prev => ({
      ...prev,
      lg: (prev.lg || []).filter(l => l.i !== widgetId)
    }));
  };

  const applyPresetLayout = (presetKey: string) => {
    const preset = PRESET_LAYOUTS[presetKey as keyof typeof PRESET_LAYOUTS];
    if (preset) {
      setLayouts({ lg: preset.layout });
      setActiveWidgets(preset.widgets);
    }
  };

  const saveCurrentLayout = () => {
    const layoutName = prompt('Enter a name for this layout:');
    if (!layoutName) return;

    const newSavedLayout = {
      id: Date.now().toString(),
      name: layoutName,
      layouts,
      widgets: activeWidgets,
      createdAt: new Date().toISOString(),
    };

    setSavedLayouts(prev => [...prev, newSavedLayout]);
    
    // Save to localStorage
    const allSaved = [...savedLayouts, newSavedLayout];
    localStorage.setItem(`fieldtime-saved-layouts-${currentUser?.id}`, JSON.stringify(allSaved));
    
    alert(`✅ Layout "${layoutName}" saved successfully!`);
  };

  const renderWidget = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) return <div>Widget not found</div>;

    const WidgetComponent = widget.component;
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border overflow-hidden">
        <WidgetComponent 
          onRemove={() => removeWidget(widgetId)}
          isEditMode={isEditMode}
        />
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'homeowner' ? 'Project Dashboard' : 'Contractor Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Drag widgets to rearrange, resize by dragging corners' : 'Your personalized project overview'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Layout Controls */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-colors ${
                isEditMode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isEditMode ? <Eye className="w-4 h-4 mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
              {isEditMode ? 'Preview' : 'Edit'}
            </button>
          </div>

          {isEditMode && (
            <>
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Widget
              </button>
              
              <button
                onClick={saveCurrentLayout}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Layout
              </button>
            </>
          )}

          {/* Preset Layouts Dropdown */}
          <div className="relative">
            <select 
              onChange={(e) => applyPresetLayout(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              defaultValue=""
            >
              <option value="" disabled>Load Preset</option>
              <option value="contractor">Contractor Default</option>
              <option value="homeowner">Client Default</option>
              <option value="staff">Staff Default</option>
            </select>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className={`${isEditMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-2' : ''}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {activeWidgets.map((widgetId) => (
            <div key={widgetId} className="relative">
              {renderWidget(widgetId)}
              {isEditMode && (
                <button
                  onClick={() => removeWidget(widgetId)}
                  className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Widget</h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableWidgets
                .filter(widget => !activeWidgets.includes(widget.id))
                .map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => addWidget(widget.id)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{widget.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{widget.description}</p>
                    <div className="text-xs text-gray-500">
                      Size: {widget.defaultSize.w}×{widget.defaultSize.h} • 
                      Min: {widget.minSize.w}×{widget.minSize.h}
                    </div>
                  </button>
                ))}
            </div>

            {availableWidgets.filter(w => !activeWidgets.includes(w.id)).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <LayoutGrid className="w-12 h-12 mx-auto mb-3" />
                <p>All available widgets are already on your dashboard</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text for Edit Mode */}
      {isEditMode && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📝 Dashboard Editing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Drag widgets</strong> to rearrange layout</li>
            <li>• <strong>Resize widgets</strong> by dragging corners</li>
            <li>• <strong>Remove widgets</strong> using the × button</li>
            <li>• <strong>Add widgets</strong> with the green + button</li>
            <li>• <strong>Save layout</strong> to preserve your changes</li>
            <li>• <strong>Load presets</strong> to start with optimized layouts</li>
          </ul>
        </div>
      )}
    </div>
  );
}