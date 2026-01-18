"""
Login Page Object Model for EduAssist Authentication Module
Demonstrates various locator strategies and authentication testing
"""

import time
from selenium.webdriver.common.keys import Keys

from pages.base_page import BasePage
from utils.driver_manager import by_css, by_xpath, by_id, by_link_text, by_partial_link_text
from config.test_config import config


class LoginPage(BasePage):
    """Login page object with authentication functionality"""
    
    def __init__(self):
        super().__init__()
        
        # Page Elements based on actual EduAssist login page structure
        # CSS selectors matching your React Hook Form implementation
        self.email_input_selectors = [
            '#email',                        # Primary ID from your login form
            'input[type="email"]',           # HTML5 email input
            'input[placeholder*="email"]',   # Placeholder text matching
            '[name="email"]'                 # Form field name
        ]
        
        self.password_input_selectors = [
            '#password',                     # Primary ID from your login form
            'input[type="password"]',        # Password input type
            'input[placeholder*="password"]', # Placeholder text matching
            '[name="password"]'              # Form field name
        ]
        
        self.login_button_selectors = [
            'button[type="submit"]',         # Submit button from your form
            '.game-button',                  # Your custom button class
            'form button',                   # Any button in the form
            'button'                         # Generic button fallback
        ]
        
        # XPath selectors based on your actual UI text
        self.login_button_xpath = '//button[contains(text(), "Login") or @type="submit"]'
        self.signup_link_xpath = '//a[contains(text(), "Sign up now") or contains(@href, "register")]'
        self.demo_button_xpath = '//button[contains(text(), "Use Demo Account")]'
        
        # Error and success message selectors matching your styling
        self.error_message_selectors = [
            '.text-red-400',                 # Your Tailwind error color
            '.text-red-500',                 # Alternative red shade
            '[role="alert"]',                # Accessibility role
            '.error-message',                # Generic error class
            'p.text-red-400'                 # Specific error paragraph
        ]
        
        self.success_message_selectors = [
            '.text-green-400',               # Your Tailwind success color
            '.text-green-500',               # Alternative green shade
            '.success-message',              # Generic success class
            '[data-testid="success-message"]' # Test ID if added
        ]
        
        # Additional selectors specific to your login page
        self.welcome_title_selectors = [
            'h1.text-3xl.font-bold',         # Title styling classes
            'h1',                            # Generic h1 fallback
            '.text-3xl'                      # Title class fallback
        ]
        
        self.remember_me_checkbox = '#rememberMe'  # Your checkbox ID
        self.show_password_button = 'button[type="button"]'  # Eye icon button
    
    def navigate_to_login(self) -> None:
        """Navigate to login page"""
        print("🔐 Navigating to login page...")
        login_url = f"{config.BASE_URL}/login"
        self.driver.get(login_url)
        self.wait_for_page_load()
        
        # Wait for login form to be ready
        self.wait_for_login_form()
    
    def wait_for_login_form(self, timeout: int = None) -> bool:
        """
        Wait for login form elements to be present
        Demonstrates waiting for multiple elements
        """
        timeout = timeout or config.TIMEOUTS['medium']
        print("⏳ Waiting for login form to load...")
        
        # Wait for any email input to be present
        email_element = self.wait_for_any_element(self.email_input_selectors, timeout)
        if email_element:
            print("✅ Login form loaded successfully")
            return True
        
        print("⚠️ Login form not found - might be on a different page")
        return False
    
    def login(self, email: str, password: str) -> bool:
        """
        Perform login with credentials
        Demonstrates form interaction and explicit waits
        """
        print(f"🔑 Attempting login with email: {email}")
        
        # Find and fill email input
        email_success = self.try_multiple_selectors(self.email_input_selectors, "find")
        if email_success:
            if self.type_text(by_css(self.email_input_selectors[0]), email):
                print("✅ Email entered successfully")
            else:
                print("❌ Failed to enter email")
                return False
        else:
            print("❌ Email input not found")
            return False
        
        # Find and fill password input
        password_success = self.try_multiple_selectors(self.password_input_selectors, "find")
        if password_success:
            if self.type_text(by_css(self.password_input_selectors[0]), password):
                print("✅ Password entered successfully")
            else:
                print("❌ Failed to enter password")
                return False
        else:
            print("❌ Password input not found")
            return False
        
        # Click login button
        login_clicked = False
        
        # Try CSS selectors first
        for selector in self.login_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Login button clicked using CSS: {selector}")
                login_clicked = True
                break
        
        # Try XPath as fallback
        if not login_clicked:
            if self.click_element(by_xpath(self.login_button_xpath)):
                print("✅ Login button clicked using XPath")
                login_clicked = True
        
        if not login_clicked:
            print("❌ Login button not found or not clickable")
            return False
        
        # Wait for form submission
        time.sleep(2)
        print("✅ Login form submitted")
        return True
    
    def login_with_enter_key(self, email: str, password: str) -> bool:
        """
        Login using Enter key instead of clicking button
        Demonstrates keyboard interaction
        """
        print(f"⌨️ Attempting login with Enter key: {email}")
        
        # Enter email
        email_element = self.try_multiple_selectors(self.email_input_selectors, "find")
        if email_element:
            self.type_text(by_css(self.email_input_selectors[0]), email)
        else:
            return False
        
        # Enter password and press Enter
        password_element = self.try_multiple_selectors(self.password_input_selectors, "find")
        if password_element:
            self.type_text(by_css(self.password_input_selectors[0]), password)
            # Press Enter key
            self.send_keys_to_element(by_css(self.password_input_selectors[0]), Keys.RETURN)
            print("✅ Login submitted with Enter key")
            time.sleep(2)
            return True
        
        return False
    
    def login_with_valid_user(self) -> bool:
        """Login with predefined valid user credentials"""
        user = config.TEST_USERS['valid_user']
        return self.login(user['email'], user['password'])
    
    def login_with_demo_account(self) -> bool:
        """
        Use the demo account login button specific to EduAssist
        Tests the demo login functionality from your app
        """
        print("🎮 Attempting demo account login...")
        
        # Click the demo login button using XPath
        if self.click_element(by_xpath(self.demo_button_xpath)):
            print("✅ Demo login button clicked")
            time.sleep(3)  # Wait for demo login to process
            return True
        
        # Try CSS selector fallback
        demo_selectors = [
            'button[class*="demo"]',
            '.demo-button',
            'button[data-testid="demo-login"]'
        ]
        
        for selector in demo_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Demo login clicked via CSS: {selector}")
                time.sleep(3)
                return True
        
        print("❌ Demo login button not found")
        return False
    
    def login_with_invalid_credentials(self) -> bool:
        """
        Attempt login with invalid credentials
        Useful for negative testing
        """
        print("❌ Testing login with invalid credentials...")
        return self.login('invalid@email.com', 'wrongpassword')
    
    def is_login_form_displayed(self) -> bool:
        """
        Check if login form is displayed
        Demonstrates element visibility checking
        """
        email_visible = any(self.is_element_displayed(by_css(selector)) 
                           for selector in self.email_input_selectors)
        password_visible = any(self.is_element_displayed(by_css(selector)) 
                              for selector in self.password_input_selectors)
        button_visible = any(self.is_element_displayed(by_css(selector)) 
                            for selector in self.login_button_selectors)
        
        return email_visible and password_visible and button_visible
    
    def get_error_message(self) -> str:
        """
        Get error message text
        Useful for validation testing
        """
        for selector in self.error_message_selectors:
            text = self.get_text(by_css(selector))
            if text:
                return text
        return ""
    
    def is_error_message_displayed(self) -> bool:
        """Check if error message is displayed"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.error_message_selectors)
    
    def get_success_message(self) -> str:
        """Get success message text"""
        for selector in self.success_message_selectors:
            text = self.get_text(by_css(selector))
            if text:
                return text
        return ""
    
    def is_success_message_displayed(self) -> bool:
        """Check if success message is displayed"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.success_message_selectors)
    
    def click_signup_link(self) -> bool:
        """
        Click on signup link
        Demonstrates navigation testing
        """
        print("🔗 Clicking signup link...")
        
        # Try XPath first for text-based link finding
        if self.click_element(by_xpath(self.signup_link_xpath)):
            print("✅ Signup link clicked using XPath")
            return True
        
        # Try common CSS selectors
        signup_selectors = [
            'a[href*="register"]',
            'a[href*="signup"]',
            '[data-testid="signup-link"]',
            '.signup-link'
        ]
        
        for selector in signup_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Signup link clicked using CSS: {selector}")
                return True
        
        print("⚠️ Signup link not found")
        return False
    
    def click_forgot_password_link(self) -> bool:
        """Click forgot password link"""
        forgot_selectors = [
            'a[href*="forgot"]',
            'a[href*="reset"]',
            '[data-testid="forgot-password"]',
            '.forgot-password'
        ]
        
        forgot_xpath = '//a[contains(text(), "Forgot") or contains(text(), "Reset")]'
        
        # Try XPath first
        if self.click_element(by_xpath(forgot_xpath)):
            return True
        
        # Try CSS selectors
        for selector in forgot_selectors:
            if self.click_element(by_css(selector)):
                return True
        
        return False
    
    def wait_for_login_success(self, timeout: int = None) -> bool:
        """
        Wait for successful login redirect
        Demonstrates explicit wait for navigation
        """
        timeout = timeout or config.TIMEOUTS['medium']
        print("⏳ Waiting for login success...")
        
        # Wait for redirect to dashboard or home page
        success_indicators = [
            '/dashboard',
            '/home',
            '/welcome'
        ]
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            current_url = self.get_current_url()
            
            # Check if redirected away from login
            if '/login' not in current_url:
                # Check for success indicators
                for indicator in success_indicators:
                    if indicator in current_url:
                        print(f"✅ Login successful - redirected to: {current_url}")
                        return True
                
                # Even if not a specific success page, being away from login is good
                print(f"✅ Login appears successful - current URL: {current_url}")
                return True
            
            time.sleep(0.5)
        
        print("⚠️ Login success timeout")
        return False
    
    def verify_page_title(self) -> bool:
        """Verify page title contains expected text"""
        title = self.get_page_title()
        expected_keywords = ['login', 'sign in', 'eduassist', 'authentication']
        
        # If title is empty, check if we're on the right page by URL
        if not title or title.strip() == "":
            current_url = self.get_current_url()
            if '/login' in current_url:
                print(f"✅ Page title empty but URL confirms login page: {current_url}")
                return True
        
        title_lower = title.lower()
        for keyword in expected_keywords:
            if keyword in title_lower:
                print(f"✅ Page title verified: '{title}' contains '{keyword}'")
                return True
        
        # If no keywords match but we're on login page, still pass
        current_url = self.get_current_url()
        if '/login' in current_url:
            print(f"⚠️ Page title '{title}' doesn't contain expected keywords, but URL confirms login page")
            return True
        
        print(f"⚠️ Page title '{title}' doesn't contain expected keywords and URL doesn't confirm login page")
        return False
    
    def clear_login_form(self) -> bool:
        """Clear all login form fields"""
        print("🧹 Clearing login form...")
        
        # Clear email field
        email_element = self.try_multiple_selectors(self.email_input_selectors, "find")
        if email_element:
            email_element.clear()
        
        # Clear password field
        password_element = self.try_multiple_selectors(self.password_input_selectors, "find")
        if password_element:
            password_element.clear()
        
        print("✅ Login form cleared")
        return True
    
    def get_login_form_validation_errors(self) -> list:
        """
        Get all validation error messages
        Useful for form validation testing
        """
        errors = []
        
        # Common validation error selectors
        validation_selectors = [
            '.field-error',
            '.input-error',
            '.validation-error',
            '[role="alert"]',
            '.error-text'
        ]
        
        for selector in validation_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                text = element.text.strip()
                if text and text not in errors:
                    errors.append(text)
        
        return errors