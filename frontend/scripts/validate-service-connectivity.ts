#!/usr/bin/env tsx

/**
 * Service Connectivity Validation Script
 * 
 * This script validates all existing frontend services against backend endpoints
 * and generates a comprehensive report of connectivity status.
 * 
 * Usage: npm run validate:connectivity
 */

import { generateConnectivityReport } from '../src/tests/service-connectivity-validation.test'
import fs from 'fs'
import path from 'path'

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

interface EndpointTest {
  name: string
  url: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  requiresAuth: boolean
  test: () => Promise<any>
}

// Define all endpoints to test based on existing services
const endpointTests: EndpointTest[] = [
  // Auth endpoints
  {
    name: 'Auth Status',
    url: '/auth/status',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { authService } = await import('../src/services/authService')
      return authService.getAuthStatus()
    }
  },
  
  // Subject endpoints
  {
    name: 'Get All Subjects',
    url: '/subjects/get-subjects',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { subjectService } = await import('../src/services/subjectService')
      return subjectService.getAllSubjects()
    }
  },
  {
    name: 'Get All Topics',
    url: '/topics/get-topics',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { subjectService } = await import('../src/services/subjectService')
      return subjectService.getAllTopics()
    }
  },
  {
    name: 'Search Subjects',
    url: '/subjects/search',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { subjectService } = await import('../src/services/subjectService')
      return subjectService.searchSubjects('test')
    }
  },
  
  // Quiz endpoints
  {
    name: 'Get All Quizzes',
    url: '/quizzes',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { quizService } = await import('../src/services/quizService')
      return quizService.getAllQuizzes()
    }
  },
  {
    name: 'Get Popular Quizzes',
    url: '/quizzes/popular',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { quizService } = await import('../src/services/quizService')
      return quizService.getPopularQuizzes(5)
    }
  },
  {
    name: 'Search Quizzes',
    url: '/quizzes/search',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { quizService } = await import('../src/services/quizService')
      return quizService.searchQuizzes('test')
    }
  },
  
  // Gamification endpoints
  {
    name: 'Global Leaderboard',
    url: '/attempts/leaderboard',
    method: 'GET',
    requiresAuth: false,
    test: async () => {
      const { gamificationService } = await import('../src/services/gamificationService')
      return gamificationService.getGlobalLeaderboard(10)
    }
  },
  
  // User endpoints (require auth)
  {
    name: 'Get All Users',
    url: '/users',
    method: 'GET',
    requiresAuth: true,
    test: async () => {
      const { userService } = await import('../src/services/userService')
      return userService.getAllUsers()
    }
  },
  {
    name: 'Get Current User',
    url: '/users/me',
    method: 'GET',
    requiresAuth: true,
    test: async () => {
      const { userService } = await import('../src/services/userService')
      return userService.getCurrentUser()
    }
  }
]

async function validateEndpoint(test: EndpointTest): Promise<{
  success: boolean
  error?: string
  responseTime: number
  statusCode?: number
}> {
  const startTime = Date.now()
  
  try {
    const result = await test.test()
    const responseTime = Date.now() - startTime
    
    return {
      success: true,
      responseTime,
      statusCode: 200
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      responseTime,
      statusCode: error.response?.status
    }
  }
}

