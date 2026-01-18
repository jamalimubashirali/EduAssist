"""
Dashboard Page Object Model for EduAssist Dashboard Module
Demonstrates testing performance analytics and progress charts
"""

import time
from typing import Dict, List

from pages.base_page import BasePage
from utils.driver_manager import by_css, by_xpath
from config.test_config import config


class DashboardPage(BasePage):
    """Dashboard page object with analytics and chart functionality"""
    
    def __init__(self):
        super().__init__()
        
        # Dashboard elements based on actual EduAssist dashboard structure
        self.welcome_message_selectors = [
            'h1.text-responsive-3xl',        # Your actual welcome heading classes
            'h1.font-primary',               # Font class from your design
            '.game-card h1',                 # H1 inside game card
            'h1:contains("Welcome back")',   # Text content matching
            'h1'                             # Generic fallback
        ]
        
        # XP and progress elements from your dashboard
        self.xp_bar_selectors = [
            '[data-testid="xp-bar"]',        # If you add test IDs
            '.xp-bar',                       # XP bar component
            '.progress-bar',                 # Generic progress bar
            'div:contains("XP")'             # Any div containing XP text
        ]
        
        self.streak_counter_selectors = [
            '[data-testid="streak-counter"]', # Streak counter component
            '.streak-counter',
            'div:contains("streak")',         # Any div with streak text
            'div:contains("🔥")'             # Fire emoji for streak
        ]
        
        # Navigation elements from GameLayout
        self.navigation_menu_selectors = [
            'nav',                           # Navigation element
            '.nav-menu',                     # Navigation menu class
            '[role="navigation"]',           # Accessibility role
            '.sidebar'                       # Sidebar navigation
        ]
        
        # Game cards and quick actions from your dashboard
        self.game_card_selectors = [
            '.game-card',                    # Your custom game card class
            '[data-testid="game-card"]',     # Test ID if added
            '.card',                         # Generic card class
            'div.p-6'                        # Padding class used in cards
        ]
        
        self.quick_action_selectors = [
            '.game-button',                  # Your button class
            'button[data-testid*="quiz"]',   # Quiz-related buttons
            'button[data-testid*="challenge"]', # Challenge buttons
            'button[data-testid*="study"]'   # Study buttons
        ]
        
        # Active quests and badges from your dashboard
        self.active_quests_selectors = [
            '.quest-card',                   # Quest card component
            '[data-testid="quest-card"]',    # Test ID if added
            'h2.text-responsive-2xl',        # Section heading styling
            '.game-card'                     # Game card fallback
        ]
        
        self.badges_selectors = [
            '.badge-card',                   # Badge card component
            '[data-testid="badge-card"]',    # Test ID if added
            '.trophy',                       # Trophy/badge icons
            '.game-card'                     # Game card fallback
        ]
        
        # Learning Assistant Widget
        self.learning_assistant_selectors = [
            '[data-testid="learning-assistant-widget"]',
            '.learning-assistant-widget',
            'button[data-testid*="ai"]',
            '.ai-widget'
        ]
        
        # Chart-specific elements
        self.chart_canvas_selectors = [
            'canvas',
            'svg',
            '.recharts-wrapper',
            '.chart-svg',
            '.highcharts-container'
        ]
        
        self.chart_tooltip_selectors = [
            '.chart-tooltip',
            '.recharts-tooltip-wrapper',
            '.tooltip',
            '.chart-popup'
        ]
    
    def navigate_to_dashboard(self) -> None:
        """Navigate to dashboard page"""
        print("📊 Navigating to dashboard...")
        dashboard_url = f"{config.BASE_URL}/dashboard"
        self.driver.get(dashboard_url)
        self.wait_for_page_load()
        self.wait_for_dashboard_load()
    
    def wait_for_dashboard_load(self, timeout: int = None) -> bool:
        """
        Wait for dashboard components to load
        Demonstrates waiting for dynamic content
        """
        timeout = timeout or config.TIMEOUTS['long']
        print("⏳ Waiting for dashboard components to load...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Check for key dashboard elements
            welcome_present = any(self.is_element_displayed(by_css(selector)) 
                                for selector in self.welcome_message_selectors)
            nav_present = any(self.is_element_displayed(by_css(selector)) 
                            for selector in self.navigation_menu_selectors)
            
            if welcome_present and nav_present:
                print("✅ Dashboard components loaded successfully")
                return True
            
            time.sleep(0.5)
        
        print("⚠️ Dashboard load timeout")
        return False
    
    def get_welcome_message(self) -> str:
        """
        Get welcome message text
        Demonstrates text extraction and validation
        """
        for selector in self.welcome_message_selectors:
            text = self.get_text(by_css(selector))
            if text:
                print(f"📝 Welcome message: '{text}'")
                return text
        
        print("⚠️ Welcome message not found")
        return ""
    
    def is_performance_chart_displayed(self) -> bool:
        """
        Check if performance chart is displayed
        Demonstrates chart element validation
        """
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.performance_chart_selectors)
    
    def is_progress_chart_displayed(self) -> bool:
        """Check if progress chart is displayed"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.progress_chart_selectors)
    
    def wait_for_charts_to_load(self, timeout: int = None) -> bool:
        """
        Wait for charts to load with data
        Demonstrates explicit wait for dynamic chart content
        """
        timeout = timeout or config.TIMEOUTS['long']
        print("📈 Waiting for charts to load...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Look for chart canvas/svg elements
            chart_elements = []
            for selector in self.chart_canvas_selectors:
                elements = self.find_elements_safe(by_css(selector))
                chart_elements.extend(elements)
            
            if chart_elements:
                print(f"✅ Charts loaded - found {len(chart_elements)} chart elements")
                # Additional wait for chart data to render
                time.sleep(2)
                return True
            
            time.sleep(0.5)
        
        print("⚠️ Charts load timeout")
        return False
    
    def get_performance_stats(self) -> Dict[str, str]:
        """
        Get performance statistics
        Demonstrates data extraction from dashboard cards
        """
        stats = {}
        print("📊 Extracting performance statistics...")
        
        # Find all stats cards
        stats_elements = []
        for selector in self.stats_card_selectors:
            elements = self.find_elements_safe(by_css(selector))
            stats_elements.extend(elements)
        
        for i, card in enumerate(stats_elements):
            try:
                text = card.text
                if text:
                    # Try to parse metric name and value
                    lines = text.split('\n')
                    if len(lines) >= 2:
                        value = lines[0].strip()
                        label = lines[1].strip()
                        if value and label:
                            stats[label] = value
                    else:
                        # Single line stats
                        stats[f"Metric_{i+1}"] = text.strip()
            except Exception as e:
                print(f"⚠️ Error extracting stats from card {i}: {e}")
        
        print(f"✅ Extracted {len(stats)} performance statistics")
        for key, value in stats.items():
            print(f"   📈 {key}: {value}")
        
        return stats
    
    def hover_over_chart(self) -> bool:
        """
        Interact with chart elements
        Demonstrates mouse interactions with charts
        """
        print("🖱️ Hovering over performance chart...")
        
        # Find chart element
        chart_element = None
        for selector in self.performance_chart_selectors:
            element = self.find_element_safe(by_css(selector))
            if element and element.is_displayed():
                chart_element = element
                break
        
        if chart_element:
            success = self.hover_over_element(by_css(self.performance_chart_selectors[0]))
            if success:
                print("✅ Chart hover interaction successful")
                # Wait for tooltip to appear
                time.sleep(1)
                return True
        
        print("⚠️ Chart hover interaction failed")
        return False
    
    def is_chart_tooltip_displayed(self) -> bool:
        """Check if chart tooltip is displayed after hover"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.chart_tooltip_selectors)
    
    def get_active_quests(self) -> List[str]:
        """
        Get active quests from dashboard
        Based on your actual quest system
        """
        quests = []
        print("🎯 Extracting active quests...")
        
        # Find quest container
        quest_container = None
        for selector in self.active_quests_selectors:
            element = self.find_element_safe(by_css(selector))
            if element:
                quest_container = element
                break
        
        if quest_container:
            # Look for quest cards within container
            quest_selectors = [
                '.quest-card',
                '.game-card',
                'div[class*="quest"]'
            ]
            
            for quest_selector in quest_selectors:
                try:
                    quest_elements = quest_container.find_elements(*by_css(quest_selector))
                    for quest in quest_elements:
                        text = quest.text.strip()
                        if text and text not in quests:
                            quests.append(text)
                except Exception:
                    continue
        
        print(f"✅ Found {len(quests)} active quests")
        for i, quest in enumerate(quests[:3]):  # Show first 3
            print(f"   🎯 {i+1}. {quest}")
        
        return quests
    
    def get_xp_and_level_info(self) -> Dict[str, str]:
        """
        Extract XP and level information from dashboard
        Based on your XP bar component
        """
        xp_info = {}
        print("⚡ Extracting XP and level information...")
        
        # Look for XP-related text
        xp_selectors = [
            'div:contains("XP")',
            'div:contains("Level")',
            '.xp-bar',
            '.level-display'
        ]
        
        for selector in xp_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                text = element.text.strip()
                if 'XP' in text:
                    xp_info['xp'] = text
                elif 'Level' in text:
                    xp_info['level'] = text
        
        print(f"✅ XP Info extracted: {xp_info}")
        return xp_info
    
    def get_streak_count(self) -> str:
        """
        Get current streak count
        Based on your streak counter component
        """
        print("🔥 Getting streak count...")
        
        for selector in self.streak_counter_selectors:
            element = self.find_element_safe(by_css(selector))
            if element:
                text = element.text.strip()
                print(f"✅ Streak info: {text}")
                return text
        
        print("⚠️ Streak counter not found")
        return ""
    
    def click_quick_action(self, action_text: str) -> bool:
        """
        Click on quick action button
        Demonstrates dynamic element interaction
        """
        print(f"⚡ Clicking quick action: {action_text}")
        
        # Try XPath to find button by text
        xpath = f'//button[contains(text(), "{action_text}")]'
        if self.click_element(by_xpath(xpath)):
            print(f"✅ Quick action '{action_text}' clicked")
            return True
        
        # Try CSS selectors for common action buttons
        action_selectors = [
            f'[data-action="{action_text.lower().replace(" ", "-")}"]',
            f'.action-{action_text.lower().replace(" ", "-")}',
            '.quick-action',
            '.action-button'
        ]
        
        for selector in action_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                if action_text.lower() in element.text.lower():
                    element.click()
                    print(f"✅ Quick action '{action_text}' clicked via CSS")
                    return True
        
        print(f"⚠️ Quick action '{action_text}' not found")
        return False
    
    def navigate_to_menu_item(self, menu_item: str) -> bool:
        """
        Navigate using sidebar menu
        Demonstrates navigation testing
        """
        print(f"🧭 Navigating to menu item: {menu_item}")
        
        # Try XPath for menu item by text
        menu_xpath = f'//a[contains(text(), "{menu_item}") or contains(@href, "{menu_item.lower()}")]'
        if self.click_element(by_xpath(menu_xpath)):
            print(f"✅ Navigated to {menu_item} via XPath")
            time.sleep(2)  # Wait for navigation
            return True
        
        # Try CSS selectors
        menu_selectors = [
            f'a[href*="{menu_item.lower()}"]',
            f'[data-menu="{menu_item.lower()}"]',
            f'.menu-{menu_item.lower()}',
            '.nav-link',
            '.menu-item'
        ]
        
        for selector in menu_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                if menu_item.lower() in element.text.lower():
                    element.click()
                    print(f"✅ Navigated to {menu_item} via CSS")
                    time.sleep(2)
                    return True
        
        print(f"⚠️ Menu item '{menu_item}' not found")
        return False
    
    def is_user_logged_in(self) -> bool:
        """Check if user is logged in (dashboard accessible)"""
        current_url = self.get_current_url()
        dashboard_indicators = ['/dashboard', '/home', '/welcome']
        
        # Check URL
        url_indicates_login = any(indicator in current_url for indicator in dashboard_indicators)
        
        # Check for welcome message or user-specific content
        welcome_present = any(self.is_element_displayed(by_css(selector)) 
                            for selector in self.welcome_message_selectors)
        
        return url_indicates_login and welcome_present
    
    def logout(self) -> bool:
        """Logout from dashboard"""
        print("🚪 Attempting to logout...")
        
        # Try common logout selectors
        logout_selectors = [
            'button:contains("Logout")',
            'button:contains("Sign Out")',
            'a:contains("Logout")',
            'a:contains("Sign Out")',
            '[data-testid="logout-button"]',
            '.logout-button'
        ]
        
        logout_xpath = '//button[contains(text(), "Logout") or contains(text(), "Sign Out")] | //a[contains(text(), "Logout") or contains(text(), "Sign Out")]'
        
        # Try XPath first
        if self.click_element(by_xpath(logout_xpath)):
            print("✅ Logout clicked via XPath")
            return self.wait_for_logout_success()
        
        # Try CSS selectors
        for selector in logout_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Logout clicked via CSS: {selector}")
                return self.wait_for_logout_success()
        
        print("⚠️ Logout button not found")
        return False
    
    def wait_for_logout_success(self, timeout: int = None) -> bool:
        """Wait for successful logout"""
        timeout = timeout or config.TIMEOUTS['medium']
        
        return self.wait_for_url_contains('/login', timeout) or \
               self.wait_for_url_contains('/', timeout)
    
    def verify_page_title(self) -> bool:
        """Verify dashboard page title"""
        title = self.get_page_title()
        expected_keywords = ['dashboard', 'home', 'eduassist', 'learning']
        
        title_lower = title.lower()
        for keyword in expected_keywords:
            if keyword in title_lower:
                print(f"✅ Dashboard title verified: '{title}' contains '{keyword}'")
                return True
        
        print(f"⚠️ Dashboard title '{title}' doesn't contain expected keywords")
        return False
    
    def validate_dashboard_components(self) -> Dict[str, bool]:
        """
        Check if all main dashboard components are loaded
        Comprehensive dashboard validation
        """
        print("🔍 Validating dashboard components...")
        
        components = {
            'welcome_message': any(self.is_element_displayed(by_css(selector)) 
                                 for selector in self.welcome_message_selectors),
            'performance_chart': self.is_performance_chart_displayed(),
            'progress_chart': self.is_progress_chart_displayed(),
            'navigation': any(self.is_element_displayed(by_css(selector)) 
                            for selector in self.navigation_menu_selectors),
            'stats_cards': any(self.is_element_displayed(by_css(selector)) 
                             for selector in self.stats_card_selectors)
        }
        
        print("📊 Dashboard component validation results:")
        for component, status in components.items():
            status_icon = "✅" if status else "❌"
            print(f"   {status_icon} {component.replace('_', ' ').title()}: {status}")
        
        return components
    
    def refresh_dashboard(self) -> None:
        """
        Refresh dashboard data
        Demonstrates page refresh and data reload testing
        """
        print("🔄 Refreshing dashboard...")
        self.refresh_page()
        self.wait_for_dashboard_load()
        self.wait_for_charts_to_load()
        print("✅ Dashboard refresh completed")
    
    def measure_dashboard_load_time(self) -> float:
        """
        Measure dashboard load performance
        Demonstrates performance testing
        """
        print("⏱️ Measuring dashboard load time...")
        
        start_time = time.time()
        self.navigate_to_dashboard()
        load_time = time.time() - start_time
        
        print(f"📊 Dashboard load time: {load_time:.2f} seconds")
        return load_time