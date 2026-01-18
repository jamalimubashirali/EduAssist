/**
 * Signup Page Object Model for EduAssist Registration Module
 * Demonstrates form validation and user registration testing
 */

import { By } from 'selenium-webdriver';
import { BasePage } from './base-page';
import { TestConfig } from '../config/test-config';

export class SignupPage extends BasePage {
  
  // Registration form elements using various locator strategies
  private readonly firstNameInput = By.css('input[name="firstName"], input[placeholder*="First"]'); // CSS with multiple options
  private readonly lastNameInput = By.css('input[name="lastName"], input[placeholder*="Last"]');
  private readonly emailInput = By.css('input[type="email"]');
  private readonly passwordInput = By.css('input[type="password"]');
  private readonly confirmPasswordInput = By.css('input[name="confirmPassword"], input[placeholder*="Confirm"]');
  private readonly signupButton = By.xpath('//button[contains(text(), "Sign Up") or contains(text(), "Register") or contains(text(), "Create Account")]');
  private readonly loginLink = By.linkText('Sign in');
  private readonly termsCheckbox = By.css('input[type="checkbox"]');
  private readonly errorMessages = By.css('.error-message, .field-error, [role="alert"]');
  private readonly successMessage = By.css('.success-message, .alert-success');

  // Alternative data-testid selectors
  private readonly firstNameTestId = By.css('[data-testid="first-name-input"]');
  private readonly lastNameTestId = By.css('[data-testid="last-name-input"]');
  private readonly emailTestId = By.css('[data-testid="email-input"]');
  private readonly passwordTestId = By.css('[data-testid="password-input"]');
  private readonly confirmPasswordTestId = By.css('[data-testid="confirm-password-input"]');
  private readonly signupButtonTestId = By.css('[data-testid="signup-button"]');

  /**
   * Navigate to signup page
   */
  async navigateToSignup(): Promise<void> {
    await this.driver.get(`${TestConfig.baseUrl}/register`);
    await this.waitForPageLoad();
  }

  /**
   * Fill out registration form
   * Demonstrates comprehensive form interaction
   * @param userData - User registration data
   */
  async fillRegistrationForm(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }): Promise<void> {
    const confirmPassword = userData.confirmPassword || userData.password;

    try {
      // Try data-testid selectors first
      await this.typeText(this.firstNameTestId, userData.firstName);
      await this.typeText(this.lastNameTestId, userData.lastName);
      await this.typeText(this.emailTestId, userData.email);
      await this.typeText(this.passwordTestId, userData.password);
      await this.typeText(this.confirmPasswordTestId, confirmPassword);
    } catch (error) {
      // Fallback to generic selectors
      console.log('Using fallback selectors for registration form');
      await this.typeText(this.firstNameInput, userData.firstName);
      await this.typeText(this.lastNameInput, userData.lastName);
      await this.typeText(this.emailInput, userData.email);
      await this.typeText(this.passwordInput, userData.password);
      await this.typeText(this.confirmPasswordInput, confirmPassword);
    }
  }

  /**
   * Submit registration form
   */
  async submitRegistration(): Promise<void> {
    try {
      await this.clickElement(this.signupButtonTestId);
    } catch (error) {
      await this.clickElement(this.signupButton);
    }
    
    // Wait for form submission
    await this.driver.sleep(2000);
  }

  /**
   * Complete full registration process
   * @param userData - User registration data
   */
  async registerNewUser(userData?: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    const user = userData || TestConfig.testUsers.newUser;
    
    await this.fillRegistrationForm(user);
    await this.acceptTermsIfPresent();
    await this.submitRegistration();
  }

  /**
   * Accept terms and conditions if checkbox is present
   */
  async acceptTermsIfPresent(): Promise<void> {
    try {
      if (await this.isElementDisplayed(this.termsCheckbox)) {
        await this.clickElement(this.termsCheckbox);
      }
    } catch (error) {
      // Terms checkbox might not be present
      console.log('Terms checkbox not found or not required');
    }
  }

  /**
   * Check if registration form is displayed
   */
  async isRegistrationFormDisplayed(): Promise<boolean> {
    try {
      return await this.isElementDisplayed(this.emailInput) && 
             await this.isElementDisplayed(this.passwordInput) &&
             await this.isElementDisplayed(this.signupButton);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get validation error messages
   * Useful for form validation testing
   */
  async getErrorMessages(): Promise<string[]> {
    try {
      const errorElements = await this.findElements(this.errorMessages);
      const messages: string[] = [];
      
      for (const element of errorElements) {
        const text = await element.getText();
        if (text.trim()) {
          messages.push(text.trim());
        }
      }
      
      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if any error messages are displayed
   */
  async hasErrorMessages(): Promise<boolean> {
    const errors = await this.getErrorMessages();
    return errors.length > 0;
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    try {
      return await this.getText(this.successMessage);
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if success message is displayed
   */
  async isSuccessMessageDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.successMessage);
  }

  /**
   * Click login link to navigate to login page
   */
  async clickLoginLink(): Promise<void> {
    await this.clickElement(this.loginLink);
  }

  /**
   * Wait for successful registration
   * Demonstrates waiting for different success indicators
   */
  async waitForRegistrationSuccess(): Promise<void> {
    await this.driver.wait(async () => {
      // Check for success message or redirect
      const hasSuccessMessage = await this.isSuccessMessageDisplayed();
      const currentUrl = await this.getCurrentUrl();
      const redirectedToLogin = currentUrl.includes('/login');
      const redirectedToDashboard = currentUrl.includes('/dashboard');
      
      return hasSuccessMessage || redirectedToLogin || redirectedToDashboard;
    }, TestConfig.timeouts.medium);
  }

  /**
   * Test password strength validation
   * Demonstrates testing dynamic form validation
   */
  async testPasswordStrength(password: string): Promise<string> {
    await this.typeText(this.passwordInput, password);
    
    // Wait for password strength indicator to update
    await this.driver.sleep(1000);
    
    try {
      const strengthIndicator = By.css('.password-strength, .strength-meter, [data-testid="password-strength"]');
      return await this.getText(strengthIndicator);
    } catch (error) {
      return '';
    }
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(): Promise<boolean> {
    const title = await this.getPageTitle();
    return title.toLowerCase().includes('sign up') || 
           title.toLowerCase().includes('register') ||
           title.toLowerCase().includes('create account') ||
           title.toLowerCase().includes('eduassist');
  }
}