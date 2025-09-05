/**
 * User Journey Test Runner
 * Executes all user journey validation tests in sequence
 */

import { execSync } from 'child_process'
import path from 'path'

async function runUserJourneyTests() {
  console.log('🚀 Starting Complete User Journey Validation Tests...\n')
  
  const testFiles = [
    'user-journey-validation.test.ts',
    'advanced-features-validation.test.ts', 
    'navigation-validation.test.ts'
  ]

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0

  for (const testFile of testFiles) {
    console.log(`\n📋 Running ${testFile}...`)
    console.log('=' .repeat(60))
    
    try {
      const testPath = path.join(__dirname, testFile)
      const result = execSync(`npx vitest run ${testPath}`, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..', '..')
      })
      
      console.log(result)
      
      // Parse results (basic parsing)
      const lines = result.split('\n')
      const testResults = lines.filter(line => 
        line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL')
      )
      
      const passed = testResults.filter(line => line.includes('✓') || line.includes('PASS')).length
      const failed = testResults.filter(line => line.includes('✗') || line.includes('FAIL')).length
      
      totalTests += passed + failed
      passedTests += passed
      failedTests += failed
      
      console.log(`✅ ${testFile}: ${passed} passed, ${failed} failed`)
      
    } catch (error: any) {
      console.error(`❌ ${testFile} failed to run:`, error.message)
      failedTests++
      totalTests++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests} ✅`)
  console.log(`Failed: ${failedTests} ❌`)
  console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`)
  
  if (failedTests === 0) {
    console.log('\n🎉 All user journey tests passed! The application is ready for production.')
  } else {
    console.log('\n⚠️ Some tests failed. Please review the results and fix any issues.')
  }
  
  console.log('\n📋 Test Summary:')
  console.log('- User Journey Validation: Complete signup → onboarding → dashboard flow')
  console.log('- Advanced Features: Gamification, performance analytics, recommendations')
  console.log('- Navigation: All page routes and data loading functionality')
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  }
}

// Run tests if called directly
if (require.main === module) {
  runUserJourneyTests().catch(console.error)
}

export default runUserJourneyTests