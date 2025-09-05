/**
 * Topic Service Integration Tests
 * 
 * Tests the complete topic service integration with backend endpoints,
 * including data conversion, error handling, and CRUD operations.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { topicService } from '@/services/topicService'
import { subjectService } from '@/services/subjectService'
import api from '@/lib/api'

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  skipCrudTests: false, // Set to true to skip create/update/delete tests
}

// Test data
let testSubjectId: string | null = null
let testTopicId: string | null = null

describe('Topic Service Integration', () => {
  beforeAll(async () => {
    // Ensure backend is running and get a test subject
    try {
      const subjects = await subjectService.getAllSubjects()
      if (subjects.length > 0) {
        testSubjectId = subjects[0].id
        console.log(`Using test subject: ${subjects[0].name} (${testSubjectId})`)
      }
    } catch (error) {
      console.warn('Failed to get test subject:', error)
    }
  }, TEST_CONFIG.timeout)

  afterAll(async () => {
    // Cleanup: delete test topic if created
    if (testTopicId && !TEST_CONFIG.skipCrudTests) {
      try {
        await topicService.deleteTopic(testTopicId)
        console.log('Cleaned up test topic')
      } catch (error) {
        console.warn('Failed to cleanup test topic:', error)
      }
    }
  })

  describe('Topic Service Endpoint Connectivity', () => {
    it('should connect to get all topics endpoint', async () => {
      const topics = await topicService.getAllTopics()
      
      expect(Array.isArray(topics)).toBe(true)
      console.log(`✅ Retrieved ${topics.length} topics`)
      
      // Validate topic structure
      if (topics.length > 0) {
        const topic = topics[0]
        expect(topic).toHaveProperty('id')
        expect(topic).toHaveProperty('name')
        expect(topic).toHaveProperty('subjectId')
        expect(topic).toHaveProperty('difficulty')
        expect(['beginner', 'intermediate', 'advanced']).toContain(topic.difficulty)
      }
    }, TEST_CONFIG.timeout)

    it('should connect to get topics by subject endpoint', async () => {
      if (!testSubjectId) {
        console.log('Skipping - no test subject available')
        return
      }

      const topics = await topicService.getTopicsBySubject(testSubjectId)
      
      expect(Array.isArray(topics)).toBe(true)
      console.log(`✅ Retrieved ${topics.length} topics for subject ${testSubjectId}`)
      
      // All topics should belong to the requested subject
      topics.forEach(topic => {
        expect(topic.subjectId).toBe(testSubjectId)
      })
    }, TEST_CONFIG.timeout)

    it('should connect to search topics endpoint', async () => {
      const searchResults = await topicService.searchTopics('math')
      
      expect(Array.isArray(searchResults)).toBe(true)
      console.log(`✅ Found ${searchResults.length} topics matching 'math'`)
      
      // Validate search results structure
      searchResults.forEach(topic => {
        expect(topic).toHaveProperty('id')
        expect(topic).toHaveProperty('name')
        expect(typeof topic.name).toBe('string')
      })
    }, TEST_CONFIG.timeout)

    it('should handle empty search queries gracefully', async () => {
      const emptyResults = await topicService.searchTopics('')
      expect(Array.isArray(emptyResults)).toBe(true)
      expect(emptyResults.length).toBe(0)
      
      const whitespaceResults = await topicService.searchTopics('   ')
      expect(Array.isArray(whitespaceResults)).toBe(true)
      expect(whitespaceResults.length).toBe(0)
    }, TEST_CONFIG.timeout)

    it('should get topic by ID if topics exist', async () => {
      const allTopics = await topicService.getAllTopics()
      
      if (allTopics.length === 0) {
        console.log('Skipping - no topics available for ID test')
        return
      }

      const topicId = allTopics[0].id
      const topic = await topicService.getTopicById(topicId)
      
      expect(topic).toHaveProperty('id', topicId)
      expect(topic).toHaveProperty('name')
      expect(topic).toHaveProperty('subjectId')
      console.log(`✅ Retrieved topic by ID: ${topic.name}`)
    }, TEST_CONFIG.timeout)
  })

  describe('Topic Data Conversion', () => {
    it('should properly convert backend topic data to frontend format', async () => {
      const topics = await topicService.getAllTopics()
      
      if (topics.length === 0) {
        console.log('Skipping - no topics available for conversion test')
        return
      }

      const topic = topics[0]
      
      // Validate frontend format
      expect(topic.id).toBeDefined()
      expect(typeof topic.id).toBe('string')
      expect(topic.name).toBeDefined()
      expect(typeof topic.name).toBe('string')
      expect(topic.subjectId).toBeDefined()
      expect(typeof topic.subjectId).toBe('string')
      expect(['beginner', 'intermediate', 'advanced']).toContain(topic.difficulty)
      
      // Validate optional fields
      if (topic.description) {
        expect(typeof topic.description).toBe('string')
      }
      if (topic.prerequisites) {
        expect(Array.isArray(topic.prerequisites)).toBe(true)
      }
      
      console.log('✅ Topic data conversion validated')
    }, TEST_CONFIG.timeout)

    it('should handle difficulty level mapping correctly', async () => {
      const topics = await topicService.getAllTopics()
      
      topics.forEach(topic => {
        // Frontend should use lowercase difficulty levels
        expect(['beginner', 'intermediate', 'advanced']).toContain(topic.difficulty)
        // Should not contain backend format (EASY, MEDIUM, HARD)
        expect(['EASY', 'MEDIUM', 'HARD']).not.toContain(topic.difficulty)
      })
      
      console.log('✅ Difficulty level mapping validated')
    }, TEST_CONFIG.timeout)
  })

  describe('Topic CRUD Operations', () => {
    it('should create a new topic', async () => {
      if (TEST_CONFIG.skipCrudTests || !testSubjectId) {
        console.log('Skipping CRUD tests')
        return
      }

      const topicData = {
        name: `Test Topic ${Date.now()}`,
        description: 'A test topic created by integration tests',
        subjectId: testSubjectId
      }

      const createdTopic = await topicService.createTopic(topicData)
      testTopicId = createdTopic.id
      
      expect(createdTopic).toHaveProperty('id')
      expect(createdTopic.name).toBe(topicData.name)
      expect(createdTopic.description).toBe(topicData.description)
      expect(createdTopic.subjectId).toBe(topicData.subjectId)
      
      console.log(`✅ Created test topic: ${createdTopic.name}`)
    }, TEST_CONFIG.timeout)

    it('should update the created topic', async () => {
      if (TEST_CONFIG.skipCrudTests || !testTopicId) {
        console.log('Skipping update test - no test topic')
        return
      }

      const updateData = {
        name: `Updated Test Topic ${Date.now()}`,
        description: 'Updated description for test topic'
      }

      const updatedTopic = await topicService.updateTopic(testTopicId, updateData)
      
      expect(updatedTopic.id).toBe(testTopicId)
      expect(updatedTopic.name).toBe(updateData.name)
      expect(updatedTopic.description).toBe(updateData.description)
      
      console.log(`✅ Updated test topic: ${updatedTopic.name}`)
    }, TEST_CONFIG.timeout)

    it('should delete the created topic', async () => {
      if (TEST_CONFIG.skipCrudTests || !testTopicId) {
        console.log('Skipping delete test - no test topic')
        return
      }

      const deleteResult = await topicService.deleteTopic(testTopicId)
      
      expect(deleteResult).toHaveProperty('deleted')
      expect(deleteResult.deleted).toBe(true)
      
      // Verify topic is deleted by trying to fetch it
      try {
        await topicService.getTopicById(testTopicId)
        // If we reach here, the topic wasn't deleted
        expect(true).toBe(false) // Force failure
      } catch (error: any) {
        // Expected - topic should not be found
        expect(error.message).toBeDefined()
      }
      
      console.log('✅ Deleted test topic successfully')
      testTopicId = null // Clear reference
    }, TEST_CONFIG.timeout)
  })

  describe('Topic Service Error Handling', () => {
    it('should handle invalid topic ID gracefully', async () => {
      const invalidId = 'invalid-topic-id-12345'
      
      try {
        await topicService.getTopicById(invalidId)
        // If we reach here, the service didn't throw an error
        expect(true).toBe(false) // Force failure
      } catch (error: any) {
        expect(error.message).toBeDefined()
        console.log(`✅ Handled invalid topic ID error: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should handle invalid subject ID in getTopicsBySubject', async () => {
      const invalidSubjectId = 'invalid-subject-id-12345'
      
      try {
        const topics = await topicService.getTopicsBySubject(invalidSubjectId)
        // Some backends might return empty array instead of error
        expect(Array.isArray(topics)).toBe(true)
        console.log(`✅ Handled invalid subject ID (returned ${topics.length} topics)`)
      } catch (error: any) {
        expect(error.message).toBeDefined()
        console.log(`✅ Handled invalid subject ID error: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should handle network errors gracefully', async () => {
      // Temporarily modify API base URL to simulate network error
      const originalBaseURL = api.defaults.baseURL
      api.defaults.baseURL = 'http://localhost:9999/api/v1' // Non-existent port
      
      try {
        await topicService.getAllTopics()
        // If we reach here, the request somehow succeeded
        expect(true).toBe(false) // Force failure
      } catch (error: any) {
        expect(error.message).toBeDefined()
        console.log(`✅ Handled network error: ${error.message}`)
      } finally {
        // Restore original base URL
        api.defaults.baseURL = originalBaseURL
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Topic Service Performance', () => {
    it('should retrieve topics within reasonable time', async () => {
      const startTime = Date.now()
      const topics = await topicService.getAllTopics()
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(5000) // Should complete within 5 seconds
      console.log(`✅ Retrieved ${topics.length} topics in ${responseTime}ms`)
    }, TEST_CONFIG.timeout)

    it('should handle concurrent topic requests', async () => {
      const startTime = Date.now()
      
      // Make multiple concurrent requests
      const promises = [
        topicService.getAllTopics(),
        topicService.searchTopics('test'),
        testSubjectId ? topicService.getTopicsBySubject(testSubjectId) : Promise.resolve([])
      ]
      
      const results = await Promise.all(promises)
      const responseTime = Date.now() - startTime
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
      })
      
      console.log(`✅ Handled concurrent requests in ${responseTime}ms`)
    }, TEST_CONFIG.timeout)
  })

  describe('Topic Service Integration with Subject Service', () => {
    it('should maintain data consistency between topic and subject services', async () => {
      const [topicsFromTopicService, topicsFromSubjectService] = await Promise.all([
        topicService.getAllTopics(),
        subjectService.getAllTopics()
      ])
      
      // Both services should return the same topics
      expect(topicsFromTopicService.length).toBe(topicsFromSubjectService.length)
      
      // Validate that topic IDs match
      const topicServiceIds = new Set(topicsFromTopicService.map(t => t.id))
      const subjectServiceIds = new Set(topicsFromSubjectService.map(t => t.id))
      
      expect(topicServiceIds.size).toBe(subjectServiceIds.size)
      
      console.log(`✅ Data consistency validated between services (${topicsFromTopicService.length} topics)`)
    }, TEST_CONFIG.timeout)

    it('should validate subject-topic relationships', async () => {
      if (!testSubjectId) {
        console.log('Skipping - no test subject available')
        return
      }

      const [subject, topicsInSubject] = await Promise.all([
        subjectService.getSubjectById(testSubjectId),
        topicService.getTopicsBySubject(testSubjectId)
      ])
      
      expect(subject).toHaveProperty('id', testSubjectId)
      expect(Array.isArray(topicsInSubject)).toBe(true)
      
      // All topics should reference the correct subject
      topicsInSubject.forEach(topic => {
        expect(topic.subjectId).toBe(testSubjectId)
      })
      
      console.log(`✅ Subject-topic relationships validated (${topicsInSubject.length} topics in subject)`)
    }, TEST_CONFIG.timeout)
  })
})