/**
 * Login Page Object Model for EduAssist Authentication Module
 * Demonstrates various locator strategies and authentication testing
 */

import { By } from 'selenium-webdriver';
import { BasePage } from './base-page';
import { TestConfig } from '../config/test-config';

export class LoginPage extends BasePage {
  
  // Page Elements using different locator strategies
  private readonly emailInput = By.css('input[type="email"]'); // CSS selector
  private readonly passwordInput = By.css('input[type="password"]'); // CSS selector
  private readonly loginButton = By.xpath('//button[contains(text(), "Sign In") or contains(text(), "Login")]'); // XPath
  private readonly signupLink = By.linkText('Sign up'); // Link text locator
  private readonly errorMessage = By.css('.error-message, .alert-error, [role="alert"]'); // CSS selector with multiple options
  private readonly forgotPasswordLink = By.partialLinkText('Forgot'); // Partial link text
  private readonly rememberMeCheckbox = By.css('input[type="checkbox"]'); // CSS selector
  
  // Alternative selectors using data-testid (more reliable)
  private readonly emailInputTestId = By.css('[data-testid="email-input"]');
  private readonly passwordInputTestId = By.css('[data-testid="password-input"]');
  private readonly loginButtonTestId = By.css('[data-testid="login-button"]');

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.driver.get(`${TestConfig.baseUrl}/login`);
    await this.waitForPageLoad();
  }

  /**
   * Perform login with credentials
   * Demonstrates form interaction and explicit waits
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string): Promise<void> {
    // Try data-testid selectors first, fallback to generic selectors
    try {
      await this.typeText(this.emailInputTestId, email);
      await this.typeText(this.passwordInputTestId, password);
      await this.clickElement(this.loginButtonTestId);
    } catch (error) {
      // Fallback to generic selectors
      console.log('Using fallback selectors for login form');
      await this.typeText(this.emailInput, email);
      await this.typeText(this.passwordInput, password);
      await this.clickElement(this.loginButton);
    }
    
    // Wait for navigation or error message
    await this.driver.sleep(2000); // Brief pause for form submission
  }

  /**
   * Login with valid test user
   */
  async loginWithValidUser(): Promise<void> {
    const { email, password } = TestConfig.testUsers.validUser;
    await this.login(email, password);
  }

  /**
   * Attempt login with invalid credentials
   * Useful for negative testing
   */
  async loginWithInvalidCredentials(): Promise<void> {
    await this.login('invalid@email.com', 'wrongpassword');
  }

  /**
   * Check if login form is displayed
   * Demonstrates element visibility checking
   */
  async isLoginFormDisplayed(): Promise<boolean> {
    try {
      return await this.isElementDisplayed(this.emailInput) && 
             await this.isElementDisplayed(this.passwordInput) &&
             await this.isElementDisplayed(this.loginButton);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get error message text
   * Useful for validation testing
   */
  async getErrorMessage(): Promise<string> {
    try {
      return await this.getText(this.errorMessage);
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if error message is displayed
   */
  async isErrorMessageDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.errorMessage);
  }

  /**
   * Click on signup link
   * Demonstrates navigation testing
   */
  async clickSignupLink(): Promise<void> {
    await this.clickElement(this.signupLink);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPasswordLink(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe(): Promise<void> {
    await this.clickElement(this.rememberMeCheckbox);
  }

  /**
   * Wait for successful login redirect
   * Demonstrates explicit wait for navigation
   */
  async waitForLoginSuccess(): Promise<void> {
    // Wait for redirect to dashboard or home page
    await this.driver.wait(async () => {
      const currentUrl = await this.getCurrentUrl();
      return currentUrl.includes('/dashboard') || 
             currentUrl.includes('/home') || 
             !currentUrl.includes('/login');
    }, TestConfig.timeouts.medium);
  }

  /**
   * Verify page title contains expected text
   */
  async verifyPageTitle(): Promise<boolean> {
    const title = await this.getPageTitle();
    return title.toLowerCase().includes('login') || 
           title.toLowerCase().includes('sign in') ||
           title.toLowerCase().includes('eduassist');
  }
}