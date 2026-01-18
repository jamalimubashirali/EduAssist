"""
Quiz Page Object Model for EduAssist Quiz Arena Module
Tests quiz functionality and subject selection
"""

import time
from typing import List, Dict

from pages.base_page import BasePage
from utils.driver_manager import by_css, by_xpath
from config.test_config import config


class QuizPage(BasePage):
    """Quiz page object with quiz arena functionality"""
    
    def __init__(self):
        super().__init__()
        
        # Quiz arena elements based on your actual quiz page structure
        self.page_title_selectors = [
            'h1.text-3xl.font-bold',                # Title styling classes
            '.quiz-title',                          # Generic quiz title
            'h1',                                   # Fallback h1
            '.text-3xl'                             # Title class fallback
        ]
        
        # Tab navigation elements
        self.subjects_tab_selectors = [
            '[data-tab="subjects"]',                # Tab data attribute
            'button[class*="subject"]',             # Button with subject in class
            '.bg-gradient-to-r'                     # Active tab styling
        ]
        
        self.quizzes_tab_selectors = [
            '[data-tab="quizzes"]',                 # Tab data attribute
            'button[class*="quiz"]',                # Button with quiz in class
            '.bg-gradient-to-r'                     # Active tab styling
        ]
        
        # Quick action buttons from your dashboard
        self.quick_quiz_button_selectors = [
            '[data-testid="quick-quiz"]',           # Test ID if added
            '.quick-quiz-button',                   # Quick quiz button class
            'button[class*="quick"]',               # Button with quick in class
            '.game-button'                          # Your button class
        ]
        
        self.challenge_quiz_button_selectors = [
            '[data-testid="challenge-quiz"]',       # Test ID if added
            'button:contains("Start Challenge")',   # Start challenge text
            '[data-testid="challenge-quiz"]',       # Test ID if added
            '.challenge-quiz-button'                # Challenge button class
        ]
        
        self.daily_challenge_selectors = [
            'button:contains("Daily Challenge")',   # Daily challenge text
            'button:contains("Take Challenge")',    # Take challenge text
            'a[href*="daily"]',                     # Daily challenge link
            '.daily-challenge'                      # Daily challenge class
        ]
        
        # Subject selection elements
        self.subject_card_selectors = [
            '.game-card',                           # Your game card class
            '[data-testid="subject-card"]',         # Test ID if added
            'div:contains("Mathematics")',          # Mathematics subject
            'div:contains("Science")',              # Science subject
            'a[href*="subjects"]'                   # Subject links
        ]
        
        # Quiz list elements (for All Quizzes tab)
        self.search_input_selectors = [
            'input[placeholder*="Search quizzes"]', # Search input placeholder
            'input[type="search"]',                 # Search input type
            '[data-testid="quiz-search"]',          # Test ID if added
            '.search-input'                         # Search input class
        ]
        
        self.filter_selectors = [
            'select',                               # Filter dropdowns
            '[data-testid="subject-filter"]',       # Subject filter
            '[data-testid="difficulty-filter"]',    # Difficulty filter
            '.filter-select'                        # Filter select class
        ]
        
        self.quiz_card_selectors = [
            '.game-card',                           # Quiz cards use game-card class
            '[data-testid="quiz-card"]',            # Test ID if added
            'div:contains("questions")',            # Cards with question count
            'button:contains("Start")'              # Start button in cards
        ]
        
        # Generate quiz elements
        self.generate_quiz_button_selectors = [
            'button:contains("Generate Quiz")',     # Generate quiz button
            'a[href*="generate"]',                  # Generate quiz link
            '[data-testid="generate-quiz"]',        # Test ID if added
            '.generate-quiz-button'                 # Generate button class
        ]
        
        # Quiz statistics and info
        self.stats_display_selectors = [
            '.text-2xl.font-bold',                  # Stats number styling
            'div:contains("Available")',            # Available count text
            '.stats-number',                        # Stats number class
            '[data-testid="quiz-stats"]'            # Test ID if added
        ]
    
    def navigate_to_quiz_arena(self) -> None:
        """Navigate to quiz arena page"""
        print("🎮 Navigating to Quiz Arena...")
        quiz_url = f"{config.BASE_URL}/quiz"
        self.driver.get(quiz_url)
        self.wait_for_page_load()
        self.wait_for_quiz_arena_load()
    
    def wait_for_quiz_arena_load(self, timeout: int = None) -> bool:
        """
        Wait for quiz arena components to load
        Demonstrates waiting for quiz interface
        """
        timeout = timeout or config.TIMEOUTS['medium']
        print("⏳ Waiting for quiz arena to load...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Check for page title and main elements
            title_present = any(self.is_element_displayed(by_css(selector)) 
                              for selector in self.page_title_selectors)
            tabs_present = any(self.is_element_displayed(by_css(selector)) 
                             for selector in self.subjects_tab_selectors)
            
            if title_present and tabs_present:
                print("✅ Quiz arena loaded successfully")
                return True
            
            time.sleep(0.5)
        
        print("⚠️ Quiz arena load timeout")
        return False
    
    def switch_to_subjects_tab(self) -> bool:
        """Switch to the subjects tab"""
        print("📚 Switching to subjects tab...")
        
        for selector in self.subjects_tab_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Subjects tab clicked using: {selector}")
                time.sleep(1)  # Wait for tab content to load
                return True
        
        print("⚠️ Subjects tab not found")
        return False
    
    def switch_to_quizzes_tab(self) -> bool:
        """Switch to the all quizzes tab"""
        print("📝 Switching to all quizzes tab...")
        
        for selector in self.quizzes_tab_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Quizzes tab clicked using: {selector}")
                time.sleep(1)  # Wait for tab content to load
                return True
        
        print("⚠️ Quizzes tab not found")
        return False
    
    def start_quick_quiz(self) -> bool:
        """
        Start a quick quiz
        Tests the quick quiz functionality
        """
        print("⚡ Starting quick quiz...")
        
        for selector in self.quick_quiz_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Quick quiz started using: {selector}")
                time.sleep(2)  # Wait for quiz to start
                return True
        
        print("⚠️ Quick quiz button not found")
        return False
    
    def start_challenge_quiz(self) -> bool:
        """
        Start a timed challenge quiz
        Tests the challenge quiz functionality
        """
        print("🏆 Starting challenge quiz...")
        
        for selector in self.challenge_quiz_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Challenge quiz started using: {selector}")
                time.sleep(2)  # Wait for quiz to start
                return True
        
        print("⚠️ Challenge quiz button not found")
        return False
    
    def start_daily_challenge(self) -> bool:
        """
        Start the daily challenge
        Tests daily challenge functionality
        """
        print("📅 Starting daily challenge...")
        
        for selector in self.daily_challenge_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Daily challenge started using: {selector}")
                time.sleep(2)  # Wait for navigation
                return True
        
        print("⚠️ Daily challenge button not found")
        return False
    
    def select_subject(self, subject_name: str) -> bool:
        """
        Select a specific subject from the subjects tab
        Demonstrates subject selection testing
        """
        print(f"📖 Selecting subject: {subject_name}")
        
        # First ensure we're on the subjects tab
        self.switch_to_subjects_tab()
        
        # Try XPath to find subject by name
        xpath = f'//div[contains(text(), "{subject_name}") or contains(@href, "{subject_name.lower()}")]'
        if self.click_element(by_xpath(xpath)):
            print(f"✅ Subject '{subject_name}' selected via XPath")
            time.sleep(2)
            return True
        
        # Try CSS selectors for subject cards
        subject_elements = []
        for selector in self.subject_card_selectors:
            elements = self.find_elements_safe(by_css(selector))
            subject_elements.extend(elements)
        
        for element in subject_elements:
            try:
                if subject_name.lower() in element.text.lower():
                    element.click()
                    print(f"✅ Subject '{subject_name}' selected via CSS")
                    time.sleep(2)
                    return True
            except Exception:
                continue
        
        print(f"⚠️ Subject '{subject_name}' not found")
        return False
    
    def search_quizzes(self, search_term: str) -> bool:
        """
        Search for quizzes using the search input
        Tests quiz search functionality
        """
        print(f"🔍 Searching for quizzes: '{search_term}'")
        
        # First ensure we're on the quizzes tab
        self.switch_to_quizzes_tab()
        
        # Find and use search input
        for selector in self.search_input_selectors:
            if self.type_text(by_css(selector), search_term):
                print(f"✅ Search term entered using: {selector}")
                time.sleep(2)  # Wait for search results
                return True
        
        print("⚠️ Search input not found")
        return False
    
    def filter_quizzes_by_subject(self, subject: str) -> bool:
        """
        Filter quizzes by subject using dropdown
        Tests quiz filtering functionality
        """
        print(f"🎯 Filtering quizzes by subject: {subject}")
        
        # Find subject filter dropdown
        filter_elements = []
        for selector in self.filter_selectors:
            elements = self.find_elements_safe(by_css(selector))
            filter_elements.extend(elements)
        
        for filter_element in filter_elements:
            try:
                # Check if this is a subject filter (contains subject options)
                options = filter_element.find_elements(*by_css('option'))
                for option in options:
                    if subject.lower() in option.text.lower():
                        option.click()
                        print(f"✅ Subject filter '{subject}' selected")
                        time.sleep(2)
                        return True
            except Exception:
                continue
        
        print(f"⚠️ Subject filter '{subject}' not found")
        return False
    
    def get_available_subjects(self) -> List[str]:
        """
        Get list of available subjects
        Demonstrates data extraction from subject cards
        """
        subjects = []
        print("📚 Extracting available subjects...")
        
        # Ensure we're on subjects tab
        self.switch_to_subjects_tab()
        
        # Get subject cards
        subject_elements = []
        for selector in self.subject_card_selectors:
            elements = self.find_elements_safe(by_css(selector))
            subject_elements.extend(elements)
        
        for element in subject_elements:
            try:
                text = element.text.strip()
                if text and 'Mathematics' in text or 'Science' in text or 'English' in text:
                    # Extract subject name from card text
                    lines = text.split('\n')
                    for line in lines:
                        if any(subj in line for subj in ['Mathematics', 'Science', 'English', 'History']):
                            if line not in subjects:
                                subjects.append(line)
                            break
            except Exception:
                continue
        
        print(f"✅ Found {len(subjects)} subjects: {subjects}")
        return subjects
    
    def get_quiz_count(self) -> int:
        """
        Get the total number of available quizzes
        Demonstrates stats extraction
        """
        print("📊 Getting quiz count...")
        
        # Look for stats display elements
        for selector in self.stats_display_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                text = element.text.strip()
                if 'Available' in text or text.isdigit():
                    try:
                        # Extract number from text
                        import re
                        numbers = re.findall(r'\d+', text)
                        if numbers:
                            count = int(numbers[0])
                            print(f"✅ Quiz count: {count}")
                            return count
                    except ValueError:
                        continue
        
        print("⚠️ Quiz count not found")
        return 0
    
    def get_quiz_cards(self) -> List[Dict[str, str]]:
        """
        Get information from quiz cards
        Demonstrates quiz data extraction
        """
        quizzes = []
        print("🎯 Extracting quiz card information...")
        
        # Ensure we're on quizzes tab
        self.switch_to_quizzes_tab()
        
        # Get quiz cards
        quiz_elements = []
        for selector in self.quiz_card_selectors:
            elements = self.find_elements_safe(by_css(selector))
            quiz_elements.extend(elements)
        
        for element in quiz_elements:
            try:
                text = element.text.strip()
                if text and ('questions' in text.lower() or 'start' in text.lower()):
                    quiz_info = {
                        'title': 'Unknown',
                        'questions': '0',
                        'difficulty': 'Unknown',
                        'full_text': text
                    }
                    
                    # Parse quiz information from text
                    lines = text.split('\n')
                    for line in lines:
                        if 'questions' in line.lower():
                            quiz_info['questions'] = line
                        elif any(diff in line.lower() for diff in ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced']):
                            quiz_info['difficulty'] = line
                        elif len(line) > 5 and not any(skip in line.lower() for skip in ['start', 'questions', 'min', 'xp']):
                            quiz_info['title'] = line
                    
                    quizzes.append(quiz_info)
            except Exception:
                continue
        
        print(f"✅ Extracted {len(quizzes)} quiz cards")
        for i, quiz in enumerate(quizzes[:3]):  # Show first 3
            print(f"   🎯 {i+1}. {quiz['title']} - {quiz['questions']} - {quiz['difficulty']}")
        
        return quizzes
    
    def click_generate_quiz(self) -> bool:
        """
        Click the generate quiz button
        Tests quiz generation functionality
        """
        print("🎲 Clicking generate quiz...")
        
        for selector in self.generate_quiz_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Generate quiz clicked using: {selector}")
                time.sleep(2)  # Wait for navigation
                return True
        
        print("⚠️ Generate quiz button not found")
        return False
    
    def verify_page_title(self) -> bool:
        """Verify quiz arena page title"""
        title = self.get_page_title()
        expected_keywords = ['quiz', 'arena', 'eduassist', 'test']
        
        title_lower = title.lower()
        for keyword in expected_keywords:
            if keyword in title_lower:
                print(f"✅ Quiz page title verified: '{title}' contains '{keyword}'")
                return True
        
        print(f"⚠️ Quiz page title '{title}' doesn't contain expected keywords")
        return False
    
    def is_quiz_arena_loaded(self) -> bool:
        """Check if quiz arena is fully loaded"""
        title_present = any(self.is_element_displayed(by_css(selector)) 
                          for selector in self.page_title_selectors)
        tabs_present = any(self.is_element_displayed(by_css(selector)) 
                         for selector in self.subjects_tab_selectors)
        
        return title_present and tabs_present
    
    def test_tab_switching(self) -> bool:
        """
        Test switching between subjects and quizzes tabs
        Demonstrates tab navigation testing
        """
        print("🔄 Testing tab switching...")
        
        # Test subjects tab
        subjects_success = self.switch_to_subjects_tab()
        if not subjects_success:
            return False
        
        # Test quizzes tab
        quizzes_success = self.switch_to_quizzes_tab()
        if not quizzes_success:
            return False
        
        # Switch back to subjects
        subjects_again = self.switch_to_subjects_tab()
        
        success = subjects_success and quizzes_success and subjects_again
        print(f"✅ Tab switching test: {'Passed' if success else 'Failed'}")
        return success