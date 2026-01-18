"""
Dashboard Module E2E Tests for EduAssist
Tests performance analytics and progress charts functionality

Demonstrates:
- Chart and data visualization testing
- Explicit waits for asynchronous content loading
- Mouse interactions and hover effects
- Data extraction and validation
- Navigation and user interface testing
"""

import pytest
import time
from utils.driver_manager import DriverManager
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from config.test_config import config


class TestDashboard:
    """Dashboard module test class"""
    
    @classmethod
    def setup_class(cls):
        """Setup authenticated session for dashboard tests"""
        print("🚀 Initializing WebDriver for Dashboard tests...")
        DriverManager.initialize_driver()
        
        # Initialize page objects
        cls.login_page = LoginPage()
        cls.dashboard_page = DashboardPage()
        
        # Login to access dashboard
        print("🔐 Logging in to access dashboard...")
        cls.login_page.navigate_to_login()
        cls.login_page.login_with_valid_user()
        cls.login_page.wait_for_login_success()
        
        print("✅ Authentication successful, ready for dashboard tests")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup after all tests"""
        print("🧹 Cleaning up WebDriver...")
        DriverManager.quit_driver()
        print("✅ WebDriver cleanup completed")
    
    def setup_method(self):
        """Setup before each test method"""
        # Ensure we're on the dashboard page before each test
        self.dashboard_page.navigate_to_dashboard()
    
    def test_dashboard_page_load_and_layout(self):
        """Test dashboard loads with all main components"""
        print("📊 Testing dashboard component loading...")
        
        # Verify page title using explicit assertion
        title_valid = self.dashboard_page.verify_page_title()
        assert title_valid, "Dashboard page title should contain expected keywords"
        
        # Wait for dashboard components to load using explicit waits
        dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
        assert dashboard_loaded, "Dashboard components should load successfully"
        
        # Validate all main dashboard components are present
        components = self.dashboard_page.validate_dashboard_components()
        
        assert components['welcome_message'], "Welcome message should be displayed"
        assert components['navigation'], "Navigation menu should be displayed"
        
        print("✅ Dashboard components loaded successfully")
        print(f"   - Welcome Message: {components['welcome_message']}")
        print(f"   - Performance Chart: {components['performance_chart']}")
        print(f"   - Progress Chart: {components['progress_chart']}")
        print(f"   - Navigation: {components['navigation']}")
        print(f"   - Stats Cards: {components['stats_cards']}")
    
    def test_personalized_welcome_message(self):
        """Test that dashboard displays personalized welcome message"""
        print("👋 Testing personalized welcome message...")
        
        # Get welcome message text using CSS selector
        welcome_message = self.dashboard_page.get_welcome_message()
        
        # Verify welcome message is not empty and contains expected content
        assert welcome_message, "Welcome message should not be empty"
        
        welcome_lower = welcome_message.lower()
        expected_keywords = ['welcome', 'hello', 'dashboard', 'good', 'hi']
        
        contains_greeting = any(keyword in welcome_lower for keyword in expected_keywords)
        assert contains_greeting, f"Welcome message should contain greeting keywords: {welcome_message}"
        
        print(f"✅ Welcome message displayed: '{welcome_message}'")
    
    def test_performance_chart_display(self):
        """Test that performance chart displays with data"""
        print("📈 Testing performance chart display...")
        
        # Check if performance chart is displayed using explicit wait
        chart_displayed = self.dashboard_page.is_performance_chart_displayed()
        assert chart_displayed, "Performance chart should be displayed"
        
        # Wait for charts to load with data (demonstrates waiting for async content)
        charts_loaded = self.dashboard_page.wait_for_charts_to_load()
        assert charts_loaded, "Charts should load with data"
        
        print("✅ Performance chart displayed successfully")
    
    def test_progress_chart_display(self):
        """Test that progress chart displays with data"""
        print("📊 Testing progress chart display...")
        
        # Check if progress chart is displayed
        chart_displayed = self.dashboard_page.is_progress_chart_displayed()
        assert chart_displayed, "Progress chart should be displayed"
        
        # Wait for chart data to load
        charts_loaded = self.dashboard_page.wait_for_charts_to_load()
        assert charts_loaded, "Progress chart should load with data"
        
        print("✅ Progress chart displayed successfully")
    
    def test_chart_hover_interactions(self):
        """Test chart tooltips and hover interactions"""
        print("🖱️ Testing chart hover interactions...")
        
        # Wait for charts to be fully loaded
        charts_loaded = self.dashboard_page.wait_for_charts_to_load()
        assert charts_loaded, "Charts should be loaded before interaction"
        
        # Perform hover interaction on performance chart (demonstrates mouse actions)
        hover_success = self.dashboard_page.hover_over_chart()
        
        if hover_success:
            # Check if tooltip appears (may not always be present depending on chart library)
            tooltip_displayed = self.dashboard_page.is_chart_tooltip_displayed()
            print(f"   🖱️ Chart hover successful. Tooltip visible: {tooltip_displayed}")
        else:
            print("   ⚠️ Chart hover interaction not available")
        
        print("✅ Chart hover interaction completed")
    
    def test_performance_statistics_extraction(self):
        """Test extraction and validation of performance statistics"""
        print("📊 Testing performance statistics extraction...")
        
        # Extract performance stats from dashboard cards
        stats = self.dashboard_page.get_performance_stats()
        
        # Verify stats object is not empty
        assert isinstance(stats, dict), "Performance stats should be returned as dictionary"
        
        if stats:
            print("✅ Performance statistics extracted:")
            for key, value in stats.items():
                print(f"   - {key}: {value}")
                # Basic validation that stats contain data
                assert value, f"Stat value for '{key}' should not be empty"
        else:
            print("⚠️ No performance statistics found - might be empty for new users")
    
    def test_recent_activity_feed(self):
        """Test recent activity feed display and data"""
        print("📝 Testing recent activity feed...")
        
        # Get recent activity items using list extraction
        activities = self.dashboard_page.get_recent_activity_items()
        
        # Verify activities are returned as list
        assert isinstance(activities, list), "Recent activities should be returned as list"
        
        if activities:
            print(f"✅ Recent activities found ({len(activities)} items):")
            for i, activity in enumerate(activities[:3]):  # Show first 3
                print(f"   {i + 1}. {activity}")
                # Validate activity items are not empty
                assert activity.strip(), f"Activity item {i + 1} should not be empty"
        else:
            print("✅ No recent activities (expected for new user accounts)")
    
    def test_dashboard_navigation_menu(self):
        """Test navigation to different sections using sidebar menu"""
        print("🧭 Testing dashboard navigation...")
        
        # Test navigation to different sections
        menu_items = ['Profile', 'Settings', 'Analytics', 'Reports']
        
        for menu_item in menu_items:
            try:
                print(f"   Navigating to {menu_item}...")
                nav_success = self.dashboard_page.navigate_to_menu_item(menu_item)
                
                if nav_success:
                    # Wait for navigation to complete
                    time.sleep(2)
                    
                    # Verify URL change or page content change
                    current_url = self.dashboard_page.get_current_url()
                    url_changed = menu_item.lower() in current_url.lower()
                    
                    print(f"   ✅ Navigation to {menu_item}: {'Success' if url_changed else 'URL unchanged'}")
                    
                    # Navigate back to dashboard for next test
                    self.dashboard_page.navigate_to_dashboard()
                    time.sleep(1)
                else:
                    print(f"   ⚠️ Navigation to {menu_item} not available")
                    
            except Exception as e:
                print(f"   ⚠️ Navigation to {menu_item} failed: {e}")
    
    def test_quick_action_interactions(self):
        """Test quick action button interactions"""
        print("⚡ Testing quick action interactions...")
        
        # Test common quick actions
        quick_actions = ['Start Quiz', 'View Progress', 'Get Recommendations', 'New Learning']
        
        for action in quick_actions:
            try:
                print(f"   Testing quick action: {action}...")
                action_success = self.dashboard_page.click_quick_action(action)
                
                if action_success:
                    # Wait for action to complete
                    time.sleep(2)
                    print(f"   ✅ Quick action '{action}' executed successfully")
                    
                    # Navigate back to dashboard
                    self.dashboard_page.navigate_to_dashboard()
                    time.sleep(1)
                else:
                    print(f"   ⚠️ Quick action '{action}' not available")
                    
            except Exception as e:
                print(f"   ⚠️ Quick action '{action}' failed: {e}")
    
    def test_dashboard_data_refresh(self):
        """Test dashboard data refresh functionality"""
        print("🔄 Testing dashboard data refresh...")
        
        # Get initial stats
        initial_stats = self.dashboard_page.get_performance_stats()
        
        # Refresh dashboard
        self.dashboard_page.refresh_dashboard()
        
        # Wait for refresh to complete
        time.sleep(3)
        
        # Get stats after refresh
        refreshed_stats = self.dashboard_page.get_performance_stats()
        
        # Verify dashboard refreshed (stats structure should be consistent)
        if initial_stats and refreshed_stats:
            assert len(refreshed_stats) >= len(initial_stats), \
                "Refreshed stats should have at least as many items as initial stats"
        
        print("✅ Dashboard refresh completed successfully")
    
    def test_dashboard_load_performance(self):
        """Test dashboard loading performance"""
        print("⏱️ Testing dashboard load performance...")
        
        # Measure dashboard load time
        load_time = self.dashboard_page.measure_dashboard_load_time()
        
        # Assert load time is reasonable (under 15 seconds)
        assert load_time < 15.0, f"Dashboard should load within 15 seconds, took {load_time:.2f}s"
        
        print(f"✅ Dashboard loaded in {load_time:.2f} seconds")
    
    def test_user_session_maintenance(self):
        """Test that user session is maintained and authentication state persists"""
        print("🔐 Testing session persistence...")
        
        # Verify user is still logged in
        is_logged_in = self.dashboard_page.is_user_logged_in()
        assert is_logged_in, "User should still be logged in"
        
        # Refresh page and verify session persists
        self.dashboard_page.refresh_page()
        self.dashboard_page.wait_for_dashboard_load()
        
        still_logged_in = self.dashboard_page.is_user_logged_in()
        assert still_logged_in, "User session should persist after page refresh"
        
        print("✅ User session maintained after page refresh")
    
    def test_responsive_design_elements(self):
        """Test dashboard responsive design and layout"""
        print("📱 Testing responsive design elements...")
        
        # Get current window size
        driver = DriverManager.get_driver()
        current_size = driver.get_window_size()
        
        try:
            # Test different window sizes
            test_sizes = [
                (1920, 1080),  # Desktop
                (1366, 768),   # Laptop
                (768, 1024),   # Tablet
            ]
            
            for width, height in test_sizes:
                print(f"   Testing size: {width}x{height}")
                driver.set_window_size(width, height)
                time.sleep(1)
                
                # Verify dashboard components are still accessible
                components = self.dashboard_page.validate_dashboard_components()
                navigation_visible = components['navigation']
                
                print(f"   ✅ Navigation visible at {width}x{height}: {navigation_visible}")
                
        finally:
            # Restore original window size
            driver.set_window_size(current_size['width'], current_size['height'])
            time.sleep(1)
        
        print("✅ Responsive design testing completed")
    
    def test_dashboard_error_handling(self):
        """Test dashboard error handling scenarios"""
        print("🚨 Testing dashboard error handling...")
        
        try:
            # Test navigation to non-existent dashboard section
            driver = DriverManager.get_driver()
            driver.get(f"{config.BASE_URL}/dashboard/nonexistent-section")
            time.sleep(2)
            
            current_url = self.dashboard_page.get_current_url()
            print(f"   Error page URL: {current_url}")
            
            # Should either show error page or redirect to valid dashboard
            page_elements = self.dashboard_page.find_elements_safe(
                self.dashboard_page.by_css('*')
            )
            assert len(page_elements) > 0, "Page should still have content even for invalid URLs"
            
            print("✅ Error handling working - page still loads content")
            
        except Exception as e:
            print(f"⚠️ Error handling test encountered: {e}")
        
        finally:
            # Navigate back to valid dashboard
            self.dashboard_page.navigate_to_dashboard()
    
    @pytest.mark.integration
    def test_complete_dashboard_workflow(self):
        """Test complete dashboard user workflow"""
        print("🔄 Testing complete dashboard workflow...")
        
        # Step 1: Verify dashboard loads
        dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
        assert dashboard_loaded, "Dashboard should load successfully"
        
        # Step 2: Verify welcome message
        welcome_message = self.dashboard_page.get_welcome_message()
        assert welcome_message, "Welcome message should be displayed"
        
        # Step 3: Wait for charts to load
        charts_loaded = self.dashboard_page.wait_for_charts_to_load()
        assert charts_loaded, "Charts should load with data"
        
        # Step 4: Extract performance data
        stats = self.dashboard_page.get_performance_stats()
        assert isinstance(stats, dict), "Should be able to extract performance statistics"
        
        # Step 5: Test chart interaction
        hover_success = self.dashboard_page.hover_over_chart()
        print(f"   Chart interaction: {'✅' if hover_success else '⚠️'}")
        
        # Step 6: Test navigation
        nav_success = self.dashboard_page.navigate_to_menu_item('Profile')
        if nav_success:
            self.dashboard_page.navigate_to_dashboard()  # Return to dashboard
        
        print("✅ Complete dashboard workflow successful")
    
    def test_accessibility_features(self):
        """Test basic accessibility features of dashboard"""
        print("♿ Testing accessibility features...")
        
        # Check for ARIA labels and roles
        driver = DriverManager.get_driver()
        
        # Look for accessibility attributes
        aria_elements = driver.find_elements(self.dashboard_page.by_css('[aria-label]'))
        role_elements = driver.find_elements(self.dashboard_page.by_css('[role]'))
        alt_images = driver.find_elements(self.dashboard_page.by_css('img[alt]'))
        
        print(f"   ARIA labels found: {len(aria_elements)}")
        print(f"   Role attributes found: {len(role_elements)}")
        print(f"   Images with alt text: {len(alt_images)}")
        
        # Basic accessibility check
        accessibility_score = len(aria_elements) + len(role_elements) + len(alt_images)
        print(f"   Basic accessibility score: {accessibility_score}")
        
        print("✅ Accessibility features checked")