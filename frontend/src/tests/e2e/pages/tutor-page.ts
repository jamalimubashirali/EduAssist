/**
 * AI Tutor Page Object Model for EduAssist AI Tutoring Module
 * Demonstrates testing chat-based interactive tutoring interface with AI responses
 */

import { By, WebElement, Key } from 'selenium-webdriver';
import { BasePage } from './base-page';
import { TestConfig } from '../config/test-config';

export class TutorPage extends BasePage {

  // Chat interface elements using various locator strategies
  private readonly chatInterface = By.css('.chat-interface, [data-testid="chat-interface"], .tutor-chat');
  private readonly messageInput = By.css('input[type="text"], textarea, [data-testid="message-input"], .chat-input');
  private readonly sendButton = By.css('.send-button, [data-testid="send-button"], button[type="submit"]');
  private readonly chatMessages = By.css('.chat-messages, [data-testid="chat-messages"], .messages-container');
  private readonly userMessage = By.css('.user-message, [data-testid="user-message"], .message-user');
  private readonly aiResponse = By.css('.ai-message, [data-testid="ai-response"], .message-ai, .tutor-response');
  private readonly typingIndicator = By.css('.typing-indicator, [data-testid="typing-indicator"], .ai-typing');

  // Message elements
  private readonly messageText = By.css('.message-text, .message-content, p');
  private readonly messageTimestamp = By.css('.message-timestamp, .timestamp, .message-time');
  private readonly messageActions = By.css('.message-actions, .action-buttons');

  // Chat controls and features
  private readonly clearChatButton = By.css('.clear-chat, [data-testid="clear-chat"], .reset-chat');
  private readonly voiceButton = By.css('.voice-input, [data-testid="voice-button"], .mic-button');
  private readonly attachmentButton = By.css('.attachment, [data-testid="attachment-button"], .file-upload');
  private readonly emojiButton = By.css('.emoji-picker, [data-testid="emoji-button"]');

  // Tutor-specific features
  private readonly subjectSelector = By.css('.subject-selector, [data-testid="subject-selector"], select');
  private readonly difficultySlider = By.css('.difficulty-slider, [data-testid="difficulty-slider"], input[type="range"]');
  private readonly tutorPersonality = By.css('.personality-selector, [data-testid="personality-selector"]');
  private readonly helpButton = By.css('.help-button, [data-testid="help-button"], .tutorial');

  // Loading and error states
  private readonly loadingSpinner = By.css('.loading, .spinner, [data-testid="loading"]');
  private readonly errorMessage = By.css('.error-message, [data-testid="error-message"], .chat-error');
  private readonly connectionStatus = By.css('.connection-status, [data-testid="connection-status"]');

  // Quick actions and suggestions
  private readonly quickActions = By.css('.quick-actions, [data-testid="quick-actions"], .suggested-questions');
  private readonly suggestionButton = By.css('.suggestion-button, [data-testid="suggestion-button"], .quick-question');

  /**
   * Navigate to AI tutor page
   */
  async navigateToTutor(): Promise<void> {
    await this.driver.get(`${TestConfig.baseUrl}/learning-assistant`);
    await this.waitForPageLoad();
    await this.waitForChatInterfaceLoad();
  }

  /**
   * Wait for chat interface to load
   * Demonstrates waiting for complex UI components
   */
  async waitForChatInterfaceLoad(): Promise<void> {
    // Wait for main chat interface elements
    await this.driver.wait(async () => {
      try {
        const chatDisplayed = await this.isElementDisplayed(this.chatInterface);
        const inputDisplayed = await this.isElementDisplayed(this.messageInput);
        const sendDisplayed = await this.isElementDisplayed(this.sendButton);
        return chatDisplayed && inputDisplayed && sendDisplayed;
      } catch (error) {
        return false;
      }
    }, TestConfig.timeouts.medium);

    // Wait for any initial loading to complete
    await this.waitForLoadingToComplete();
  }

  /**
   * Send a message to the AI tutor
   * Demonstrates text input and form submission
   * @param message - Message to send to the tutor
   */
  async sendMessage(message: string): Promise<void> {
    // Clear any existing text and type new message
    await this.typeText(this.messageInput, message);

    // Send message using button click
    await this.clickElement(this.sendButton);

    // Wait for message to appear in chat
    await this.waitForUserMessageToAppear(message);
  }

  /**
   * Send message using Enter key
   * Demonstrates keyboard interaction
   * @param message - Message to send
   */
  async sendMessageWithEnter(message: string): Promise<void> {
    const input = await this.findElement(this.messageInput);
    await input.clear();
    await input.sendKeys(message);
    await input.sendKeys(Key.ENTER);

    // Wait for message to appear
    await this.waitForUserMessageToAppear(message);
  }

