import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { 
  FrontendSubject as Subject, 
  FrontendTopic as Topic,
  BackendSubject,
  BackendTopic,
  convertBackendSubject,
  convertBackendTopic,
  convertBackendSubjectArray,
  convertBackendTopicArray,
  convertFrontendSubject,
  convertFrontendTopic
} from '@/lib/subjectConverters'

export type { Subject, Topic }

export interface CreateSubjectData {
  name: string
  description?: string
  icon?: string
  color?: string
}

export interface CreateTopicData {
  name: string
  description?: string
  subjectId: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: string[]
}

export interface SubjectWithStats extends Subject {
  topicCount: number
  quizCount: number
  questionsCount?: number
}

export interface SubjectApiResponse {
  subjects?: BackendSubject[]
  subject?: BackendSubject
  topics?: BackendTopic[]
  topic?: BackendTopic
  message?: string
  success?: boolean
}

class SubjectService {
  // Get all subjects with proper data conversion
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const response = await api.get('/subjects/get-subjects')
      const backendSubjects = handleApiResponse(response) as BackendSubject[]
      return convertBackendSubjectArray(backendSubjects)
    } catch (error: any) {
      console.error('Error fetching subjects:', error)
      return handleApiError(error)
    }
  }

  // Get subject by ID with stats
  async getSubjectById(id: string): Promise<SubjectWithStats> {
    try {
      const [subjectResponse, statsResponse] = await Promise.all([
        api.get(`/subjects/get-subject-by-id/${id}`),
        api.get(`/subjects/get-subject-stats/${id}`)
      ])
      
      const backendSubject = handleApiResponse(subjectResponse) as BackendSubject
      const stats = handleApiResponse(statsResponse) as any
      
      const subject = convertBackendSubject(backendSubject)
      
      return {
        ...subject,
        topicCount: stats?.subjectStats?.topicsCount || 0,
        quizCount: stats?.subjectStats?.quizzesCount || 0,
        questionsCount: stats?.subjectStats?.questionsCount || 0
      }
    } catch (error: any) {
      console.error('Error fetching subject:', error)
      return handleApiError(error)
    }
  }

  // Create new subject
  async createSubject(data: CreateSubjectData): Promise<Subject> {
    try {
      const backendData = {
        subjectName: data.name,
        subjectDescription: data.description || ''
      }
      const response = await api.post('/subjects/create-subject', backendData)
      const backendSubject = handleApiResponse(response) as BackendSubject
      return convertBackendSubject(backendSubject)
    } catch (error: any) {
      console.error('Error creating subject:', error)
      return handleApiError(error)
    }
  }

  // Update subject
  async updateSubject(id: string, data: Partial<CreateSubjectData>): Promise<Subject> {
    try {
      const backendData = {
        subjectName: data.name,
        subjectDescription: data.description
      }
      const response = await api.patch(`/subjects/update-subject/${id}`, backendData)
      const backendSubject = handleApiResponse(response) as BackendSubject
      return convertBackendSubject(backendSubject)
    } catch (error: any) {
      console.error('Error updating subject:', error)
      return handleApiError(error)
    }
  }

  // Delete subject
  async deleteSubject(id: string): Promise<void> {
    try {
      await api.delete(`/subjects/remove-subject/${id}`)
    } catch (error: any) {
      console.error('Error deleting subject:', error)
      return handleApiError(error)
    }
  }

  // Get all topics with conversion
  async getAllTopics(): Promise<Topic[]> {
    try {
      const response = await api.get('/topics/get-topics')
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      console.error('Error fetching topics:', error)
      return handleApiError(error)
    }
  }

  // Get topics by subject with conversion
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    try {
      const response = await api.get(`/topics/get-topics-by-subject/${subjectId}`)
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      console.error('Error fetching topics by subject:', error)
      return handleApiError(error)
    }
  }

  // Get topic by ID with conversion
  async getTopicById(id: string): Promise<Topic> {
    try {
      const response = await api.get(`/topics/get-topic-by-id/${id}`)
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      console.error('Error fetching topic:', error)
      return handleApiError(error)
    }
  }

  // Create new topic
  async createTopic(data: CreateTopicData): Promise<Topic> {
    try {
      const backendData = convertFrontendTopic(data)
      const response = await api.post('/topics/create-topic', {
        topicName: data.name,
        topicDescription: data.description,
        subjectId: data.subjectId,
        difficulty: data.difficulty?.toUpperCase() || 'EASY',
        prerequisites: data.prerequisites
      })
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      console.error('Error creating topic:', error)
      return handleApiError(error)
    }
  }

  // Update topic
  async updateTopic(id: string, data: Partial<CreateTopicData>): Promise<Topic> {
    try {
      const backendData = {
        topicName: data.name,
        topicDescription: data.description,
        difficulty: data.difficulty?.toUpperCase(),
        prerequisites: data.prerequisites
      }
      const response = await api.patch(`/topics/update-topic/${id}`, backendData)
      const backendTopic = handleApiResponse(response) as BackendTopic
      return convertBackendTopic(backendTopic)
    } catch (error: any) {
      console.error('Error updating topic:', error)
      return handleApiError(error)
    }
  }

  // Delete topic
  async deleteTopic(id: string): Promise<void> {
    try {
      await api.delete(`/topics/remove-topic/${id}`)
    } catch (error: any) {
      console.error('Error deleting topic:', error)
      return handleApiError(error)
    }
  }

  // Search subjects
  async searchSubjects(query: string): Promise<Subject[]> {
    if (!query) return []
    try {
      const response = await api.get(`/subjects/search?q=${encodeURIComponent(query)}`)
      const backendSubjects = handleApiResponse(response) as BackendSubject[]
      return convertBackendSubjectArray(backendSubjects)
    } catch (error: any) {
      console.error('Error searching subjects:', error)
      return handleApiError(error)
    }
  }

  // Search topics with conversion
  async searchTopics(query: string, subjectId?: string): Promise<Topic[]> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      if (subjectId) params.append('subjectId', subjectId)

      const response = await api.get(`/topics/search?${params.toString()}`)
      const backendTopics = handleApiResponse(response) as BackendTopic[]
      return convertBackendTopicArray(backendTopics)
    } catch (error: any) {
      console.error('Error searching topics:', error)
      return handleApiError(error)
    }
  }

  // Get popular subjects with conversion
  async getPopularSubjects(limit: number = 10): Promise<Subject[]> {
    try {
      const response = await api.get(`/subjects/popular?limit=${limit}`)
      const backendSubjects = handleApiResponse(response) as BackendSubject[]
      return convertBackendSubjectArray(backendSubjects)
    } catch (error: any) {
      console.error('Error fetching popular subjects:', error)
      return handleApiError(error)
    }
  }

  // Get subjects with enhanced stats
  async getSubjectsWithStats(): Promise<SubjectWithStats[]> {
    try {
      const subjects = await this.getAllSubjects()
      
      // Enhance with stats for each subject
      const subjectsWithStats = await Promise.all(
        subjects.map(async (subject) => {
          try {
            const statsResponse = await api.get(`/subjects/get-subject-stats/${subject.id}`)
            const stats = handleApiResponse(statsResponse) as any
            
            return {
              ...subject,
              topicCount: stats?.subjectStats?.topicsCount || 0,
              quizCount: stats?.subjectStats?.quizzesCount || 0,
              questionsCount: stats?.subjectStats?.questionsCount || 0
            }
          } catch (error) {
            console.warn(`Failed to get stats for subject ${subject.id}:`, error)
            return {
              ...subject,
              topicCount: 0,
              quizCount: 0,
              questionsCount: 0
            }
          }
        })
      )
      
      return subjectsWithStats
    } catch (error: any) {
      console.error('Error fetching subjects with stats:', error)
      return handleApiError(error)
    }
  }
}

export const subjectService = new SubjectService()
export default subjectService
