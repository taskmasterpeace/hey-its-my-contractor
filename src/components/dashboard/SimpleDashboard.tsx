'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Settings, LayoutGrid, Plus } from 'lucide-react';
import { LatestPhotosWidget } from './widgets/LatestPhotosWidget';
import { MessageCenterWidget } from './widgets/MessageCenterWidget';
import { TodaysScheduleWidget } from './widgets/TodaysScheduleWidget';
import { ProjectProgressWidget } from './widgets/ProjectProgressWidget';
import { PaymentStatusWidget } from './widgets/PaymentStatusWidget';

export function SimpleDashboard() {
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);
  const [isEditMode, setIsEditMode] = useState(false);

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const userName = currentUser?.profile.first_name || 'User';
    
    if (userRole === 'homeowner') {
      return `${timeGreeting}, ${userName}! Here's your project status:`;
    } else {
      return `${timeGreeting}, ${userName}! Here's your dashboard overview:`;
    }
  };

  const getWidgetsForRole = () => {
    if (userRole === 'homeowner') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="lg:col-span-1 xl:col-span-2">
            <ProjectProgressWidget />
          </div>
          <div className="lg:col-span-1">
            <LatestPhotosWidget />
          </div>
          <div className="lg:col-span-1">
            <PaymentStatusWidget />
          </div>
          <div className="lg:col-span-1 xl:col-span-2">
            <MessageCenterWidget />
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TodaysScheduleWidget />
          </div>
          <div className="xl:col-span-1">
            <LatestPhotosWidget />
          </div>
          <div className="lg:col-span-1">
            <MessageCenterWidget />
          </div>
          <div className="lg:col-span-1">
            <ProjectProgressWidget />
          </div>
          <div className="lg:col-span-1">
            <PaymentStatusWidget />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'homeowner' ? 'Project Dashboard' : 'Hey, It\'s My Contractor Dashboard'}
          </h1>
          <p className="text-gray-600">
            {getUserGreeting()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isEditMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 mr-1" />
            {isEditMode ? 'Done Editing' : 'Customize'}
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      {getWidgetsForRole()}

      {/* Customization Info */}
      {isEditMode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🎛️ Dashboard Customization</h4>
          <p className="text-sm text-blue-800 mb-2">
            Drag-and-drop customization with React Grid Layout will be added in the next update.
          </p>
          <div className="text-sm text-blue-700">
            <strong>Current Layout:</strong> {userRole === 'homeowner' ? 'Client-optimized view' : 'Contractor-optimized view'}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {userRole === 'homeowner' ? '1' : '3'}
          </p>
          <p className="text-sm text-gray-600">
            {userRole === 'homeowner' ? 'Active Project' : 'Active Projects'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {userRole === 'homeowner' ? '12' : '47'}
          </p>
          <p className="text-sm text-gray-600">Photos This Week</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {userRole === 'homeowner' ? '3' : '18'}
          </p>
          <p className="text-sm text-gray-600">Messages Today</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {userRole === 'homeowner' ? '95%' : '87%'}
          </p>
          <p className="text-sm text-gray-600">
            {userRole === 'homeowner' ? 'Project Health' : 'On Schedule'}
          </p>
        </div>
      </div>
    </div>
  );
}