'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Camera, Smile, Mic, FileImage, Zap } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  roomType?: string;
}

export function MessageInput({ 
  onSendMessage, 
  placeholder = "Type a message...",
  roomType 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQuickActions = () => {
    if (roomType === 'project') {
      return [
        { 
          label: 'Progress Update', 
          icon: <Camera className="w-4 h-4" />,
          action: () => {
            setMessage(prev => prev + '📍 Progress Update: ');
            imageInputRef.current?.click();
          }
        },
        { 
          label: 'Work Started', 
          icon: <Zap className="w-4 h-4" />,
          action: () => setMessage('🔨 Work has begun on site. Will provide updates throughout the day.')
        },
        { 
          label: 'Break Time', 
          icon: <Smile className="w-4 h-4" />,
          action: () => setMessage('☕ Taking a short break. Back to work shortly.')
        },
        { 
          label: 'Day Complete', 
          icon: <Zap className="w-4 h-4" />,
          action: () => setMessage('🏁 Work completed for today. Site secured and clean.')
        },
      ];
    }
    return [];
  };

  return (
    <div className="p-4">
      {/* File Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-100 rounded-lg p-2 group"
            >
              {file.type.startsWith('image/') ? (
                <FileImage className="w-4 h-4 text-gray-500 mr-2" />
              ) : (
                <Paperclip className="w-4 h-4 text-gray-500 mr-2" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && getQuickActions().length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {getQuickActions().map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setShowQuickActions(false);
              }}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              overflow: 'auto',
            }}
          />
          
          {/* Emoji Button */}
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            onClick={() => {
              // Add emoji picker functionality here
              setMessage(prev => prev + '😊');
            }}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions Toggle (for project rooms) */}
          {roomType === 'project' && (
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`p-2 rounded-lg transition-colors ${
                showQuickActions 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-5 h-5" />
            </button>
          )}

          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Image Upload */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Voice Message (placeholder) */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className={`p-2 rounded-lg transition-colors ${
              message.trim() || attachments.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="*/*"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*"
      />
    </div>
  );
}