import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '@/services/gamificationService';
import { Badge, Quest, Streak, Achievement, LeaderboardEntry } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { toast } from 'sonner';
import { CACHE_TIMES, createQueryKey } from '@/lib/queryClient';
import { useCacheInvalidation } from '@/hooks/useCacheManager'
import { useOptimisticXPUpdate, useOptimisticStreakUpdate } from '@/hooks/useOptimisticUpdates';

// Query keys for gamification
export const gamificationKeys = {
  all: ['gamification'] as const,
  userStats: (userId: string) => [...gamificationKeys.all, 'stats', userId] as const,
  userQuests: (userId: string) => [...gamificationKeys.all, 'quests', userId] as const,
  userBadges: (userId: string) => [...gamificationKeys.all, 'badges', userId] as const,
  userAchievements: (userId: string) => [...gamificationKeys.all, 'achievements', userId] as const,
  userStreak: (userId: string) => [...gamificationKeys.all, 'streak', userId] as const,
  globalLeaderboard: (limit: number) => [...gamificationKeys.all, 'leaderboard', 'global', limit] as const,
};

// User Statistics Hook - optimized caching
export function useUserStats(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: gamificationKeys.userStats(targetUserId || ''),
    queryFn: () => gamificationService.getUserStats(targetUserId!),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.USER_STATS,
    gcTime: 1000 * 60 * 10, // Keep user stats in cache longer
    refetchOnWindowFocus: false, // Disable aggressive refetching
    retry: 1, // Reduce retries
    retryDelay: 2000, // Wait 2 seconds between retries
  });
}

// User Quests Hook - frequent updates for dynamic content
export function useUserQuests(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: gamificationKeys.userQuests(targetUserId || ''),
    queryFn: () => gamificationService.getUserQuests(targetUserId!),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.GAMIFICATION,
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchInterval: false, // Disable background refresh
    retry: 1,
    retryDelay: 2000,
  });
}

// User Badges Hook - longer cache for stable content
export function useUserBadges(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: gamificationKeys.userBadges(targetUserId || ''),
    queryFn: () => gamificationService.getUserBadges(targetUserId!),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.USER_PREFERENCES, // Badges don't change often
    gcTime: 1000 * 60 * 20, // Keep badges in cache longer
    retry: 2,
  });
}

// User Achievements Hook
export function useUserAchievements(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: gamificationKeys.userAchievements(targetUserId || ''),
    queryFn: () => gamificationService.getUserAchievements(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

// User Streak Hook
export function useUserStreak(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: gamificationKeys.userStreak(targetUserId || ''),
    queryFn: async () => {
      const stats = await gamificationService.getUserStats(targetUserId!);
      const streakData = {
        current: stats.currentStreak || 0,
        longest: stats.longestStreak || 0,
        lastActivityDate: new Date().toISOString(),
        isActive: (stats.currentStreak || 0) > 0,
      } as Streak;
      
      return streakData;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
}

// Global Leaderboard Hook - optimized for competitive data
export function useGamificationLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: gamificationKeys.globalLeaderboard(limit),
    queryFn: () => gamificationService.getGlobalLeaderboard(limit),
    staleTime: CACHE_TIMES.LEADERBOARD,
    refetchOnWindowFocus: true, // Refresh leaderboard when user returns
    refetchInterval: 1000 * 60 * 3, // Background refresh every 3 minutes
    retry: 2,
  });
}

// Complete Quest Mutation
export function useCompleteQuest() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { addXp, addBadge } = useGamificationStore();

  return useMutation({
    mutationFn: ({ questId }: { questId: string }) => gamificationService.completeQuest(user!.id, questId),
    onSuccess: (result, { questId }) => {
      addXp(result.xpEarned);

      queryClient.invalidateQueries({ queryKey: gamificationKeys.userQuests(user!.id) });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.userStats(user!.id) });

      toast.success(`Quest completed! +${result.xpEarned} XP`, {
        icon: '🎯',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete quest');
    },
  });
}

// Update Streak Mutation
export function useUpdateStreak() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const setGamificationState = useGamificationStore(state => state.setGamificationState);

  return useMutation({
    mutationFn: () => gamificationService.updateStreak(user!.id),
    onSuccess: (streak) => {
      setGamificationState({ streak: { current: streak.current, longest: streak.longest } });

      if (streak.current > 0 && streak.current % 7 === 0) {
        toast.success(`🔥 Amazing! ${streak.current}-day streak!`, {
          duration: 4000,
        });
      }

      queryClient.invalidateQueries({ queryKey: gamificationKeys.userStreak(user!.id) });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.userStats(user!.id) });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.userBadges(user!.id) });
    },
    onError: (error: any) => {
      console.error('Failed to update streak:', error);
    },
  });
}

