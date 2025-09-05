import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { 
  FrontendTopic as Topic,
  BackendTopic,
  convertBackendTopic,
  convertBackendTopicArray
} from '@/lib/topicConverters'
import { ServiceErrorHandler, EnhancedToast, RetryHandler } from '@/lib/errorHandling'

export type { Topic }

export interface CreateTopicData {
  name: string
  description: string
  subjectId: string
}

export interface UpdateTopicData {
  name?: string
  description?: string
  subjectId?: string
}

export interface TopicWithStats extends Topic {
  quizCount?: number
  questionCount?: number
  averageScore?: number
}

export interface TopicApiResponse {
  topics?: BackendTopic[]
  topic?: BackendTopic
  message?: string
  success?: boolean
}

class TopicService {
  // Get all topics with proper data conversion
  async getAllTopics(): Promise<Topic[]> {
    try {
      const response = await api.get('/topics/get-topics')
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleTopicError(error, 'fetch all')
      EnhancedToast.error(serviceError, () => this.getAllTopics())
      throw error
    }
  }

  // Get topic by ID with conversion
  async getTopicById(topicId: string): Promise<Topic> {
    try {
      const response = await api.get(`/topics/get-topic-by-id/${topicId}`)
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleTopicError(error, `fetch by ID (${topicId})`)
      EnhancedToast.error(serviceError, () => this.getTopicById(topicId))
      throw error
    }
  }

  // Get topics by subject with conversion
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    try {
      const response = await api.get(`/topics/get-topics-by-subject/${subjectId}`)
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleTopicError(error, `fetch by subject (${subjectId})`)
      EnhancedToast.error(serviceError, () => this.getTopicsBySubject(subjectId))
      throw error
    }
  }

  // Create new topic
  async createTopic(data: CreateTopicData): Promise<Topic> {
    try {
      const backendData = {
        topicName: data.name,
        topicDescription: data.description,
        subjectId: data.subjectId
      }
      const response = await api.post('/topics/create-topic', backendData)
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleTopicError(error, `create (${data.name})`)
      EnhancedToast.error(serviceError)
      throw error
    }
  }

  // Update topic
  async updateTopic(topicId: string, data: UpdateTopicData): Promise<Topic> {
    try {
      const backendData = {
        topicName: data.name,
        topicDescription: data.description,
        subjectId: data.subjectId
      }
      const response = await api.patch(`/topics/update-topic/${topicId}`, backendData)
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      console.error('Error updating topic:', error)
      return handleApiError(error)
    }
  }

  // Delete topic
  async deleteTopic(topicId: string): Promise<{ deleted: boolean; message?: string }> {
    try {
      const response = await api.delete(`/topics/remove-topic/${topicId}`)
      return handleApiResponse(response) as { deleted: boolean; message?: string }
    } catch (error: any) {
      console.error('Error deleting topic:', error)
      return handleApiError(error)
    }
  }

  // Search topics with conversion
  async searchTopics(query: string): Promise<Topic[]> {
    if (!query || query.trim().length === 0) return []
    
    try {
      const response = await api.get(`/topics/search?q=${encodeURIComponent(query.trim())}`)
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleTopicError(error, `search (${query})`)
      EnhancedToast.error(serviceError, () => this.searchTopics(query))
      throw error
    }
  }

  // Get topics with enhanced stats (future enhancement)
  async getTopicsWithStats(subjectId?: string): Promise<TopicWithStats[]> {
    try {
      const topics = subjectId 
        ? await this.getTopicsBySubject(subjectId)
        : await this.getAllTopics()
      
      // For now, return topics without stats
      // In the future, this could be enhanced to fetch quiz/question counts per topic
      return topics.map(topic => ({
        ...topic,
        quizCount: 0,
        questionCount: 0,
        averageScore: 0
      }))
    } catch (error: any) {
      console.error('Error fetching topics with stats:', error)
      return handleApiError(error)
    }
  }
}

export const topicService = new TopicService()
export default topicService