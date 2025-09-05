import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicService, CreateTopicData, UpdateTopicData, TopicWithStats } from '@/services/topicService'
import { Topic } from '@/types'
import { toast } from 'sonner'
import { useSmartLoading, useEnhancedQuery, useEnhancedMutation } from './useLoadingStates'

// Query keys
export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  list: (filters?: any) => [...topicKeys.lists(), filters] as const,
  details: () => [...topicKeys.all, 'detail'] as const,
  detail: (id: string) => [...topicKeys.details(), id] as const,
  subject: (subjectId: string) => [...topicKeys.all, 'subject', subjectId] as const,
  search: (query: string) => [...topicKeys.all, 'search', query] as const,
  stats: (subjectId?: string) => [...topicKeys.all, 'stats', subjectId] as const,
}

// Get all topics with enhanced loading states
export function useTopics() {
  const query = useQuery({
    queryKey: topicKeys.list(),
    queryFn: () => topicService.getAllTopics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const loadingState = useSmartLoading(query, {
    showSkeletonOnInitial: true,
    showSkeletonOnRefetch: false,
    minimumLoadingTime: 300
  })

  return {
    ...query,
    ...loadingState
  }
}

// Get topic by ID
export function useTopicById(id: string) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => topicService.getTopicById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get topics by subject with enhanced loading states
export function useTopicsBySubject(subjectId: string) {
  const query = useQuery({
    queryKey: topicKeys.subject(subjectId),
    queryFn: () => topicService.getTopicsBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5,
  })

  const loadingState = useSmartLoading(query, {
    showSkeletonOnInitial: true,
    showSkeletonOnRefetch: false,
    minimumLoadingTime: 200
  })

  return {
    ...query,
    ...loadingState
  }
}

// Search topics
export function useSearchTopics(query: string) {
  return useQuery({
    queryKey: topicKeys.search(query),
    queryFn: () => topicService.searchTopics(query),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 5,
  })
}

// Get topics with stats
export function useTopicsWithStats(subjectId?: string) {
  return useQuery({
    queryKey: topicKeys.stats(subjectId),
    queryFn: () => topicService.getTopicsWithStats(subjectId),
    staleTime: 1000 * 60 * 5,
  })
}

// Create topic mutation
export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: topicService.createTopic,
    onSuccess: (newTopic) => {
      // Add to cache
      queryClient.setQueryData(topicKeys.detail(newTopic.id), newTopic)
      
      // Invalidate lists to include new topic
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: topicKeys.subject(newTopic.subjectId) })
      
      toast.success('Topic created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create topic')
    },
  })
}

// Update topic mutation
export function useUpdateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopicData }) => 
      topicService.updateTopic(id, data),
    onSuccess: (updatedTopic) => {
      // Update cache
      queryClient.setQueryData(topicKeys.detail(updatedTopic.id), updatedTopic)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: topicKeys.subject(updatedTopic.subjectId) })
      
      toast.success('Topic updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update topic')
    },
  })
}

// Delete topic mutation
export function useDeleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: topicService.deleteTopic,
    onSuccess: (result, deletedId) => {
      if (result.deleted) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: topicKeys.detail(deletedId) })
        
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
        
        toast.success(result.message || 'Topic deleted successfully!')
      } else {
        toast.error(result.message || 'Failed to delete topic')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete topic')
    },
  })
}

// Custom hook for topic management
export function useTopicManager() {
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()

  const handleCreateTopic = (data: CreateTopicData) => {
    createTopic.mutate(data)
  }

  const handleUpdateTopic = (id: string, data: UpdateTopicData) => {
    updateTopic.mutate({ id, data })
  }

  const handleDeleteTopic = (id: string) => {
    deleteTopic.mutate(id)
  }

  return {
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    isCreating: createTopic.isPending,
    isUpdating: updateTopic.isPending,
    isDeleting: deleteTopic.isPending,
    createError: createTopic.error,
    updateError: updateTopic.error,
    deleteError: deleteTopic.error,
  }
}

// Custom hook for topic statistics
export function useTopicStats(subjectId?: string) {
  const { data: topics } = useTopicsWithStats(subjectId)

  const totalTopics = topics?.length || 0
  const topicsWithQuizzes = topics?.filter(t => (t.quizCount || 0) > 0).length || 0
  const averageQuizCount = totalTopics > 0 
    ? topics?.reduce((sum, t) => sum + (t.quizCount || 0), 0)! / totalTopics 
    : 0

  return {
    topics: topics || [],
    totalTopics,
    topicsWithQuizzes,
    averageQuizCount,
    isLoading: !topics,
  }
}