async function runValidation() {
  console.log(`${colors.bold}${colors.blue}🔍 EduAssist Service Connectivity Validation${colors.reset}\n`)
  
  // Check API configuration first
  const { default: api } = await import('../src/lib/api')
  console.log(`${colors.bold}API Configuration:${colors.reset}`)
  console.log(`  Base URL: ${colors.blue}${api.defaults.baseURL}${colors.reset}`)
  console.log(`  Timeout: ${api.defaults.timeout}ms`)
  console.log(`  With Credentials: ${api.defaults.withCredentials}`)
  console.log(`  Content-Type: ${api.defaults.headers['Content-Type']}\n`)
  
  // Validate base URL
  const expectedPort = '5000'
  const expectedPath = '/api/v1'
  const baseUrl = api.defaults.baseURL || ''
  
  if (!baseUrl.includes(expectedPort)) {
    console.log(`${colors.red}❌ WARNING: API base URL should use port ${expectedPort}${colors.reset}`)
  }
  if (!baseUrl.includes(expectedPath)) {
    console.log(`${colors.red}❌ WARNING: API base URL should include ${expectedPath}${colors.reset}`)
  }
  
  console.log(`${colors.bold}Testing Endpoints:${colors.reset}\n`)
  
  const results: Array<{
    test: EndpointTest
    result: Awaited<ReturnType<typeof validateEndpoint>>
  }> = []
  
  // Test each endpoint
  for (const test of endpointTests) {
    process.stdout.write(`  Testing ${test.name}... `)
    
    const result = await validateEndpoint(test)
    results.push({ test, result })
    
    if (result.success) {
      console.log(`${colors.green}✅ SUCCESS${colors.reset} (${result.responseTime}ms)`)
    } else {
      const authNote = test.requiresAuth ? ' (requires auth)' : ''
      console.log(`${colors.red}❌ FAILED${colors.reset} (${result.responseTime}ms)${authNote}`)
      if (result.error) {
        console.log(`    Error: ${colors.yellow}${result.error}${colors.reset}`)
      }
    }
  }
  
  // Generate summary
  console.log(`\n${colors.bold}Summary:${colors.reset}`)
  
  const totalTests = results.length
  const successfulTests = results.filter(r => r.result.success).length
  const failedTests = totalTests - successfulTests
  const authRequiredFailed = results.filter(r => !r.result.success && r.test.requiresAuth).length
  const publicEndpointsFailed = results.filter(r => !r.result.success && !r.test.requiresAuth).length
  
  console.log(`  Total endpoints tested: ${totalTests}`)
  console.log(`  ${colors.green}Successful: ${successfulTests}${colors.reset}`)
  console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`)
  
  if (authRequiredFailed > 0) {
    console.log(`    - Auth required failures: ${authRequiredFailed} (expected without login)`)
  }
  if (publicEndpointsFailed > 0) {
    console.log(`    - Public endpoint failures: ${colors.red}${publicEndpointsFailed}${colors.reset} (needs investigation)`)
  }
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    apiConfiguration: {
      baseUrl: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      withCredentials: api.defaults.withCredentials,
      contentType: api.defaults.headers['Content-Type']
    },
    validation: {
      correctPort: baseUrl.includes(expectedPort),
      correctPath: baseUrl.includes(expectedPath)
    },
    summary: {
      totalTests,
      successfulTests,
      failedTests,
      authRequiredFailed,
      publicEndpointsFailed
    },
    endpoints: results.map(({ test, result }) => ({
      name: test.name,
      url: test.url,
      method: test.method,
      requiresAuth: test.requiresAuth,
      success: result.success,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      error: result.error
    }))
  }
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'service-connectivity-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`)
  
  // Recommendations
  console.log(`\n${colors.bold}Recommendations:${colors.reset}`)
  
  if (publicEndpointsFailed > 0) {
    console.log(`  ${colors.red}🚨 ${publicEndpointsFailed} public endpoints are failing - backend may not be running${colors.reset}`)
    console.log(`     Run: ${colors.blue}cd backend && npm run start:dev${colors.reset}`)
  }
  
  if (authRequiredFailed > 0) {
    console.log(`  ${colors.yellow}ℹ️  ${authRequiredFailed} auth-required endpoints failed (normal without login)${colors.reset}`)
    console.log(`     To test authenticated endpoints, implement login in the test suite`)
  }
  
  if (successfulTests === totalTests) {
    console.log(`  ${colors.green}🎉 All endpoints are working correctly!${colors.reset}`)
  }
  
  // Exit with appropriate code
  process.exit(publicEndpointsFailed > 0 ? 1 : 0)
}

// Run validation
runValidation().catch(error => {
  console.error(`${colors.red}❌ Validation failed:${colors.reset}`, error)
  process.exit(1)
})