  /**
   * Wait for user message to appear in chat
   * @param expectedMessage - Expected message text
   */
  async waitForUserMessageToAppear(expectedMessage: string): Promise<void> {
    await this.driver.wait(async () => {
      const messages = await this.getUserMessages();
      return messages.some(msg => msg.includes(expectedMessage));
    }, TestConfig.timeouts.short);
  }

  /**
   * Wait for AI response
   * Demonstrates waiting for asynchronous AI responses with extended timeout
   */
  async waitForAIResponse(): Promise<void> {
    // First wait for typing indicator to appear (if present)
    try {
      await this.driver.wait(async () => {
        return await this.isElementDisplayed(this.typingIndicator);
      }, TestConfig.timeouts.short);

      // Then wait for typing indicator to disappear
      await this.driver.wait(async () => {
        return !(await this.isElementDisplayed(this.typingIndicator));
      }, TestConfig.timeouts.aiResponse);
    } catch (error) {
      // Typing indicator might not be present
    }

    // Wait for new AI message to appear
    await this.driver.wait(async () => {
      const aiMessages = await this.getAIMessages();
      return aiMessages.length > 0;
    }, TestConfig.timeouts.aiResponse);
  }

  /**
   * Get all user messages
   * Demonstrates extracting multiple elements' text
   */
  async getUserMessages(): Promise<string[]> {
    const messages: string[] = [];

    try {
      const userMessageElements = await this.findElements(this.userMessage);

      for (const element of userMessageElements) {
        const messageText = await element.findElement(this.messageText).getText();
        messages.push(messageText);
      }
    } catch (error) {
      console.log('Could not extract user messages:', error);
    }

    return messages;
  }

  /**
   * Get all AI messages
   */
  async getAIMessages(): Promise<string[]> {
    const messages: string[] = [];

    try {
      const aiMessageElements = await this.findElements(this.aiResponse);

      for (const element of aiMessageElements) {
        const messageText = await element.findElement(this.messageText).getText();
        messages.push(messageText);
      }
    } catch (error) {
      console.log('Could not extract AI messages:', error);
    }

    return messages;
  }

  /**
   * Get the latest AI response
   * Useful for validating specific AI responses
   */
  async getLatestAIResponse(): Promise<string> {
    const aiMessages = await this.getAIMessages();
    return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : '';
  }

  /**
   * Get total message count
   */
  async getTotalMessageCount(): Promise<number> {
    const userMessages = await this.getUserMessages();
    const aiMessages = await this.getAIMessages();
    return userMessages.length + aiMessages.length;
  }

  /**
   * Send message and wait for AI response
   * Comprehensive interaction method
   * @param message - Message to send
   */
  async sendMessageAndWaitForResponse(message: string): Promise<string> {
    const initialMessageCount = await this.getTotalMessageCount();

    await this.sendMessage(message);
    await this.waitForAIResponse();

    // Verify message count increased
    await this.driver.wait(async () => {
      const newCount = await this.getTotalMessageCount();
      return newCount > initialMessageCount + 1; // +1 for user message, +1 for AI response
    }, TestConfig.timeouts.short);

    return await this.getLatestAIResponse();
  }

  /**
   * Click on a quick action/suggestion
   * @param suggestionText - Text of the suggestion to click
   */
  async clickQuickAction(suggestionText: string): Promise<void> {
    const suggestionBtn = By.xpath(`//button[contains(text(), "${suggestionText}")]`);
    await this.clickElement(suggestionBtn);

    // Wait for the suggestion to be sent as a message
    await this.waitForUserMessageToAppear(suggestionText);
    await this.waitForAIResponse();
  }

  /**
   * Clear chat history
   */
  async clearChat(): Promise<void> {
    if (await this.isElementDisplayed(this.clearChatButton)) {
      await this.clickElement(this.clearChatButton);

      // Wait for chat to be cleared
      await this.driver.wait(async () => {
        const messageCount = await this.getTotalMessageCount();
        return messageCount === 0;
      }, TestConfig.timeouts.short);
    }
  }

  /**
   * Select subject for tutoring
   * @param subject - Subject to select
   */
  async selectSubject(subject: string): Promise<void> {
    try {
      const subjectSelect = await this.findElement(this.subjectSelector);
      await subjectSelect.click();

      const option = By.xpath(`//option[contains(text(), "${subject}")]`);
      await this.clickElement(option);
    } catch (error) {
      console.log(`Subject selector not found or subject "${subject}" not available`);
    }
  }

