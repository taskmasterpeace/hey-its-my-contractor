'use client';

import { ChatRoom } from '@contractor-platform/types';

interface ChatRoomsListProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
  getRoomIcon: (room: ChatRoom) => React.ReactNode;
}

export function ChatRoomsList({ 
  rooms, 
  selectedRoom, 
  onRoomSelect, 
  getRoomIcon 
}: ChatRoomsListProps) {
  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.last_message) return 'No messages yet';
    
    const { content, type, sender_name } = room.last_message;
    const prefix = room.type === 'direct' ? '' : `${sender_name}: `;
    
    if (type === 'file' || type === 'image') {
      return `${prefix}📎 Shared a file`;
    }
    
    const preview = content?.length > 50 ? content.substring(0, 50) + '...' : content;
    return `${prefix}${preview}`;
  };

  return (
    <div className="space-y-1 p-2">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onRoomSelect(room)}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            selectedRoom?.id === room.id
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0 mr-3">
                {getRoomIcon(room)}
              </div>
              <h3 className={`font-medium truncate ${
                selectedRoom?.id === room.id ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {room.name}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {room.last_message && (
                <span className="text-xs text-gray-500">
                  {formatLastMessageTime(room.last_message.timestamp)}
                </span>
              )}
              {room.unread_count > 0 && (
                <div className="bg-blue-600 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                  {room.unread_count > 99 ? '99+' : room.unread_count}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 truncate">
            {getLastMessagePreview(room)}
          </p>
        </button>
      ))}
      
      {rooms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No chat rooms yet</p>
        </div>
      )}
    </div>
  );
}