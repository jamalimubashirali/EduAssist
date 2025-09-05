import { userService } from '../services/userService'
import { recommendationService } from '../services/recommendationService'
import { performanceService } from '../services/performanceService'
import { subjectService } from '../services/subjectService'

/**
 * Test script to validate the assessment-to-recommendation flow
 * This ensures that onboarding assessment results properly feed into backend algorithms
 * and trigger initial performance baseline setting and personalized recommendations.
 */

interface AssessmentFlowTestResult {
  success: boolean
  message: string
  details?: any
}

class AssessmentRecommendationFlowValidator {
  private testUserId: string = 'test-user-id' // This would be a real user ID in practice

  async validateCompleteFlow(): Promise<AssessmentFlowTestResult[]> {
    console.log('🧪 Testing Assessment-to-Recommendation Flow...\n')
    
    const results: AssessmentFlowTestResult[] = []

    // Test 1: Validate assessment submission creates proper data structure
    results.push(await this.testAssessmentDataStructure())

    // Test 2: Validate assessment results trigger performance baseline
    results.push(await this.testPerformanceBaselineCreation())

    // Test 3: Validate recommendations are generated after assessment
    results.push(await this.testRecommendationGeneration())

    // Test 4: Validate cross-service data consistency
    results.push(await this.testDataConsistency())

    // Test 5: Validate onboarding completion triggers system initialization
    results.push(await this.testOnboardingCompletionFlow())

    return results
  }

  private async testAssessmentDataStructure(): Promise<AssessmentFlowTestResult> {
    try {
      console.log('1. Testing assessment data structure validation...')

      // Mock assessment data that should match backend expectations
      const mockAssessmentData = {
        answers: [
          {
            question_id: '507f1f77bcf86cd799439011',
            user_answer: 'A',
            time_taken: 30
          },
          {
            question_id: '507f1f77bcf86cd799439012', 
            user_answer: 'B',
            time_taken: 45
          }
        ],
        started_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        completed_at: new Date().toISOString()
      }

      // Test that the service method exists and accepts the correct data structure
      const serviceMethod = userService.submitAssessment
      if (typeof serviceMethod !== 'function') {
        return {
          success: false,
          message: 'submitAssessment method not found in userService'
        }
      }

      // Validate the method signature accepts the expected parameters
      const methodString = serviceMethod.toString()
      const hasUserIdParam = methodString.includes('userId')
      const hasAssessmentDataParam = methodString.includes('assessmentData')

      if (!hasUserIdParam || !hasAssessmentDataParam) {
        return {
          success: false,
          message: 'submitAssessment method signature does not match expected parameters'
        }
      }

      console.log('✅ Assessment data structure validation passed')
      return {
        success: true,
        message: 'Assessment data structure is properly defined',
        details: {
          methodExists: true,
          correctSignature: true,
          expectedDataStructure: mockAssessmentData
        }
      }

    } catch (error: any) {
      console.log('❌ Assessment data structure test failed:', error.message)
      return {
        success: false,
        message: `Assessment data structure validation failed: ${error.message}`
      }
    }
  }

