'use client';

import { ChatRoom } from '@contractor-platform/types';
import { Users, Crown, Shield, Wrench, User } from 'lucide-react';

interface ChatSidebarProps {
  room: ChatRoom | null;
  onlineUsers: any[];
}

export function ChatSidebar({ room, onlineUsers }: ChatSidebarProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'contractor':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'staff':
        return <Shield className="w-3 h-3 text-blue-500" />;
      case 'sub':
        return <Wrench className="w-3 h-3 text-green-500" />;
      case 'homeowner':
        return <User className="w-3 h-3 text-purple-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getUserAvatar = (user: any) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const colorIndex = user.id.charCodeAt(0) % colors.length;
    const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    
    return (
      <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium relative`}>
        {initials}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
      </div>
    );
  };

  if (!room) {
    return (
      <div className="p-6 text-center">
        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Select a chat to see participants</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Room Info */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">About</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Type:</strong> {room.type.charAt(0).toUpperCase() + room.type.slice(1)} chat</p>
          <p><strong>Members:</strong> {room.participants?.length || 0}</p>
          {room.project_id && (
            <p><strong>Project:</strong> Linked</p>
          )}
        </div>
      </div>

      {/* Online Users */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Online ({onlineUsers.filter(u => u.status === 'online').length})
        </h3>
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              {getUserAvatar(user)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(user.role)}
                  <span className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Actions */}
      {room.type === 'project' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              📅 Schedule Meeting
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              📋 Create Task
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              📄 Upload Document
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              💰 Create Invoice
            </button>
          </div>
        </div>
      )}

      {/* Room Settings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" defaultChecked />
            <span className="text-sm text-gray-700">Notifications</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">Mute chat</span>
          </label>
        </div>
      </div>
    </div>
  );
}