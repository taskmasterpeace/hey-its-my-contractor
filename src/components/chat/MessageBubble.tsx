'use client';

import { useState } from 'react';
import { ChatMessage } from '@contractor-platform/types';
import { MoreHorizontal, Reply, Heart, ThumbsUp, Download, Eye } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showAvatar, 
  showTimestamp 
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getUserName = () => {
    // In a real app, this would come from user data
    const userNames: { [key: string]: string } = {
      'contractor-1': 'Mike Johnson',
      'client-1': 'John Smith',
      'staff-1': 'Sarah Davis',
      'sub-1': 'Tom Rodriguez',
    };
    return userNames[message.user_id] || 'Unknown User';
  };

  const getUserAvatar = () => {
    // Generate avatar based on user ID
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const colorIndex = message.user_id.charCodeAt(0) % colors.length;
    const initials = getUserName().split(' ').map(n => n[0]).join('').toUpperCase();
    
    return (
      <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
        {initials}
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (attachment: any) => {
    return attachment.type === 'image' || attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  return (
    <div 
      className={`group flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwnMessage && (
          <div className="mr-3 mt-1">
            {getUserAvatar()}
          </div>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* Sender Name & Timestamp */}
          {showAvatar && (
            <div className={`flex items-baseline mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-sm font-medium text-gray-900">
                {isOwnMessage ? 'You' : getUserName()}
              </span>
              {showTimestamp && (
                <span className={`text-xs text-gray-500 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                  {formatTimestamp(message.created_at)}
                </span>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className="relative">
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {/* Text Content */}
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className={`${message.content ? 'mt-2' : ''} space-y-2`}>
                  {message.attachments.map((attachment, index) => (
                    <div key={index}>
                      {isImage(attachment) ? (
                        <div className="relative">
                          {!imageError ? (
                            <img
                              src={attachment.url}
                              alt={attachment.filename}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ maxHeight: '300px' }}
                              onError={() => setImageError(true)}
                              onClick={() => {
                                // Open image in modal/lightbox
                                window.open(attachment.url, '_blank');
                              }}
                            />
                          ) : (
                            <div className="flex items-center p-3 bg-gray-100 rounded-lg">
                              <Eye className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">
                                Image failed to load
                              </span>
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2">
                            <button className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-opacity">
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center p-3 rounded-lg border ${
                          isOwnMessage ? 'bg-blue-500 border-blue-400' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${
                            isOwnMessage ? 'bg-blue-400' : 'bg-gray-300'
                          }`}>
                            <span className={`text-xs font-bold ${
                              isOwnMessage ? 'text-white' : 'text-gray-600'
                            }`}>
                              {attachment.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isOwnMessage ? 'text-white' : 'text-gray-900'
                            }`}>
                              {attachment.filename}
                            </p>
                            <p className={`text-xs ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <button 
                            className={`p-1 rounded hover:opacity-70 transition-opacity ${
                              isOwnMessage ? 'text-white' : 'text-gray-400'
                            }`}
                            onClick={() => {
                              // Download file
                              const link = document.createElement('a');
                              link.href = attachment.url;
                              link.download = attachment.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Actions */}
            {showActions && (
              <div className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} flex items-center bg-white border border-gray-200 rounded-lg shadow-md`}>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <Reply className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Timestamp for single messages */}
          {!showAvatar && showTimestamp && (
            <span className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
              {formatTimestamp(message.created_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}