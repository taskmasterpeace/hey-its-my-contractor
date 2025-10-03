import { useCallback } from 'react';
import { ChatRoom, ChatMessage } from '@contractor-platform/types';
import { useAppStore } from '@/store';

export function useChat() {
  const rooms = useAppStore((state) => state.chatRooms);
  const selectedRoom = useAppStore((state) => state.selectedChatRoom);
  const messages = useAppStore((state) => state.messages);
  const onlineUsers = useAppStore((state) => state.onlineUsers);
  const loading = useAppStore((state) => state.loading.chat);
  const currentProject = useAppStore((state) => state.currentProject);
  const currentUser = useAppStore((state) => state.currentUser);

  const {
    setChatRooms,
    setSelectedChatRoom,
    addMessage,
    setMessages,
    setOnlineUsers,
    setLoading,
  } = useAppStore();

  // Get messages for current room
  const currentMessages = selectedRoom ? messages[selectedRoom.id] || [] : [];

  // Get user role for permission filtering
  const userRole = useAppStore((state) => state.userRole);
  
  // Helper function to get client's project ID  
  const getClientProjectId = (clientId: string): string => {
    const projectMapping: Record<string, string> = {
      'client-1': 'proj-1', // John Smith → Johnson Kitchen
      'client-2': 'proj-2', // Emily Wilson → Wilson Bathroom
      'client-3': 'proj-3', // Davis → Deck Construction
    };
    return projectMapping[clientId] || '';
  };
  
  // Filter rooms based on user role and permissions
  const filteredRooms = rooms.filter(room => {
    // If project filter is active, apply it first
    if (currentProject && room.project_id !== currentProject.id) {
      return false;
    }
    
    if (!currentUser) return false;
    
    if (userRole === 'contractor' || userRole === 'staff' || userRole === 'admin') {
      // Contractors see all rooms in their tenant
      return true;
    } else if (userRole === 'homeowner') {
      // Homeowners only see rooms for their projects
      const clientProjectId = getClientProjectId(currentUser.id);
      return room.project_id === clientProjectId || 
             room.participants?.includes(currentUser.id);
    }
    
    return false;
  });

  // Chat Actions
  const selectRoom = useCallback((room: ChatRoom) => {
    setSelectedChatRoom(room);
    
    // Mark room as read (reset unread count)
    const updatedRooms = rooms.map(r => 
      r.id === room.id ? { ...r, unread_count: 0 } : r
    );
    setChatRooms(updatedRooms);

    // Load messages if not already loaded
    if (!messages[room.id]) {
      loadMessages(room.id);
    }
  }, [setSelectedChatRoom, rooms, setChatRooms, messages]);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!selectedRoom || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      channel_id: selectedRoom.id,
      user_id: currentUser.id,
      content,
      type: attachments && attachments.length > 0 ? 'file' : 'text',
      attachments: attachments?.map((file, index) => ({
        id: `att-${Date.now()}-${index}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        metadata: {},
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add message optimistically
    addMessage(selectedRoom.id, newMessage);

    try {
      // In real app, send to API and get real message ID
      // const sentMessage = await api.sendMessage(selectedRoom.id, content, attachments);
      
      // Update the message with real ID
      const finalMessage = { ...newMessage, id: Date.now().toString() };
      
      // Update room's last message
      const updatedRooms = rooms.map(room =>
        room.id === selectedRoom.id
          ? {
              ...room,
              last_message: {
                id: finalMessage.id,
                content: finalMessage.content,
                sender_id: finalMessage.user_id,
                sender_name: currentUser.profile.first_name + ' ' + currentUser.profile.last_name,
                timestamp: finalMessage.created_at,
                type: finalMessage.type,
              },
              updated_at: finalMessage.created_at,
            }
          : room
      );
      setChatRooms(updatedRooms);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Could remove the optimistic message or show error state
    }
  }, [selectedRoom, currentUser, addMessage, rooms, setChatRooms]);

  const loadMessages = useCallback(async (roomId: string) => {
    setLoading(true);
    try {
      // In real app, fetch from API
      // const roomMessages = await api.getMessages(roomId);
      
      // Sample messages
      const sampleMessages: ChatMessage[] = [
        {
          id: '1',
          channel_id: roomId,
          user_id: 'contractor-1',
          content: 'Good morning everyone! Starting work on the kitchen today.',
          type: 'text',
          created_at: '2025-01-24T08:00:00Z',
          updated_at: '2025-01-24T08:00:00Z',
        },
        {
          id: '2',
          channel_id: roomId,
          user_id: 'client-1',
          content: 'Great! Looking forward to seeing the progress.',
          type: 'text',
          created_at: '2025-01-24T08:15:00Z',
          updated_at: '2025-01-24T08:15:00Z',
        },
      ];
      
      setMessages(roomId, sampleMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [setMessages, setLoading]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      // Sample rooms data
      const sampleRooms: ChatRoom[] = [
        {
          id: '1',
          name: 'Johnson Kitchen Project',
          type: 'project',
          project_id: 'proj-1',
          participants: ['contractor-1', 'client-1', 'staff-1'],
          last_message: {
            id: 'msg-1',
            content: 'Just finished the electrical rough-in. Ready for inspection.',
            sender_id: 'contractor-1',
            sender_name: 'Mike Johnson',
            timestamp: '2025-01-24T16:30:00Z',
            type: 'text',
          },
          unread_count: 0,
          created_at: '2025-01-15T09:00:00Z',
          updated_at: '2025-01-24T16:30:00Z',
        },
        {
          id: '2',
          name: 'Wilson Bathroom Team',
          type: 'team',
          project_id: 'proj-2',
          participants: ['contractor-1', 'staff-1', 'sub-1'],
          last_message: {
            id: 'msg-2',
            content: 'Tile delivery scheduled for Monday morning',
            sender_id: 'staff-1',
            sender_name: 'Sarah Davis',
            timestamp: '2025-01-24T14:15:00Z',
            type: 'text',
          },
          unread_count: 2,
          created_at: '2025-01-18T10:00:00Z',
          updated_at: '2025-01-24T14:15:00Z',
        },
      ];

      setChatRooms(sampleRooms);
      
      // Auto-select first room if none selected
      if (!selectedRoom && sampleRooms.length > 0) {
        selectRoom(sampleRooms[0]);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [setChatRooms, selectedRoom, selectRoom]);

  const createProjectRoom = useCallback(async (projectId: string, projectName: string) => {
    try {
      const newRoom: ChatRoom = {
        id: Date.now().toString(),
        name: `${projectName} - Project Chat`,
        type: 'project',
        project_id: projectId,
        participants: [currentUser?.id || 'contractor-1'],
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setChatRooms([...rooms, newRoom]);
      return newRoom;
    } catch (error) {
      console.error('Failed to create project room:', error);
      throw error;
    }
  }, [rooms, setChatRooms, currentUser]);

  // Utility functions
  const getTotalUnreadCount = useCallback(() => {
    return rooms.reduce((total, room) => total + room.unread_count, 0);
  }, [rooms]);

  const getProjectRooms = useCallback((projectId: string) => {
    return rooms.filter(room => room.project_id === projectId);
  }, [rooms]);

  const getRoomIcon = useCallback((room: ChatRoom) => {
    // This would return appropriate icon based on room type
    // Used by components for consistent iconography
    return room.type;
  }, []);

  return {
    // State
    rooms: filteredRooms,
    allRooms: rooms,
    selectedRoom,
    currentMessages,
    onlineUsers,
    loading,
    
    // Computed
    totalUnreadCount: getTotalUnreadCount(),
    
    // Actions
    selectRoom,
    sendMessage,
    loadMessages,
    loadRooms,
    createProjectRoom,
    
    // Utilities
    getProjectRooms,
    getRoomIcon,
  };
}