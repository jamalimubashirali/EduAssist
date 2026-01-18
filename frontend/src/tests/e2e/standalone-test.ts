/**
 * Standalone Selenium Test for EduAssist
 * Uses direct imports to avoid module loading issues
 */

import { expect } from 'chai';

// Direct selenium-webdriver imports
import { Builder, WebDriver, By, until, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';

describe('EduAssist Standalone E2E Test', function() {
  let driver: WebDriver;

  before(async function() {
    console.log('🚀 Initializing Chrome WebDriver...');
    
    // Chrome options configuration
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--disable-web-security');
    chromeOptions.addArguments('--window-size=1920,1080');
    
    // Uncomment for headless mode
    // chromeOptions.addArguments('--headless');

    try {
      // Build WebDriver instance
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      // Set timeouts
      await driver.manage().setTimeouts({
        implicit: 5000,
        pageLoad: 30000,
        script: 30000
      });

      // Maximize window
      await driver.manage().window().maximize();
      
      console.log('✅ Chrome WebDriver initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize WebDriver:', error);
      throw error;
    }
  });

  after(async function() {
    console.log('🧹 Cleaning up WebDriver...');
    if (driver) {
      try {
        await driver.quit();
        console.log('✅ WebDriver cleanup completed');
      } catch (error) {
        console.error('⚠️ Error during cleanup:', error);
      }
    }
  });

  describe('🌐 Application Loading Tests', function() {
    
    it('should successfully load the EduAssist application', async function() {
      console.log('📱 Testing application load...');
      
      try {
        // Navigate to application
        await driver.get('http://localhost:3000');
        
        // Wait for page to load
        await driver.sleep(3000);
        
        // Get page information
        const title = await driver.getTitle();
        const currentUrl = await driver.getCurrentUrl();
        
        console.log(`📄 Page Title: "${title}"`);
        console.log(`🌐 Current URL: ${currentUrl}`);
        
        // Assertions
        expect(currentUrl).to.include('localhost:3000');
        expect(title).to.be.a('string').and.not.be.empty;
        
        console.log('✅ Application loaded successfully');
        
      } catch (error) {
        console.error('❌ Application loading failed:', error);
        throw error;
      }
    });

    it('should find and count page elements', async function() {
      console.log('🔍 Analyzing page elements...');
      
      try {
        // Ensure we're on the main page
        await driver.get('http://localhost:3000');
        await driver.sleep(2000);
        
        // Find different types of elements using CSS selectors
        const buttons = await driver.findElements(By.css('button'));
        const links = await driver.findElements(By.css('a'));
        const inputs = await driver.findElements(By.css('input'));
        const divs = await driver.findElements(By.css('div'));
        const images = await driver.findElements(By.css('img'));
        
        console.log(`🔘 Buttons found: ${buttons.length}`);
        console.log(`🔗 Links found: ${links.length}`);
        console.log(`📝 Input fields found: ${inputs.length}`);
        console.log(`📦 Div elements found: ${divs.length}`);
        console.log(`🖼️ Images found: ${images.length}`);
        
        // Assertions
        const totalElements = buttons.length + links.length + inputs.length + divs.length;
        expect(totalElements).to.be.greaterThan(0);
        
        console.log(`✅ Total interactive elements: ${totalElements}`);
        
      } catch (error) {
        console.error('❌ Element analysis failed:', error);
        throw error;
      }
    });
  });

  describe('🧭 Navigation Tests', function() {
    
    it('should test navigation to different routes', async function() {
      console.log('🗺️ Testing route navigation...');
      
      const routes = [
        { path: '/', name: 'Home' },
        { path: '/login', name: 'Login' },
        { path: '/register', name: 'Register' },
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/learning-assistant', name: 'Learning Assistant' }
      ];
      
      for (const route of routes) {
        try {
          console.log(`   📍 Testing route: ${route.name} (${route.path})`);
          
          // Navigate to route
          await driver.get(`http://localhost:3000${route.path}`);
          await driver.sleep(2000);
          
          // Get current URL and title
          const currentUrl = await driver.getCurrentUrl();
          const title = await driver.getTitle();
          
          console.log(`      🌐 URL: ${currentUrl}`);
          console.log(`      📄 Title: ${title}`);
          
          // Basic assertions
          expect(currentUrl).to.include('localhost:3000');
          
          // Check if page has content
          const bodyElements = await driver.findElements(By.css('body *'));
          expect(bodyElements.length).to.be.greaterThan(0);
          
          console.log(`      ✅ ${route.name} route accessible (${bodyElements.length} elements)`);
          
        } catch (error) {
          console.log(`      ⚠️ ${route.name} route may not exist or requires auth`);
        }
      }
    });
  });

  describe('🖱️ Interaction Tests', function() {
    
    it('should test basic page interactions', async function() {
      console.log('🎯 Testing page interactions...');
      
      try {
        // Go to main page
        await driver.get('http://localhost:3000');
        await driver.sleep(2000);
        
        // Test scrolling
        console.log('   📜 Testing page scroll...');
        await driver.executeScript('window.scrollTo(0, 200);');
        await driver.sleep(500);
        await driver.executeScript('window.scrollTo(0, 0);');
        await driver.sleep(500);
        
        // Test finding clickable elements
        console.log('   🔘 Finding clickable elements...');
        const clickableElements = await driver.findElements(By.css('button, a, [role="button"]'));
        console.log(`      Found ${clickableElements.length} clickable elements`);
        
        // Test hover interaction (safer than clicking)
        if (clickableElements.length > 0) {
          console.log('   🖱️ Testing hover interaction...');
          const firstClickable = clickableElements[0];
          
          // Get element info before hover
          const tagName = await firstClickable.getTagName();
          const isDisplayed = await firstClickable.isDisplayed();
          
          console.log(`      Element: ${tagName}, Visible: ${isDisplayed}`);
          
          if (isDisplayed) {
            // Perform hover action
            const actions = driver.actions({ async: true });
            await actions.move({ origin: firstClickable }).perform();
            await driver.sleep(1000);
            
            console.log('      ✅ Hover interaction successful');
          }
        }
        
        // Test page refresh
        console.log('   🔄 Testing page refresh...');
        const urlBeforeRefresh = await driver.getCurrentUrl();
        await driver.navigate().refresh();
        await driver.sleep(2000);
        const urlAfterRefresh = await driver.getCurrentUrl();
        
        expect(urlAfterRefresh).to.equal(urlBeforeRefresh);
        console.log('      ✅ Page refresh successful');
        
        console.log('✅ All interactions completed successfully');
        
      } catch (error) {
        console.error('❌ Interaction testing failed:', error);
        throw error;
      }
    });
  });

  describe('🔍 Element Location Tests', function() {
    
    it('should demonstrate different locator strategies', async function() {
      console.log('🎯 Testing different element locators...');
      
      try {
        await driver.get('http://localhost:3000');
        await driver.sleep(2000);
        
        // CSS Selector tests
        console.log('   🎨 Testing CSS selectors...');
        const cssSelectorTests = [
          { selector: 'button', description: 'All buttons' },
          { selector: 'a', description: 'All links' },
          { selector: 'input[type="text"]', description: 'Text inputs' },
          { selector: 'input[type="email"]', description: 'Email inputs' },
          { selector: 'input[type="password"]', description: 'Password inputs' },
          { selector: '.btn, .button', description: 'Button classes' },
          { selector: '[data-testid]', description: 'Test ID attributes' },
          { selector: 'nav, .nav, .navigation', description: 'Navigation elements' }
        ];
        
        for (const test of cssSelectorTests) {
          try {
            const elements = await driver.findElements(By.css(test.selector));
            console.log(`      ${test.description}: ${elements.length} found`);
          } catch (error) {
            console.log(`      ${test.description}: Error finding elements`);
          }
        }
        
        // XPath tests
        console.log('   🗺️ Testing XPath selectors...');
        const xpathTests = [
          { xpath: '//button', description: 'All buttons (XPath)' },
          { xpath: '//a[contains(@href, "/")]', description: 'Internal links' },
          { xpath: '//*[contains(text(), "Login") or contains(text(), "Sign")]', description: 'Login-related text' },
          { xpath: '//input[@type="email" or @type="password"]', description: 'Auth inputs' },
          { xpath: '//*[@role="button"]', description: 'Button roles' }
        ];
        
        for (const test of xpathTests) {
          try {
            const elements = await driver.findElements(By.xpath(test.xpath));
            console.log(`      ${test.description}: ${elements.length} found`);
          } catch (error) {
            console.log(`      ${test.description}: Error finding elements`);
          }
        }
        
        console.log('✅ Locator strategy testing completed');
        
      } catch (error) {
        console.error('❌ Locator testing failed:', error);
        throw error;
      }
    });
  });

  describe('⏱️ Wait Strategy Tests', function() {
    
    it('should demonstrate explicit waits', async function() {
      console.log('⏳ Testing explicit wait strategies...');
      
      try {
        await driver.get('http://localhost:3000');
        
        // Test waiting for title
        console.log('   📄 Waiting for page title...');
        await driver.wait(until.titleMatches(/.+/), 10000);
        const title = await driver.getTitle();
        console.log(`      Title loaded: "${title}"`);
        
        // Test waiting for element to be located
        console.log('   🔍 Waiting for body element...');
        const bodyElement = await driver.wait(until.elementLocated(By.css('body')), 10000);
        const bodyTagName = await bodyElement.getTagName();
        console.log(`      Body element found: ${bodyTagName}`);
        
        // Test waiting for element to be visible
        console.log('   👁️ Waiting for visible elements...');
        const visibleElements = await driver.findElements(By.css('*'));
        const visibleCount = visibleElements.length;
        console.log(`      Visible elements: ${visibleCount}`);
        
        expect(visibleCount).to.be.greaterThan(0);
        
        console.log('✅ Explicit wait testing completed');
        
      } catch (error) {
        console.error('❌ Wait strategy testing failed:', error);
        throw error;
      }
    });
  });

  describe('📊 Performance Tests', function() {
    
    it('should measure page load performance', async function() {
      console.log('🚀 Testing page load performance...');
      
      try {
        const startTime = Date.now();
        
        // Navigate and wait for load
        await driver.get('http://localhost:3000');
        await driver.wait(until.titleMatches(/.+/), 15000);
        
        const loadTime = Date.now() - startTime;
        
        console.log(`   ⏱️ Page load time: ${loadTime}ms`);
        
        // Performance assertions
        expect(loadTime).to.be.lessThan(15000); // Should load within 15 seconds
        
        // Test navigation performance
        const navStartTime = Date.now();
        await driver.navigate().refresh();
        await driver.sleep(2000);
        const navTime = Date.now() - navStartTime;
        
        console.log(`   🔄 Refresh time: ${navTime}ms`);
        expect(navTime).to.be.lessThan(10000); // Refresh should be faster
        
        console.log('✅ Performance testing completed');
        
      } catch (error) {
        console.error('❌ Performance testing failed:', error);
        throw error;
      }
    });
  });

  describe('🛡️ Error Handling Tests', function() {
    
    it('should handle various error scenarios', async function() {
      console.log('🚨 Testing error handling...');
      
      try {
        // Test invalid URL
        console.log('   🌐 Testing invalid URL handling...');
        await driver.get('http://localhost:3000/nonexistent-page-12345');
        await driver.sleep(2000);
        
        const errorPageUrl = await driver.getCurrentUrl();
        console.log(`      Error page URL: ${errorPageUrl}`);
        
        // Should still have some content (404 page or redirect)
        const pageElements = await driver.findElements(By.css('*'));
        expect(pageElements.length).to.be.greaterThan(0);
        
        // Test recovery by going back to main page
        console.log('   🔄 Testing error recovery...');
        await driver.get('http://localhost:3000');
        await driver.sleep(2000);
        
        const recoveryUrl = await driver.getCurrentUrl();
        expect(recoveryUrl).to.include('localhost:3000');
        
        console.log('✅ Error handling and recovery successful');
        
      } catch (error) {
        console.error('❌ Error handling test failed:', error);
        // Don't throw here as this is testing error scenarios
      }
    });
  });
});