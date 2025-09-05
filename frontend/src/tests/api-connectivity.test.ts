import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { subjectService } from '../services/subjectService'
import { quizService } from '../services/quizService'
import { performanceService } from '../services/performanceService'
import { gamificationService } from '../services/gamificationService'
import { recommendationService } from '../services/recommendationService'
import { attemptService } from '../services/attemptService'

// Test script to verify all API endpoints are working correctly
async function testApiConnectivity() {
  console.log('🧪 Testing API Connectivity for All Services...\n')
  
  const results = {
    auth: false,
    user: false,
    subject: false,
    quiz: false,
    performance: false,
    gamification: false,
    recommendation: false,
    attempt: false
  }

  // Test 1: Auth Service
  console.log('1. Testing Auth Service...')
  try {
    await authService.getAuthStatus()
    results.auth = true
    console.log('✅ Auth service is reachable')
  } catch (error: any) {
    console.log('❌ Auth service error:', error.message)
  }

  // Test 2: Subject Service
  console.log('\n2. Testing Subject Service...')
  try {
    const subjects = await subjectService.getAllSubjects()
    results.subject = true
    console.log(`✅ Successfully fetched ${subjects.length} subjects`)
    if (subjects.length > 0) {
      console.log('Sample subject:', subjects[0].name)
      
      // Test topics endpoint
      try {
        const topics = await subjectService.getTopicsBySubject(subjects[0].id)
        console.log(`✅ Successfully fetched ${topics.length} topics for subject`)
      } catch (topicError: any) {
        console.log('⚠️ Topics endpoint error:', topicError.message)
      }
    }
  } catch (error: any) {
    console.log('❌ Subject service error:', error.message)
  }

  // Test 3: Quiz Service (public endpoints)
  console.log('\n3. Testing Quiz Service...')
  try {
    const quizzes = await quizService.getAllQuizzes({ limit: 5 })
    results.quiz = true
    console.log(`✅ Successfully fetched ${quizzes.length} quizzes`)
  } catch (error: any) {
    console.log('❌ Quiz service error:', error.message)
  }

  // Test 4: User Service (will require auth)
  console.log('\n4. Testing User Service...')
  try {
    await userService.getCurrentUser()
    results.user = true
    console.log('✅ User service is reachable')
  } catch (error: any) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      results.user = true
      console.log('✅ User service is reachable (auth required)')
    } else {
      console.log('❌ User service error:', error.message)
    }
  }

  // Test 5: Performance Service (will require auth)
  console.log('\n5. Testing Performance Service...')
  try {
    await performanceService.getUserPerformance('test-user-id')
    results.performance = true
    console.log('✅ Performance service is reachable')
  } catch (error: any) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      results.performance = true
      console.log('✅ Performance service is reachable (auth required)')
    } else {
      console.log('❌ Performance service error:', error.message)
    }
  }

  // Test 6: Gamification Service (will require auth)
  console.log('\n6. Testing Gamification Service...')
  try {
    await gamificationService.getGlobalLeaderboard(5)
    results.gamification = true
    console.log('✅ Gamification service is reachable')
  } catch (error: any) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      results.gamification = true
      console.log('✅ Gamification service is reachable (auth required)')
    } else {
      console.log('❌ Gamification service error:', error.message)
    }
  }

  // Test 7: Recommendation Service (will require auth)
  console.log('\n7. Testing Recommendation Service...')
  try {
    await recommendationService.getUserRecommendations('test-user-id')
    results.recommendation = true
    console.log('✅ Recommendation service is reachable')
  } catch (error: any) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      results.recommendation = true
      console.log('✅ Recommendation service is reachable (auth required)')
    } else {
      console.log('❌ Recommendation service error:', error.message)
    }
  }

  // Test 8: Attempt Service (will require auth)
  console.log('\n8. Testing Attempt Service...')
  try {
    await attemptService.getUserAttempts('test-user-id', 5)
    results.attempt = true
    console.log('✅ Attempt service is reachable')
  } catch (error: any) {
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      results.attempt = true
      console.log('✅ Attempt service is reachable (auth required)')
    } else {
      console.log('❌ Attempt service error:', error.message)
    }
  }

  // Summary
  console.log('\n📊 API Connectivity Test Results:')
  console.log('=====================================')
  Object.entries(results).forEach(([service, status]) => {
    console.log(`${status ? '✅' : '❌'} ${service.charAt(0).toUpperCase() + service.slice(1)} Service: ${status ? 'Connected' : 'Failed'}`)
  })

  const successCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length
  
  console.log(`\n🎯 Overall Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`)
  
  if (successCount === totalCount) {
    console.log('🎉 All services are properly connected!')
  } else {
    console.log('⚠️ Some services need attention')
  }

  return results
}

// Only run if not in browser environment
if (typeof window === 'undefined') {
  testApiConnectivity()
}

export default testApiConnectivity