"""
Test Configuration for EduAssist Python E2E Tests
Contains all environment-specific settings and test data
"""

import os
from typing import Dict, Any


class TestConfig:
    """Configuration class for E2E tests"""
    
    def __init__(self):
        # Application URLs
        self.BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:3000')
        self.BACKEND_URL = os.getenv('TEST_BACKEND_URL', 'http://localhost:5000')
        
        # Browser Configuration
        self.HEADLESS = os.getenv('HEADLESS', 'false').lower() == 'true'
        self.WINDOW_WIDTH = 1920
        self.WINDOW_HEIGHT = 1080
        self.IMPLICIT_WAIT = 5  # seconds
        self.PAGE_LOAD_TIMEOUT = 30  # seconds
        self.SCRIPT_TIMEOUT = 30  # seconds
        
        # Test Data based on your actual EduAssist demo account
        self.TEST_USERS = {
            'valid_user': {
                'email': 'demo@eduassist.com',      # Your demo account
                'password': 'demo123',              # Your demo password
                'first_name': 'Demo',
                'last_name': 'User'
            },
            'demo_user': {
                'email': 'demo@eduassist.com',
                'password': 'demo123',
                'first_name': 'Demo',
                'last_name': 'User'
            },
            'new_user': {
                'email': 'new.user@eduassist.com',
                'password': 'NewPassword123!',
                'first_name': 'New',
                'last_name': 'User'
            }
        }
        
        # Timeouts for different operations (in seconds)
        self.TIMEOUTS = {
            'short': 5,      # Quick operations
            'medium': 15,    # API calls
            'long': 30,      # Complex operations
            'ai_response': 45  # AI tutoring responses
        }
        
        # Test selectors (fallback if page objects don't work)
        self.SELECTORS = {
            'auth': {
                'login_form': '[data-testid="login-form"], form',
                'email_input': '[data-testid="email-input"], input[type="email"], input[name="email"]',
                'password_input': '[data-testid="password-input"], input[type="password"], input[name="password"]',
                'login_button': '[data-testid="login-button"], button[type="submit"], .login-button',
                'signup_link': '[data-testid="signup-link"], a[href*="register"], a[href*="signup"]'
            },
            'dashboard': {
                'welcome_message': '[data-testid="welcome-message"], .welcome-message, h1',
                'performance_chart': '[data-testid="performance-chart"], .performance-chart, .chart-container',
                'progress_chart': '[data-testid="progress-chart"], .progress-chart, .progress-container',
                'navigation_menu': '[data-testid="navigation-menu"], .nav-menu, .sidebar'
            },
            'recommendations': {
                'recommendations_list': '[data-testid="recommendations-list"], .recommendations-list',
                'recommendation_card': '[data-testid="recommendation-card"], .recommendation-card',
                'skill_recommendation': '[data-testid="skill-recommendation"], .skill-recommendation'
            },
            'tutor': {
                'chat_interface': '[data-testid="chat-interface"], .chat-interface, .tutor-chat',
                'message_input': '[data-testid="message-input"], input[type="text"], textarea',
                'send_button': '[data-testid="send-button"], .send-button, button[type="submit"]',
                'chat_messages': '[data-testid="chat-messages"], .chat-messages, .messages-container',
                'ai_response': '[data-testid="ai-response"], .ai-message, .tutor-response'
            }
        }
        
        # Chrome options
        self.CHROME_OPTIONS = [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content',
            f'--window-size={self.WINDOW_WIDTH},{self.WINDOW_HEIGHT}'
        ]
    
    def get_chrome_options(self) -> list:
        """Get Chrome options including headless if configured"""
        options = self.CHROME_OPTIONS.copy()
        if self.HEADLESS:
            options.append('--headless')
        return options


# Global config instance
config = TestConfig()