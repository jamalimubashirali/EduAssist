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

  setGamificationState: (state: Partial<GamificationState>) => void;
  addXp: (amount: number) => void;
  levelUp: () => void;
  addBadge: (badge: Badge) => void;
  hideLevelUp: () => void;
  triggerXPAnimation: (amount: number) => void;
}

export const useGamificationStore = create<GamificationState>()(
  devtools(
    (set, get) => ({
      xp: 0,
      level: 1,
      badges: [],
      streak: { current: 0, longest: 0 },
      showLevelUpModal: false,
      showXPAnimation: false,
      xpAnimationAmount: 0,

      setGamificationState: (state) => set(state),

      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

      levelUp: () => set((state) => ({ level: state.level + 1, showLevelUpModal: true })),

      addBadge: (badge) => set((state) => ({ badges: [...state.badges, badge] })),

      hideLevelUp: () => set({ showLevelUpModal: false }),

      triggerXPAnimation: (amount) => {
        set({ showXPAnimation: true, xpAnimationAmount: amount });
        setTimeout(() => set({ showXPAnimation: false }), 2000); // Hide after 2s
      },
    }),
    { name: 'gamification-store' }
  )
);
