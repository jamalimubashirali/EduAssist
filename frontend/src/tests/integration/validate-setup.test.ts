/**
 * Setup Validation Test
 * 
 * Simple test to validate that the integration test environment is working correctly.
 */

import { describe, it, expect } from 'vitest'

describe('Integration Test Setup Validation', () => {
  it('should validate test environment is working', () => {
    expect(true).toBe(true)
    console.log('✅ Test environment is working correctly')
  })

  it('should validate imports are working', async () => {
    // Test that we can import our services without CSS issues
    try {
      // These imports should work without triggering CSS processing
      const { topicService } = await import('@/services/topicService')
      const { subjectService } = await import('@/services/subjectService')
      
      expect(topicService).toBeDefined()
      expect(subjectService).toBeDefined()
      
      console.log('✅ Service imports are working correctly')
    } catch (error) {
      console.error('❌ Service import failed:', error)
      throw error
    }
  })

  it('should validate API configuration', async () => {
    try {
      const api = await import('@/lib/api')
      expect(api.default).toBeDefined()
      expect(api.default.defaults).toBeDefined()
      
      console.log('✅ API configuration is accessible')
      console.log(`   Base URL: ${api.default.defaults.baseURL}`)
    } catch (error) {
      console.error('❌ API configuration failed:', error)
      throw error
    }
  })
})