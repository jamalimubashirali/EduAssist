#!/usr/bin/env tsx

/**
 * Integration Test Runner
 * 
 * Runs all integration tests in the correct order and generates a comprehensive report.
 * This script validates the complete frontend-backend integration including new services,
 * algorithm integration, and data flow consistency.
 * 
 * Usage: npm run test:integration
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

interface TestSuite {
  name: string
  file: string
  description: string
  requirements: string[]
  timeout: number
}

// Define test suites in execution order
const testSuites: TestSuite[] = [
  {
    name: 'Service Connectivity Validation',
    file: 'service-connectivity-validation.test.ts',
    description: 'Validates existing service connectivity and API configuration',
    requirements: ['2.1', '2.2', '2.3', '2.4'],
    timeout: 30000
  },
  {
    name: 'Topic Service Integration',
    file: 'integration/topic-service-integration.test.ts',
    description: 'Tests complete topic service integration with backend endpoints',
    requirements: ['9.1', '9.2', '9.3'],
    timeout: 30000
  },
  {
    name: 'Enhanced Quiz Service Integration',
    file: 'integration/quiz-service-integration.test.ts',
    description: 'Tests enhanced quiz service with personalized generation and analytics',
    requirements: ['9.1', '9.2', '9.3'],
    timeout: 45000
  },
  {
    name: 'Complete User Journey Integration',
    file: 'integration/user-journey-integration.test.ts',
    description: 'Tests end-to-end user flows from signup through advanced features',
    requirements: ['9.1', '9.2', '9.3'],
    timeout: 60000
  },
  {
    name: 'Backend Algorithm Integration',
    file: 'integration/algorithm-integration.test.ts',
    description: 'Validates frontend integration with backend intelligent algorithms',
    requirements: ['9.4', '9.5', '9.6'],
    timeout: 45000
  },
  {
    name: 'Data Flow and Consistency Validation',
    file: 'integration/data-flow-validation.test.ts',
    description: 'Tests data consistency and flow between all services',
    requirements: ['9.4', '9.5', '9.6'],
    timeout: 60000
  }
]

interface TestResult {
  suite: TestSuite
  success: boolean
  duration: number
  output: string
  error?: string
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now()
  
  console.log(`\n${colors.blue}🧪 Running: ${suite.name}${colors.reset}`)
  console.log(`   ${colors.cyan}${suite.description}${colors.reset}`)
  console.log(`   Requirements: ${suite.requirements.join(', ')}`)
  
  try {
    const output = execSync(
      `npx vitest run src/tests/${suite.file} --config vitest.integration.config.ts --reporter=verbose`,
      {
        encoding: 'utf8',
        timeout: suite.timeout,
        cwd: process.cwd()
      }
    )
    
    const duration = Date.now() - startTime
    
    console.log(`   ${colors.green}✅ PASSED${colors.reset} (${duration}ms)`)
    
    return {
      suite,
      success: true,
      duration,
      output
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    console.log(`   ${colors.red}❌ FAILED${colors.reset} (${duration}ms)`)
    if (error.stdout) {
      console.log(`   ${colors.yellow}Output:${colors.reset}`)
      console.log(error.stdout.split('\n').map((line: string) => `     ${line}`).join('\n'))
    }
    if (error.stderr) {
      console.log(`   ${colors.red}Error:${colors.reset}`)
      console.log(error.stderr.split('\n').map((line: string) => `     ${line}`).join('\n'))
    }
    
    return {
      suite,
      success: false,
      duration,
      output: error.stdout || '',
      error: error.stderr || error.message
    }
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.magenta}🚀 Frontend-Backend Integration Test Suite${colors.reset}\n`)
  console.log(`Running ${testSuites.length} test suites to validate complete integration...\n`)
  
  // Check if backend is running
  console.log(`${colors.blue}🔍 Checking backend connectivity...${colors.reset}`)
  try {
    execSync('curl -f http://localhost:5000/api/v1/health', { 
      encoding: 'utf8', 
      timeout: 5000,
      stdio: 'pipe'
    })
    console.log(`${colors.green}✅ Backend is running on port 5000${colors.reset}`)
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Backend may not be running - some tests may fail${colors.reset}`)
    console.log(`   Start backend with: ${colors.cyan}cd backend && npm run start:dev${colors.reset}`)
  }
  
  const results: TestResult[] = []
  const startTime = Date.now()
  
  // Run test suites sequentially
  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push(result)
    
    // Stop on critical failures (optional)
    if (!result.success && suite.name.includes('Connectivity')) {
      console.log(`\n${colors.red}❌ Critical connectivity test failed - stopping execution${colors.reset}`)
      break
    }
  }
  
  const totalDuration = Date.now() - startTime
  
  // Generate summary
  console.log(`\n${colors.bold}📊 Test Results Summary${colors.reset}`)
  console.log(`${'='.repeat(60)}`)
  
  const passedTests = results.filter(r => r.success).length
  const failedTests = results.length - passedTests
  
  console.log(`Total test suites: ${results.length}`)
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`)
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`)
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`)
  
  // Detailed results
  console.log(`\n${colors.bold}Detailed Results:${colors.reset}`)
  results.forEach((result, index) => {
    const status = result.success ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`
    const duration = `${(result.duration / 1000).toFixed(1)}s`
    console.log(`${index + 1}. ${result.suite.name}: ${status} (${duration})`)
    
    if (!result.success && result.error) {
      console.log(`   Error: ${colors.red}${result.error.split('\n')[0]}${colors.reset}`)
    }
  })
  
  // Requirements coverage
  console.log(`\n${colors.bold}Requirements Coverage:${colors.reset}`)
  const allRequirements = new Set<string>()
  const coveredRequirements = new Set<string>()
  
  results.forEach(result => {
    result.suite.requirements.forEach(req => {
      allRequirements.add(req)
      if (result.success) {
        coveredRequirements.add(req)
      }
    })
  })
  
  const coveragePercentage = (coveredRequirements.size / allRequirements.size) * 100
  console.log(`Requirements covered: ${coveredRequirements.size}/${allRequirements.size} (${coveragePercentage.toFixed(1)}%)`)
  
  Array.from(allRequirements).sort().forEach(req => {
    const status = coveredRequirements.has(req) ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`
    console.log(`  ${status} Requirement ${req}`)
  })
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      passedSuites: passedTests,
      failedSuites: failedTests,
      totalDuration: totalDuration,
      requirementsCoverage: {
        total: allRequirements.size,
        covered: coveredRequirements.size,
        percentage: coveragePercentage
      }
    },
    results: results.map(result => ({
      suiteName: result.suite.name,
      description: result.suite.description,
      requirements: result.suite.requirements,
      success: result.success,
      duration: result.duration,
      error: result.error
    })),
    recommendations: generateRecommendations(results)
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'integration-test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`)
  
  // Final recommendations
  console.log(`\n${colors.bold}Recommendations:${colors.reset}`)
  report.recommendations.forEach(rec => {
    console.log(`  ${rec.type === 'error' ? colors.red + '🚨' : colors.yellow + 'ℹ️'} ${rec.message}${colors.reset}`)
  })
  
  if (passedTests === results.length) {
    console.log(`\n${colors.green}🎉 All integration tests passed! Frontend-backend integration is working correctly.${colors.reset}`)
  } else {
    console.log(`\n${colors.red}❌ ${failedTests} test suite(s) failed. Please review the issues above.${colors.reset}`)
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0)
}

function generateRecommendations(results: TestResult[]): Array<{type: 'error' | 'warning' | 'info', message: string}> {
  const recommendations: Array<{type: 'error' | 'warning' | 'info', message: string}> = []
  
  const failedResults = results.filter(r => !r.success)
  
  if (failedResults.length === 0) {
    recommendations.push({
      type: 'info',
      message: 'All integration tests passed! The frontend-backend integration is working correctly.'
    })
    return recommendations
  }
  
  // Check for connectivity issues
  const connectivityFailed = failedResults.some(r => r.suite.name.includes('Connectivity'))
  if (connectivityFailed) {
    recommendations.push({
      type: 'error',
      message: 'Backend connectivity failed. Ensure backend is running on port 5000: cd backend && npm run start:dev'
    })
  }
  
  // Check for service-specific issues
  const serviceFailed = failedResults.some(r => r.suite.name.includes('Service'))
  if (serviceFailed) {
    recommendations.push({
      type: 'error',
      message: 'Service integration tests failed. Check API endpoints and data conversion logic.'
    })
  }
  
  // Check for algorithm issues
  const algorithmFailed = failedResults.some(r => r.suite.name.includes('Algorithm'))
  if (algorithmFailed) {
    recommendations.push({
      type: 'warning',
      message: 'Algorithm integration tests failed. Verify backend algorithms are accessible and working correctly.'
    })
  }
  
  // Check for data flow issues
  const dataFlowFailed = failedResults.some(r => r.suite.name.includes('Data Flow'))
  if (dataFlowFailed) {
    recommendations.push({
      type: 'warning',
      message: 'Data flow validation failed. Check cross-service data consistency and synchronization.'
    })
  }
  
  // Check for user journey issues
  const journeyFailed = failedResults.some(r => r.suite.name.includes('Journey'))
  if (journeyFailed) {
    recommendations.push({
      type: 'warning',
      message: 'User journey tests failed. Verify complete user flows and authentication requirements.'
    })
  }
  
  return recommendations
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}❌ Test runner failed:${colors.reset}`, error)
  process.exit(1)
})