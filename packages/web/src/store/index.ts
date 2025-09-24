import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project, User, CalendarEvent, ChatRoom, ChatMessage, Document } from '@contractor-platform/types';

// Global App State Interface
interface AppState {
  // User & Authentication
  currentUser: User | null;
  isAuthenticated: boolean;
  userRole: 'contractor' | 'client' | 'staff' | 'sub' | 'admin' | null;
  
  // Sample Users for Testing
  sampleUsers: User[];
  
  // View Switching (for testing client experience)
  isViewSwitching: boolean;
  
  // Project Context
  currentProject: Project | null;
  projects: Project[];
  
  // Calendar State
  calendarEvents: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  calendarView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  
  // Chat State
  chatRooms: ChatRoom[];
  selectedChatRoom: ChatRoom | null;
  messages: { [roomId: string]: ChatMessage[] };
  onlineUsers: string[];
  
  // Document State
  documents: Document[];
  selectedDocument: Document | null;
  uploadQueue: File[];
  
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  
  // Loading States
  loading: {
    calendar: boolean;
    chat: boolean;
    documents: boolean;
    projects: boolean;
  };
}

// Actions Interface
interface AppActions {
  // User Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
  
  // View Switching Actions  
  switchToUser: (userId: string) => void;
  toggleViewSwitching: () => void;
  
  // Project Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  
  // Calendar Actions
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setCalendarView: (view: AppState['calendarView']) => void;
  
  // Chat Actions
  setChatRooms: (rooms: ChatRoom[]) => void;
  setSelectedChatRoom: (room: ChatRoom | null) => void;
  addMessage: (roomId: string, message: ChatMessage) => void;
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  setOnlineUsers: (users: string[]) => void;
  
  // Document Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setSelectedDocument: (document: Document | null) => void;
  addToUploadQueue: (file: File) => void;
  removeFromUploadQueue: (index: number) => void;
  clearUploadQueue: () => void;
  
  // UI Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Loading Actions
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  
  // Utility Actions
  reset: () => void;
}

type AppStore = AppState & AppActions;

