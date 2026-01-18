"""
Learning Assistant Page Object Model for EduAssist AI Tutor Module
Tests the AI Learning Assistant chat functionality
"""

import time
from typing import List, Dict

from pages.base_page import BasePage
from utils.driver_manager import by_css, by_xpath
from config.test_config import config


class LearningAssistantPage(BasePage):
    """Learning Assistant page object with AI chat functionality"""
    
    def __init__(self):
        super().__init__()
        
        # Chat interface elements based on your LearningAssistantChat component
        self.chat_input_selectors = [
            'textarea[placeholder*="Ask me anything"]',  # Your chat input placeholder
            'textarea[placeholder*="studies"]',          # Alternative placeholder text
            '[data-testid="chat-input"]',                # Test ID if added
            'textarea',                                  # Generic textarea
            '.chat-input'                                # Chat input class
        ]
        
        self.send_button_selectors = [
            'button[type="submit"]',                     # Submit button in chat
            'button:contains("Send")',                   # Send button text
            '[data-testid="send-button"]',               # Test ID if added
            '.send-button'                               # Send button class
        ]
        
        self.chat_messages_selectors = [
            '.chat-message',                             # Chat message component
            '[data-testid="chat-message"]',              # Test ID if added
            '.message',                                  # Generic message class
            'div[class*="message"]'                      # Any div with message in class
        ]
        
        self.ai_response_selectors = [
            '.chat-message.ai',                          # AI message class
            '[data-role="assistant"]',                   # Assistant role
            'div:contains("AI")',                        # Any div mentioning AI
            '.bot-message'                               # Bot message class
        ]
        
        self.user_message_selectors = [
            '.chat-message.user',                        # User message class
            '[data-role="user"]',                        # User role
            '.user-message'                              # User message class
        ]
        
        # Sidebar and session elements
        self.session_sidebar_selectors = [
            '.session-sidebar',                          # Session sidebar component
            '[data-testid="session-sidebar"]',           # Test ID if added
            '.sidebar',                                  # Generic sidebar
            'aside'                                      # Semantic aside element
        ]
        
        self.new_session_button_selectors = [
            '[data-testid="new-session"]',               # Test ID if added
            '.new-session-button',                       # New session button class
            'button[class*="new"]',                      # Button with new in class
            'button[class*="session"]'                   # Button with session in class
        ]
        
        # Suggested topics and follow-up questions
        self.suggested_topics_selectors = [
            '.suggested-topics',                         # Suggested topics component
            '[data-testid="suggested-topics"]',          # Test ID if added
            'button[class*="topic"]',                    # Button with topic in class
            '.topic-button'                              # Topic button class
        ]
        
        self.follow_up_questions_selectors = [
            '.follow-up-questions',                      # Follow-up questions component
            '[data-testid="follow-up-questions"]',       # Test ID if added
            '.follow-up-button'                          # Follow-up button class
        ]
        
        # Loading and typing indicators
        self.typing_indicator_selectors = [
            '.typing-indicator',                         # Typing indicator component
            '[data-testid="typing-indicator"]',          # Test ID if added
            '.loading-dots',                             # Loading animation
            '[class*="typing"]'                          # Any element with typing in class
        ]
        
        # Error handling
        self.error_message_selectors = [
            '.text-red-400',                             # Your error color
            '[role="alert"]',                            # Alert role
            '.error-message',                            # Error message class
            '[class*="error"]'                           # Any element with error in class
        ]
    
    def navigate_to_learning_assistant(self) -> None:
        """Navigate to learning assistant page"""
        print("🤖 Navigating to AI Learning Assistant...")
        assistant_url = f"{config.BASE_URL}/learning-assistant"
        self.driver.get(assistant_url)
        self.wait_for_page_load()
        self.wait_for_chat_interface_load()
    
    def wait_for_chat_interface_load(self, timeout: int = None) -> bool:
        """
        Wait for chat interface to load
        Demonstrates waiting for chat components
        """
        timeout = timeout or config.TIMEOUTS['medium']
        print("⏳ Waiting for chat interface to load...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Check for chat input and send button
            input_present = any(self.is_element_displayed(by_css(selector)) 
                              for selector in self.chat_input_selectors)
            send_present = any(self.is_element_displayed(by_css(selector)) 
                             for selector in self.send_button_selectors)
            
            if input_present and send_present:
                print("✅ Chat interface loaded successfully")
                return True
            
            time.sleep(0.5)
        
        print("⚠️ Chat interface load timeout")
        return False
    
    def send_chat_message(self, message: str) -> bool:
        """
        Send a message in the chat interface
        Demonstrates chat interaction
        """
        print(f"💬 Sending chat message: '{message}'")
        
        # Find and fill chat input
        input_success = False
        for selector in self.chat_input_selectors:
            if self.type_text(by_css(selector), message):
                print(f"✅ Message typed using selector: {selector}")
                input_success = True
                break
        
        if not input_success:
            print("❌ Failed to find chat input")
            return False
        
        # Click send button
        send_success = False
        for selector in self.send_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ Send button clicked using selector: {selector}")
                send_success = True
                break
        
        if not send_success:
            print("❌ Failed to find send button")
            return False
        
        # Wait for message to be sent
        time.sleep(2)
        print("✅ Chat message sent successfully")
        return True
    
    def wait_for_ai_response(self, timeout: int = None) -> bool:
        """
        Wait for AI to respond to the message
        Demonstrates waiting for dynamic AI responses
        """
        timeout = timeout or config.TIMEOUTS['long']  # AI responses might take longer
        print("🤖 Waiting for AI response...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Check for new AI messages
            ai_messages = []
            for selector in self.ai_response_selectors:
                elements = self.find_elements_safe(by_css(selector))
                ai_messages.extend(elements)
            
            if ai_messages:
                print(f"✅ AI response received - found {len(ai_messages)} AI messages")
                return True
            
            # Check for typing indicator
            typing_active = any(self.is_element_displayed(by_css(selector)) 
                              for selector in self.typing_indicator_selectors)
            if typing_active:
                print("⏳ AI is typing...")
            
            time.sleep(1)
        
        print("⚠️ AI response timeout")
        return False
    
    def get_chat_messages(self) -> List[Dict[str, str]]:
        """
        Get all chat messages from the conversation
        Demonstrates message extraction and parsing
        """
        messages = []
        print("📝 Extracting chat messages...")
        
        # Get all message elements
        message_elements = []
        for selector in self.chat_messages_selectors:
            elements = self.find_elements_safe(by_css(selector))
            message_elements.extend(elements)
        
        for element in message_elements:
            try:
                text = element.text.strip()
                if text:
                    # Determine message type (user or AI)
                    message_type = "unknown"
                    
                    # Check if it's a user message
                    for user_selector in self.user_message_selectors:
                        if element.find_elements(*by_css(user_selector.replace('.chat-message.user', ''))):
                            message_type = "user"
                            break
                    
                    # Check if it's an AI message
                    if message_type == "unknown":
                        for ai_selector in self.ai_response_selectors:
                            if element.find_elements(*by_css(ai_selector.replace('.chat-message.ai', ''))):
                                message_type = "ai"
                                break
                    
                    messages.append({
                        'type': message_type,
                        'content': text
                    })
            except Exception as e:
                print(f"⚠️ Error extracting message: {e}")
        
        print(f"✅ Extracted {len(messages)} chat messages")
        for i, msg in enumerate(messages[-3:]):  # Show last 3 messages
            print(f"   💬 {msg['type']}: {msg['content'][:50]}...")
        
        return messages
    
    def click_suggested_topic(self, topic_text: str) -> bool:
        """
        Click on a suggested topic button
        Demonstrates interaction with suggested topics
        """
        print(f"🎯 Clicking suggested topic: '{topic_text}'")
        
        # Try XPath to find button by text
        xpath = f'//button[contains(text(), "{topic_text}")]'
        if self.click_element(by_xpath(xpath)):
            print(f"✅ Suggested topic '{topic_text}' clicked")
            return True
        
        # Try CSS selectors for suggested topics
        for selector in self.suggested_topics_selectors:
            elements = self.find_elements_safe(by_css(selector))
            for element in elements:
                if topic_text.lower() in element.text.lower():
                    element.click()
                    print(f"✅ Suggested topic '{topic_text}' clicked via CSS")
                    return True
        
        print(f"⚠️ Suggested topic '{topic_text}' not found")
        return False
    
    def create_new_session(self) -> bool:
        """
        Create a new chat session
        Tests session management functionality
        """
        print("🆕 Creating new chat session...")
        
        # Try to find and click new session button
        for selector in self.new_session_button_selectors:
            if self.click_element(by_css(selector)):
                print(f"✅ New session created using selector: {selector}")
                time.sleep(2)  # Wait for new session to load
                return True
        
        print("⚠️ New session button not found")
        return False
    
    def is_typing_indicator_visible(self) -> bool:
        """Check if AI typing indicator is visible"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.typing_indicator_selectors)
    
    def get_error_message(self) -> str:
        """Get any error messages from the chat interface"""
        for selector in self.error_message_selectors:
            text = self.get_text(by_css(selector))
            if text:
                return text
        return ""
    
    def is_error_displayed(self) -> bool:
        """Check if any error messages are displayed"""
        return any(self.is_element_displayed(by_css(selector)) 
                  for selector in self.error_message_selectors)
    
    def test_chat_conversation_flow(self) -> bool:
        """
        Test a complete chat conversation flow
        Demonstrates end-to-end chat testing
        """
        print("🔄 Testing complete chat conversation flow...")
        
        # Step 1: Send initial message
        initial_message = "What are my weak areas?"
        if not self.send_chat_message(initial_message):
            return False
        
        # Step 2: Wait for AI response
        if not self.wait_for_ai_response():
            return False
        
        # Step 3: Send follow-up message
        follow_up = "Can you help me with algebra?"
        if not self.send_chat_message(follow_up):
            return False
        
        # Step 4: Wait for second AI response
        if not self.wait_for_ai_response():
            return False
        
        # Step 5: Verify conversation history
        messages = self.get_chat_messages()
        if len(messages) < 4:  # Should have at least 2 user + 2 AI messages
            print(f"⚠️ Expected at least 4 messages, got {len(messages)}")
            return False
        
        print("✅ Complete chat conversation flow successful")
        return True
    
    def verify_page_title(self) -> bool:
        """Verify learning assistant page title"""
        title = self.get_page_title()
        expected_keywords = ['learning', 'assistant', 'ai', 'tutor', 'eduassist']
        
        title_lower = title.lower()
        for keyword in expected_keywords:
            if keyword in title_lower:
                print(f"✅ Page title verified: '{title}' contains '{keyword}'")
                return True
        
        print(f"⚠️ Page title '{title}' doesn't contain expected keywords")
        return False
    
    def is_chat_interface_ready(self) -> bool:
        """Check if chat interface is ready for interaction"""
        input_ready = any(self.is_element_displayed(by_css(selector)) 
                         for selector in self.chat_input_selectors)
        send_ready = any(self.is_element_displayed(by_css(selector)) 
                        for selector in self.send_button_selectors)
        
        return input_ready and send_ready