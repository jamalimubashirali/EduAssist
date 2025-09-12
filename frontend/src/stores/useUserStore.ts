import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  initializeAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  addXP: (amount: number) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        isInitialized: false,
        setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, error: null }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error, isLoading: false }),
        setInitialized: (isInitialized) => set({ isInitialized }),
        initializeAuth: async () => {
          const currentState = get();

          // If already initialized, don't reinitialize
          if (currentState.isInitialized) {
            console.log('🔄 Auth already initialized, skipping...');
            return;
          }

          set({ isLoading: true });

          try {
            console.log('🔄 Fetching fresh auth status...');

            // Always fetch fresh auth status from backend
            const authStatus = await authService.getAuthStatus();

            if (authStatus.isAuthenticated && authStatus.user) {
              console.log('✅ User authenticated:', authStatus.user.email);
              set({
                user: authStatus.user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
              });
            } else {
              console.log('❌ User not authenticated');
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
                error: null,
              });
            }
          } catch (error: any) {
            console.error('❌ Auth initialization failed:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: error.message || 'Authentication failed',
            });
          }
        },
        refreshUserData: async () => {
          const currentState = get();
          if (!currentState.isAuthenticated) {
            console.log('❌ Cannot refresh user data - not authenticated');
            return;
          }

          try {
            console.log('🔄 Refreshing user data...');
            const authStatus = await authService.getAuthStatus();

            if (authStatus.isAuthenticated && authStatus.user) {
              console.log('✅ User data refreshed successfully');
              set({
                user: authStatus.user,
                isAuthenticated: true,
                error: null,
              });
            } else {
              console.log('❌ Session expired during refresh');
              set({
                user: null,
                isAuthenticated: false,
                error: 'Session expired',
              });
            }
          } catch (error: any) {
            console.error('❌ Failed to refresh user data:', error);
            set({
              error: error.message || 'Failed to refresh user data',
            });
          }
        },
        logout: async () => {
          try {
            await userService.logout();
          } catch (error) {
            console.error("Logout failed on server, clearing client state anyway.", error);
          } finally {
            set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
          }
        },
        addXP: (amount) =>
          set((state) => ({
            ...state,
            user: state.user
              ? { ...state.user, xp: (state.user.xp || 0) + amount }
              : state.user,
          })),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),        // Handle hydration properly
        onRehydrateStorage: () => (state) => {
          console.log('🔄 Hydration completed');
          if (state) {
            // Only set loading to true if we have persisted state but need to verify it
            if (state.user && !state.isInitialized) {
              state.isLoading = true;
            }
          } else {
            // No persisted state, ensure we start fresh
            console.log('🔄 No persisted state, starting fresh');
          }
        },
      }
    )
  )
);
