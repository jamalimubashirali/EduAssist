'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { useInfiniteLoading } from '@/hooks/useIntelligentLoading'
import { Loader2 } from 'lucide-react'

interface InfiniteLoaderProps<T> {
  fetchMore: (offset: number, limit: number) => Promise<T[]>
  renderItem: (item: T, index: number) => ReactNode
  renderEmpty?: () => ReactNode
  renderError?: (error: Error) => ReactNode
  renderLoading?: () => ReactNode
  initialLimit?: number
  prefetchThreshold?: number
  className?: string
  itemClassName?: string
  loadingClassName?: string
  emptyClassName?: string
  errorClassName?: string
}

export function InfiniteLoader<T>({
  fetchMore,
  renderItem,
  renderEmpty,
  renderError,
  renderLoading,
  initialLimit = 20,
  prefetchThreshold = 5,
  className = '',
  itemClassName = '',
  loadingClassName = '',
  emptyClassName = '',
  errorClassName = '',
}: InfiniteLoaderProps<T>) {
  const {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    shouldLoadMore,
    reset,
  } = useInfiniteLoading(fetchMore, initialLimit, prefetchThreshold)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Set up intersection observer for automatic loading
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before the element is visible
      }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, loadMore])

  // Handle scroll-based loading as fallback
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Load more when user is near bottom of page
      if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !isLoading) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, loadMore])

  // Error state
  if (error && data.length === 0) {
    return (
      <div className={`text-center py-8 ${errorClassName}`}>
        {renderError ? (
          renderError(error)
        ) : (
          <div>
            <p className="text-red-500 mb-4">Failed to load data</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    )
  }

  // Empty state
  if (!isLoading && data.length === 0) {
    return (
      <div className={`text-center py-8 ${emptyClassName}`}>
        {renderEmpty ? renderEmpty() : <p className="text-gray-500">No items found</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Render items */}
      {data.map((item, index) => (
        <div key={index} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className={`text-center py-4 ${loadingClassName}`}>
          {renderLoading ? (
            renderLoading()
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Error indicator for failed additional loads */}
      {error && data.length > 0 && (
        <div className={`text-center py-4 ${errorClassName}`}>
          <p className="text-red-500 mb-2">Failed to load more items</p>
          <button
            onClick={loadMore}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef} className="h-4" />
      )}

      {/* End of list indicator */}
      {!hasMore && data.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No more items to load
        </div>
      )}
    </div>
  )
}

// Specialized infinite loader for quizzes
export function InfiniteQuizLoader({
  fetchQuizzes,
  onQuizClick,
  className = '',
}: {
  fetchQuizzes: (offset: number, limit: number) => Promise<any[]>
  onQuizClick?: (quiz: any) => void
  className?: string
}) {
  return (
    <InfiniteLoader
      fetchMore={fetchQuizzes}
      className={className}
      itemClassName="mb-4"
      renderItem={(quiz, index) => (
        <div
          key={quiz.id || index}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onQuizClick?.(quiz)}
        >
          <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
          <p className="text-gray-600 mb-2">{quiz.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{quiz.questionCount} questions</span>
            <span>Difficulty: {quiz.difficulty}</span>
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="text-center py-8">
          <p className="text-gray-500">No quizzes available</p>
        </div>
      )}
      renderError={(error) => (
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load quizzes</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      )}
    />
  )
}

// Specialized infinite loader for subjects
export function InfiniteSubjectLoader({
  fetchSubjects,
  onSubjectClick,
  className = '',
}: {
  fetchSubjects: (offset: number, limit: number) => Promise<any[]>
  onSubjectClick?: (subject: any) => void
  className?: string
}) {
  return (
    <InfiniteLoader
      fetchMore={fetchSubjects}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      itemClassName=""
      renderItem={(subject, index) => (
        <div
          key={subject.id || index}
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white"
          onClick={() => onSubjectClick?.(subject)}
        >
          <div className="flex items-center mb-4">
            {subject.icon && (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-2xl">{subject.icon}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{subject.name}</h3>
              <p className="text-sm text-gray-500">{subject.topicCount} topics</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">{subject.description}</p>
        </div>
      )}
      renderEmpty={() => (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">No subjects available</p>
        </div>
      )}
    />
  )
}