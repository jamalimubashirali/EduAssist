import { useUserStore } from '@/stores/useUserStore';
import { getXPForLevel, getLevelProgress } from '@/lib/utils';
import { useUpdateUserXP } from './useUserData';

export function useXP() {
  const { user, addXP: addXPToStore } = useUserStore();
  const { mutate: updateUserXP } = useUpdateUserXP();

  const addXP = (amount: number) => {
    if (user) {
      updateUserXP({ userId: user.id, xpGained: amount });
      addXPToStore(amount);
    }
  };

  const simulateXPGain = (amount: number) => {
    if (user) {
      addXPToStore(amount);
    }
  };

  const getXPData = () => {
    if (!user) {
      return {
        currentXP: 0,
        level: 1,
        xpForCurrentLevel: 0,
        xpForNextLevel: getXPForLevel(2),
        levelProgress: 0,
        xpToNextLevel: getXPForLevel(2),
      };
    }

    const { xp_points: currentXP, level } = user;
    const xpForCurrentLevel = getXPForLevel(level!);
    const xpForNextLevel = getXPForLevel(level! + 1);
    const levelProgress = getLevelProgress(currentXP!);

    return {
      currentXP,
      level,
      xpForCurrentLevel,
      xpForNextLevel,
      levelProgress,
      xpToNextLevel: xpForNextLevel - currentXP!,
    };
  };

  return {
    xpData: getXPData(),
    addXP,
    simulateXPGain,
  };
}