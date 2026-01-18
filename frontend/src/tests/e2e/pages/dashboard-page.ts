/**
 * Dashboard Page Object Model for EduAssist Dashboard Module
 * Demonstrates testing performance analytics and progress charts
 */

import { By, WebElement } from 'selenium-webdriver';
import { BasePage } from './base-page';
import { TestConfig } from '../config/test-config';

export class DashboardPage extends BasePage {
  
  // Dashboard elements using various locator strategies
  private readonly welcomeMessage = By.css('.welcome-message, [data-testid="welcome-message"], h1, .greeting');
  private readonly performanceChart = By.css('.performance-chart, [data-testid="performance-chart"], .chart-container');
  private readonly progressChart = By.css('.progress-chart, [data-testid="progress-chart"], .progress-container');
  private readonly navigationMenu = By.css('.nav-menu, .sidebar, [data-testid="navigation-menu"]');
  private readonly userProfile = By.css('.user-profile, [data-testid="user-profile"], .profile-section');
  private readonly statsCards = By.css('.stats-card, .metric-card, [data-testid="stats-card"]');
  private readonly recentActivity = By.css('.recent-activity, [data-testid="recent-activity"], .activity-feed');
  private readonly quickActions = By.css('.quick-actions, [data-testid="quick-actions"], .action-buttons');
  
  // Chart-specific elements
  private readonly chartCanvas = By.css('canvas, svg, .recharts-wrapper');
  private readonly chartLegend = By.css('.chart-legend, .recharts-legend-wrapper');
  private readonly chartTooltip = By.css('.chart-tooltip, .recharts-tooltip-wrapper');
  
  // Navigation elements
  private readonly dashboardLink = By.xpath('//a[contains(text(), "Dashboard") or contains(@href, "dashboard")]');
  private readonly profileLink = By.xpath('//a[contains(text(), "Profile") or contains(@href, "profile")]');
  private readonly settingsLink = By.xpath('//a[contains(text(), "Settings") or contains(@href, "settings")]');
  private readonly logoutButton = By.xpath('//button[contains(text(), "Logout") or contains(text(), "Sign Out")]');

  /**
   * Navigate to dashboard page
   */
  async navigateToDashboard(): Promise<void> {
    await this.driver.get(`${TestConfig.baseUrl}/dashboard`);
    await this.waitForPageLoad();
    await this.waitForDashboardLoad();
  }

  /**
   * Wait for dashboard components to load
   * Demonstrates waiting for dynamic content
   */
  async waitForDashboardLoad(): Promise<void> {
    // Wait for key dashboard elements to be present
    await this.driver.wait(async () => {
      try {
        const welcomeDisplayed = await this.isElementDisplayed(this.welcomeMessage);
        const navDisplayed = await this.isElementDisplayed(this.navigationMenu);
        return welcomeDisplayed && navDisplayed;
      } catch (error) {
        return false;
      }
    }, TestConfig.timeouts.medium);
  }

  /**
   * Get welcome message text
   * Demonstrates text extraction and validation
   */
  async getWelcomeMessage(): Promise<string> {
    try {
      return await this.getText(this.welcomeMessage);
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if performance chart is displayed
   * Demonstrates chart element validation
   */
  async isPerformanceChartDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.performanceChart);
  }

