/**
 * WebDriver Manager for EduAssist E2E Tests
 * Handles browser setup, teardown, and common driver operations
 */

import { Builder, WebDriver, Capabilities, until, By } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { TestConfig } from '../config/test-config';

// Export By for use in other modules
export { By };

export class DriverManager {
  private static driver: WebDriver;

  /**
   * Initialize WebDriver with Chrome configuration
   * Demonstrates proper browser setup with explicit options
   */
  static async initializeDriver(): Promise<WebDriver> {
    const chromeOptions = new ChromeOptions();
    
    // Configure Chrome options for testing
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    
    // Run headless if specified in config
    if (TestConfig.browser.headless) {
      chromeOptions.addArguments('--headless');
    }

    // Build WebDriver with Chrome capabilities
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // Set implicit wait - WebDriver will wait up to 5 seconds for elements
    await this.driver.manage().setTimeouts({
      implicit: TestConfig.browser.implicitWait,
      pageLoad: TestConfig.browser.pageLoadTimeout,
      script: TestConfig.browser.scriptTimeout
    });

    // Maximize window for consistent testing
    await this.driver.manage().window().maximize();

    return this.driver;
  }

  /**
   * Get current WebDriver instance
   */
  static getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('WebDriver not initialized. Call initializeDriver() first.');
    }
    return this.driver;
  }

  /**
   * Navigate to a specific URL
   * @param url - The URL to navigate to
   */
  static async navigateTo(url: string): Promise<void> {
    await this.driver.get(url);
    
    // Wait for page to be fully loaded
    await this.driver.wait(until.titleContains('EduAssist'), TestConfig.timeouts.medium);
  }

  /**
   * Wait for element to be located using explicit wait
   * Demonstrates WebDriverWait with until conditions
   * @param locator - By locator for the element
   * @param timeout - Optional timeout (defaults to medium timeout)
   */
  static async waitForElement(locator: By, timeout: number = TestConfig.timeouts.medium) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  /**
   * Wait for element to be visible and clickable
   * @param locator - By locator for the element
   * @param timeout - Optional timeout
   */
  static async waitForElementClickable(locator: By, timeout: number = TestConfig.timeouts.medium) {
    const element = await this.waitForElement(locator, timeout);
    return await this.driver.wait(until.elementIsVisible(element), timeout);
  }

  /**
   * Wait for text to be present in element
   * Useful for dynamic content like AI responses
   * @param locator - By locator for the element
   * @param text - Text to wait for
   * @param timeout - Optional timeout
   */
  static async waitForTextInElement(locator: By, text: string, timeout: number = TestConfig.timeouts.long) {
    return await this.driver.wait(until.elementTextContains(
      await this.waitForElement(locator), text
    ), timeout);
  }

  /**
   * Take screenshot for debugging
   * @param filename - Name for the screenshot file
   */
  static async takeScreenshot(filename: string): Promise<void> {
    const screenshot = await this.driver.takeScreenshot();
    require('fs').writeFileSync(`./screenshots/${filename}.png`, screenshot, 'base64');
  }

  /**
   * Execute JavaScript in the browser
   * @param script - JavaScript code to execute
   * @param args - Arguments to pass to the script
   */
  static async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.executeScript(script, ...args);
  }

  /**
   * Clean up and quit WebDriver
   * Essential for proper test teardown
   */
  static async quitDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  /**
   * Refresh the current page
   */
  static async refresh(): Promise<void> {
    await this.driver.navigate().refresh();
  }

  /**
   * Get current page title
   */
  static async getTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  /**
   * Get current URL
   */
  static async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }
}