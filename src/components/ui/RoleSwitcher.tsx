'use client';

import { useState } from 'react';
import { ChevronDown, User, Crown, Home, Shield, Wrench } from 'lucide-react';
import { useAppStore } from '@/store';

export function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useAppStore((state) => state.currentUser);
  const sampleUsers = useAppStore((state) => state.sampleUsers);
  const isViewSwitching = useAppStore((state) => state.isViewSwitching);
  const { switchToUser, toggleViewSwitching } = useAppStore();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'contractor':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'homeowner':
        return <Home className="w-4 h-4 text-blue-500" />;
      case 'staff':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'sub':
        return <Wrench className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'contractor':
        return 'text-yellow-700';
      case 'homeowner':
        return 'text-blue-700';
      case 'staff':
        return 'text-green-700';
      case 'sub':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  const getProjectForUser = (userId: string) => {
    // Map users to their associated projects
    const projectMapping: Record<string, string> = {
      'contractor-1': 'All Projects',
      'client-1': 'Johnson Kitchen Project',
      'client-2': 'Wilson Bathroom Project',
    };
    
    return projectMapping[userId] || 'No Project';
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {/* Current User Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {currentUser.profile.first_name[0]}{currentUser.profile.last_name[0]}
        </div>
        
        {/* User Info */}
        <div className="text-left">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">
              {currentUser.profile.first_name} {currentUser.profile.last_name}
            </p>
            {isViewSwitching && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                Test View
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {getRoleIcon(currentUser.role)}
            <p className={`text-xs ${getRoleColor(currentUser.role)} capitalize`}>
              {currentUser.role}
            </p>
          </div>
        </div>
        
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Switch User View</h3>
              <button
                onClick={() => {
                  toggleViewSwitching();
                  setIsOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  isViewSwitching 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isViewSwitching ? 'Exit Test Mode' : 'Enter Test Mode'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Test how different users experience FieldTime
            </p>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {sampleUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  switchToUser(user.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  currentUser?.id === user.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.profile.first_name[0]}{user.profile.last_name[0]}
                </div>
                
                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user.profile.first_name} {user.profile.last_name}
                    </p>
                    {currentUser?.id === user.id && (
                      <span className="text-xs text-blue-600 font-medium">Current</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-1">
                    {getRoleIcon(user.role)}
                    <span className={`text-xs capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {getProjectForUser(user.id)}
                  </p>
                  
                  {user.profile.company && (
                    <p className="text-xs text-gray-500">
                      {user.profile.company}
                    </p>
                  )}
                </div>

                {/* Current User Indicator */}
                {currentUser?.id === user.id && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Help Text */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Switch between contractor and client views to test user experience. 
              Clients see limited, project-specific data while contractors see everything.
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}