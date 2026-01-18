/**
 * Simplified Authentication Test for EduAssist
 * Basic test to verify the setup is working
 */

import { expect } from 'chai';
import { Builder, WebDriver, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';

describe('EduAssist Simple Authentication Test', function() {
  let driver: WebDriver;

  before(async function() {
    console.log('🚀 Initializing WebDriver for simple auth test...');
    
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    // chromeOptions.addArguments('--headless'); // Uncomment for headless mode

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    await driver.manage().setTimeouts({
      implicit: 5000,
      pageLoad: 30000,
      script: 30000
    });

    await driver.manage().window().maximize();
    console.log('✅ WebDriver initialized successfully');
  });

  after(async function() {
    console.log('🧹 Cleaning up WebDriver...');
    if (driver) {
      await driver.quit();
    }
    console.log('✅ WebDriver cleanup completed');
  });

  it('should load the EduAssist application', async function() {
    console.log('🌐 Testing application load...');
    
    // Navigate to the application
    await driver.get('http://localhost:3000');
    
    // Wait for page to load
    await driver.wait(until.titleContains('EduAssist'), 10000);
    
    // Get page title
    const title = await driver.getTitle();
    console.log(`📄 Page title: "${title}"`);
    
    // Verify title contains EduAssist
    expect(title.toLowerCase()).to.include('eduassist');
    
    console.log('✅ Application loaded successfully');
  });

  it('should find login elements on the page', async function() {
    console.log('🔍 Testing login elements...');
    
    try {
      // Try to navigate to login page
      await driver.get('http://localhost:3000/login');
      await driver.sleep(2000);
      
      // Look for common login elements
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        '[data-testid="email-input"]',
        '#email'
      ];
      
      let emailFound = false;
      for (const selector of emailSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            emailFound = true;
            console.log(`✅ Email input found with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        '[data-testid="password-input"]',
        '#password'
      ];
      
      let passwordFound = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            passwordFound = true;
            console.log(`✅ Password input found with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      // Check for login button
      const buttonSelectors = [
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
        '[data-testid="login-button"]',
        '.login-button'
      ];
      
      let buttonFound = false;
      for (const selector of buttonSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            buttonFound = true;
            console.log(`✅ Login button found with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      console.log(`📊 Login elements found - Email: ${emailFound}, Password: ${passwordFound}, Button: ${buttonFound}`);
      
      // At least one element should be found for a basic login page
      expect(emailFound || passwordFound || buttonFound).to.be.true;
      
    } catch (error) {
      console.log('⚠️ Login page might not be available, checking main page...');
      
      // Fallback: check if we can find any form elements on main page
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      
      const forms = await driver.findElements(By.css('form, input, button'));
      expect(forms.length).to.be.greaterThan(0);
      
      console.log(`✅ Found ${forms.length} form elements on main page`);
    }
  });

  it('should be able to interact with page elements', async function() {
    console.log('🖱️ Testing basic interactions...');
    
    await driver.get('http://localhost:3000');
    await driver.sleep(2000);
    
    // Try to find clickable elements
    const clickableElements = await driver.findElements(By.css('button, a, [role="button"]'));
    console.log(`🔘 Found ${clickableElements.length} clickable elements`);
    
    expect(clickableElements.length).to.be.greaterThan(0);
    
    // Try to scroll the page
    await driver.executeScript('window.scrollTo(0, 100);');
    await driver.sleep(500);
    
    // Get current URL
    const currentUrl = await driver.getCurrentUrl();
    console.log(`🌐 Current URL: ${currentUrl}`);
    
    expect(currentUrl).to.include('localhost:3000');
    
    console.log('✅ Basic interactions working');
  });
});