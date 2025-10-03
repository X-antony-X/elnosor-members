// Notification badge utilities for PWA

export class NotificationBadge {
  static async setBadge(count: number) {
    if ("setAppBadge" in navigator) {
      try {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (error) {
        console.error("Error setting app badge:", error);
      }
    }
  }

  static async clearBadge() {
    if ("clearAppBadge" in navigator) {
      try {
        await navigator.clearAppBadge();
      } catch (error) {
        console.error("Error clearing app badge:", error);
      }
    }
  }

  static isSupported(): boolean {
    return "setAppBadge" in navigator;
  }
}

// Hook for managing notification badges
export function useNotificationBadge() {
  const setBadge = async (count: number) => {
    await NotificationBadge.setBadge(count);
  };

  const clearBadge = async () => {
    await NotificationBadge.clearBadge();
  };

  const isSupported = NotificationBadge.isSupported();

  return { setBadge, clearBadge, isSupported };
}
