"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatRoom, ChatMessage } from "@contractor-platform/types";
import { ChatRoomsList } from "@/components/chat/ChatRoomsList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageSquare, Users, Hash, Lock, Plus } from "lucide-react";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample chat data filtered by project
  useEffect(() => {
    const loadChatData = async () => {
      setLoading(true);

      // Simulate API calls
      setTimeout(() => {
        const sampleRooms: ChatRoom[] = [
          {
            id: "1",
            name: "Project Discussion",
            type: "project",
            project_id: projectId,
            participants: ["contractor-1", "client-1", "staff-1"],
            last_message: {
              id: "msg-1",
              content:
                "Just finished the electrical rough-in. Ready for inspection.",
              sender_id: "contractor-1",
              sender_name: "Mike Johnson",
              timestamp: "2025-01-24T16:30:00Z",
              type: "text",
            },
            unread_count: 0,
            created_at: "2025-01-15T09:00:00Z",
            updated_at: "2025-01-24T16:30:00Z",
          },
          {
            id: "2",
            name: "Team Chat",
            type: "team",
            project_id: projectId,
            participants: ["contractor-1", "staff-1", "sub-1"],
            last_message: {
              id: "msg-2",
              content: "Tile delivery scheduled for Monday morning",
              sender_id: "staff-1",
              sender_name: "Sarah Davis",
              timestamp: "2025-01-24T14:15:00Z",
              type: "text",
            },
            unread_count: 2,
            created_at: "2025-01-18T10:00:00Z",
            updated_at: "2025-01-24T14:15:00Z",
          },
          {
            id: "3",
            name: "Client Direct",
            type: "direct",
            project_id: projectId,
            participants: ["contractor-1", "client-1"],
            last_message: {
              id: "msg-3",
              content: "Thanks for the update! The project is looking great.",
              sender_id: "client-1",
              sender_name: "John Smith",
              timestamp: "2025-01-24T11:45:00Z",
              type: "text",
            },
            unread_count: 1,
            created_at: "2025-01-15T09:30:00Z",
            updated_at: "2025-01-24T11:45:00Z",
          },
        ];

        const sampleOnlineUsers = [
          {
            id: "contractor-1",
            name: "Mike Johnson",
            username: "mike.johnson",
            status: "online",
            avatar_url: null,
            role: "contractor",
          },
          {
            id: "staff-1",
            name: "Sarah Davis",
            username: "sarah.davis",
            status: "online",
            avatar_url: null,
            role: "staff",
          },
          {
            id: "client-1",
            name: "John Smith",
            username: "john.smith",
            status: "away",
            avatar_url: null,
            role: "homeowner",
          },
        ];

        setRooms(sampleRooms);
        setOnlineUsers(sampleOnlineUsers);
        setSelectedRoom(sampleRooms[0]);
        setLoading(false);
      }, 1000);
    };

    if (projectId) {
      loadChatData();
    }
  }, [projectId]);

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);

    // Mark room as read
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unread_count: 0 } : r))
    );

    // Load messages for selected room (simulate)
    setTimeout(() => {
      const sampleMessages: ChatMessage[] = [
        {
          id: "1",
          channel_id: room.id,
          user_id: "contractor-1",
          content: "Good morning everyone! Starting work on the project today.",
          type: "text",
          created_at: "2025-01-24T08:00:00Z",
          updated_at: "2025-01-24T08:00:00Z",
        },
        {
          id: "2",
          channel_id: room.id,
          user_id: "client-1",
          content: "Great! Looking forward to seeing the progress.",
          type: "text",
          created_at: "2025-01-24T08:15:00Z",
          updated_at: "2025-01-24T08:15:00Z",
        },
        {
          id: "3",
          channel_id: room.id,
          user_id: "contractor-1",
          content:
            "Demo work is complete. Here's a photo of the space ready for electrical.",
          type: "text",
          attachments: [
            {
              id: "att-1",
              type: "image",
              url: "https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Project+Progress",
              filename: "project-progress.jpg",
              size: 1800000,
              metadata: {},
            },
          ],
          created_at: "2025-01-24T12:30:00Z",
          updated_at: "2025-01-24T12:30:00Z",
        },
        {
          id: "4",
          channel_id: room.id,
          user_id: "staff-1",
          content: "Next phase is scheduled for tomorrow at 9 AM",
          type: "text",
          created_at: "2025-01-24T14:00:00Z",
          updated_at: "2025-01-24T14:00:00Z",
        },
        {
          id: "5",
          channel_id: room.id,
          user_id: "contractor-1",
          content: "Perfect! Just finished this phase. Ready for next steps.",
          type: "text",
          created_at: "2025-01-24T16:30:00Z",
          updated_at: "2025-01-24T16:30:00Z",
        },
      ];

      setMessages(sampleMessages);
    }, 500);
  };

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (!selectedRoom) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      channel_id: selectedRoom.id,
      user_id: "contractor-1", // Current user
      content,
      type: attachments && attachments.length > 0 ? "file" : "text",
      attachments: attachments?.map((file, index) => ({
        id: `att-${Date.now()}-${index}`,
        type: file.type.startsWith("image/") ? "image" : "file",
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        metadata: {},
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Update room's last message
    setRooms((prev) =>
      prev.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              last_message: {
                id: newMessage.id,
                content: newMessage.content,
                sender_id: newMessage.user_id,
                sender_name: "Mike Johnson", // Current user name
                timestamp: newMessage.created_at,
                type: "text" as const,
              },
              updated_at: newMessage.created_at,
            }
          : room
      )
    );
  };

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case "project":
        return <Hash className="w-4 h-4 text-blue-600" />;
      case "team":
        return <Users className="w-4 h-4 text-green-600" />;
      case "direct":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "general":
        return <Hash className="w-4 h-4 text-gray-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Rooms Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{rooms.length} channels</span>
            <span>
              {onlineUsers.filter((u) => u.status === "online").length} online
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatRoomsList
            rooms={rooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelect}
            getRoomIcon={getRoomIcon}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId="contractor-1"
            getRoomIcon={getRoomIcon}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a chat room to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Users Sidebar */}
      <div className="w-64 bg-gray-50 border-l border-gray-200">
        <ChatSidebar room={selectedRoom} onlineUsers={onlineUsers} />
      </div>
    </div>
  );
}
