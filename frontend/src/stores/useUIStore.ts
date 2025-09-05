import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  isLoading: boolean;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
  isSidebarOpen: boolean;

  setLoading: (isLoading: boolean) => void;
  setNotification: (notification: UIState['notification']) => void;
  clearNotification: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isLoading: false,
      notification: null,
      isSidebarOpen: false,

      setLoading: (isLoading) => set({ isLoading }),

      setNotification: (notification) => set({ notification }),

      clearNotification: () => set({ notification: null }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    { name: 'ui-store' }
  )
);
