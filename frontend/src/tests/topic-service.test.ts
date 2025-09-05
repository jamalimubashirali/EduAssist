import { describe, it, expect } from 'vitest'
import { topicService } from '@/services/topicService'
import { convertBackendTopic, convertBackendTopicArray } from '@/lib/topicConverters'

describe('Topic Service Structure', () => {
  it('should have all required methods', () => {
    expect(topicService).toBeDefined()
    expect(typeof topicService.getAllTopics).toBe('function')
    expect(typeof topicService.getTopicById).toBe('function')
    expect(typeof topicService.getTopicsBySubject).toBe('function')
    expect(typeof topicService.createTopic).toBe('function')
    expect(typeof topicService.updateTopic).toBe('function')
    expect(typeof topicService.deleteTopic).toBe('function')
    expect(typeof topicService.searchTopics).toBe('function')
    expect(typeof topicService.getTopicsWithStats).toBe('function')
  })
})

describe('Topic Converters', () => {
  it('should convert backend topic to frontend format', () => {
    const backendTopic = {
      _id: '507f1f77bcf86cd799439011',
      topicName: 'Algebra',
      topicDescription: 'Basic algebra concepts',
      subjectId: '507f1f77bcf86cd799439012',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }

    const frontendTopic = convertBackendTopic(backendTopic)

    expect(frontendTopic).toEqual({
      id: '507f1f77bcf86cd799439011',
      name: 'Algebra',
      description: 'Basic algebra concepts',
      subjectId: '507f1f77bcf86cd799439012',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    })
  })

  it('should convert array of backend topics', () => {
    const backendTopics = [
      {
        _id: '507f1f77bcf86cd799439011',
        topicName: 'Algebra',
        topicDescription: 'Basic algebra concepts',
        subjectId: '507f1f77bcf86cd799439012',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ]

    const frontendTopics = convertBackendTopicArray(backendTopics)

    expect(frontendTopics).toHaveLength(1)
    expect(frontendTopics[0].id).toBe('507f1f77bcf86cd799439011')
    expect(frontendTopics[0].name).toBe('Algebra')
  })
})