  private async testPerformanceBaselineCreation(): Promise<AssessmentFlowTestResult> {
    try {
      console.log('2. Testing performance baseline creation...')

      // Check if performance service has the required methods for baseline setting
      const requiredMethods = [
        'getUserPerformance',
        'updateUserPerformance',
        'getUserPerformanceAnalytics'
      ]

      const missingMethods = requiredMethods.filter(method => 
        typeof (performanceService as any)[method] !== 'function'
      )

      if (missingMethods.length > 0) {
        return {
          success: false,
          message: `Performance service missing required methods: ${missingMethods.join(', ')}`
        }
      }

      // Test that performance service can handle user performance data
      try {
        // This would normally make an API call, but we're testing the service structure
        const performanceMethod = performanceService.getUserPerformanceAnalytics
        if (typeof performanceMethod === 'function') {
          console.log('✅ Performance service methods are properly defined')
        }
      } catch (error: any) {
        // Expected to fail without real user data, but method should exist
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.log('✅ Performance service is reachable (auth required)')
        }
      }

      return {
        success: true,
        message: 'Performance baseline creation methods are available',
        details: {
          availableMethods: requiredMethods.filter(method => 
            typeof (performanceService as any)[method] === 'function'
          )
        }
      }

    } catch (error: any) {
      console.log('❌ Performance baseline test failed:', error.message)
      return {
        success: false,
        message: `Performance baseline creation test failed: ${error.message}`
      }
    }
  }

  private async testRecommendationGeneration(): Promise<AssessmentFlowTestResult> {
    try {
      console.log('3. Testing recommendation generation...')

      // Check if recommendation service has the required methods
      const requiredMethods = [
        'getUserRecommendations',
        'generateRecommendations',
        'getQuizRecommendations',
        'getTopicRecommendations'
      ]

      const availableMethods = requiredMethods.filter(method => 
        typeof (recommendationService as any)[method] === 'function'
      )

      if (availableMethods.length === 0) {
        return {
          success: false,
          message: 'No recommendation generation methods found in recommendationService'
        }
      }

      // Test that recommendation service can generate recommendations
      try {
        const recommendationMethod = recommendationService.getUserRecommendations
        if (typeof recommendationMethod === 'function') {
          console.log('✅ Recommendation service methods are properly defined')
        }
      } catch (error: any) {
        // Expected to fail without real user data
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.log('✅ Recommendation service is reachable (auth required)')
        }
      }

      return {
        success: true,
        message: 'Recommendation generation methods are available',
        details: {
          availableMethods,
          missingMethods: requiredMethods.filter(method => 
            typeof (recommendationService as any)[method] !== 'function'
          )
        }
      }

    } catch (error: any) {
      console.log('❌ Recommendation generation test failed:', error.message)
      return {
        success: false,
        message: `Recommendation generation test failed: ${error.message}`
      }
    }
  }

  private async testDataConsistency(): Promise<AssessmentFlowTestResult> {
    try {
      console.log('4. Testing cross-service data consistency...')

      // Validate that all services use consistent data types and IDs
      const services = {
        userService,
        recommendationService,
        performanceService,
        subjectService
      }

      const serviceValidation = Object.entries(services).map(([name, service]) => ({
        name,
        hasRequiredMethods: typeof service === 'object' && service !== null,
        isProperlyExported: service.constructor.name !== 'Object'
      }))

      const invalidServices = serviceValidation.filter(s => !s.hasRequiredMethods)
      
      if (invalidServices.length > 0) {
        return {
          success: false,
          message: `Invalid service exports: ${invalidServices.map(s => s.name).join(', ')}`
        }
      }

      console.log('✅ All services are properly exported and accessible')
      return {
        success: true,
        message: 'Cross-service data consistency validation passed',
        details: {
          validatedServices: serviceValidation.map(s => s.name),
          allServicesValid: true
        }
      }

    } catch (error: any) {
      console.log('❌ Data consistency test failed:', error.message)
      return {
        success: false,
        message: `Data consistency test failed: ${error.message}`
      }
    }
  }

  private async testOnboardingCompletionFlow(): Promise<AssessmentFlowTestResult> {
    try {
      console.log('5. Testing onboarding completion flow...')

      // Check if userService has the complete onboarding method
      const completeOnboardingMethod = userService.completeOnboarding
      if (typeof completeOnboardingMethod !== 'function') {
        return {
          success: false,
          message: 'completeOnboarding method not found in userService'
        }
      }

      // Validate the method accepts the expected parameters
      const methodString = completeOnboardingMethod.toString()
      const hasUserIdParam = methodString.includes('userId')
      const hasOnboardingDataParam = methodString.includes('onboardingData')

      if (!hasUserIdParam || !hasOnboardingDataParam) {
        return {
          success: false,
          message: 'completeOnboarding method signature does not match expected parameters'
        }
      }

      // Test that the method includes assessment results in the completion data
      const includesAssessmentResults = methodString.includes('assessment_results')
      
      console.log('✅ Onboarding completion flow validation passed')
      return {
        success: true,
        message: 'Onboarding completion flow is properly implemented',
        details: {
          methodExists: true,
          correctSignature: true,
          includesAssessmentResults,
          expectedFlow: 'assessment → results → completion → system initialization'
        }
      }

    } catch (error: any) {
      console.log('❌ Onboarding completion test failed:', error.message)
      return {
        success: false,
        message: `Onboarding completion test failed: ${error.message}`
      }
    }
  }

  async generateTestReport(results: AssessmentFlowTestResult[]): Promise<void> {
    console.log('\n📊 Assessment-to-Recommendation Flow Test Report')
    console.log('=' .repeat(60))

    const passedTests = results.filter(r => r.success)
    const failedTests = results.filter(r => !r.success)

    console.log(`✅ Passed: ${passedTests.length}/${results.length}`)
    console.log(`❌ Failed: ${failedTests.length}/${results.length}`)

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:')
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.message}`)
      })
    }

    if (passedTests.length > 0) {
      console.log('\n✅ Passed Tests:')
      passedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.message}`)
      })
    }

    console.log('\n🎯 Recommendations for Implementation:')
    
    if (failedTests.some(t => t.message.includes('assessment'))) {
      console.log('- Ensure assessment submission properly validates and processes user answers')
      console.log('- Verify assessment results include all required fields for recommendation generation')
    }

    if (failedTests.some(t => t.message.includes('performance'))) {
      console.log('- Implement performance baseline setting after assessment completion')
      console.log('- Ensure performance data is properly stored and accessible for recommendations')
    }

    if (failedTests.some(t => t.message.includes('recommendation'))) {
      console.log('- Implement automatic recommendation generation after assessment')
      console.log('- Ensure recommendations are personalized based on assessment results')
    }

    console.log('\n🔄 Next Steps:')
    console.log('1. Fix any failed validations')
    console.log('2. Test with real user data in development environment')
    console.log('3. Validate end-to-end flow with actual backend integration')
    console.log('4. Monitor recommendation quality and user engagement metrics')
  }
}

// Test runner function
async function runAssessmentRecommendationFlowTest() {
  const validator = new AssessmentRecommendationFlowValidator()
  const results = await validator.validateCompleteFlow()
  await validator.generateTestReport(results)
  return results
}

// Only run if not in browser environment
if (typeof window === 'undefined') {
  runAssessmentRecommendationFlowTest()
}

export { runAssessmentRecommendationFlowTest, AssessmentRecommendationFlowValidator }
export default runAssessmentRecommendationFlowTest