"""
WebDriver Manager for EduAssist Python E2E Tests
Handles browser setup, teardown, and common driver operations
"""

import time
import os
from typing import Optional, List
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

from config.test_config import config


class DriverManager:
    """WebDriver manager for handling browser operations"""
    
    _driver: Optional[webdriver.Chrome] = None
    _wait: Optional[WebDriverWait] = None
    
    @classmethod
    def initialize_driver(cls) -> webdriver.Chrome:
        """
        Initialize WebDriver with Chrome configuration
        Demonstrates proper browser setup with explicit options
        """
        print("🚀 Initializing Chrome WebDriver...")
        
        # Configure Chrome options
        chrome_options = Options()
        
        # Add Chrome arguments
        for option in config.get_chrome_options():
            chrome_options.add_argument(option)
        
        # Additional Chrome preferences
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        try:
            # Try simple Chrome initialization first (uses system PATH)
            print("🔧 Trying system Chrome WebDriver...")
            cls._driver = webdriver.Chrome(options=chrome_options)
            print("✅ Using system Chrome WebDriver")
            
        except Exception as system_error:
            print(f"⚠️ System Chrome failed: {system_error}")
            print("🔧 Trying WebDriverManager...")
            
            try:
                # Use WebDriverManager as fallback
                driver_path = ChromeDriverManager().install()
                
                # Fix for Windows ChromeDriver path issues
                if os.name == 'nt' and not driver_path.endswith('chromedriver.exe'):
                    # Find the actual chromedriver.exe in the directory
                    driver_dir = os.path.dirname(driver_path)
                    for root, dirs, files in os.walk(driver_dir):
                        if 'chromedriver.exe' in files:
                            driver_path = os.path.join(root, 'chromedriver.exe')
                            break
                
                print(f"🔧 Using ChromeDriver at: {driver_path}")
                service = Service(driver_path)
                cls._driver = webdriver.Chrome(service=service, options=chrome_options)
                
            except Exception as wdm_error:
                print(f"❌ WebDriverManager also failed: {wdm_error}")
                print("💡 ChromeDriver setup failed. Please try:")
                print("   1. Install Chrome browser if not installed")
                print("   2. pip install --upgrade selenium webdriver-manager")
                print("   3. Clear WebDriverManager cache: rm -rf ~/.wdm")
                print("   4. Or download ChromeDriver manually from https://chromedriver.chromium.org/")
                raise Exception("Both system Chrome and WebDriverManager failed")
        
        # Set timeouts - demonstrates implicit and explicit wait configuration
        cls._driver.implicitly_wait(config.IMPLICIT_WAIT)
        cls._driver.set_page_load_timeout(config.PAGE_LOAD_TIMEOUT)
        cls._driver.set_script_timeout(config.SCRIPT_TIMEOUT)
        
        # Maximize window for consistent testing
        cls._driver.maximize_window()
        
        # Initialize WebDriverWait for explicit waits
        cls._wait = WebDriverWait(cls._driver, config.TIMEOUTS['medium'])
        
        print("✅ Chrome WebDriver initialized successfully")
        return cls._driver
    
    @classmethod
    def get_driver(cls) -> webdriver.Chrome:
        """Get current WebDriver instance"""
        if cls._driver is None:
            raise RuntimeError("WebDriver not initialized. Call initialize_driver() first.")
        return cls._driver
    
    @classmethod
    def get_wait(cls) -> WebDriverWait:
        """Get WebDriverWait instance"""
        if cls._wait is None:
            raise RuntimeError("WebDriverWait not initialized. Call initialize_driver() first.")
        return cls._wait
    
    @classmethod
    def navigate_to(cls, url: str) -> None:
        """
        Navigate to a specific URL
        Demonstrates basic navigation with wait
        """
        print(f"🌐 Navigating to: {url}")
        cls._driver.get(url)
        
        # Wait for page to be ready
        cls.wait_for_page_load()
    
    @classmethod
    def wait_for_page_load(cls, timeout: int = None) -> None:
        """Wait for page to be fully loaded"""
        timeout = timeout or config.TIMEOUTS['medium']
        
        try:
            # Wait for document ready state
            WebDriverWait(cls._driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
        except TimeoutException:
            print("⚠️ Page load timeout - continuing anyway")
    
    @classmethod
    def find_element_safe(cls, locator: tuple, timeout: int = None) -> Optional[WebElement]:
        """
        Safely find element with explicit wait
        Demonstrates WebDriverWait with until conditions
        """
        timeout = timeout or config.TIMEOUTS['medium']
        
        try:
            element = WebDriverWait(cls._driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
            return element
        except TimeoutException:
            print(f"⚠️ Element not found: {locator}")
            return None
    
    @classmethod
    def find_elements_safe(cls, locator: tuple) -> List[WebElement]:
        """Safely find multiple elements"""
        try:
            return cls._driver.find_elements(*locator)
        except NoSuchElementException:
            return []
    
    @classmethod
    def wait_for_element_clickable(cls, locator: tuple, timeout: int = None) -> Optional[WebElement]:
        """
        Wait for element to be clickable
        Demonstrates explicit wait for element interaction
        """
        timeout = timeout or config.TIMEOUTS['medium']
        
        try:
            element = WebDriverWait(cls._driver, timeout).until(
                EC.element_to_be_clickable(locator)
            )
            return element
        except TimeoutException:
            print(f"⚠️ Element not clickable: {locator}")
            return None
    
    @classmethod
    def wait_for_text_in_element(cls, locator: tuple, text: str, timeout: int = None) -> bool:
        """
        Wait for text to be present in element
        Useful for dynamic content like AI responses
        """
        timeout = timeout or config.TIMEOUTS['long']
        
        try:
            WebDriverWait(cls._driver, timeout).until(
                EC.text_to_be_present_in_element(locator, text)
            )
            return True
        except TimeoutException:
            print(f"⚠️ Text '{text}' not found in element: {locator}")
            return False
    
    @classmethod
    def click_element_safe(cls, locator: tuple, timeout: int = None) -> bool:
        """
        Safely click element with explicit wait
        Demonstrates safe element interaction
        """
        element = cls.wait_for_element_clickable(locator, timeout)
        if element:
            try:
                element.click()
                return True
            except Exception as e:
                print(f"⚠️ Click failed: {e}")
                return False
        return False
    
    @classmethod
    def type_text_safe(cls, locator: tuple, text: str, clear_first: bool = True) -> bool:
        """
        Safely type text into input field
        Demonstrates text input with error handling
        """
        element = cls.find_element_safe(locator)
        if element:
            try:
                if clear_first:
                    element.clear()
                element.send_keys(text)
                return True
            except Exception as e:
                print(f"⚠️ Text input failed: {e}")
                return False
        return False
    
    @classmethod
    def get_text_safe(cls, locator: tuple) -> str:
        """Safely get text from element"""
        element = cls.find_element_safe(locator)
        if element:
            try:
                return element.text
            except Exception as e:
                print(f"⚠️ Get text failed: {e}")
                return ""
        return ""
    
    @classmethod
    def is_element_displayed(cls, locator: tuple) -> bool:
        """Check if element is displayed"""
        element = cls.find_element_safe(locator, timeout=2)
        if element:
            try:
                return element.is_displayed()
            except:
                return False
        return False
    
    @classmethod
    def scroll_to_element(cls, locator: tuple) -> bool:
        """Scroll element into view"""
        element = cls.find_element_safe(locator)
        if element:
            try:
                cls._driver.execute_script("arguments[0].scrollIntoView(true);", element)
                time.sleep(0.5)  # Brief pause after scroll
                return True
            except Exception as e:
                print(f"⚠️ Scroll failed: {e}")
                return False
        return False
    
    @classmethod
    def take_screenshot(cls, filename: str) -> bool:
        """
        Take screenshot for debugging
        Demonstrates screenshot capability
        """
        try:
            # Create screenshots directory if it doesn't exist
            os.makedirs("screenshots", exist_ok=True)
            
            filepath = f"screenshots/{filename}.png"
            cls._driver.save_screenshot(filepath)
            print(f"📸 Screenshot saved: {filepath}")
            return True
        except Exception as e:
            print(f"⚠️ Screenshot failed: {e}")
            return False
    
    @classmethod
    def execute_script(cls, script: str, *args) -> any:
        """Execute JavaScript in the browser"""
        try:
            return cls._driver.execute_script(script, *args)
        except Exception as e:
            print(f"⚠️ Script execution failed: {e}")
            return None
    
    @classmethod
    def refresh_page(cls) -> None:
        """Refresh the current page"""
        print("🔄 Refreshing page...")
        cls._driver.refresh()
        cls.wait_for_page_load()
    
    @classmethod
    def get_current_url(cls) -> str:
        """Get current page URL"""
        return cls._driver.current_url
    
    @classmethod
    def get_title(cls) -> str:
        """Get current page title"""
        return cls._driver.title
    
    @classmethod
    def quit_driver(cls) -> None:
        """
        Clean up and quit WebDriver
        Essential for proper test teardown
        """
        if cls._driver:
            print("🧹 Cleaning up WebDriver...")
            try:
                cls._driver.quit()
                cls._driver = None
                cls._wait = None
                print("✅ WebDriver cleanup completed")
            except Exception as e:
                print(f"⚠️ Cleanup error: {e}")


# Convenience functions for common locator types
def by_css(selector: str) -> tuple:
    """Create CSS selector locator"""
    return (By.CSS_SELECTOR, selector)

def by_xpath(xpath: str) -> tuple:
    """Create XPath locator"""
    return (By.XPATH, xpath)

def by_id(element_id: str) -> tuple:
    """Create ID locator"""
    return (By.ID, element_id)

def by_class(class_name: str) -> tuple:
    """Create class name locator"""
    return (By.CLASS_NAME, class_name)

def by_tag(tag_name: str) -> tuple:
    """Create tag name locator"""
    return (By.TAG_NAME, tag_name)

def by_link_text(text: str) -> tuple:
    """Create link text locator"""
    return (By.LINK_TEXT, text)

def by_partial_link_text(text: str) -> tuple:
    """Create partial link text locator"""
    return (By.PARTIAL_LINK_TEXT, text)