import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Badge } from '@/types';

interface GamificationState {
  xp: number;
  level: number;
  badges: Badge[];
  streak: {
    current: number;
    longest: number;
  };
  showLevelUpModal: boolean;
  showXPAnimation: boolean;
  xpAnimationAmount: number;
  isLoading: boolean;
  error: string | null;

  setGamificationState: (state: Partial<GamificationState>) => void;
  addXp: (amount: number) => void;
  levelUp: () => void;
  addBadge: (badge: Badge) => void;
  hideLevelUp: () => void;
  triggerXPAnimation: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const initialState = {
  xp: 0,
  level: 1,
  badges: [],
  streak: { current: 0, longest: 0 },
  showLevelUpModal: false,
  showXPAnimation: false,
  xpAnimationAmount: 0,
  isLoading: false,
  error: null,
}

export const useGamificationStore = create<GamificationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setGamificationState: (state) => set(state),

      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

      levelUp: () => set((state) => ({ level: state.level + 1, showLevelUpModal: true })),

      addBadge: (badge) => set((state) => ({ badges: [...state.badges, badge] })),

      hideLevelUp: () => set({ showLevelUpModal: false }),

      triggerXPAnimation: (amount) => {
        set({ showXPAnimation: true, xpAnimationAmount: amount });
        setTimeout(() => set({ showXPAnimation: false }), 2000); // Hide after 2s
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      resetState: () => set(initialState),
    }),
    { name: 'gamification-store' }
  )
);
