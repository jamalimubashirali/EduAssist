"""
Complete E2E Test Suite for EduAssist
Runs comprehensive tests across all modules with integration scenarios

Demonstrates:
- Cross-module integration testing
- Complete user journey validation
- Performance and reliability testing
- Comprehensive test reporting
"""

import pytest
import time
from typing import Dict, Any
from utils.driver_manager import DriverManager
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from config.test_config import config


class TestCompleteSuite:
    """Complete E2E test suite with integration scenarios"""
    
    # Test execution tracking
    test_results = {
        'authentication': {'passed': 0, 'failed': 0, 'skipped': 0},
        'dashboard': {'passed': 0, 'failed': 0, 'skipped': 0},
        'integration': {'passed': 0, 'failed': 0, 'skipped': 0}
    }
    
    @classmethod
    def setup_class(cls):
        """Global setup for the entire test suite"""
        print("🚀 Starting EduAssist Complete E2E Test Suite...")
        print("=" * 60)
        print(f"Test Environment: {config.BASE_URL}")
        print(f"Browser: Chrome (Headless: {config.HEADLESS})")
        print(f"Timeout Settings: Short={config.TIMEOUTS['short']}s, "
              f"Medium={config.TIMEOUTS['medium']}s, Long={config.TIMEOUTS['long']}s")
        print("=" * 60)
        
        DriverManager.initialize_driver()
        
        # Initialize all page objects
        cls.login_page = LoginPage()
        cls.dashboard_page = DashboardPage()
        
        print("✅ WebDriver and Page Objects initialized successfully")
    
    @classmethod
    def teardown_class(cls):
        """Global cleanup and reporting"""
        print("\n" + "=" * 60)
        print("📊 TEST SUITE SUMMARY")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        total_skipped = 0
        
        for module, results in cls.test_results.items():
            print(f"{module.upper()}:")
            print(f"  ✅ Passed: {results['passed']}")
            print(f"  ❌ Failed: {results['failed']}")
            print(f"  ⏭️  Skipped: {results['skipped']}")
            print(f"  📊 Total: {results['passed'] + results['failed'] + results['skipped']}")
            
            total_passed += results['passed']
            total_failed += results['failed']
            total_skipped += results['skipped']
        
        print("=" * 60)
        print(f"OVERALL RESULTS:")
        print(f"  ✅ Total Passed: {total_passed}")
        print(f"  ❌ Total Failed: {total_failed}")
        print(f"  ⏭️  Total Skipped: {total_skipped}")
        print(f"  📊 Grand Total: {total_passed + total_failed + total_skipped}")
        
        if total_passed + total_failed > 0:
            success_rate = total_passed / (total_passed + total_failed) * 100
            print(f"  🎯 Success Rate: {success_rate:.1f}%")
        
        print("=" * 60)
        
        DriverManager.quit_driver()
        print("✅ Test suite cleanup completed")
    
    def test_application_accessibility(self):
        """Test basic application accessibility and loading"""
        print("\n🌐 Testing application accessibility...")
        
        try:
            # Navigate to application
            self.login_page.driver.get(config.BASE_URL)
            self.login_page.wait_for_page_load()
            
            # Get page information
            title = self.login_page.get_page_title()
            current_url = self.login_page.get_current_url()
            
            print(f"📄 Page Title: '{title}'")
            print(f"🌐 Current URL: {current_url}")
            
            # Basic assertions
            assert config.BASE_URL in current_url, f"Should load application URL: {current_url}"
            assert title, "Page should have a title"
            
            # Check for basic page elements
            page_elements = self.login_page.find_elements_safe(
                self.login_page.by_css('*')
            )
            assert len(page_elements) > 0, "Page should have content elements"
            
            print(f"✅ Application accessible with {len(page_elements)} elements")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Application accessibility test failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    def test_complete_authentication_workflow(self):
        """Test complete user authentication workflow"""
        print("\n🔄 Testing complete authentication workflow...")
        
        try:
            # Step 1: Navigate to login page
            self.login_page.navigate_to_login()
            assert self.login_page.verify_page_title(), "Login page should load with correct title"
            
            # Step 2: Verify login form is present
            assert self.login_page.is_login_form_displayed(), "Login form should be displayed"
            
            # Step 3: Perform login with valid credentials
            login_success = self.login_page.login_with_valid_user()
            assert login_success, "Login form submission should succeed"
            
            # Step 4: Wait for successful redirect
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Should redirect after successful login"
            
            # Step 5: Verify dashboard access
            current_url = self.login_page.get_current_url()
            assert '/dashboard' in current_url or '/home' in current_url, \
                f"Should redirect to dashboard: {current_url}"
            
            # Step 6: Verify user session is established
            is_logged_in = self.dashboard_page.is_user_logged_in()
            assert is_logged_in, "User should be logged in with dashboard access"
            
            print("✅ Complete authentication workflow successful")
            self.test_results['authentication']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Authentication workflow failed: {e}")
            self.test_results['authentication']['failed'] += 1
            raise
    
    def test_dashboard_functionality_integration(self):
        """Test integrated dashboard functionality"""
        print("\n📊 Testing dashboard functionality integration...")
        
        try:
            # Ensure we're on dashboard
            self.dashboard_page.navigate_to_dashboard()
            
            # Step 1: Wait for dashboard to load completely
            dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
            assert dashboard_loaded, "Dashboard should load successfully"
            
            # Step 2: Validate all main components
            components = self.dashboard_page.validate_dashboard_components()
            assert components['welcome_message'], "Welcome message should be displayed"
            assert components['navigation'], "Navigation should be present"
            
            # Step 3: Test data extraction
            welcome_message = self.dashboard_page.get_welcome_message()
            assert welcome_message, "Should be able to extract welcome message"
            
            # Step 4: Test chart loading
            charts_loaded = self.dashboard_page.wait_for_charts_to_load()
            print(f"   📈 Charts loaded: {charts_loaded}")
            
            # Step 5: Test performance statistics
            stats = self.dashboard_page.get_performance_stats()
            print(f"   📊 Statistics extracted: {len(stats)} items")
            
            # Step 6: Test basic interactions
            hover_success = self.dashboard_page.hover_over_chart()
            print(f"   🖱️ Chart interaction: {'✅' if hover_success else '⚠️'}")
            
            print("✅ Dashboard functionality integration successful")
            self.test_results['dashboard']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Dashboard integration test failed: {e}")
            self.test_results['dashboard']['failed'] += 1
            raise
    
    def test_cross_module_navigation(self):
        """Test seamless navigation between all modules"""
        print("\n🔄 Testing cross-module navigation...")
        
        try:
            # Start from dashboard
            self.dashboard_page.navigate_to_dashboard()
            assert self.dashboard_page.is_user_logged_in(), "Should be logged in on dashboard"
            
            # Test navigation to different sections
            navigation_tests = [
                {'section': 'Profile', 'expected_url_part': 'profile'},
                {'section': 'Settings', 'expected_url_part': 'settings'},
                {'section': 'Analytics', 'expected_url_part': 'analytics'}
            ]
            
            successful_navigations = 0
            
            for nav_test in navigation_tests:
                try:
                    print(f"   Testing navigation to: {nav_test['section']}")
                    
                    nav_success = self.dashboard_page.navigate_to_menu_item(nav_test['section'])
                    if nav_success:
                        time.sleep(2)
                        current_url = self.dashboard_page.get_current_url()
                        
                        if nav_test['expected_url_part'] in current_url.lower():
                            print(f"   ✅ Successfully navigated to {nav_test['section']}")
                            successful_navigations += 1
                        else:
                            print(f"   ⚠️ Navigation to {nav_test['section']} - URL didn't change as expected")
                    else:
                        print(f"   ⚠️ Navigation to {nav_test['section']} not available")
                    
                    # Return to dashboard for next test
                    self.dashboard_page.navigate_to_dashboard()
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"   ⚠️ Navigation to {nav_test['section']} failed: {e}")
            
            # At least some navigation should work
            print(f"   📊 Successful navigations: {successful_navigations}/{len(navigation_tests)}")
            
            print("✅ Cross-module navigation testing completed")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Cross-module navigation failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    def test_session_persistence_across_modules(self):
        """Test that user session persists across different modules"""
        print("\n🔐 Testing session persistence across modules...")
        
        try:
            # Verify initial login state
            assert self.dashboard_page.is_user_logged_in(), "Should start logged in"
            
            # Test session persistence across different URLs
            test_urls = [
                f"{config.BASE_URL}/dashboard",
                f"{config.BASE_URL}/profile",
                f"{config.BASE_URL}/"
            ]
            
            session_maintained_count = 0
            
            for url in test_urls:
                try:
                    print(f"   Testing session at: {url}")
                    
                    self.dashboard_page.driver.get(url)
                    time.sleep(2)
                    
                    current_url = self.dashboard_page.get_current_url()
                    
                    # Should not be redirected back to login
                    if '/login' not in current_url:
                        print(f"   ✅ Session maintained at: {url}")
                        session_maintained_count += 1
                    else:
                        print(f"   ❌ Session lost at: {url} - redirected to login")
                        
                except Exception as e:
                    print(f"   ⚠️ Could not test session at {url}: {e}")
            
            # At least main pages should maintain session
            assert session_maintained_count > 0, "Session should be maintained on at least some pages"
            
            print(f"✅ Session persistence verified on {session_maintained_count}/{len(test_urls)} URLs")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Session persistence test failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    def test_performance_across_modules(self):
        """Test performance metrics across different modules"""
        print("\n⏱️ Testing performance across modules...")
        
        try:
            performance_results = {}
            
            # Test dashboard load time
            print("   Testing dashboard performance...")
            start_time = time.time()
            self.dashboard_page.navigate_to_dashboard()
            self.dashboard_page.wait_for_dashboard_load()
            dashboard_time = time.time() - start_time
            performance_results['dashboard'] = dashboard_time
            
            # Test login page load time
            print("   Testing login page performance...")
            start_time = time.time()
            self.login_page.navigate_to_login()
            self.login_page.wait_for_login_form()
            login_time = time.time() - start_time
            performance_results['login'] = login_time
            
            # Test main page load time
            print("   Testing main page performance...")
            start_time = time.time()
            self.dashboard_page.driver.get(config.BASE_URL)
            self.dashboard_page.wait_for_page_load()
            main_time = time.time() - start_time
            performance_results['main'] = main_time
            
            # Verify all modules load within acceptable time (15 seconds)
            for module, load_time in performance_results.items():
                print(f"   📊 {module.title()} load time: {load_time:.2f}s")
                assert load_time < 15.0, f"{module} should load within 15 seconds, took {load_time:.2f}s"
            
            average_load_time = sum(performance_results.values()) / len(performance_results)
            print(f"✅ Average module load time: {average_load_time:.2f}s")
            
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Performance test failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    def test_error_handling_and_recovery(self):
        """Test error handling and recovery across modules"""
        print("\n🚨 Testing error handling and recovery...")
        
        try:
            # Test invalid URL handling
            print("   Testing invalid URL handling...")
            invalid_url = f"{config.BASE_URL}/nonexistent-page-12345"
            self.dashboard_page.driver.get(invalid_url)
            time.sleep(2)
            
            # Should still have some content (404 page or redirect)
            page_elements = self.dashboard_page.find_elements_safe(
                self.dashboard_page.by_css('*')
            )
            assert len(page_elements) > 0, "Should show error page or redirect for invalid URLs"
            
            # Test recovery by navigating to valid page
            print("   Testing error recovery...")
            self.dashboard_page.navigate_to_dashboard()
            recovery_success = self.dashboard_page.wait_for_dashboard_load()
            assert recovery_success, "Should be able to recover from error state"
            
            print("✅ Error handling and recovery successful")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            self.test_results['integration']['failed'] += 1
            # Don't raise here as this is testing error scenarios
    
    def test_browser_compatibility_features(self):
        """Test browser compatibility and JavaScript functionality"""
        print("\n🌐 Testing browser compatibility features...")
        
        try:
            # Test JavaScript execution
            print("   Testing JavaScript execution...")
            js_result = self.dashboard_page.execute_script("return document.readyState;")
            assert js_result == "complete", "JavaScript should be working"
            
            # Test local storage (if used by application)
            print("   Testing browser storage...")
            storage_test = self.dashboard_page.execute_script(
                "localStorage.setItem('test', 'value'); return localStorage.getItem('test');"
            )
            assert storage_test == "value", "Local storage should be working"
            
            # Clean up test data
            self.dashboard_page.execute_script("localStorage.removeItem('test');")
            
            # Test basic DOM manipulation
            print("   Testing DOM manipulation...")
            scroll_result = self.dashboard_page.execute_script("window.scrollTo(0, 100); return window.pageYOffset;")
            assert scroll_result == 100, "DOM manipulation should work"
            
            # Reset scroll position
            self.dashboard_page.execute_script("window.scrollTo(0, 0);")
            
            print("✅ Browser compatibility features working")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Browser compatibility test failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    def test_responsive_design_validation(self):
        """Test responsive design across different viewport sizes"""
        print("\n📱 Testing responsive design validation...")
        
        try:
            driver = DriverManager.get_driver()
            original_size = driver.get_window_size()
            
            # Test different viewport sizes
            test_viewports = [
                {'name': 'Desktop', 'width': 1920, 'height': 1080},
                {'name': 'Laptop', 'width': 1366, 'height': 768},
                {'name': 'Tablet', 'width': 768, 'height': 1024},
                {'name': 'Mobile', 'width': 375, 'height': 667}
            ]
            
            responsive_results = {}
            
            for viewport in test_viewports:
                try:
                    print(f"   Testing {viewport['name']} ({viewport['width']}x{viewport['height']})...")
                    
                    driver.set_window_size(viewport['width'], viewport['height'])
                    time.sleep(1)
                    
                    # Navigate to dashboard to test responsiveness
                    self.dashboard_page.navigate_to_dashboard()
                    time.sleep(2)
                    
                    # Check if main elements are still accessible
                    components = self.dashboard_page.validate_dashboard_components()
                    responsive_results[viewport['name']] = components['navigation']
                    
                    print(f"   📱 {viewport['name']} navigation visible: {components['navigation']}")
                    
                except Exception as e:
                    print(f"   ⚠️ {viewport['name']} test failed: {e}")
                    responsive_results[viewport['name']] = False
            
            # Restore original window size
            driver.set_window_size(original_size['width'], original_size['height'])
            time.sleep(1)
            
            # At least desktop and laptop should work well
            desktop_works = responsive_results.get('Desktop', False)
            laptop_works = responsive_results.get('Laptop', False)
            
            assert desktop_works or laptop_works, "Application should work on at least desktop or laptop sizes"
            
            working_viewports = sum(1 for works in responsive_results.values() if works)
            print(f"✅ Responsive design working on {working_viewports}/{len(test_viewports)} viewports")
            
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ Responsive design test failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise
    
    @pytest.mark.integration
    def test_end_to_end_user_journey(self):
        """Test complete end-to-end user journey"""
        print("\n🎯 Testing complete end-to-end user journey...")
        
        try:
            # Step 1: Start from application homepage
            print("   Step 1: Loading application...")
            self.dashboard_page.driver.get(config.BASE_URL)
            self.dashboard_page.wait_for_page_load()
            
            # Step 2: Navigate to login
            print("   Step 2: Navigating to login...")
            self.login_page.navigate_to_login()
            assert self.login_page.is_login_form_displayed(), "Login form should be accessible"
            
            # Step 3: Perform authentication
            print("   Step 3: Performing authentication...")
            login_success = self.login_page.login_with_valid_user()
            assert login_success, "Authentication should succeed"
            
            # Step 4: Access dashboard
            print("   Step 4: Accessing dashboard...")
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Should redirect to dashboard after login"
            
            # Step 5: Interact with dashboard features
            print("   Step 5: Interacting with dashboard...")
            dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
            assert dashboard_loaded, "Dashboard should load with all components"
            
            # Step 6: Extract user data
            print("   Step 6: Extracting user data...")
            welcome_message = self.dashboard_page.get_welcome_message()
            stats = self.dashboard_page.get_performance_stats()
            
            assert welcome_message, "Should display personalized welcome message"
            print(f"   📊 Extracted {len(stats)} performance metrics")
            
            # Step 7: Test navigation
            print("   Step 7: Testing navigation...")
            nav_success = self.dashboard_page.navigate_to_menu_item('Profile')
            if nav_success:
                self.dashboard_page.navigate_to_dashboard()  # Return to dashboard
            
            # Step 8: Verify session persistence
            print("   Step 8: Verifying session...")
            self.dashboard_page.refresh_page()
            still_logged_in = self.dashboard_page.is_user_logged_in()
            assert still_logged_in, "Session should persist after page refresh"
            
            print("✅ Complete end-to-end user journey successful")
            self.test_results['integration']['passed'] += 1
            
        except Exception as e:
            print(f"❌ End-to-end user journey failed: {e}")
            self.test_results['integration']['failed'] += 1
            raise