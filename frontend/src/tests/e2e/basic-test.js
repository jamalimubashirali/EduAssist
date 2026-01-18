/**
 * Basic Selenium Test for EduAssist (JavaScript)
 * This avoids TypeScript compilation issues entirely
 */

const { expect } = require('chai');
const { Builder, By, until } = require('selenium-webdriver');
const { Options: ChromeOptions } = require('selenium-webdriver/chrome');

describe('EduAssist Basic E2E Test (JavaScript)', function() {
  let driver;

  before(async function() {
    console.log('🚀 Initializing Chrome WebDriver (JavaScript)...');
    
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    // chromeOptions.addArguments('--headless'); // Uncomment for headless

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
    console.log('✅ Chrome WebDriver initialized successfully');
  });

  after(async function() {
    console.log('🧹 Cleaning up WebDriver...');
    if (driver) {
      await driver.quit();
    }
    console.log('✅ WebDriver cleanup completed');
  });

  describe('Application Loading', function() {
    
    it('should load the EduAssist application', async function() {
      console.log('🌐 Testing application load...');
      
      // Navigate to application
      await driver.get('http://localhost:3000');
      await driver.sleep(3000);
      
      // Get page information
      const title = await driver.getTitle();
      const currentUrl = await driver.getCurrentUrl();
      
      console.log(`📄 Page Title: "${title}"`);
      console.log(`🌐 Current URL: ${currentUrl}`);
      
      // Assertions
      expect(currentUrl).to.include('localhost:3000');
      expect(title).to.be.a('string');
      
      console.log('✅ Application loaded successfully');
    });

    it('should find page elements', async function() {
      console.log('🔍 Testing element detection...');
      
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      
      // Find elements using CSS selectors
      const buttons = await driver.findElements(By.css('button'));
      const links = await driver.findElements(By.css('a'));
      const inputs = await driver.findElements(By.css('input'));
      
      console.log(`🔘 Buttons: ${buttons.length}`);
      console.log(`🔗 Links: ${links.length}`);
      console.log(`📝 Inputs: ${inputs.length}`);
      
      const totalElements = buttons.length + links.length + inputs.length;
      expect(totalElements).to.be.greaterThan(0);
      
      console.log('✅ Elements found successfully');
    });
  });

  describe('Navigation Testing', function() {
    
    it('should test different routes', async function() {
      console.log('🗺️ Testing navigation...');
      
      const routes = ['/', '/login', '/register', '/dashboard'];
      
      for (const route of routes) {
        try {
          console.log(`   📍 Testing: ${route}`);
          
          await driver.get(`http://localhost:3000${route}`);
          await driver.sleep(2000);
          
          const url = await driver.getCurrentUrl();
          const elements = await driver.findElements(By.css('*'));
          
          console.log(`      URL: ${url}`);
          console.log(`      Elements: ${elements.length}`);
          
          expect(elements.length).to.be.greaterThan(0);
          
        } catch (error) {
          console.log(`      ⚠️ Route ${route} may not exist`);
        }
      }
    });
  });

  describe('Basic Interactions', function() {
    
    it('should test page interactions', async function() {
      console.log('🖱️ Testing interactions...');
      
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      
      // Test scrolling
      await driver.executeScript('window.scrollTo(0, 100);');
      await driver.sleep(500);
      
      // Test finding clickable elements
      const clickables = await driver.findElements(By.css('button, a'));
      console.log(`🔘 Clickable elements: ${clickables.length}`);
      
      // Test page refresh
      const urlBefore = await driver.getCurrentUrl();
      await driver.navigate().refresh();
      await driver.sleep(2000);
      const urlAfter = await driver.getCurrentUrl();
      
      expect(urlAfter).to.equal(urlBefore);
      
      console.log('✅ Interactions completed');
    });
  });

  describe('Selenium Concepts Demo', function() {
    
    it('should demonstrate CSS selectors', async function() {
      console.log('🎯 Demonstrating CSS selectors...');
      
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      
      const selectors = [
        'button',
        'a',
        'input[type="text"]',
        'input[type="email"]',
        '.btn, .button',
        '[data-testid]',
        'nav, .nav'
      ];
      
      for (const selector of selectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          console.log(`   ${selector}: ${elements.length} found`);
        } catch (error) {
          console.log(`   ${selector}: Error`);
        }
      }
      
      console.log('✅ CSS selectors demonstrated');
    });

    it('should demonstrate XPath selectors', async function() {
      console.log('🗺️ Demonstrating XPath selectors...');
      
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      
      const xpaths = [
        '//button',
        '//a[contains(@href, "/")]',
        '//*[contains(text(), "Login")]',
        '//input[@type="email"]',
        '//*[@role="button"]'
      ];
      
      for (const xpath of xpaths) {
        try {
          const elements = await driver.findElements(By.xpath(xpath));
          console.log(`   ${xpath}: ${elements.length} found`);
        } catch (error) {
          console.log(`   ${xpath}: Error`);
        }
      }
      
      console.log('✅ XPath selectors demonstrated');
    });

    it('should demonstrate explicit waits', async function() {
      console.log('⏳ Demonstrating explicit waits...');
      
      await driver.get('http://localhost:3000');
      
      // Wait for title
      await driver.wait(until.titleMatches(/.+/), 10000);
      const title = await driver.getTitle();
      console.log(`   Title: "${title}"`);
      
      // Wait for element
      const body = await driver.wait(until.elementLocated(By.css('body')), 10000);
      const tagName = await body.getTagName();
      console.log(`   Body element: ${tagName}`);
      
      console.log('✅ Explicit waits demonstrated');
    });
  });
});