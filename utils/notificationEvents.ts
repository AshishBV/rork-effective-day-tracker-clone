type Listener = () => void;

const listeners: Set<Listener> = new Set();

export const notificationEvents = {
  addListener(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  emit(): void {
    console.log(`[NotificationEvents] Emitting data-changed to ${listeners.size} listeners`);
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[NotificationEvents] Listener error:', e);
      }
    });
  },
};
