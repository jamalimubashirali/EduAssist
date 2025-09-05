// Topic data converters between backend and frontend formats

export interface BackendTopic {
  _id: string
  topicName: string
  topicDescription: string
  subjectId: string
  createdAt: string
  updatedAt: string
}

export interface FrontendTopic {
  id: string
  name: string
  description: string
  subjectId: string
  createdAt: string
  updatedAt: string
  
  // Optional stats (for enhanced views)
  quizCount?: number
  questionCount?: number
  averageScore?: number
}

// Convert backend topic to frontend format
export function convertBackendTopic(backendTopic: BackendTopic): FrontendTopic {
  return {
    id: backendTopic._id,
    name: backendTopic.topicName,
    description: backendTopic.topicDescription,
    subjectId: backendTopic.subjectId,
    createdAt: backendTopic.createdAt,
    updatedAt: backendTopic.updatedAt
  }
}

// Convert frontend topic to backend format  
export function convertFrontendTopic(frontendTopic: Partial<FrontendTopic>): Partial<BackendTopic> {
  return {
    _id: frontendTopic.id,
    topicName: frontendTopic.name || '',
    topicDescription: frontendTopic.description || '',
    subjectId: frontendTopic.subjectId || '',
    createdAt: frontendTopic.createdAt,
    updatedAt: frontendTopic.updatedAt
  }
}

// Safely convert arrays
export function convertBackendTopicArray(backendTopics: BackendTopic[]): FrontendTopic[] {
  return backendTopics.map(convertBackendTopic)
}

export function convertFrontendTopicArray(frontendTopics: FrontendTopic[]): BackendTopic[] {
  return frontendTopics.map(topic => convertFrontendTopic(topic) as BackendTopic)
}