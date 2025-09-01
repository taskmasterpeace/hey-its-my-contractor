'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function NotificationSystem() {
  const { notifications, remove } = useNotifications();

  if (notifications.length === 0) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right duration-300 ${getNotificationStyles(notification.type)}`}
        >
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={() => remove(notification.id)}
            className="flex-shrink-0 ml-2 p-1 rounded hover:bg-black hover:bg-opacity-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}