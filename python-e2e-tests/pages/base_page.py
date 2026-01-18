"""
Base Page Object Model for EduAssist Python E2E Tests
Contains common functionality shared across all pages
"""

import time
from typing import List, Optional
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

from utils.driver_manager import DriverManager, by_css, by_xpath
from config.test_config import config


class BasePage:
    """Base page object with common functionality"""
    
    def __init__(self):
        self.driver = DriverManager.get_driver()
        self.wait = DriverManager.get_wait()
    
    def find_element_safe(self, locator: tuple, timeout: int = None) -> Optional[WebElement]:
        """Find element using various locator strategies with fallback"""
        return DriverManager.find_element_safe(locator, timeout)
    
    def find_elements_safe(self, locator: tuple) -> List[WebElement]:
        """Find multiple elements safely"""
        return DriverManager.find_elements_safe(locator)
    
    def click_element(self, locator: tuple, timeout: int = None) -> bool:
        """
        Click element with explicit wait
        Ensures element is clickable before clicking
        """
        return DriverManager.click_element_safe(locator, timeout)
    
    def type_text(self, locator: tuple, text: str, clear_first: bool = True) -> bool:
        """
        Type text into input field
        Clears field first by default, then types new text
        """
        return DriverManager.type_text_safe(locator, text, clear_first)
    
    def get_text(self, locator: tuple) -> str:
        """Get text content from element"""
        return DriverManager.get_text_safe(locator)
    
    def is_element_displayed(self, locator: tuple) -> bool:
        """Check if element is displayed"""
        return DriverManager.is_element_displayed(locator)
    
    def wait_for_element_text(self, locator: tuple, expected_text: str, timeout: int = None) -> bool:
        """
        Wait for element to contain specific text
        Useful for dynamic content
        """
        return DriverManager.wait_for_text_in_element(locator, expected_text, timeout)
    
    def scroll_to_element(self, locator: tuple) -> bool:
        """Scroll element into view"""
        return DriverManager.scroll_to_element(locator)
    
    def hover_over_element(self, locator: tuple) -> bool:
        """
        Hover over element using ActionChains
        Demonstrates mouse interactions
        """
        element = self.find_element_safe(locator)
        if element:
            try:
                actions = ActionChains(self.driver)
                actions.move_to_element(element).perform()
                time.sleep(0.5)  # Brief pause for hover effect
                return True
            except Exception as e:
                print(f"⚠️ Hover failed: {e}")
                return False
        return False
    
    def send_keys_to_element(self, locator: tuple, keys) -> bool:
        """
        Send special keys to element (like ENTER, TAB, etc.)
        Demonstrates keyboard interactions
        """
        element = self.find_element_safe(locator)
        if element:
            try:
                element.send_keys(keys)
                return True
            except Exception as e:
                print(f"⚠️ Send keys failed: {e}")
                return False
        return False
    
    def get_current_url(self) -> str:
        """Get current page URL"""
        return DriverManager.get_current_url()
    
    def get_page_title(self) -> str:
        """Get page title"""
        return DriverManager.get_title()
    
    def refresh_page(self) -> None:
        """Refresh the current page"""
        DriverManager.refresh_page()
    
    def wait_for_page_load(self, timeout: int = None) -> None:
        """Wait for page to load completely"""
        DriverManager.wait_for_page_load(timeout)
    
    def take_screenshot(self, filename: str) -> bool:
        """Take screenshot for debugging"""
        return DriverManager.take_screenshot(filename)
    
    def execute_script(self, script: str, *args) -> any:
        """Execute JavaScript in the browser"""
        return DriverManager.execute_script(script, *args)
    
    def try_multiple_selectors(self, selectors: List[str], action: str = "find") -> Optional[WebElement]:
        """
        Try multiple CSS selectors until one works
        Demonstrates robust element location with fallbacks
        """
        for selector in selectors:
            try:
                locator = by_css(selector)
                if action == "find":
                    element = self.find_element_safe(locator, timeout=2)
                    if element and element.is_displayed():
                        print(f"✅ Found element with selector: {selector}")
                        return element
                elif action == "click":
                    if self.click_element(locator, timeout=2):
                        print(f"✅ Clicked element with selector: {selector}")
                        return True
            except Exception:
                continue
        
        print(f"⚠️ No working selector found from: {selectors}")
        return None
    
    def wait_for_any_element(self, selectors: List[str], timeout: int = None) -> Optional[WebElement]:
        """
        Wait for any of the provided selectors to be present
        Useful when element selectors might vary
        """
        timeout = timeout or config.TIMEOUTS['medium']
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            for selector in selectors:
                element = self.find_element_safe(by_css(selector), timeout=1)
                if element and element.is_displayed():
                    return element
            time.sleep(0.5)
        
        return None
    
    def get_element_attribute(self, locator: tuple, attribute: str) -> str:
        """Get attribute value from element"""
        element = self.find_element_safe(locator)
        if element:
            try:
                return element.get_attribute(attribute) or ""
            except Exception as e:
                print(f"⚠️ Get attribute failed: {e}")
                return ""
        return ""
    
    def is_element_enabled(self, locator: tuple) -> bool:
        """Check if element is enabled"""
        element = self.find_element_safe(locator)
        if element:
            try:
                return element.is_enabled()
            except:
                return False
        return False
    
    def get_elements_count(self, locator: tuple) -> int:
        """Get count of elements matching locator"""
        elements = self.find_elements_safe(locator)
        return len(elements)
    
    def wait_for_url_contains(self, text: str, timeout: int = None) -> bool:
        """Wait for URL to contain specific text"""
        timeout = timeout or config.TIMEOUTS['medium']
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if text in self.get_current_url():
                return True
            time.sleep(0.5)
        
        return False
    
    def wait_for_title_contains(self, text: str, timeout: int = None) -> bool:
        """Wait for page title to contain specific text"""
        timeout = timeout or config.TIMEOUTS['medium']
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if text.lower() in self.get_page_title().lower():
                return True
            time.sleep(0.5)
        
        return False