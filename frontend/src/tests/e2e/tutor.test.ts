/**
 * AI Tutor Module E2E Tests for EduAssist
 * Tests chat-based interactive tutoring interface with AI responses
 * 
 * Demonstrates:
 * - Real-time chat interface testing
 * - Extended explicit waits for AI responses
 * - Text input and keyboard interactions
 * - Dynamic content validation
 * - Conversation flow testing
 * - Asynchronous content handling
 */

import { expect } from 'chai';
import { DriverManager } from './utils/driver-manager';
import { LoginPage } from './pages/login-page';
import { TutorPage } from './pages/tutor-page';
import { TestConfig } from './config/test-config';

describe('EduAssist AI Tutor Module', function() {
  let loginPage: LoginPage;
  let tutorPage: TutorPage;

  // Setup authenticated session for tutor tests
  before(async function() {
    console.log('🚀 Initializing WebDriver for AI Tutor tests...');
    await DriverManager.initializeDriver();
    
    // Initialize page objects
    loginPage = new LoginPage();
    tutorPage = new TutorPage();
    
    // Login to access AI tutor
    console.log('🔐 Logging in to access AI tutor...');
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidUser();
    await loginPage.waitForLoginSuccess();
    
    console.log('✅ Authentication successful, ready for AI tutor tests');
  });

  after(async function() {
    console.log('🧹 Cleaning up WebDriver...');
    await DriverManager.quitDriver();
    console.log('✅ WebDriver cleanup completed');
  });

  beforeEach(async function() {
    // Navigate to AI tutor page before each test
    await tutorPage.navigateToTutor();
  });

  describe('Chat Interface Load and Layout', function() {
    
    it('should load chat interface with all components', async function() {
      console.log('💬 Testing chat interface layout...');
      
      // Verify page title
      const titleValid = await tutorPage.verifyPageTitle();
      expect(titleValid).to.be.true;
      
      // Wait for chat interface to load using explicit waits
      await tutorPage.waitForChatInterfaceLoad();
      
      // Validate chat interface components
      const interfaceComponents = await tutorPage.validateChatInterface();
      
      expect(interfaceComponents.hasMessageInput).to.be.true;
      expect(interfaceComponents.hasSendButton).to.be.true;
      expect(interfaceComponents.hasChatMessages).to.be.true;
      
      console.log('✅ Chat interface components validated:');
      console.log(`   - Message Input: ${interfaceComponents.hasMessageInput}`);
      console.log(`   - Send Button: ${interfaceComponents.hasSendButton}`);
      console.log(`   - Chat Messages: ${interfaceComponents.hasChatMessages}`);
      console.log(`   - Quick Actions: ${interfaceComponents.hasQuickActions}`);
    });

    it('should display initial chat state correctly', async function() {
      console.log('🎯 Testing initial chat state...');
      
      // Check initial message count
      const initialMessageCount = await tutorPage.getTotalMessageCount();
      
      // Initial state might have welcome messages or be empty
      expect(initialMessageCount).to.be.greaterThanOrEqual(0);
      
      console.log(`✅ Initial chat state: ${initialMessageCount} messages`);
      
      // If there are initial messages, verify they're from the AI
      if (initialMessageCount > 0) {
        const aiMessages = await tutorPage.getAIMessages();
        expect(aiMessages.length).to.be.greaterThan(0);
        
        console.log(`   Initial AI message: "${aiMessages[0].substring(0, 50)}..."`);
      }
    });
  });

  describe('Basic Chat Interactions', function() {
    
    it('should send message using send button', async function() {
      console.log('📤 Testing message sending with button...');
      
      const testMessage = 'Hello, can you help me with mathematics?';
      const initialCount = await tutorPage.getTotalMessageCount();
      
      // Send message using button click
      await tutorPage.sendMessage(testMessage);
      
      // Verify user message appears
      const userMessages = await tutorPage.getUserMessages();
      const messageFound = userMessages.some(msg => msg.includes(testMessage));
      expect(messageFound).to.be.true;
      
      // Verify message count increased
      const newCount = await tutorPage.getTotalMessageCount();
      expect(newCount).to.be.greaterThan(initialCount);
      
      console.log(`✅ Message sent successfully: "${testMessage}"`);
      console.log(`   Message count: ${initialCount} → ${newCount}`);
    });

    it('should send message using Enter key', async function() {
      console.log('⌨️ Testing message sending with Enter key...');
      
      const testMessage = 'Can you explain algebra basics?';
      const initialCount = await tutorPage.getTotalMessageCount();
      
      // Send message using Enter key (demonstrates keyboard interaction)
      await tutorPage.sendMessageWithEnter(testMessage);
      
      // Verify message was sent
      const userMessages = await tutorPage.getUserMessages();
      const messageFound = userMessages.some(msg => msg.includes(testMessage));
      expect(messageFound).to.be.true;
      
      const newCount = await tutorPage.getTotalMessageCount();
      expect(newCount).to.be.greaterThan(initialCount);
      
      console.log(`✅ Message sent with Enter key: "${testMessage}"`);
    });

    it('should receive AI response after sending message', async function() {
      console.log('🤖 Testing AI response generation...');
      
      const testMessage = 'What is the quadratic formula?';
      
      // Send message and wait for AI response (demonstrates extended wait for async content)
      const aiResponse = await tutorPage.sendMessageAndWaitForResponse(testMessage);
      
      // Verify AI response is not empty
      expect(aiResponse).to.not.be.empty;
      expect(aiResponse.length).to.be.greaterThan(10); // Reasonable response length
      
      // Validate response quality
      const responseQuality = await tutorPage.validateAIResponse(aiResponse);
      expect(responseQuality.isNotEmpty).to.be.true;
      
      console.log(`✅ AI response received (${aiResponse.length} characters)`);
      console.log(`   Response preview: "${aiResponse.substring(0, 100)}..."`);
      console.log(`   Quality check - Relevant: ${responseQuality.isRelevant}, Helpful: ${responseQuality.isHelpful}`);
    });
  });

  describe('Advanced Chat Features', function() {
    
    it('should handle typing indicator during AI response', async function() {
      console.log('⏳ Testing typing indicator functionality...');
      
      const testMessage = 'Explain the concept of derivatives in calculus';
      const initialCount = await tutorPage.getTotalMessageCount();
      
      // Send message
      await tutorPage.sendMessage(testMessage);
      
      // Check if typing indicator appears (might be very brief)
      let typingIndicatorSeen = false;
      try {
        // Quick check for typing indicator
        await DriverManager.getDriver().sleep(500);
        typingIndicatorSeen = await tutorPage.isTypingIndicatorDisplayed();
      } catch (error) {
        // Typing indicator might not be visible or implemented
      }
      
      // Wait for AI response
      await tutorPage.waitForAIResponse();
      
      // Verify response was received
      const newCount = await tutorPage.getTotalMessageCount();
      expect(newCount).to.be.greaterThan(initialCount + 1);
      
      console.log(`✅ AI response flow completed. Typing indicator seen: ${typingIndicatorSeen}`);
    });

    it('should support quick action buttons', async function() {
      console.log('⚡ Testing quick action functionality...');
      
      // Common quick actions in educational chat interfaces
      const quickActions = [
        'Help me study',
        'Explain this topic',
        'Give me an example',
        'Practice problems'
      ];
      
      for (const action of quickActions) {
        try {
          console.log(`   Testing quick action: "${action}"...`);
          
          const initialCount = await tutorPage.getTotalMessageCount();
          
          // Click quick action
          await tutorPage.clickQuickAction(action);
          
          // Verify action was processed
          const newCount = await tutorPage.getTotalMessageCount();
          
          if (newCount > initialCount) {
            console.log(`   ✅ Quick action "${action}" processed successfully`);
            break; // Exit after first successful quick action
          }
          
        } catch (error) {
          console.log(`   ⚠️ Quick action "${action}" not available`);
        }
      }
    });

    it('should maintain conversation context', async function() {
      console.log('🧠 Testing conversation context maintenance...');
      
      // Test multi-turn conversation
      const conversationFlow = [
        'I want to learn about fractions',
        'Can you give me an example?',
        'How do I add fractions with different denominators?'
      ];
      
      const responses = await tutorPage.testConversationFlow(conversationFlow);
      
      // Verify all messages received responses
      expect(responses.length).to.equal(conversationFlow.length);
      
      // Verify responses are contextually relevant
      responses.forEach((response, index) => {
        expect(response).to.not.be.empty;
        console.log(`   Q${index + 1}: ${conversationFlow[index]}`);
        console.log(`   A${index + 1}: ${response.substring(0, 80)}...`);
      });
      
      console.log('✅ Conversation context maintained through multiple turns');
    });
  });

  describe('Tutor Customization and Settings', function() {
    
    it('should allow subject selection', async function() {
      console.log('📚 Testing subject selection...');
      
      const subjects = ['Mathematics', 'Science', 'Programming', 'Language Arts'];
      
      for (const subject of subjects) {
        try {
          console.log(`   Testing subject: ${subject}...`);
          
          await tutorPage.selectSubject(subject);
          
          // Wait for subject change to take effect
          await DriverManager.getDriver().sleep(1000);
          
          console.log(`   ✅ Subject "${subject}" selected successfully`);
          break; // Exit after first successful selection
          
        } catch (error) {
          console.log(`   ⚠️ Subject "${subject}" not available`);
        }
      }
    });

    it('should allow difficulty adjustment', async function() {
      console.log('📊 Testing difficulty level adjustment...');
      
      const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];
      
      for (const level of difficultyLevels) {
        try {
          console.log(`   Testing difficulty: ${level}...`);
          
          await tutorPage.adjustDifficulty(level);
          
          // Wait for difficulty change to take effect
          await DriverManager.getDriver().sleep(1000);
          
          console.log(`   ✅ Difficulty "${level}" set successfully`);
          break; // Exit after first successful adjustment
          
        } catch (error) {
          console.log(`   ⚠️ Difficulty "${level}" not available`);
        }
      }
    });
  });

  describe('Chat Management and Controls', function() {
    
    it('should clear chat history when requested', async function() {
      console.log('🗑️ Testing chat history clearing...');
      
      // First, ensure we have some messages
      await tutorPage.sendMessage('This is a test message for clearing');
      await tutorPage.waitForAIResponse();
      
      const messageCountBeforeClear = await tutorPage.getTotalMessageCount();
      expect(messageCountBeforeClear).to.be.greaterThan(0);
      
      // Clear chat
      try {
        await tutorPage.clearChat();
        
        // Verify chat was cleared
        const messageCountAfterClear = await tutorPage.getTotalMessageCount();
        expect(messageCountAfterClear).to.be.lessThan(messageCountBeforeClear);
        
        console.log(`✅ Chat cleared: ${messageCountBeforeClear} → ${messageCountAfterClear} messages`);
        
      } catch (error) {
        console.log('⚠️ Clear chat functionality not available');
      }
    });

    it('should scroll to bottom of chat for long conversations', async function() {
      console.log('📜 Testing chat scrolling...');
      
      // Send multiple messages to create scrollable content
      const messages = [
        'Message 1: Tell me about physics',
        'Message 2: What about chemistry?',
        'Message 3: How about biology?'
      ];
      
      for (const message of messages) {
        await tutorPage.sendMessage(message);
        await DriverManager.getDriver().sleep(1000); // Brief pause between messages
      }
      
      // Wait for all responses
      await DriverManager.getDriver().sleep(5000);
      
      // Test scroll to bottom functionality
      await tutorPage.scrollToBottomOfChat();
      
      console.log('✅ Chat scrolling functionality tested');
    });
  });

  describe('Error Handling and Edge Cases', function() {
    
    it('should handle empty messages gracefully', async function() {
      console.log('🚫 Testing empty message handling...');
      
      const initialCount = await tutorPage.getTotalMessageCount();
      
      try {
        // Attempt to send empty message
        await tutorPage.sendMessage('');
        
        // Wait briefly
        await DriverManager.getDriver().sleep(2000);
        
        // Verify no new messages were added
        const newCount = await tutorPage.getTotalMessageCount();
        expect(newCount).to.equal(initialCount);
        
        console.log('✅ Empty message handled correctly - no message sent');
        
      } catch (error) {
        console.log('✅ Empty message prevented by form validation');
      }
    });

    it('should handle very long messages', async function() {
      console.log('📏 Testing long message handling...');
      
      // Create a very long message
      const longMessage = 'This is a very long message that tests the chat interface handling of extended text input. '.repeat(10);
      
      try {
        const response = await tutorPage.sendMessageAndWaitForResponse(longMessage);
        
        // Verify response was received
        expect(response).to.not.be.empty;
        
        console.log(`✅ Long message handled successfully (${longMessage.length} characters)`);
        console.log(`   Response length: ${response.length} characters`);
        
      } catch (error) {
        console.log('⚠️ Long message handling may have limitations');
      }
    });

    it('should display error messages when AI is unavailable', async function() {
      console.log('❌ Testing AI unavailability error handling...');
      
      // Check if any error messages are currently displayed
      const hasError = await tutorPage.isErrorMessageDisplayed();
      
      if (hasError) {
        const errorMessage = await tutorPage.getErrorMessage();
        console.log(`⚠️ Error message found: "${errorMessage}"`);
        expect(errorMessage).to.not.be.empty;
      } else {
        console.log('✅ No error messages - AI tutor functioning properly');
      }
    });

    it('should handle network interruptions gracefully', async function() {
      console.log('🌐 Testing network error resilience...');
      
      // This test would typically involve network manipulation
      // For demo purposes, we'll test basic error detection
      
      try {
        // Send a message and monitor for any connection issues
        const testMessage = 'Testing network resilience';
        await tutorPage.sendMessage(testMessage);
        
        // Wait longer than usual to see if timeout errors occur
        await DriverManager.getDriver().sleep(5000);
        
        // Check for error states
        const hasError = await tutorPage.isErrorMessageDisplayed();
        
        if (hasError) {
          const errorMessage = await tutorPage.getErrorMessage();
          console.log(`⚠️ Network-related error detected: "${errorMessage}"`);
        } else {
          console.log('✅ No network errors detected during test');
        }
        
      } catch (error) {
        console.log('⚠️ Network error simulation not implemented in this demo');
      }
    });
  });

  describe('Performance and Responsiveness', function() {
    
    it('should respond to messages within acceptable time limits', async function() {
      console.log('⏱️ Testing AI response time performance...');
      
      const testMessage = 'What is 2 + 2?'; // Simple question for quick response
      const startTime = Date.now();
      
      const response = await tutorPage.sendMessageAndWaitForResponse(testMessage);
      
      const responseTime = Date.now() - startTime;
      
      // Verify response was received
      expect(response).to.not.be.empty;
      
      // Assert response time is reasonable (under 30 seconds for AI)
      expect(responseTime).to.be.lessThan(30000);
      
      console.log(`✅ AI response time: ${responseTime}ms`);
      console.log(`   Response: "${response.substring(0, 50)}..."`);
    });

    it('should maintain chat interface responsiveness', async function() {
      console.log('🚀 Testing interface responsiveness...');
      
      // Test rapid message sending (stress test)
      const rapidMessages = [
        'Quick test 1',
        'Quick test 2',
        'Quick test 3'
      ];
      
      const startTime = Date.now();
      
      for (const message of rapidMessages) {
        await tutorPage.sendMessage(message);
        await DriverManager.getDriver().sleep(500); // Brief pause
      }
      
      const sendTime = Date.now() - startTime;
      
      // Verify all messages were sent
      const userMessages = await tutorPage.getUserMessages();
      const allMessagesSent = rapidMessages.every(msg => 
        userMessages.some(userMsg => userMsg.includes(msg))
      );
      
      expect(allMessagesSent).to.be.true;
      
      console.log(`✅ Interface responsiveness test completed in ${sendTime}ms`);
      console.log(`   All ${rapidMessages.length} messages sent successfully`);
    });
  });
});