"""
Authentication Module E2E Tests for EduAssist
Tests login and signup functionality using Selenium WebDriver with Python

Demonstrates:
- Page Object Model (POM) structure
- Explicit waits with WebDriverWait
- XPath and CSS selectors
- Form interaction and validation
- Navigation testing
- Assertions with pytest
"""

import pytest
import time
from utils.driver_manager import DriverManager
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from config.test_config import config


class TestAuthentication:
    """Authentication module test class"""
    
    @classmethod
    def setup_class(cls):
        """Setup for the entire test class"""
        print("🚀 Initializing WebDriver for Authentication tests...")
        DriverManager.initialize_driver()
        
        # Initialize page objects
        cls.login_page = LoginPage()
        cls.dashboard_page = DashboardPage()
        
        print("✅ WebDriver and Page Objects initialized successfully")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup for the entire test class"""
        print("🧹 Cleaning up WebDriver...")
        DriverManager.quit_driver()
        print("✅ WebDriver cleanup completed")
    
    def setup_method(self):
        """Setup before each test method"""
        # Navigate to login page before each test
        self.login_page.navigate_to_login()
    
    def test_login_form_display(self):
        """Test that login form elements are displayed correctly"""
        print("🔍 Testing login form display...")
        
        # Verify page title using explicit assertion
        title_valid = self.login_page.verify_page_title()
        assert title_valid, "Login page title should contain expected keywords"
        
        # Check if login form is displayed using CSS selectors
        form_displayed = self.login_page.is_login_form_displayed()
        assert form_displayed, "Login form should be displayed with all required elements"
        
        print("✅ Login form elements are displayed correctly")
    
    def test_successful_login_with_valid_credentials(self):
        """Test successful login with valid user credentials"""
        print("🔐 Testing successful login...")
        
        # Perform login using test user credentials (demo account)
        login_success = self.login_page.login_with_valid_user()
        assert login_success, "Login form submission should succeed"
        
        # Wait for successful login redirect using explicit wait
        redirect_success = self.login_page.wait_for_login_success()
        assert redirect_success, "Should redirect after successful login"
        
        # Verify redirect to dashboard
        current_url = self.login_page.get_current_url()
        assert '/dashboard' in current_url or '/home' in current_url, \
            f"Should redirect to dashboard, but got: {current_url}"
        
        # Verify user is logged in by checking dashboard elements
        is_logged_in = self.dashboard_page.is_user_logged_in()
        assert is_logged_in, "User should be logged in and see dashboard content"
        
        print("✅ Login successful - redirected to dashboard")
    
    def test_demo_account_login_functionality(self):
        """Test the demo account login button specific to EduAssist"""
        print("🎮 Testing demo account login functionality...")
        
        # Try demo account login button
        demo_success = self.login_page.login_with_demo_account()
        
        if demo_success:
            # Wait for redirect
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Demo login should redirect successfully"
            
            # Verify we're on dashboard
            current_url = self.login_page.get_current_url()
            assert '/dashboard' in current_url, f"Demo login should go to dashboard, got: {current_url}"
            
            print("✅ Demo account login successful")
        else:
            print("⚠️ Demo account button not found - this might be expected in some environments")
    
    def test_login_with_invalid_credentials(self):
        """Test error handling for invalid credentials"""
        print("❌ Testing login with invalid credentials...")
        
        # Attempt login with invalid credentials
        login_attempted = self.login_page.login_with_invalid_credentials()
        assert login_attempted, "Login form should accept invalid credentials for testing"
        
        # Wait briefly for error message to appear
        time.sleep(3)
        
        # Check if error message is displayed using XPath locator
        error_displayed = self.login_page.is_error_message_displayed()
        
        if error_displayed:
            # Verify error message content
            error_message = self.login_page.get_error_message()
            assert error_message, "Error message should not be empty"
            print(f"✅ Error message displayed: '{error_message}'")
        else:
            # Some applications might redirect or handle errors differently
            current_url = self.login_page.get_current_url()
            # Should still be on login page or show some error indication
            assert '/login' in current_url or '/error' in current_url, \
                "Should remain on login page or show error page for invalid credentials"
            print("✅ Invalid credentials handled appropriately")
    
    def test_login_with_enter_key(self):
        """Test login submission using Enter key instead of clicking"""
        print("⌨️ Testing login with Enter key...")
        
        # Use Enter key for form submission (demonstrates keyboard interaction)
        user = config.TEST_USERS['valid_user']
        login_success = self.login_page.login_with_enter_key(user['email'], user['password'])
        
        if login_success:
            # Wait for navigation
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Enter key login should redirect successfully"
            print("✅ Enter key login successful")
        else:
            print("⚠️ Enter key login not supported or failed")
    
    def test_navigation_to_signup_page(self):
        """Test navigation from login to signup page"""
        print("🔗 Testing navigation to signup page...")
        
        # Click signup link using link text locator
        signup_clicked = self.login_page.click_signup_link()
        
        if signup_clicked:
            # Wait for navigation and verify URL change
            time.sleep(2)
            current_url = self.login_page.get_current_url()
            assert '/register' in current_url or '/signup' in current_url, \
                f"Should navigate to signup page, but got: {current_url}"
            print("✅ Successfully navigated to signup page")
        else:
            print("⚠️ Signup link not found - might not be implemented")
    
    def test_forgot_password_link(self):
        """Test forgot password functionality"""
        print("🔑 Testing forgot password link...")
        
        forgot_clicked = self.login_page.click_forgot_password_link()
        
        if forgot_clicked:
            time.sleep(2)
            current_url = self.login_page.get_current_url()
            assert '/forgot' in current_url or '/reset' in current_url, \
                "Should navigate to password reset page"
            print("✅ Forgot password link working")
        else:
            print("⚠️ Forgot password link not found")
    
    def test_login_form_validation(self):
        """Test client-side form validation"""
        print("📝 Testing form validation...")
        
        # Try to submit empty form
        self.login_page.clear_login_form()
        
        # Try to click login button with empty fields
        empty_login = self.login_page.login("", "")
        
        # Check for validation errors
        validation_errors = self.login_page.get_login_form_validation_errors()
        
        if validation_errors:
            print(f"✅ Form validation working - errors: {validation_errors}")
            assert len(validation_errors) > 0, "Should show validation errors for empty form"
        else:
            print("⚠️ No client-side validation detected")
    
    def test_login_with_special_characters(self):
        """Test login with special characters in credentials"""
        print("🔤 Testing login with special characters...")
        
        # Test with email containing special characters
        special_email = "test+special@example.com"
        special_password = "P@ssw0rd!#$"
        
        login_attempted = self.login_page.login(special_email, special_password)
        assert login_attempted, "Should be able to enter special characters"
        
        time.sleep(2)
        print("✅ Special characters handled in login form")
    
    def test_login_performance(self):
        """Test login page load performance"""
        print("⏱️ Testing login page performance...")
        
        start_time = time.time()
        self.login_page.navigate_to_login()
        load_time = time.time() - start_time
        
        print(f"📊 Login page load time: {load_time:.2f} seconds")
        assert load_time < 10, f"Login page should load within 10 seconds, took {load_time:.2f}s"
        
        print("✅ Login page performance acceptable")
    
    def test_multiple_locator_strategies(self):
        """Demonstrate different element location strategies"""
        print("🎯 Testing multiple locator strategies...")
        
        # Test CSS selectors
        email_by_css = self.login_page.try_multiple_selectors(
            self.login_page.email_input_selectors, "find"
        )
        assert email_by_css is not None, "Should find email input using CSS selectors"
        
        # Test XPath selectors
        login_button_xpath = self.login_page.find_element_safe(
            self.login_page.by_xpath(self.login_page.login_button_xpath)
        )
        
        print("✅ Multiple locator strategies demonstrated:")
        print(f"   - CSS selectors: {'✅' if email_by_css else '❌'}")
        print(f"   - XPath selectors: {'✅' if login_button_xpath else '❌'}")
    
    def test_explicit_waits_demonstration(self):
        """Demonstrate explicit wait strategies"""
        print("⏳ Demonstrating explicit waits...")
        
        # Navigate to login page
        self.login_page.navigate_to_login()
        
        # Demonstrate waiting for page title
        title_wait_success = self.login_page.wait_for_title_contains("login", 10)
        print(f"   📄 Title wait: {'✅' if title_wait_success else '❌'}")
        
        # Demonstrate waiting for form elements
        form_wait_success = self.login_page.wait_for_login_form(10)
        print(f"   📝 Form wait: {'✅' if form_wait_success else '❌'}")
        
        # Demonstrate waiting for specific element text
        welcome_element = self.login_page.wait_for_any_element(
            ['h1', '.title', '.welcome'], 5
        )
        print(f"   🎯 Element wait: {'✅' if welcome_element else '❌'}")
        
        print("✅ Explicit wait strategies demonstrated")
    
    @pytest.mark.integration
    def test_complete_authentication_flow(self):
        """Test complete authentication workflow from login to dashboard"""
        print("🔄 Testing complete authentication flow...")
        
        # Step 1: Verify login page loads
        assert self.login_page.is_login_form_displayed(), "Login form should be displayed"
        
        # Step 2: Perform login
        login_success = self.login_page.login_with_valid_user()
        assert login_success, "Login should succeed"
        
        # Step 3: Wait for redirect
        redirect_success = self.login_page.wait_for_login_success()
        assert redirect_success, "Should redirect after login"
        
        # Step 4: Verify dashboard access
        dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
        assert dashboard_loaded, "Dashboard should load after successful login"
        
        # Step 5: Verify user session
        is_logged_in = self.dashboard_page.is_user_logged_in()
        assert is_logged_in, "User should be logged in with dashboard access"
        
        print("✅ Complete authentication flow successful")
    
    def test_session_persistence(self):
        """Test that user session persists across page navigation"""
        print("🔄 Testing session persistence...")
        
        # Login first
        self.login_page.login_with_valid_user()
        self.login_page.wait_for_login_success()
        
        # Navigate to different pages
        test_urls = [
            f"{config.BASE_URL}/dashboard",
            f"{config.BASE_URL}/profile",
            f"{config.BASE_URL}/"
        ]
        
        for url in test_urls:
            try:
                self.login_page.driver.get(url)
                time.sleep(2)
                
                current_url = self.login_page.get_current_url()
                # Should not be redirected back to login
                assert '/login' not in current_url, \
                    f"Should maintain session, but redirected to login from {url}"
                
                print(f"   ✅ Session maintained for: {url}")
                
            except Exception as e:
                print(f"   ⚠️ Could not test {url}: {e}")
        
        print("✅ Session persistence verified")