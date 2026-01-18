/**
 * Simplified WebDriver Manager for EduAssist E2E Tests
 * Handles browser setup with better module compatibility
 */

const { Builder, By, until } = require('selenium-webdriver');
const { Options: ChromeOptions } = require('selenium-webdriver/chrome');

export class SimpleDriverManager {
  private static driver: any;

  /**
   * Initialize WebDriver with Chrome configuration
   */
  static async initializeDriver(): Promise<any> {
    const chromeOptions = new ChromeOptions();
    
    // Configure Chrome options for testing
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    
    // Run headless if specified
    if (process.env.HEADLESS === 'true') {
      chromeOptions.addArguments('--headless');
    }

    // Build WebDriver with Chrome capabilities
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // Set timeouts
    await this.driver.manage().setTimeouts({
      implicit: 5000,
      pageLoad: 30000,
      script: 30000
    });

    // Maximize window
    await this.driver.manage().window().maximize();

    return this.driver;
  }

  /**
   * Get current WebDriver instance
   */
  static getDriver(): any {
    if (!this.driver) {
      throw new Error('WebDriver not initialized. Call initializeDriver() first.');
    }
    return this.driver;
  }

  /**
   * Navigate to a specific URL
   */
  static async navigateTo(url: string): Promise<void> {
    await this.driver.get(url);
    await this.driver.wait(until.titleContains('EduAssist'), 15000);
  }

  /**
   * Wait for element to be located
   */
  static async waitForElement(locator: any, timeout: number = 15000) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  /**
   * Clean up and quit WebDriver
   */
  static async quitDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  /**
   * Get current URL
   */
  static async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Get current page title
   */
  static async getTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  /**
   * Refresh the current page
   */
  static async refresh(): Promise<void> {
    await this.driver.navigate().refresh();
  }
}

// Export By and until for convenience
export { By, until };