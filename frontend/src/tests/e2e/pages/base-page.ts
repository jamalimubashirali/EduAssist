/**
 * Base Page Object Model for EduAssist
 * Contains common functionality shared across all pages
 */

import { WebDriver, By, WebElement, until } from 'selenium-webdriver';
import { DriverManager } from '../utils/driver-manager';
import { TestConfig } from '../config/test-config';

export abstract class BasePage {
  protected driver: WebDriver;

  constructor() {
    this.driver = DriverManager.getDriver();
  }

  /**
   * Find element using various locator strategies
   * Demonstrates different By locators (id, css, xpath)
   */
  protected async findElement(locator: By): Promise<WebElement> {
    return await DriverManager.waitForElement(locator);
  }

  protected async findElements(locator: By): Promise<WebElement[]> {
    return await this.driver.findElements(locator);
  }

  /**
   * Click element with explicit wait
   * Ensures element is clickable before clicking
   */
  protected async clickElement(locator: By): Promise<void> {
    const element = await DriverManager.waitForElementClickable(locator);
    await element.click();
  }

  /**
   * Type text into input field
   * Clears field first, then types new text
   */
  protected async typeText(locator: By, text: string): Promise<void> {
    const element = await this.findElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * Get text content from element
   */
  protected async getText(locator: By): Promise<string> {
    const element = await this.findElement(locator);
    return await element.getText();
  }

  /**
   * Check if element is displayed
   */
  protected async isElementDisplayed(locator: By): Promise<boolean> {
    try {
      const element = await this.findElement(locator);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for page to load completely
   * Can be overridden by specific pages
   */
  protected async waitForPageLoad(): Promise<void> {
    await this.driver.wait(
      until.titleContains('EduAssist'), 
      TestConfig.timeouts.medium
    );
  }

  /**
   * Scroll element into view
   */
  protected async scrollToElement(locator: By): Promise<void> {
    const element = await this.findElement(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
  }

  /**
   * Wait for element to contain specific text
   * Useful for dynamic content
   */
  protected async waitForElementText(locator: By, expectedText: string, timeout: number = TestConfig.timeouts.medium): Promise<void> {
    await DriverManager.waitForTextInElement(locator, expectedText, timeout);
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.driver.getTitle();
  }
}