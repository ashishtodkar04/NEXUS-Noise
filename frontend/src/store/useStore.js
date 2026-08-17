import { create } from 'zustand';

const useStore = create((set) => ({
  // Global loading state
  isLoading: false,
  loadingMessage: '',
  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),
  
  // Global error state
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // User state
  user: null,
  role: null,
  setUser: (user) => set({ user, role: user?.role }),
  clearUser: () => set({ user: null, role: null }),
  
  // Notification state
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  // Cache for API responses
  cache: {},
  setCache: (key, data, ttl = 300000) => set((state) => ({
    cache: {
      ...state.cache,
      [key]: { data, timestamp: Date.now(), ttl }
    }
  })),
  getCache: (key) => {
    const cached = useStore.getState().cache[key];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cached.ttl) {
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    return cached.data;
  },
  clearCache: (key) => set((state) => {
    if (key) {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    }
    return { cache: {} };
  })
}));

export default useStore;