  /**
   * Adjust difficulty level
   * @param level - Difficulty level (1-10 or easy/medium/hard)
   */
  async adjustDifficulty(level: string | number): Promise<void> {
    try {
      if (await this.isElementDisplayed(this.difficultySlider)) {
        const slider = await this.findElement(this.difficultySlider);

        if (typeof level === 'number') {
          // Set slider value directly
          await this.driver.executeScript(`arguments[0].value = ${level}`, slider);
        } else {
          // Handle text-based difficulty levels
          const difficultyBtn = By.xpath(`//button[contains(text(), "${level}")]`);
          await this.clickElement(difficultyBtn);
        }
      }
    } catch (error) {
      console.log(`Could not adjust difficulty to "${level}"`);
    }
  }

  /**
   * Check if typing indicator is displayed
   * Demonstrates real-time UI state checking
   */
  async isTypingIndicatorDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.typingIndicator);
  }

  /**
   * Check if AI is responding (typing indicator or recent response)
   */
  async isAIResponding(): Promise<boolean> {
    const isTyping = await this.isTypingIndicatorDisplayed();

    if (isTyping) {
      return true;
    }

    // Check if there was a recent AI response (within last few seconds)
    try {
      const aiMessages = await this.findElements(this.aiResponse);
      if (aiMessages.length > 0) {
        const lastMessage = aiMessages[aiMessages.length - 1];
        const timestamp = await lastMessage.findElement(this.messageTimestamp).getText();
        // Basic timestamp check (implementation depends on timestamp format)
        return true; // Simplified for demo
      }
    } catch (error) {
      // Timestamp might not be available
    }

    return false;
  }

  /**
   * Validate AI response quality
   * Demonstrates content validation
   * @param response - AI response to validate
   */
  async validateAIResponse(response: string): Promise<{
    isNotEmpty: boolean;
    isRelevant: boolean;
    isHelpful: boolean;
  }> {
    const isNotEmpty = response.trim().length > 0;

    // Basic relevance check (can be enhanced with more sophisticated logic)
    const relevanceKeywords = ['learn', 'understand', 'explain', 'help', 'study', 'practice'];
    const isRelevant = relevanceKeywords.some(keyword =>
      response.toLowerCase().includes(keyword)
    );

    // Basic helpfulness check
    const helpfulIndicators = ['?', 'try', 'consider', 'example', 'step'];
    const isHelpful = helpfulIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );

    return { isNotEmpty, isRelevant, isHelpful };
  }

  /**
   * Test conversation flow
   * Demonstrates multi-turn conversation testing
   */
  async testConversationFlow(messages: string[]): Promise<string[]> {
    const responses: string[] = [];

    for (const message of messages) {
      const response = await this.sendMessageAndWaitForResponse(message);
      responses.push(response);

      // Brief pause between messages for natural conversation flow
      await this.driver.sleep(1000);
    }

    return responses;
  }

  /**
   * Check if error message is displayed
   */
  async isErrorMessageDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    try {
      return await this.getText(this.errorMessage);
    } catch (error) {
      return '';
    }
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete(): Promise<void> {
    try {
      await this.driver.wait(async () => {
        return !(await this.isElementDisplayed(this.loadingSpinner));
      }, TestConfig.timeouts.medium);
    } catch (error) {
      // Loading spinner might not be present
    }
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(): Promise<boolean> {
    const title = await this.getPageTitle();
    return title.toLowerCase().includes('tutor') ||
      title.toLowerCase().includes('assistant') ||
      title.toLowerCase().includes('chat') ||
      title.toLowerCase().includes('eduassist');
  }

  /**
   * Validate chat interface components
   * Comprehensive interface validation
   */
  async validateChatInterface(): Promise<{
    hasMessageInput: boolean;
    hasSendButton: boolean;
    hasChatMessages: boolean;
    hasQuickActions: boolean;
  }> {
    return {
      hasMessageInput: await this.isElementDisplayed(this.messageInput),
      hasSendButton: await this.isElementDisplayed(this.sendButton),
      hasChatMessages: await this.isElementDisplayed(this.chatMessages),
      hasQuickActions: await this.isElementDisplayed(this.quickActions)
    };
  }

  /**
   * Scroll to bottom of chat
   * Useful for long conversations
   */
  async scrollToBottomOfChat(): Promise<void> {
    try {
      const chatContainer = await this.findElement(this.chatMessages);
      await this.driver.executeScript(
        'arguments[0].scrollTop = arguments[0].scrollHeight',
        chatContainer
      );
    } catch (error) {
      console.log('Could not scroll chat to bottom:', error);
    }
  }
}