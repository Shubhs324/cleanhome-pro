export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function scheduleNotification(title: string, body: string, scheduledTime: number) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay > 0) {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'cleanhome-task',
        });
      }, delay);
    }
  }
}

export function notifyTomorrowTask(taskName: string, zone: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  scheduleNotification(
    '🧹 Tâche de demain',
    `N'oubliez pas : ${taskName} (${zone})`,
    tomorrow.getTime()
  );
}
