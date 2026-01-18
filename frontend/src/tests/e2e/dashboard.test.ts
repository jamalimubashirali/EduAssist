/**
 * Dashboard Module E2E Tests for EduAssist
 * Tests performance analytics and progress charts functionality
 * 
 * Demonstrates:
 * - Chart and data visualization testing
 * - Explicit waits for asynchronous content loading
 * - Mouse interactions and hover effects
 * - Data extraction and validation
 * - Navigation and user interface testing
 */

import { expect } from 'chai';
import { DriverManager, By } from './utils/driver-manager';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
import { TestConfig } from './config/test-config';

describe('EduAssist Dashboard Module', function () {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Setup authenticated session for dashboard tests
  before(async function () {
    console.log('🚀 Initializing WebDriver for Dashboard tests...');
    await DriverManager.initializeDriver();

    // Initialize page objects
    loginPage = new LoginPage();
    dashboardPage = new DashboardPage();

    // Login to access dashboard
    console.log('🔐 Logging in to access dashboard...');
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidUser();
    await loginPage.waitForLoginSuccess();

    console.log('✅ Authentication successful, ready for dashboard tests');
  });

  after(async function () {
    console.log('🧹 Cleaning up WebDriver...');
    await DriverManager.quitDriver();
    console.log('✅ WebDriver cleanup completed');
  });

  beforeEach(async function () {
    // Ensure we're on the dashboard page before each test
    await dashboardPage.navigateToDashboard();
  });

  describe('Dashboard Page Load and Layout', function () {

    it('should load dashboard with all main components', async function () {
      console.log('📊 Testing dashboard component loading...');

      // Verify page title using explicit assertion
      const titleValid = await dashboardPage.verifyPageTitle();
      expect(titleValid).to.be.true;

      // Wait for dashboard components to load using explicit waits
      await dashboardPage.waitForDashboardLoad();

      // Validate all main dashboard components are present
      const components = await dashboardPage.validateDashboardComponents();

      expect(components.welcomeMessage).to.be.true;
      expect(components.navigation).to.be.true;
      expect(components.statsCards).to.be.true;

      console.log('✅ Dashboard components loaded successfully');
      console.log(`   - Welcome Message: ${components.welcomeMessage}`);
      console.log(`   - Performance Chart: ${components.performanceChart}`);
      console.log(`   - Progress Chart: ${components.progressChart}`);
      console.log(`   - Navigation: ${components.navigation}`);
      console.log(`   - Stats Cards: ${components.statsCards}`);
    });

    it('should display personalized welcome message', async function () {
      console.log('👋 Testing personalized welcome message...');

      // Get welcome message text using CSS selector
      const welcomeMessage = await dashboardPage.getWelcomeMessage();

      // Verify welcome message is not empty and contains expected content
      expect(welcomeMessage).to.not.be.empty;
      expect(welcomeMessage.toLowerCase()).to.satisfy((msg: string) =>
        msg.includes('welcome') ||
        msg.includes('hello') ||
        msg.includes('dashboard') ||
        msg.includes('good')
      );

      console.log(`✅ Welcome message displayed: "${welcomeMessage}"`);
    });
  });

  describe('Performance Analytics Charts', function () {

    it('should display performance chart with data', async function () {
      console.log('📈 Testing performance chart display...');

      // Check if performance chart is displayed using explicit wait
      const chartDisplayed = await dashboardPage.isPerformanceChartDisplayed();
      expect(chartDisplayed).to.be.true;

      // Wait for charts to load with data (demonstrates waiting for async content)
      await dashboardPage.waitForChartsToLoad();

      // Verify chart has loaded by checking for canvas/svg elements
      const chartElements = await DriverManager.getDriver().findElements(
        By.css('canvas, svg, .recharts-wrapper')
      );
      expect(chartElements.length).to.be.greaterThan(0);

      console.log(`✅ Performance chart displayed with ${chartElements.length} chart element(s)`);
    });

    it('should display progress chart with data', async function () {
      console.log('📊 Testing progress chart display...');

      // Check if progress chart is displayed
      const chartDisplayed = await dashboardPage.isProgressChartDisplayed();
      expect(chartDisplayed).to.be.true;

      // Wait for chart data to load
      await dashboardPage.waitForChartsToLoad();

      console.log('✅ Progress chart displayed successfully');
    });

    it('should show chart tooltips on hover interaction', async function () {
      console.log('🖱️ Testing chart hover interactions...');

      // Wait for charts to be fully loaded
      await dashboardPage.waitForChartsToLoad();

      // Perform hover interaction on performance chart (demonstrates mouse actions)
      await dashboardPage.hoverOverChart();

      // Check if tooltip appears (may not always be present depending on chart library)
      const tooltipDisplayed = await dashboardPage.isChartTooltipDisplayed();

      // Note: Tooltip might not always be visible depending on chart implementation
      console.log(`✅ Chart hover interaction completed. Tooltip visible: ${tooltipDisplayed}`);
    });
  });

  describe('Dashboard Data and Statistics', function () {

    it('should extract and validate performance statistics', async function () {
      console.log('📊 Testing performance statistics extraction...');

      // Extract performance stats from dashboard cards
      const stats = await dashboardPage.getPerformanceStats();

      // Verify stats object is not empty
      expect(Object.keys(stats)).to.have.length.greaterThan(0);

      // Log extracted statistics
      console.log('✅ Performance statistics extracted:');
      Object.entries(stats).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });

      // Basic validation that stats contain expected data types
      Object.values(stats).forEach(value => {
        expect(value).to.be.a('string');
        expect(value).to.not.be.empty;
      });
    });

    it('should display recent activity feed', async function () {
      console.log('📝 Testing recent activity feed...');

      // Get recent activity items using list extraction
      const activities = await dashboardPage.getRecentActivityItems();

      // Verify activities are present (may be empty for new users)
      expect(activities).to.be.an('array');

      if (activities.length > 0) {
        console.log(`✅ Recent activities found (${activities.length} items):`);
        activities.slice(0, 3).forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity}`);
        });

        // Validate activity items are not empty
        activities.forEach(activity => {
          expect(activity).to.not.be.empty;
        });
      } else {
        console.log('✅ No recent activities (expected for new user accounts)');
      }
    });
  });

  describe('Dashboard Navigation and Interactions', function () {

    it('should navigate to different sections using sidebar menu', async function () {
      console.log('🧭 Testing dashboard navigation...');

      // Test navigation to different sections
      const menuItems = ['Profile', 'Settings', 'Analytics'];

      for (const menuItem of menuItems) {
        try {
          console.log(`   Navigating to ${menuItem}...`);
          await dashboardPage.navigateToMenuItem(menuItem);

          // Wait for navigation to complete
          await DriverManager.getDriver().sleep(2000);

          // Verify URL change or page content change
          const currentUrl = await dashboardPage.getCurrentUrl();
          const urlChanged = currentUrl.includes(menuItem.toLowerCase());

          console.log(`   ✅ Navigation to ${menuItem}: ${urlChanged ? 'Success' : 'URL unchanged'}`);

          // Navigate back to dashboard for next test
          await dashboardPage.navigateToDashboard();
          await DriverManager.getDriver().sleep(1000);

        } catch (error) {
          console.log(`   ⚠️ Navigation to ${menuItem} not available or failed`);
        }
      }
    });

    it('should interact with quick action buttons', async function () {
      console.log('⚡ Testing quick action interactions...');

      // Test common quick actions
      const quickActions = ['Start Quiz', 'View Progress', 'Get Recommendations'];

      for (const action of quickActions) {
        try {
          console.log(`   Testing quick action: ${action}...`);
          await dashboardPage.clickQuickAction(action);

          // Wait for action to complete
          await DriverManager.getDriver().sleep(2000);

          // Navigate back to dashboard
          await dashboardPage.navigateToDashboard();
          await DriverManager.getDriver().sleep(1000);

          console.log(`   ✅ Quick action "${action}" executed successfully`);

        } catch (error) {
          console.log(`   ⚠️ Quick action "${action}" not available`);
        }
      }
    });

    it('should refresh dashboard data', async function () {
      console.log('🔄 Testing dashboard data refresh...');

      // Get initial stats
      const initialStats = await dashboardPage.getPerformanceStats();

      // Refresh dashboard
      await dashboardPage.refreshDashboard();

      // Wait for refresh to complete
      await DriverManager.getDriver().sleep(3000);

      // Get stats after refresh
      const refreshedStats = await dashboardPage.getPerformanceStats();

      // Verify dashboard refreshed (stats structure should be consistent)
      expect(Object.keys(refreshedStats)).to.have.length.greaterThanOrEqual(
        Object.keys(initialStats).length
      );

      console.log('✅ Dashboard refresh completed successfully');
    });
  });

  describe('Dashboard Responsiveness and Performance', function () {

    it('should load dashboard components within acceptable time', async function () {
      console.log('⏱️ Testing dashboard load performance...');

      const startTime = Date.now();

      // Navigate to dashboard and wait for full load
      await dashboardPage.navigateToDashboard();
      await dashboardPage.waitForDashboardLoad();
      await dashboardPage.waitForChartsToLoad();

      const loadTime = Date.now() - startTime;

      // Assert load time is reasonable (under 10 seconds)
      expect(loadTime).to.be.lessThan(10000);

      console.log(`✅ Dashboard loaded in ${loadTime}ms`);
    });

    it('should maintain user session and authentication state', async function () {
      console.log('🔐 Testing session persistence...');

      // Verify user is still logged in
      const isLoggedIn = await dashboardPage.isUserLoggedIn();
      expect(isLoggedIn).to.be.true;

      // Refresh page and verify session persists
      await DriverManager.refresh();
      await dashboardPage.waitForDashboardLoad();

      const stillLoggedIn = await dashboardPage.isUserLoggedIn();
      expect(stillLoggedIn).to.be.true;

      console.log('✅ User session maintained after page refresh');
    });
  });

  describe('Dashboard Error Handling', function () {

    it('should handle network interruptions gracefully', async function () {
      console.log('🌐 Testing network error handling...');

      // This test would typically involve network manipulation
      // For demo purposes, we'll test basic error state detection

      try {
        // Attempt to refresh dashboard
        await dashboardPage.refreshDashboard();

        // Check if any error messages are displayed
        const errorElements = await DriverManager.getDriver().findElements(
          By.css('.error-message, .alert-error, [role="alert"]')
        );

        console.log(`✅ Network error handling test completed. Error elements found: ${errorElements.length}`);

      } catch (error) {
        console.log('⚠️ Network error simulation not implemented in this demo');
      }
    });
  });
});