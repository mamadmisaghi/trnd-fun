export function createEventHub() {
  const listeners = new Set();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(event) {
      for (const listener of listeners) listener(event);
    },
    get size() { return listeners.size; },
  };
}