// Create the store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State - Start as contractor
        currentUser: {
          id: 'contractor-1',
          tenant_id: 'tenant-1', 
          role: 'contractor',
          profile: {
            first_name: 'Mike',
            last_name: 'Johnson',
            email: 'mike@johnsoncontracting.com',
            phone: '555-0101',
            company: 'Johnson Contracting LLC',
            license_number: 'VA-12345',
          },
          auth_id: 'auth-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        isAuthenticated: true,
        userRole: 'contractor',
        sampleUsers: [
          {
            id: 'contractor-1',
            tenant_id: 'tenant-1', 
            role: 'contractor',
            profile: {
              first_name: 'Mike',
              last_name: 'Johnson',
              email: 'mike@johnsoncontracting.com',
              phone: '555-0101',
              company: 'Johnson Contracting LLC',
              license_number: 'VA-12345',
            },
            auth_id: 'auth-1',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'client-1',
            tenant_id: 'tenant-1',
            role: 'homeowner', 
            profile: {
              first_name: 'John',
              last_name: 'Smith',
              email: 'john.smith@email.com',
              phone: '555-0201',
            },
            auth_id: 'auth-2',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'client-2',
            tenant_id: 'tenant-1',
            role: 'homeowner',
            profile: {
              first_name: 'Emily',
              last_name: 'Wilson', 
              email: 'emily.wilson@email.com',
              phone: '555-0202',
            },
            auth_id: 'auth-3',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        isViewSwitching: false,
        currentProject: null,
        projects: [],
        calendarEvents: [],
        selectedEvent: null,
        calendarView: 'dayGridMonth',
        chatRooms: [],
        selectedChatRoom: null,
        messages: {},
        onlineUsers: [],
        documents: [],
        selectedDocument: null,
        uploadQueue: [],
        sidebarCollapsed: false,
        theme: 'light',
        notifications: [],
        loading: {
          calendar: false,
          chat: false,
          documents: false,
          projects: false,
        },

        // User Actions
        setCurrentUser: (user) => set({ 
          currentUser: user,
          userRole: user?.role || null,
        }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        logout: () => set({
          currentUser: null,
          isAuthenticated: false,
          userRole: null,
          currentProject: null,
        }),
        
        // View Switching Actions
        switchToUser: (userId) => {
          const users = get().sampleUsers;
          const user = users.find(u => u.id === userId);
          if (user) {
            set({ 
              currentUser: user,
              userRole: user.role,
              isViewSwitching: true,
              // Reset selections when switching users
              selectedEvent: null,
              selectedChatRoom: null,
              selectedDocument: null,
            });
          }
        },
        toggleViewSwitching: () => set((state) => ({
          isViewSwitching: !state.isViewSwitching
        })),

        // Project Actions
        setCurrentProject: (project) => set({ currentProject: project }),
        setProjects: (projects) => set({ projects }),
        addProject: (project) => set((state) => ({
          projects: [...state.projects, project]
        })),
        updateProject: (id, updates) => set((state) => ({
          projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
        })),

        // Calendar Actions
        setCalendarEvents: (events) => set({ calendarEvents: events }),
        addCalendarEvent: (event) => set((state) => ({
          calendarEvents: [...state.calendarEvents, event]
        })),
        updateCalendarEvent: (id, updates) => set((state) => ({
          calendarEvents: state.calendarEvents.map(e => 
            e.id === id ? { ...e, ...updates } : e
          )
        })),
        deleteCalendarEvent: (id) => set((state) => ({
          calendarEvents: state.calendarEvents.filter(e => e.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent
        })),
        setSelectedEvent: (event) => set({ selectedEvent: event }),
        setCalendarView: (view) => set({ calendarView: view }),

        // Chat Actions
        setChatRooms: (rooms) => set({ chatRooms: rooms }),
        setSelectedChatRoom: (room) => set({ selectedChatRoom: room }),
        addMessage: (roomId, message) => set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: [...(state.messages[roomId] || []), message]
          }
        })),
        setMessages: (roomId, messages) => set((state) => ({
          messages: { ...state.messages, [roomId]: messages }
        })),
        setOnlineUsers: (users) => set({ onlineUsers: users }),

        // Document Actions
        setDocuments: (documents) => set({ documents }),
        addDocument: (document) => set((state) => ({
          documents: [...state.documents, document]
        })),
        setSelectedDocument: (document) => set({ selectedDocument: document }),
        addToUploadQueue: (file) => set((state) => ({
          uploadQueue: [...state.uploadQueue, file]
        })),
        removeFromUploadQueue: (index) => set((state) => ({
          uploadQueue: state.uploadQueue.filter((_, i) => i !== index)
        })),
        clearUploadQueue: () => set({ uploadQueue: [] }),

        // UI Actions
        toggleSidebar: () => set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        })),
        setTheme: (theme) => set({ theme }),
        addNotification: (notification) => set((state) => ({
          notifications: [...state.notifications, {
            ...notification,
            id: Date.now().toString(),
            timestamp: Date.now(),
          }]
        })),
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),

        // Loading Actions
        setLoading: (key, loading) => set((state) => ({
          loading: { ...state.loading, [key]: loading }
        })),

        // Utility Actions
        reset: () => set({
          currentUser: null,
          isAuthenticated: false,
          userRole: null,
          currentProject: null,
          projects: [],
          calendarEvents: [],
          selectedEvent: null,
          chatRooms: [],
          selectedChatRoom: null,
          messages: {},
          documents: [],
          selectedDocument: null,
          notifications: [],
        }),
      }),
      {
        name: 'fieldtime-storage',
        // Only persist essential data, not UI state
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          userRole: state.userRole,
          currentProject: state.currentProject,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'FieldTime Store' }
  )
);

// Selector hooks for better performance
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useCurrentProject = () => useAppStore((state) => state.currentProject);
export const useCalendarEvents = () => useAppStore((state) => state.calendarEvents);
export const useChatRooms = () => useAppStore((state) => state.chatRooms);
export const useDocuments = () => useAppStore((state) => state.documents);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useTheme = () => useAppStore((state) => state.theme);

// Action hooks
export const useAppActions = () => useAppStore((state) => ({
  setCurrentUser: state.setCurrentUser,
  setCurrentProject: state.setCurrentProject,
  addCalendarEvent: state.addCalendarEvent,
  addMessage: state.addMessage,
  addDocument: state.addDocument,
  addNotification: state.addNotification,
  setLoading: state.setLoading,
}));