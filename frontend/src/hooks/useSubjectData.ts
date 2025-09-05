import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectService, CreateSubjectData, CreateTopicData } from '@/services/subjectService'
import { toast } from 'sonner'

// Query keys for better cache management
export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  detail: (id: string) => [...subjectKeys.all, 'detail', id] as const,
  withStats: () => [...subjectKeys.all, 'with-stats'] as const,
  search: (query: string) => [...subjectKeys.all, 'search', query] as const,
  popular: (limit: number) => [...subjectKeys.all, 'popular', limit] as const,
}

export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  detail: (id: string) => [...topicKeys.all, 'detail', id] as const,
  bySubject: (subjectId: string) => [...topicKeys.all, 'subject', subjectId] as const,
  search: (query: string, subjectId?: string) => [...topicKeys.all, 'search', query, subjectId] as const,
}

// Enhanced Subject hooks with better error handling
export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: () => subjectService.getAllSubjects(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useSubjectsWithStats() {
  return useQuery({
    queryKey: subjectKeys.withStats(),
    queryFn: () => subjectService.getSubjectsWithStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes (stats change more frequently)
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectService.getSubjectById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function usePopularSubjects(limit: number = 10) {
  return useQuery({
    queryKey: subjectKeys.popular(limit),
    queryFn: () => subjectService.getPopularSubjects(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 1, // Reduce retries
    retryDelay: 2000, // Simple delay
    refetchOnWindowFocus: false, // Disable aggressive refetching
  })
}

export function useSearchSubjects(query: string) {
  return useQuery({
    queryKey: subjectKeys.search(query),
    queryFn: () => subjectService.searchSubjects(query),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  })
}

// Topic hooks
export function useTopics() {
  return useQuery({
    queryKey: topicKeys.lists(),
    queryFn: () => subjectService.getAllTopics(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => subjectService.getTopicById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}

export function useTopicsBySubject(subjectId: string) {
  return useQuery({
    queryKey: topicKeys.bySubject(subjectId),
    queryFn: () => subjectService.getTopicsBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSearchTopics(query: string, subjectId?: string) {
  return useQuery({
    queryKey: topicKeys.search(query, subjectId),
    queryFn: () => subjectService.searchTopics(query, subjectId),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 5,
  })
}

// Subject mutations
export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSubjectData) => subjectService.createSubject(data),
    onSuccess: (newSubject) => {
      queryClient.setQueryData(subjectKeys.detail(newSubject.id), newSubject)
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Subject created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create subject')
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubjectData> }) =>
      subjectService.updateSubject(id, data),
    onSuccess: (updatedSubject) => {
      queryClient.setQueryData(subjectKeys.detail(updatedSubject.id), updatedSubject)
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Subject updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update subject')
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => subjectService.deleteSubject(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: subjectKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Subject deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete subject')
    },
  })
}

// Topic mutations
export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTopicData) => subjectService.createTopic(data),
    onSuccess: (newTopic) => {
      queryClient.setQueryData(topicKeys.detail(newTopic.id), newTopic)
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(newTopic.subjectId) })
      toast.success('Topic created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create topic')
    },
  })
}

export function useUpdateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTopicData> }) =>
      subjectService.updateTopic(id, data),
    onSuccess: (updatedTopic) => {
      queryClient.setQueryData(topicKeys.detail(updatedTopic.id), updatedTopic)
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(updatedTopic.subjectId) })
      toast.success('Topic updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update topic')
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => subjectService.deleteTopic(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: topicKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: topicKeys.all })
      toast.success('Topic deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete topic')
    },
  })
}

// Combined hooks for better UX with enhanced data
export function useSubjectWithTopics(subjectId: string) {
  const { data: subject, isLoading: subjectLoading, error: subjectError } = useSubject(subjectId)
  const { data: topics, isLoading: topicsLoading, error: topicsError } = useTopicsBySubject(subjectId)

  return {
    subject,
    topics: topics || [],
    isLoading: subjectLoading || topicsLoading,
    error: subjectError || topicsError,
  }
}

export function useSubjectsOverview() {
  const { data: subjects, isLoading: subjectsLoading } = useSubjectsWithStats()
  const { data: popularSubjects, isLoading: popularLoading } = usePopularSubjects(5)

  return {
    subjects: subjects || [],
    popularSubjects: popularSubjects || [],
    isLoading: subjectsLoading || popularLoading,
    totalSubjects: subjects?.length || 0,
    totalTopics: subjects?.reduce((sum, s) => sum + (s.topicCount || 0), 0) || 0,
    totalQuizzes: subjects?.reduce((sum, s) => sum + (s.quizCount || 0), 0) || 0,
  }
}
