import { useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceService } from '@/services/performanceService'
import { recommendationService } from '@/services/recommendationService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'
import { performanceKeys } from './usePerformanceData'
import { recommendationKeys } from './useRecommendationData'

// Hook for synchronized performance tracking and recommendation updates
export function usePerformanceRecommendationSync() {
    const queryClient = useQueryClient()
    const { user } = useUserStore()

    // Update performance and trigger recommendation recalculation
    const updatePerformanceWithRecommendations = useMutation({
        mutationFn: async (data: {
            userId: string
            topicId: string
            subjectId: string
            attemptData: {
                score: number
                timeSpent: number
                difficulty: 'beginner' | 'intermediate' | 'advanced'
                attemptId?: string
            }
        }) => {
            // Update performance first
            const performanceUpdate = await performanceService.recordPerformance({
                userId: data.userId,
                subjectId: data.subjectId,
                topicId: data.topicId,
                score: data.attemptData.score,
                timeSpent: data.attemptData.timeSpent,
                difficulty: data.attemptData.difficulty,
                date: new Date().toISOString(),
            })

            // Generate new recommendations based on the attempt if attemptId is provided
            let newRecommendations = null
            if (data.attemptData.attemptId) {
                try {
                    newRecommendations = await recommendationService.autoGenerateForAttempt(data.attemptData.attemptId)
                } catch (error) {
                    console.warn('Failed to generate recommendations:', error)
                    // Don't fail the entire operation if recommendation generation fails
                }
            }

            return {
                performanceUpdate,
                newRecommendations
            }
        },
        onSuccess: (result, variables) => {
            const userId = variables.userId

            // Invalidate all performance-related queries
            queryClient.invalidateQueries({ queryKey: performanceKeys.user(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.userAnalytics(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.userProgress(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.gamificationStats(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.subjectMastery(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.learningTrends(userId) })
            queryClient.invalidateQueries({ queryKey: performanceKeys.trends(userId, 'week') })
            queryClient.invalidateQueries({ queryKey: performanceKeys.trends(userId, 'month') })

            // Invalidate all recommendation-related queries
            queryClient.invalidateQueries({ queryKey: recommendationKeys.user(userId) })
            queryClient.invalidateQueries({ queryKey: recommendationKeys.smartRecommendations(userId) })
            queryClient.invalidateQueries({ queryKey: recommendationKeys.analytics(userId) })
            queryClient.invalidateQueries({ queryKey: recommendationKeys.stats(userId) })
            queryClient.invalidateQueries({ queryKey: recommendationKeys.byStatus('pending') })

            // Show success message with recommendation count if applicable
            if (result.newRecommendations && result.newRecommendations.length > 0) {
                toast.success(`Performance updated! Generated ${result.newRecommendations.length} new recommendations.`)
            } else {
                toast.success('Performance updated successfully!')
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update performance and recommendations')
        },
    })

    // Batch update multiple performance records with recommendation sync
    const batchUpdatePerformanceWithRecommendations = useMutation({
        mutationFn: async (updates: Array<{
            userId: string
            topicId: string
            subjectId: string
            attemptData: {
                score: number
                timeSpent: number
                difficulty: 'beginner' | 'intermediate' | 'advanced'
                attemptId?: string
            }
        }>) => {
            const results = []

            for (const update of updates) {
                try {
                    const performanceUpdate = await performanceService.recordPerformance({
                        userId: update.userId,
                        subjectId: update.subjectId,
                        topicId: update.topicId,
                        score: update.attemptData.score,
                        timeSpent: update.attemptData.timeSpent,
                        difficulty: update.attemptData.difficulty,
                        date: new Date().toISOString(),
                    })

                    let newRecommendations = null
                    if (update.attemptData.attemptId) {
                        try {
                            newRecommendations = await recommendationService.autoGenerateForAttempt(update.attemptData.attemptId)
                        } catch (error) {
                            console.warn('Failed to generate recommendations for attempt:', update.attemptData.attemptId, error)
                        }
                    }

                    results.push({
                        update,
                        performanceUpdate,
                        newRecommendations
                    })
                } catch (error) {
                    console.error('Failed to update performance for:', update, error)
                    results.push({
                        update,
                        error
                    })
                }
            }

            return results
        },
        onSuccess: (results, variables) => {
            const userIds = [...new Set(variables.map(v => v.userId))]

            // Invalidate queries for all affected users
            userIds.forEach(userId => {
                queryClient.invalidateQueries({ queryKey: performanceKeys.user(userId) })
                queryClient.invalidateQueries({ queryKey: performanceKeys.userAnalytics(userId) })
                queryClient.invalidateQueries({ queryKey: performanceKeys.userProgress(userId) })
                queryClient.invalidateQueries({ queryKey: performanceKeys.gamificationStats(userId) })
                queryClient.invalidateQueries({ queryKey: performanceKeys.subjectMastery(userId) })
                queryClient.invalidateQueries({ queryKey: performanceKeys.learningTrends(userId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.user(userId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.smartRecommendations(userId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.analytics(userId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.stats(userId) })
            })

            const successCount = results.filter(r => !r.error).length
            const totalRecommendations = results.reduce((sum, r) =>
                sum + (r.newRecommendations?.length || 0), 0)

            toast.success(`Updated ${successCount} performance records. Generated ${totalRecommendations} new recommendations.`)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to batch update performance and recommendations')
        },
    })

    // Force recommendation recalculation based on current performance
    const recalculateRecommendations = useMutation({
        mutationFn: async (userId?: string) => {
            const targetUserId = userId || user?.id
            if (!targetUserId) throw new Error('User ID required')

            return await recommendationService.generateRecommendations(targetUserId)
        },
        onSuccess: (newRecommendations, userId) => {
            const targetUserId = userId || user?.id
            if (targetUserId) {
                queryClient.invalidateQueries({ queryKey: recommendationKeys.user(targetUserId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.smartRecommendations(targetUserId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.analytics(targetUserId) })
                queryClient.invalidateQueries({ queryKey: recommendationKeys.stats(targetUserId) })
            }

            toast.success(`Generated ${newRecommendations.length} new recommendations based on your current performance!`)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to recalculate recommendations')
        },
    })

    return {
        updatePerformanceWithRecommendations,
        batchUpdatePerformanceWithRecommendations,
        recalculateRecommendations,
        isUpdating: updatePerformanceWithRecommendations.isPending ||
            batchUpdatePerformanceWithRecommendations.isPending ||
            recalculateRecommendations.isPending,
    }
}

// Hook for tracking quiz completion with automatic performance and recommendation updates
export function useQuizCompletionTracker() {
    const { updatePerformanceWithRecommendations } = usePerformanceRecommendationSync()
    const { user } = useUserStore()

    const trackQuizCompletion = (
        subjectId: string,
        topicId: string,
        score: number,
        timeSpent: number,
        difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
        attemptId?: string
    ) => {
        if (!user?.id) {
            toast.error('User authentication required')
            return
        }

        updatePerformanceWithRecommendations.mutate({
            userId: user.id,
            topicId,
            subjectId,
            attemptData: {
                score,
                timeSpent,
                difficulty: difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
                attemptId,
            }
        })
    }

    return {
        trackQuizCompletion,
        isTracking: updatePerformanceWithRecommendations.isPending,
    }
}

// Hook for real-time performance monitoring with recommendation updates
export function useRealTimePerformanceMonitoring() {
    const queryClient = useQueryClient()
    const { user } = useUserStore()

    // Monitor performance changes and trigger recommendation updates
    const monitorPerformanceChanges = (userId?: string) => {
        const targetUserId = userId || user?.id
        if (!targetUserId) return

        // Set up automatic query invalidation for real-time updates
        const interval = setInterval(() => {
            // Invalidate performance queries to check for updates
            queryClient.invalidateQueries({
                queryKey: performanceKeys.userAnalytics(targetUserId),
                exact: false
            })

            // Invalidate recommendation queries to get updated recommendations
            queryClient.invalidateQueries({
                queryKey: recommendationKeys.smartRecommendations(targetUserId),
                exact: false
            })
        }, 30000) // Check every 30 seconds

        return () => clearInterval(interval)
    }

    return {
        monitorPerformanceChanges,
    }
}