// Update XP Mutation with optimistic updates
export function useUpdateXP() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { addXp, levelUp } = useGamificationStore();
  const optimisticXPUpdate = useOptimisticXPUpdate();
  const { invalidateOnQuizCompletion } = useCacheInvalidation();

  return useMutation({
    mutationFn: ({ amount, source }: { amount: number; source: string }) => {
      if (!user?.id) throw new Error('User not found');
      
      return optimisticXPUpdate(
        user.id,
        amount,
        () => gamificationService.updateUserXP(user.id, amount, source)
      );
    },
    onSuccess: async (result, variables) => {
      addXp(variables.amount);

      if (result.leveledUp) {
        levelUp();
        toast.success(`🎉 Level Up! You're now level ${result.level}!`, {
          duration: 5000,
        });
      }

      // Intelligent cache invalidation
      if (user?.id) {
        await invalidateOnQuizCompletion(user.id);
      }
    },
    onError: (error: any) => {
      // Error handling is done in optimistic update manager
      console.error('XP update failed:', error);
    },
  });
}

// Combined hook for gamification dashboard
export function useGamificationDashboard(userId?: string) {
  const { user } = useUserStore();
  const targetUserId = userId || user?.id;

  const { data: stats, isLoading: statsLoading } = useUserStats(targetUserId);
  const { data: quests, isLoading: questsLoading } = useUserQuests(targetUserId);
  const { data: badges, isLoading: badgesLoading } = useUserBadges(targetUserId);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(targetUserId);
  const { data: streak, isLoading: streakLoading } = useUserStreak(targetUserId);

  const dailyQuests = quests?.filter((q) => q.type === 'daily') || [];
  const weeklyQuests = quests?.filter((q) => q.type === 'weekly') || [];
  const specialQuests = quests?.filter((q) => q.type === 'special') || [];

  const activeQuests = quests?.filter((q) => !q.isCompleted) || [];
  const completedQuests = quests?.filter((q) => q.isCompleted) || [];
  const claimableQuests = quests?.filter((q) => q.isCompleted && !q.isClaimed) || [];

  const unlockedBadges = badges?.filter((b) => b.unlockedAt) || [];
  const lockedBadges = badges?.filter((b) => !b.unlockedAt) || [];

  return {
    stats,
    quests: quests || [],
    badges: badges || [],
    achievements: achievements || [],
    streak,

    dailyQuests,
    weeklyQuests,
    specialQuests,
    activeQuests,
    completedQuests,
    claimableQuests,
    unlockedBadges,
    lockedBadges,

    isLoading: statsLoading || questsLoading || badgesLoading || achievementsLoading || streakLoading,
    isStatsLoading: statsLoading,
    isQuestsLoading: questsLoading,
    isBadgesLoading: badgesLoading,

    summary: {
      totalXP: stats?.totalXP || 0,
      level: stats?.level || 1,
      currentStreak: stats?.currentStreak || 0,
      totalBadges: stats?.totalBadges || 0,
      totalQuests: quests?.length || 0,
      completedQuestsCount: completedQuests.length,
      claimableQuestsCount: claimableQuests.length,
      unlockedBadgesCount: unlockedBadges.length,
      rank: stats?.rank || 0,
      percentile: stats?.percentile || 0,
    },
  };
}

// Hook for quest management
export function useQuestManager() {
  const completeQuest = useCompleteQuest();

  const handleQuestProgress = (questId: string, progress: number) => {
    // This would ideally be handled by a separate mutation to update quest progress
  };

  const handleQuestComplete = (questId: string) => {
    completeQuest.mutate({ questId });
  };

  return {
    handleQuestProgress,
    handleQuestComplete,
    isCompleting: completeQuest.isPending,
    error: completeQuest.error,
  };
}

// Hook for XP and level management
export function useXPManager() {
  const updateXP = useUpdateXP();
  const updateStreak = useUpdateStreak();

  const awardXP = (amount: number, source: string) => {
    updateXP.mutate({ amount, source });
  };

  const maintainStreak = () => {
    updateStreak.mutate();
  };

  return {
    awardXP,
    maintainStreak,
    isUpdating: updateXP.isPending || updateStreak.isPending,
    error: updateXP.error || updateStreak.error,
  };
}
