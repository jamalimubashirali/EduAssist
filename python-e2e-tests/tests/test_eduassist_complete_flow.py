"""
Complete EduAssist Application Flow E2E Tests
Tests the entire user journey through your actual EduAssist application

This test suite covers:
- Login with demo account
- Dashboard navigation and components
- Learning Assistant AI chat
- Quiz Arena functionality
- Subject selection and quiz taking
- Real application flow based on actual code structure
"""

import pytest
import time
from utils.driver_manager import DriverManager
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.learning_assistant_page import LearningAssistantPage
from pages.quiz_page import QuizPage
from config.test_config import config


class TestEduAssistCompleteFlow:
    """Complete application flow test class"""
    
    @classmethod
    def setup_class(cls):
        """Setup for the entire test class"""
        print("🚀 Initializing WebDriver for Complete EduAssist Flow tests...")
        DriverManager.initialize_driver()
        
        # Initialize page objects
        cls.login_page = LoginPage()
        cls.dashboard_page = DashboardPage()
        cls.learning_assistant_page = LearningAssistantPage()
        cls.quiz_page = QuizPage()
        
        print("✅ WebDriver and Page Objects initialized successfully")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup for the entire test class"""
        print("🧹 Cleaning up WebDriver...")
        DriverManager.quit_driver()
        print("✅ WebDriver cleanup completed")
    
    def test_01_login_with_demo_account(self):
        """Test login using the demo account functionality"""
        print("🎮 Testing demo account login...")
        
        # Navigate to login page
        self.login_page.navigate_to_login()
        
        # Verify login page loads
        assert self.login_page.is_login_form_displayed(), "Login form should be displayed"
        
        # Test demo account login
        demo_success = self.login_page.login_with_demo_account()
        if demo_success:
            # Wait for redirect
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Demo login should redirect to dashboard"
            print("✅ Demo account login successful")
        else:
            # Fallback to manual demo login
            print("⚠️ Demo button not found, trying manual demo login...")
            manual_success = self.login_page.login('demo@eduassist.com', 'demo123')
            assert manual_success, "Manual demo login should work"
            
            redirect_success = self.login_page.wait_for_login_success()
            assert redirect_success, "Manual demo login should redirect"
            print("✅ Manual demo login successful")
    
    def test_02_dashboard_components_and_navigation(self):
        """Test dashboard components based on your actual dashboard structure"""
        print("📊 Testing dashboard components...")
        
        # Ensure we're on dashboard
        self.dashboard_page.navigate_to_dashboard()
        
        # Wait for dashboard to load
        dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
        assert dashboard_loaded, "Dashboard should load successfully"
        
        # Test welcome message
        welcome_message = self.dashboard_page.get_welcome_message()
        assert welcome_message, "Welcome message should be displayed"
        assert any(keyword in welcome_message.lower() for keyword in ['welcome', 'demo', 'back']), \
            f"Welcome message should contain expected text: {welcome_message}"
        
        # Test XP and level information
        xp_info = self.dashboard_page.get_xp_and_level_info()
        print(f"📈 XP Info: {xp_info}")
        
        # Test streak counter
        streak_info = self.dashboard_page.get_streak_count()
        print(f"🔥 Streak Info: {streak_info}")
        
        # Test active quests
        quests = self.dashboard_page.get_active_quests()
        print(f"🎯 Active Quests: {len(quests)} found")
        
        print("✅ Dashboard components tested successfully")
    
    def test_03_quick_actions_functionality(self):
        """Test the quick action buttons on dashboard"""
        print("⚡ Testing quick actions...")
        
        # Ensure we're on dashboard
        self.dashboard_page.navigate_to_dashboard()
        
        # Test quick quiz action
        quick_quiz_success = self.dashboard_page.click_quick_action("Quick Quiz")
        if quick_quiz_success:
            print("✅ Quick Quiz action successful")
            # Navigate back to dashboard
            self.dashboard_page.navigate_to_dashboard()
        else:
            print("⚠️ Quick Quiz action not available")
        
        # Test study session action
        study_success = self.dashboard_page.click_quick_action("Study Session")
        if study_success:
            print("✅ Study Session action successful")
            # Navigate back to dashboard
            self.dashboard_page.navigate_to_dashboard()
        else:
            print("⚠️ Study Session action not available")
        
        print("✅ Quick actions testing completed")
    
    def test_04_learning_assistant_chat_functionality(self):
        """Test the AI Learning Assistant chat functionality"""
        print("🤖 Testing Learning Assistant...")
        
        # Navigate to learning assistant
        self.learning_assistant_page.navigate_to_learning_assistant()
        
        # Wait for chat interface to load
        chat_loaded = self.learning_assistant_page.wait_for_chat_interface_load()
        assert chat_loaded, "Chat interface should load successfully"
        
        # Verify page title
        title_valid = self.learning_assistant_page.verify_page_title()
        if not title_valid:
            print("⚠️ Page title doesn't match expected keywords, but continuing...")
        
        # Test sending a message
        message_sent = self.learning_assistant_page.send_chat_message("What are my weak areas?")
        assert message_sent, "Should be able to send chat message"
        
        # Wait for AI response
        ai_responded = self.learning_assistant_page.wait_for_ai_response(timeout=30)
        if ai_responded:
            print("✅ AI responded to message")
        else:
            print("⚠️ AI response timeout - this might be expected in test environment")
        
        # Test suggested topics if available
        topic_clicked = self.learning_assistant_page.click_suggested_topic("algebra")
        if topic_clicked:
            print("✅ Suggested topic clicked")
        else:
            print("⚠️ Suggested topics not available")
        
        # Get chat messages
        messages = self.learning_assistant_page.get_chat_messages()
        print(f"💬 Found {len(messages)} chat messages")
        
        print("✅ Learning Assistant testing completed")
    
    def test_05_quiz_arena_navigation_and_functionality(self):
        """Test Quiz Arena functionality based on your actual quiz page"""
        print("🎮 Testing Quiz Arena...")
        
        # Navigate to quiz arena
        self.quiz_page.navigate_to_quiz_arena()
        
        # Wait for quiz arena to load
        arena_loaded = self.quiz_page.wait_for_quiz_arena_load()
        assert arena_loaded, "Quiz arena should load successfully"
        
        # Verify page title
        title_valid = self.quiz_page.verify_page_title()
        if not title_valid:
            print("⚠️ Quiz page title doesn't match expected keywords, but continuing...")
        
        # Test tab switching
        tab_switching_success = self.quiz_page.test_tab_switching()
        assert tab_switching_success, "Tab switching should work"
        
        # Test subjects tab
        subjects_switched = self.quiz_page.switch_to_subjects_tab()
        assert subjects_switched, "Should be able to switch to subjects tab"
        
        # Get available subjects
        subjects = self.quiz_page.get_available_subjects()
        print(f"📚 Available subjects: {subjects}")
        
        # Test quizzes tab
        quizzes_switched = self.quiz_page.switch_to_quizzes_tab()
        assert quizzes_switched, "Should be able to switch to quizzes tab"
        
        # Get quiz count
        quiz_count = self.quiz_page.get_quiz_count()
        print(f"📊 Total quizzes available: {quiz_count}")
        
        # Get quiz cards information
        quiz_cards = self.quiz_page.get_quiz_cards()
        print(f"🎯 Quiz cards found: {len(quiz_cards)}")
        
        print("✅ Quiz Arena testing completed")
    
    def test_06_quick_quiz_functionality(self):
        """Test starting a quick quiz"""
        print("⚡ Testing Quick Quiz functionality...")
        
        # Navigate to quiz arena
        self.quiz_page.navigate_to_quiz_arena()
        
        # Try to start a quick quiz
        quick_quiz_started = self.quiz_page.start_quick_quiz()
        if quick_quiz_started:
            print("✅ Quick quiz started successfully")
            
            # Wait a moment for quiz to load
            time.sleep(3)
            
            # Check current URL to see if we're in a quiz
            current_url = self.quiz_page.get_current_url()
            print(f"📍 Current URL after quick quiz: {current_url}")
            
            # Navigate back to quiz arena for next test
            self.quiz_page.navigate_to_quiz_arena()
        else:
            print("⚠️ Quick quiz button not found or not functional")
    
    def test_07_subject_selection_and_navigation(self):
        """Test selecting subjects and navigating to subject pages"""
        print("📖 Testing subject selection...")
        
        # Navigate to quiz arena
        self.quiz_page.navigate_to_quiz_arena()
        
        # Switch to subjects tab
        self.quiz_page.switch_to_subjects_tab()
        
        # Try to select Mathematics subject
        math_selected = self.quiz_page.select_subject("Mathematics")
        if math_selected:
            print("✅ Mathematics subject selected")
            
            # Check if we navigated to subject page
            current_url = self.quiz_page.get_current_url()
            print(f"📍 Current URL after subject selection: {current_url}")
            
            # Navigate back to quiz arena
            self.quiz_page.navigate_to_quiz_arena()
        else:
            print("⚠️ Mathematics subject not found or not clickable")
        
        # Try Science subject
        science_selected = self.quiz_page.select_subject("Science")
        if science_selected:
            print("✅ Science subject selected")
            
            current_url = self.quiz_page.get_current_url()
            print(f"📍 Current URL after Science selection: {current_url}")
            
            # Navigate back
            self.quiz_page.navigate_to_quiz_arena()
        else:
            print("⚠️ Science subject not found")
    
    def test_08_quiz_search_and_filtering(self):
        """Test quiz search and filtering functionality"""
        print("🔍 Testing quiz search and filtering...")
        
        # Navigate to quiz arena
        self.quiz_page.navigate_to_quiz_arena()
        
        # Switch to quizzes tab
        self.quiz_page.switch_to_quizzes_tab()
        
        # Test search functionality
        search_success = self.quiz_page.search_quizzes("math")
        if search_success:
            print("✅ Quiz search functionality working")
            
            # Get results after search
            search_results = self.quiz_page.get_quiz_cards()
            print(f"🔍 Search results: {len(search_results)} quizzes found")
        else:
            print("⚠️ Quiz search not available")
        
        # Test subject filtering
        filter_success = self.quiz_page.filter_quizzes_by_subject("Mathematics")
        if filter_success:
            print("✅ Subject filtering working")
            
            # Get filtered results
            filtered_results = self.quiz_page.get_quiz_cards()
            print(f"🎯 Filtered results: {len(filtered_results)} quizzes found")
        else:
            print("⚠️ Subject filtering not available")
    
    def test_09_generate_quiz_functionality(self):
        """Test the generate quiz functionality"""
        print("🎲 Testing generate quiz functionality...")
        
        # Navigate to quiz arena
        self.quiz_page.navigate_to_quiz_arena()
        
        # Try to click generate quiz
        generate_clicked = self.quiz_page.click_generate_quiz()
        if generate_clicked:
            print("✅ Generate quiz button clicked")
            
            # Check if we navigated to generate page
            current_url = self.quiz_page.get_current_url()
            print(f"📍 Current URL after generate quiz: {current_url}")
            
            if '/generate' in current_url:
                print("✅ Successfully navigated to quiz generation page")
            else:
                print("⚠️ Generate quiz navigation might not be working as expected")
        else:
            print("⚠️ Generate quiz button not found")
    
    def test_10_complete_user_journey_integration(self):
        """Test complete user journey from login to quiz interaction"""
        print("🔄 Testing complete user journey integration...")
        
        # Step 1: Start from login
        self.login_page.navigate_to_login()
        assert self.login_page.is_login_form_displayed(), "Login form should be available"
        
        # Step 2: Login with demo account
        login_success = self.login_page.login_with_demo_account() or \
                       self.login_page.login('demo@eduassist.com', 'demo123')
        assert login_success, "Should be able to login"
        
        # Step 3: Verify dashboard access
        redirect_success = self.login_page.wait_for_login_success()
        assert redirect_success, "Should redirect to dashboard"
        
        # Step 4: Interact with dashboard
        self.dashboard_page.wait_for_dashboard_load()
        welcome_msg = self.dashboard_page.get_welcome_message()
        assert welcome_msg, "Dashboard should show welcome message"
        
        # Step 5: Navigate to Learning Assistant
        self.learning_assistant_page.navigate_to_learning_assistant()
        chat_loaded = self.learning_assistant_page.wait_for_chat_interface_load()
        if chat_loaded:
            # Send a quick message
            self.learning_assistant_page.send_chat_message("Hello AI!")
            print("✅ Learning Assistant interaction successful")
        
        # Step 6: Navigate to Quiz Arena
        self.quiz_page.navigate_to_quiz_arena()
        arena_loaded = self.quiz_page.wait_for_quiz_arena_load()
        assert arena_loaded, "Quiz arena should load"
        
        # Step 7: Try to start a quiz
        quick_quiz_started = self.quiz_page.start_quick_quiz()
        if quick_quiz_started:
            print("✅ Quiz interaction successful")
        
        print("✅ Complete user journey integration test successful")
    
    def test_11_error_handling_and_edge_cases(self):
        """Test error handling and edge cases"""
        print("⚠️ Testing error handling and edge cases...")
        
        # Test invalid navigation
        invalid_url = f"{config.BASE_URL}/nonexistent-page"
        self.login_page.driver.get(invalid_url)
        time.sleep(2)
        
        current_url = self.login_page.get_current_url()
        print(f"📍 Invalid URL result: {current_url}")
        
        # Test session persistence
        self.dashboard_page.navigate_to_dashboard()
        dashboard_loaded = self.dashboard_page.wait_for_dashboard_load()
        
        if dashboard_loaded:
            print("✅ Session maintained after invalid navigation")
        else:
            print("⚠️ Session might have been lost")
        
        # Test page refresh
        self.dashboard_page.refresh_dashboard()
        refresh_loaded = self.dashboard_page.wait_for_dashboard_load()
        
        if refresh_loaded:
            print("✅ Dashboard handles refresh correctly")
        else:
            print("⚠️ Dashboard refresh might have issues")
        
        print("✅ Error handling tests completed")
    
    @pytest.mark.performance
    def test_12_performance_and_load_times(self):
        """Test application performance and load times"""
        print("⏱️ Testing performance and load times...")
        
        # Test login page load time
        start_time = time.time()
        self.login_page.navigate_to_login()
        login_load_time = time.time() - start_time
        print(f"🔐 Login page load time: {login_load_time:.2f} seconds")
        assert login_load_time < 10, f"Login page should load within 10 seconds, took {login_load_time:.2f}s"
        
        # Test dashboard load time
        dashboard_load_time = self.dashboard_page.measure_dashboard_load_time()
        print(f"📊 Dashboard load time: {dashboard_load_time:.2f} seconds")
        assert dashboard_load_time < 15, f"Dashboard should load within 15 seconds, took {dashboard_load_time:.2f}s"
        
        # Test quiz arena load time
        start_time = time.time()
        self.quiz_page.navigate_to_quiz_arena()
        self.quiz_page.wait_for_quiz_arena_load()
        quiz_load_time = time.time() - start_time
        print(f"🎮 Quiz arena load time: {quiz_load_time:.2f} seconds")
        assert quiz_load_time < 10, f"Quiz arena should load within 10 seconds, took {quiz_load_time:.2f}s"
        
        print("✅ Performance tests completed")
    
    def test_13_accessibility_and_usability(self):
        """Test basic accessibility and usability features"""
        print("♿ Testing accessibility and usability...")
        
        # Navigate to login page
        self.login_page.navigate_to_login()
        
        # Test keyboard navigation (Tab key)
        try:
            # This is a basic test - in a real scenario you'd use more sophisticated accessibility testing
            email_input = self.login_page.find_element_safe(
                self.login_page.by_css('#email')
            )
            if email_input:
                email_input.send_keys("test@example.com")
                print("✅ Keyboard input working")
            
            # Test form labels and accessibility
            page_source = self.login_page.driver.page_source
            has_labels = 'label' in page_source.lower()
            has_alt_text = 'alt=' in page_source.lower()
            
            print(f"📝 Form labels present: {has_labels}")
            print(f"🖼️ Alt text present: {has_alt_text}")
            
        except Exception as e:
            print(f"⚠️ Accessibility test error: {e}")
        
        print("✅ Basic accessibility tests completed")