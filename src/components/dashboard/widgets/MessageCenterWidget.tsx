'use client';

import { MessageSquare, Clock, User, ChevronRight, X } from 'lucide-react';

interface MessageCenterWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export function MessageCenterWidget({ onRemove, isEditMode }: MessageCenterWidgetProps) {
  // Mock recent messages data
  const recentMessages = [
    {
      id: '1',
      sender: 'John Smith',
      message: 'Looking great! When will the countertops be installed?',
      timestamp: '10 minutes ago',
      project: 'Johnson Kitchen',
      unread: true,
      avatar: 'JS',
      type: 'client'
    },
    {
      id: '2',
      sender: 'Sarah Davis',
      message: 'Electrical inspection scheduled for tomorrow at 9 AM',
      timestamp: '2 hours ago',
      project: 'Wilson Bathroom',
      unread: false,
      avatar: 'SD',
      type: 'staff'
    },
    {
      id: '3',
      sender: 'Tom Rodriguez',
      message: 'Completed rough-in wiring. Ready for drywall.',
      timestamp: '4 hours ago',
      project: 'Johnson Kitchen',
      unread: false,
      avatar: 'TR',
      type: 'sub'
    },
    {
      id: '4',
      sender: 'Emily Wilson',
      message: 'Thank you for the update! The tile looks perfect.',
      timestamp: '6 hours ago',
      project: 'Wilson Bathroom',
      unread: false,
      avatar: 'EW',
      type: 'client'
    },
  ];

  const unreadCount = recentMessages.filter(msg => msg.unread).length;

  const getAvatarColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-blue-500';
      case 'staff': return 'bg-green-500';
      case 'sub': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return '🏠';
      case 'staff': return '👷';
      case 'sub': return '🔧';
      default: return '👤';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Message Center</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {!isEditMode && (
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {isEditMode && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {recentMessages.map((message) => (
          <div
            key={message.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
              message.unread ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full ${getAvatarColor(message.type)} flex items-center justify-center text-white text-xs font-bold relative`}>
                {message.avatar}
                <div className="absolute -bottom-1 -right-1 text-xs">
                  {getTypeIcon(message.type)}
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {message.sender}
                  </p>
                  <div className="flex items-center space-x-1">
                    {message.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {message.timestamp}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 truncate mb-1">
                  {message.message}
                </p>
                
                <p className="text-xs text-gray-500">
                  {message.project}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Messages
          </button>
          <button className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
            <MessageSquare className="w-3 h-3 mr-1" />
            New Message
          </button>
        </div>
      </div>
    </div>
  );
}