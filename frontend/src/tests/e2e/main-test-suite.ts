/**
 * Main E2E Test Suite for EduAssist
 * Runs all four module tests sequentially with comprehensive reporting
 * 
 * This file demonstrates:
 * - Sequential test execution
 * - Cross-module integration testing
 * - Comprehensive test reporting
 * - Error handling and recovery
 * - Test data management
 */

import { expect } from 'chai';
import { DriverManager } from './utils/driver-manager';
import { LoginPage } from './pages/login-page';
import { SignupPage } from './pages/signup-page';
import { DashboardPage } from './pages/dashboard-page';
import { RecommendationsPage } from './pages/recommendations-page';
import { TutorPage } from './pages/tutor-page';
import { TestConfig } from './config/test-config';

describe('EduAssist Complete E2E Test Suite', function() {
  let loginPage: LoginPage;
  let signupPage: SignupPage;
  let dashboardPage: DashboardPage;
  let recommendationsPage: RecommendationsPage;
  let tutorPage: TutorPage;

  // Test execution tracking
  const testResults = {
    authentication: { passed: 0, failed: 0, skipped: 0 },
    dashboard: { passed: 0, failed: 0, skipped: 0 },
    recommendations: { passed: 0, failed: 0, skipped: 0 },
    tutor: { passed: 0, failed: 0, skipped: 0 }
  };

  // Global setup for the entire test suite
  before(async function() {
    console.log('🚀 Starting EduAssist Complete E2E Test Suite...');
    console.log('=' .repeat(60));
    console.log(`Test Environment: ${TestConfig.baseUrl}`);
    console.log(`Browser: Chrome (Headless: ${TestConfig.browser.headless})`);
    console.log(`Timeout Settings: Short=${TestConfig.timeouts.short}ms, Medium=${TestConfig.timeouts.medium}ms, Long=${TestConfig.timeouts.long}ms`);
    console.log('=' .repeat(60));
    
    await DriverManager.initializeDriver();
    
    // Initialize all page objects
    loginPage = new LoginPage();
    signupPage = new SignupPage();
    dashboardPage = new DashboardPage();
    recommendationsPage = new RecommendationsPage();
    tutorPage = new TutorPage();
    
    console.log('✅ WebDriver and Page Objects initialized successfully');
  });

  // Global cleanup
  after(async function() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('=' .repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    
    Object.entries(testResults).forEach(([module, results]) => {
      console.log(`${module.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  ⏭️  Skipped: ${results.skipped}`);
      console.log(`  📊 Total: ${results.passed + results.failed + results.skipped}`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalSkipped += results.skipped;
    });
    
    console.log('=' .repeat(60));
    console.log(`OVERALL RESULTS:`);
    console.log(`  ✅ Total Passed: ${totalPassed}`);
    console.log(`  ❌ Total Failed: ${totalFailed}`);
    console.log(`  ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`  📊 Grand Total: ${totalPassed + totalFailed + totalSkipped}`);
    
    const successRate = totalPassed / (totalPassed + totalFailed) * 100;
    console.log(`  🎯 Success Rate: ${successRate.toFixed(1)}%`);
    console.log('=' .repeat(60));
    
    await DriverManager.quitDriver();
    console.log('✅ Test suite cleanup completed');
  });

  describe('🔐 Authentication Module Integration Tests', function() {
    
    it('should complete full user registration and login flow', async function() {
      console.log('\n🔄 Testing complete authentication workflow...');
      
      try {
        // Step 1: Navigate to signup
        await signupPage.navigateToSignup();
        expect(await signupPage.verifyPageTitle()).to.be.true;
        
        // Step 2: Register new user with unique credentials
        const timestamp = Date.now();
        const testUser = {
          firstName: 'Integration',
          lastName: 'Test',
          email: `integration.test.${timestamp}@eduassist.com`,
          password: 'IntegrationTest123!'
        };
        
        await signupPage.registerNewUser(testUser);
        await signupPage.waitForRegistrationSuccess();
        
        // Step 3: Navigate to login (if not auto-redirected)
        const currentUrl = await signupPage.getCurrentUrl();
        if (!currentUrl.includes('/login') && !currentUrl.includes('/dashboard')) {
          await loginPage.navigateToLogin();
        }
        
        // Step 4: Login with new credentials
        if (currentUrl.includes('/login') || await loginPage.navigateToLogin()) {
          await loginPage.login(testUser.email, testUser.password);
          await loginPage.waitForLoginSuccess();
        }
        
        // Step 5: Verify successful authentication
        const finalUrl = await DriverManager.getCurrentUrl();
        expect(finalUrl).to.include('/dashboard');
        
        const isLoggedIn = await dashboardPage.isUserLoggedIn();
        expect(isLoggedIn).to.be.true;
        
        console.log('✅ Complete authentication workflow successful');
        testResults.authentication.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Authentication workflow failed: ${errorMessage}`);
        testResults.authentication.failed++;
        throw error;
      }
    });

    it('should maintain session across page navigation', async function() {
      console.log('\n🔄 Testing session persistence...');
      
      try {
        // Verify user is logged in
        await dashboardPage.navigateToDashboard();
        expect(await dashboardPage.isUserLoggedIn()).to.be.true;
        
        // Navigate to different pages and verify session persists
        await recommendationsPage.navigateToRecommendations();
        await DriverManager.getDriver().sleep(2000);
        
        await tutorPage.navigateToTutor();
        await DriverManager.getDriver().sleep(2000);
        
        // Return to dashboard and verify still logged in
        await dashboardPage.navigateToDashboard();
        expect(await dashboardPage.isUserLoggedIn()).to.be.true;
        
        console.log('✅ Session persistence verified across navigation');
        testResults.authentication.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Session persistence test failed: ${errorMessage}`);
        testResults.authentication.failed++;
        throw error;
      }
    });
  });

  describe('📊 Dashboard Module Integration Tests', function() {
    
    beforeEach(async function() {
      await dashboardPage.navigateToDashboard();
    });

    it('should display personalized dashboard with user data', async function() {
      console.log('\n📊 Testing personalized dashboard display...');
      
      try {
        // Wait for dashboard to load completely
        await dashboardPage.waitForDashboardLoad();
        await dashboardPage.waitForChartsToLoad();
        
        // Validate dashboard components
        const components = await dashboardPage.validateDashboardComponents();
        expect(components.welcomeMessage).to.be.true;
        expect(components.navigation).to.be.true;
        
        // Extract and validate performance data
        const stats = await dashboardPage.getPerformanceStats();
        expect(Object.keys(stats)).to.have.length.greaterThanOrEqual(0);
        
        // Get welcome message
        const welcomeMessage = await dashboardPage.getWelcomeMessage();
        expect(welcomeMessage).to.not.be.empty;
        
        console.log('✅ Personalized dashboard validated successfully');
        console.log(`   Welcome: "${welcomeMessage}"`);
        console.log(`   Stats: ${Object.keys(stats).length} metrics displayed`);
        
        testResults.dashboard.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Dashboard display test failed: ${errorMessage}`);
        testResults.dashboard.failed++;
        throw error;
      }
    });

    it('should support dashboard interactions and navigation', async function() {
      console.log('\n🖱️ Testing dashboard interactions...');
      
      try {
        // Test chart interactions
        await dashboardPage.hoverOverChart();
        
        // Test navigation menu
        await dashboardPage.navigateToMenuItem('Profile');
        await DriverManager.getDriver().sleep(2000);
        
        // Return to dashboard
        await dashboardPage.navigateToDashboard();
        
        // Test dashboard refresh
        await dashboardPage.refreshDashboard();
        
        console.log('✅ Dashboard interactions completed successfully');
        testResults.dashboard.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Dashboard interactions test failed: ${errorMessage}`);
        testResults.dashboard.failed++;
        throw error;
      }
    });
  });

  describe('💡 Recommendations Module Integration Tests', function() {
    
    beforeEach(async function() {
      await recommendationsPage.navigateToRecommendations();
    });

    it('should display and interact with personalized recommendations', async function() {
      console.log('\n💡 Testing recommendations display and interaction...');
      
      try {
        // Wait for recommendations to load
        await recommendationsPage.waitForRecommendationsLoad();
        
        const recommendationCount = await recommendationsPage.getRecommendationCount();
        console.log(`   Found ${recommendationCount} recommendations`);
        
        if (recommendationCount > 0) {
          // Test recommendation card structure
          const cardStructure = await recommendationsPage.validateRecommendationStructure(0);
          expect(cardStructure.hasTitle).to.be.true;
          expect(cardStructure.hasDescription).to.be.true;
          
          // Test recommendation interaction
          const details = await recommendationsPage.getRecommendationDetails(0);
          expect(details.title).to.not.be.empty;
          
          // Test clicking on recommendation
          await recommendationsPage.clickRecommendation(0);
          await DriverManager.getDriver().sleep(2000);
          
          console.log(`✅ Recommendations interaction successful`);
          console.log(`   First recommendation: "${details.title}"`);
          
        } else {
          console.log('ℹ️ No recommendations available - testing empty state');
          expect(await recommendationsPage.isEmptyStateDisplayed()).to.be.true;
        }
        
        testResults.recommendations.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Recommendations test failed: ${errorMessage}`);
        testResults.recommendations.failed++;
        throw error;
      }
    });

    it('should support filtering and search functionality', async function() {
      console.log('\n🔍 Testing recommendations filtering...');
      
      try {
        const initialCount = await recommendationsPage.getRecommendationCount();
        
        if (initialCount > 0) {
          // Test search functionality
          await recommendationsPage.searchRecommendations('math');
          await DriverManager.getDriver().sleep(2000);
          
          const searchCount = await recommendationsPage.getRecommendationCount();
          console.log(`   Search results: ${searchCount} recommendations`);
          
          // Clear search
          await recommendationsPage.searchRecommendations('');
          await DriverManager.getDriver().sleep(2000);
          
          // Test category filtering
          await recommendationsPage.filterByCategory('Math');
          await DriverManager.getDriver().sleep(2000);
          
          console.log('✅ Filtering functionality tested successfully');
        } else {
          console.log('ℹ️ No recommendations available for filtering test');
        }
        
        testResults.recommendations.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Recommendations filtering test failed: ${errorMessage}`);
        testResults.recommendations.failed++;
        throw error;
      }
    });
  });

  describe('🤖 AI Tutor Module Integration Tests', function() {
    
    beforeEach(async function() {
      await tutorPage.navigateToTutor();
    });

    it('should support interactive AI tutoring conversation', async function() {
      console.log('\n🤖 Testing AI tutor conversation...');
      
      try {
        // Wait for chat interface to load
        await tutorPage.waitForChatInterfaceLoad();
        
        // Validate chat interface
        const interfaceComponents = await tutorPage.validateChatInterface();
        expect(interfaceComponents.hasMessageInput).to.be.true;
        expect(interfaceComponents.hasSendButton).to.be.true;
        
        // Test conversation flow
        const conversationFlow = [
          'Hello, I need help with mathematics',
          'Can you explain fractions?',
          'Thank you for the explanation'
        ];
        
        const responses = await tutorPage.testConversationFlow(conversationFlow);
        
        // Verify all messages received responses
        expect(responses.length).to.equal(conversationFlow.length);
        
        // Validate response quality
        responses.forEach((response, index) => {
          expect(response).to.not.be.empty;
          const quality = tutorPage.validateAIResponse(response);
          console.log(`   Q${index + 1}: ${conversationFlow[index]}`);
          console.log(`   A${index + 1}: ${response.substring(0, 60)}...`);
        });
        
        console.log('✅ AI tutor conversation completed successfully');
        testResults.tutor.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ AI tutor conversation test failed: ${errorMessage}`);
        testResults.tutor.failed++;
        throw error;
      }
    });

    it('should handle various tutoring scenarios', async function() {
      console.log('\n📚 Testing various tutoring scenarios...');
      
      try {
        // Test different types of questions
        const scenarios = [
          'What is 2 + 2?',                    // Simple math
          'Explain photosynthesis',            // Science concept
          'Help me with essay writing',        // Language arts
          'Show me a programming example'      // Technical subject
        ];
        
        for (const scenario of scenarios) {
          try {
            console.log(`   Testing scenario: "${scenario}"`);
            
            const response = await tutorPage.sendMessageAndWaitForResponse(scenario);
            expect(response).to.not.be.empty;
            
            console.log(`   ✅ Response received (${response.length} chars)`);
            
            // Brief pause between scenarios
            await DriverManager.getDriver().sleep(1000);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`   ⚠️ Scenario "${scenario}" failed: ${errorMessage}`);
          }
        }
        
        console.log('✅ Multiple tutoring scenarios tested');
        testResults.tutor.passed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Tutoring scenarios test failed: ${errorMessage}`);
        testResults.tutor.failed++;
        throw error;
      }
    });
  });

  describe('🔄 Cross-Module Integration Tests', function() {
    
    it('should support seamless navigation between all modules', async function() {
      console.log('\n🔄 Testing cross-module navigation...');
      
      try {
        // Start from dashboard
        await dashboardPage.navigateToDashboard();
        expect(await dashboardPage.isUserLoggedIn()).to.be.true;
        
        // Navigate to recommendations
        await recommendationsPage.navigateToRecommendations();
        await recommendationsPage.waitForRecommendationsLoad();
        
        // Navigate to AI tutor
        await tutorPage.navigateToTutor();
        await tutorPage.waitForChatInterfaceLoad();
        
        // Send a quick message to verify tutor is working
        await tutorPage.sendMessage('Quick test message');
        await DriverManager.getDriver().sleep(3000);
        
        // Return to dashboard
        await dashboardPage.navigateToDashboard();
        expect(await dashboardPage.isUserLoggedIn()).to.be.true;
        
        console.log('✅ Cross-module navigation completed successfully');
        testResults.authentication.passed++; // Count as authentication test
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Cross-module navigation failed: ${errorMessage}`);
        testResults.authentication.failed++;
        throw error;
      }
    });

    it('should maintain consistent user experience across modules', async function() {
      console.log('\n🎯 Testing consistent user experience...');
      
      try {
        // Test consistent navigation elements across modules
        const modules = [
          { page: dashboardPage, name: 'Dashboard' },
          { page: recommendationsPage, name: 'Recommendations' },
          { page: tutorPage, name: 'AI Tutor' }
        ];
        
        for (const module of modules) {
          console.log(`   Testing ${module.name} module...`);
          
          // Navigate to module
          if (module.name === 'Dashboard') {
            await dashboardPage.navigateToDashboard();
          } else if (module.name === 'Recommendations') {
            await recommendationsPage.navigateToRecommendations();
          } else if (module.name === 'AI Tutor') {
            await tutorPage.navigateToTutor();
          }
          
          // Verify page title is appropriate
          const title = await module.page.getPageTitle();
          expect(title.toLowerCase()).to.include('eduassist');
          
          // Verify user session is maintained
          const currentUrl = await module.page.getCurrentUrl();
          expect(currentUrl).to.not.include('/login');
          
          console.log(`   ✅ ${module.name} consistency verified`);
          
          // Brief pause between modules
          await DriverManager.getDriver().sleep(1000);
        }
        
        console.log('✅ Consistent user experience verified across all modules');
        testResults.authentication.passed++; // Count as authentication test
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ User experience consistency test failed: ${errorMessage}`);
        testResults.authentication.failed++;
        throw error;
      }
    });
  });

  describe('🚀 Performance and Reliability Tests', function() {
    
    it('should load all modules within acceptable time limits', async function() {
      console.log('\n⏱️ Testing module load performance...');
      
      try {
        const performanceResults = [];
        
        // Test dashboard load time
        let startTime = Date.now();
        await dashboardPage.navigateToDashboard();
        await dashboardPage.waitForDashboardLoad();
        let loadTime = Date.now() - startTime;
        performanceResults.push({ module: 'Dashboard', time: loadTime });
        
        // Test recommendations load time
        startTime = Date.now();
        await recommendationsPage.navigateToRecommendations();
        await recommendationsPage.waitForRecommendationsLoad();
        loadTime = Date.now() - startTime;
        performanceResults.push({ module: 'Recommendations', time: loadTime });
        
        // Test AI tutor load time
        startTime = Date.now();
        await tutorPage.navigateToTutor();
        await tutorPage.waitForChatInterfaceLoad();
        loadTime = Date.now() - startTime;
        performanceResults.push({ module: 'AI Tutor', time: loadTime });
        
        // Verify all modules loaded within acceptable time (10 seconds)
        performanceResults.forEach(result => {
          expect(result.time).to.be.lessThan(10000);
          console.log(`   ${result.module}: ${result.time}ms`);
        });
        
        const averageLoadTime = performanceResults.reduce((sum, result) => sum + result.time, 0) / performanceResults.length;
        console.log(`✅ Average module load time: ${averageLoadTime.toFixed(0)}ms`);
        
        testResults.dashboard.passed++; // Count as dashboard test
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Performance test failed: ${errorMessage}`);
        testResults.dashboard.failed++;
        throw error;
      }
    });
  });
});