  /**
   * Check if progress chart is displayed
   */
  async isProgressChartDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.progressChart);
  }

  /**
   * Wait for charts to load with data
   * Demonstrates explicit wait for dynamic chart content
   */
  async waitForChartsToLoad(): Promise<void> {
    // Wait for chart canvas/svg elements to be present
    await this.driver.wait(async () => {
      try {
        const chartElements = await this.findElements(this.chartCanvas);
        return chartElements.length > 0;
      } catch (error) {
        return false;
      }
    }, TestConfig.timeouts.long);

    // Additional wait for chart data to render
    await this.driver.sleep(2000);
  }

  /**
   * Get performance statistics
   * Demonstrates data extraction from dashboard cards
   */
  async getPerformanceStats(): Promise<{ [key: string]: string }> {
    const stats: { [key: string]: string } = {};
    
    try {
      const statCards = await this.findElements(this.statsCards);
      
      for (let i = 0; i < statCards.length; i++) {
        const card = statCards[i];
        const text = await card.getText();
        
        // Extract metric name and value (basic parsing)
        const lines = text.split('\n');
        if (lines.length >= 2) {
          const value = lines[0];
          const label = lines[1];
          stats[label] = value;
        }
      }
    } catch (error) {
      console.log('Could not extract performance stats:', error);
    }
    
    return stats;
  }

  /**
   * Interact with chart elements
   * Demonstrates mouse interactions with charts
   */
  async hoverOverChart(): Promise<void> {
    try {
      const chart = await this.findElement(this.performanceChart);
      const actions = this.driver.actions({ async: true });
      await actions.move({ origin: chart }).perform();
      
      // Wait for tooltip to appear
      await this.driver.sleep(1000);
    } catch (error) {
      console.log('Could not hover over chart:', error);
    }
  }

  /**
   * Check if chart tooltip is displayed
   */
  async isChartTooltipDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.chartTooltip);
  }

  /**
   * Get recent activity items
   * Demonstrates list data extraction
   */
  async getRecentActivityItems(): Promise<string[]> {
    const activities: string[] = [];
    
    try {
      const activityContainer = await this.findElement(this.recentActivity);
      const activityItems = await activityContainer.findElements(By.css('li, .activity-item, .list-item'));
      
      for (const item of activityItems) {
        const text = await item.getText();
        if (text.trim()) {
          activities.push(text.trim());
        }
      }
    } catch (error) {
      console.log('Could not extract recent activities:', error);
    }
    
    return activities;
  }

  /**
   * Click on quick action button
   * @param actionText - Text of the action button to click
   */
  async clickQuickAction(actionText: string): Promise<void> {
    const actionButton = By.xpath(`//button[contains(text(), "${actionText}")]`);
    await this.clickElement(actionButton);
  }

  /**
   * Navigate using sidebar menu
   * Demonstrates navigation testing
   * @param menuItem - Menu item to click
   */
  async navigateToMenuItem(menuItem: string): Promise<void> {
    const menuLink = By.xpath(`//a[contains(text(), "${menuItem}") or contains(@href, "${menuItem.toLowerCase()}")]`);
    await this.clickElement(menuLink);
    
    // Wait for navigation
    await this.driver.sleep(2000);
  }

  /**
   * Check if user is logged in (dashboard accessible)
   */
  async isUserLoggedIn(): Promise<boolean> {
    try {
      const currentUrl = await this.getCurrentUrl();
      return currentUrl.includes('/dashboard') && 
             await this.isElementDisplayed(this.welcomeMessage);
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout from dashboard
   */
  async logout(): Promise<void> {
    try {
      await this.clickElement(this.logoutButton);
      
      // Wait for redirect to login page
      await this.driver.wait(async () => {
        const currentUrl = await this.getCurrentUrl();
        return currentUrl.includes('/login') || currentUrl.includes('/');
      }, TestConfig.timeouts.medium);
    } catch (error) {
      console.log('Logout button not found, trying alternative method');
      // Alternative logout method through profile menu
      await this.navigateToMenuItem('Profile');
      await this.clickElement(this.logoutButton);
    }
  }

  /**
   * Verify dashboard page title
   */
  async verifyPageTitle(): Promise<boolean> {
    const title = await this.getPageTitle();
    return title.toLowerCase().includes('dashboard') || 
           title.toLowerCase().includes('home') ||
           title.toLowerCase().includes('eduassist');
  }

  /**
   * Check if all main dashboard components are loaded
   * Comprehensive dashboard validation
   */
  async validateDashboardComponents(): Promise<{
    welcomeMessage: boolean;
    performanceChart: boolean;
    progressChart: boolean;
    navigation: boolean;
    statsCards: boolean;
  }> {
    return {
      welcomeMessage: await this.isElementDisplayed(this.welcomeMessage),
      performanceChart: await this.isPerformanceChartDisplayed(),
      progressChart: await this.isProgressChartDisplayed(),
      navigation: await this.isElementDisplayed(this.navigationMenu),
      statsCards: await this.isElementDisplayed(this.statsCards)
    };
  }

  /**
   * Refresh dashboard data
   * Demonstrates page refresh and data reload testing
   */
  async refreshDashboard(): Promise<void> {
    await this.driver.navigate().refresh();
    await this.waitForDashboardLoad();
    await this.waitForChartsToLoad();
  }
}