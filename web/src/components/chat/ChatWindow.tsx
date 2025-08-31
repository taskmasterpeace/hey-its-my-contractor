'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatRoom, ChatMessage } from '@contractor-platform/types';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { Users, Phone, Video, MoreVertical, Pin } from 'lucide-react';

interface ChatWindowProps {
  room: ChatRoom;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  currentUserId: string;
  getRoomIcon: (room: ChatRoom) => React.ReactNode;
}

export function ChatWindow({ 
  room, 
  messages, 
  onSendMessage, 
  currentUserId,
  getRoomIcon 
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getParticipantNames = () => {
    if (room.type === 'direct') {
      return room.name || 'Direct Message';
    }
    return `${room.participants?.length || 0} members`;
  };

  const getRoomStatus = () => {
    if (room.type === 'project' && room.project_id) {
      return 'Project Chat';
    }
    if (room.type === 'team') {
      return 'Team Chat';
    }
    if (room.type === 'direct') {
      return 'Direct Message';
    }
    return 'General Chat';
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center min-w-0 flex-1">
          <div className="flex-shrink-0 mr-3">
            {getRoomIcon(room)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {room.name}
            </h3>
            <p className="text-sm text-gray-600">
              {getRoomStatus()} • {getParticipantNames()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Video className="w-5 h-5" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowRoomInfo(!showRoomInfo)}
          >
            <Users className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-white border border-gray-200 rounded-full px-4 py-1">
                <span className="text-xs font-medium text-gray-600">
                  {formatDateHeader(date)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
              {dayMessages.map((message, index) => {
                const prevMessage = index > 0 ? dayMessages[index - 1] : null;
                const showAvatar = !prevMessage || 
                                  prevMessage.user_id !== message.user_id ||
                                  (new Date(message.created_at).getTime() - 
                                   new Date(prevMessage.created_at).getTime()) > 300000; // 5 minutes

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.user_id === currentUserId}
                    showAvatar={showAvatar}
                    showTimestamp={showAvatar}
                  />
                );
              })}
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {getRoomIcon(room)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to {room.name}
            </h3>
            <p className="text-gray-600">
              This is the beginning of your conversation.
              {room.type === 'project' && ' Share updates, photos, and coordinate work here.'}
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput 
          onSendMessage={onSendMessage}
          placeholder={`Message ${room.type === 'direct' ? room.name : '#' + room.name}`}
          roomType={room.type}
        />
      </div>
    </div>
  );
}