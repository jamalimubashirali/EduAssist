// Subject data converters between backend and frontend formats

export interface BackendSubject {
  _id: string
  subjectName: string
  subjectDescription: string
  createdAt: string
  updatedAt: string
}

export interface FrontendSubject {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  topicCount?: number
  quizCount?: number
  createdAt: string
  updatedAt: string
}

export interface BackendTopic {
  _id: string
  topicName: string
  topicDescription?: string
  subjectId: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  prerequisites?: string[]
  createdAt: string
  updatedAt: string
}

export interface FrontendTopic {
  averageScore: any
  questionCount: number
  quizCount: number
  id: string
  name: string
  description?: string
  subjectId: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: string[]
  createdAt: string
  updatedAt: string
}

// Default colors and icons for subjects
const SUBJECT_DEFAULTS: Record<string, { icon: string; color: string }> = {
  'mathematics': { icon: '🔢', color: '#3B82F6' },
  'math': { icon: '🔢', color: '#3B82F6' },
  'science': { icon: '🔬', color: '#10B981' },
  'physics': { icon: '⚛️', color: '#8B5CF6' },
  'chemistry': { icon: '🧪', color: '#F59E0B' },
  'biology': { icon: '🧬', color: '#059669' },
  'english': { icon: '📝', color: '#EF4444' },
  'literature': { icon: '📚', color: '#DC2626' },
  'history': { icon: '🏛️', color: '#D97706' },
  'geography': { icon: '🌍', color: '#0891B2' },
  'computer science': { icon: '💻', color: '#6366F1' },
  'programming': { icon: '💻', color: '#6366F1' },
  'art': { icon: '🎨', color: '#EC4899' },
  'music': { icon: '🎵', color: '#8B5CF6' },
  'default': { icon: '📖', color: '#6B7280' }
}

// Convert backend subject to frontend format
export function convertBackendSubject(backendSubject: BackendSubject): FrontendSubject {
  const subjectKey = backendSubject.subjectName.toLowerCase()
  const defaults = SUBJECT_DEFAULTS[subjectKey] || SUBJECT_DEFAULTS.default

  return {
    id: backendSubject._id,
    name: backendSubject.subjectName,
    description: backendSubject.subjectDescription,
    icon: defaults.icon,
    color: defaults.color,
    topicCount: 0, // Will be populated by aggregation
    quizCount: 0,  // Will be populated by aggregation
    createdAt: backendSubject.createdAt,
    updatedAt: backendSubject.updatedAt
  }
}

// Convert frontend subject to backend format
export function convertFrontendSubject(frontendSubject: Partial<FrontendSubject>): Partial<BackendSubject> {
  return {
    _id: frontendSubject.id,
    subjectName: frontendSubject.name || '',
    subjectDescription: frontendSubject.description || '',
    createdAt: frontendSubject.createdAt,
    updatedAt: frontendSubject.updatedAt
  }
}

// Convert backend topic to frontend format
export function convertBackendTopic(backendTopic: BackendTopic): FrontendTopic {
  const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
    'EASY': 'beginner',
    'MEDIUM': 'intermediate', 
    'HARD': 'advanced'
  }

  return {
    id: backendTopic._id,
    name: backendTopic.topicName,
    description: backendTopic.topicDescription,
    subjectId: backendTopic.subjectId,
    difficulty: difficultyMap[backendTopic.difficulty] || 'beginner',
    prerequisites: backendTopic.prerequisites,
    createdAt: backendTopic.createdAt,
    updatedAt: backendTopic.updatedAt,
    averageScore: 0, // Default value, update as needed
    questionCount: 0, // Default value, update as needed
    quizCount: 0 // Default value, update as needed
  }
}

// Convert frontend topic to backend format  
export function convertFrontendTopic(frontendTopic: Partial<FrontendTopic>): Partial<BackendTopic> {
  const difficultyMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
    'beginner': 'EASY',
    'intermediate': 'MEDIUM',
    'advanced': 'HARD'
  }

  return {
    _id: frontendTopic.id,
    topicName: frontendTopic.name || '',
    topicDescription: frontendTopic.description,
    subjectId: frontendTopic.subjectId || '',
    difficulty: difficultyMap[frontendTopic.difficulty || 'beginner'],
    prerequisites: frontendTopic.prerequisites,
    createdAt: frontendTopic.createdAt,
    updatedAt: frontendTopic.updatedAt
  }
}

// Safely convert arrays
export function convertBackendSubjectArray(backendSubjects: BackendSubject[]): FrontendSubject[] {
  return backendSubjects.map(convertBackendSubject)
}

export function convertBackendTopicArray(backendTopics: BackendTopic[]): FrontendTopic[] {
  return backendTopics.map(convertBackendTopic)
}
