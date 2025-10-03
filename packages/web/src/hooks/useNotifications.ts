import { useCallback, useEffect } from 'react';
import { useAppStore } from '@/store';

export function useNotifications() {
  const notifications = useAppStore((state) => state.notifications);
  const { addNotification, removeNotification } = useAppStore();

  // Auto-remove notifications after timeout
  useEffect(() => {
    const timeouts = notifications.map(notification => {
      if (notification.type === 'success' || notification.type === 'info') {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, 5000); // 5 seconds for success/info
      } else if (notification.type === 'warning') {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, 8000); // 8 seconds for warnings
      }
      // Error notifications stay until manually dismissed
      return null;
    });

    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [notifications, removeNotification]);

  // Convenience methods
  const success = useCallback((message: string) => {
    addNotification({ type: 'success', message });
  }, [addNotification]);

  const error = useCallback((message: string) => {
    addNotification({ type: 'error', message });
  }, [addNotification]);

  const warning = useCallback((message: string) => {
    addNotification({ type: 'warning', message });
  }, [addNotification]);

  const info = useCallback((message: string) => {
    addNotification({ type: 'info', message });
  }, [addNotification]);

  const clearAll = useCallback(() => {
    notifications.forEach(notification => {
      removeNotification(notification.id);
    });
  }, [notifications, removeNotification]);

  return {
    notifications,
    success,
    error,
    warning, 
    info,
    remove: removeNotification,
    clearAll,
  };
}