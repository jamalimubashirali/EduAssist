/**
 * Test Configuration for EduAssist E2E Tests
 * Contains all environment-specific settings and test data
 */

export const TestConfig = {
  // Application URLs
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  backendUrl: process.env.TEST_BACKEND_URL || 'http://localhost:5000',
  
  // Browser Configuration
  browser: {
    headless: process.env.HEADLESS === 'true',
    windowSize: { width: 1920, height: 1080 },
    implicitWait: 5000, // 5 seconds
    pageLoadTimeout: 30000, // 30 seconds
    scriptTimeout: 30000 // 30 seconds
  },
  
  // Test Data
  testUsers: {
    validUser: {
      email: 'test.user@eduassist.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    },
    newUser: {
      email: 'new.user@eduassist.com',
      password: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User'
    }
  },
  
  // Timeouts for different operations
  timeouts: {
    short: 5000,    // 5 seconds - for quick operations
    medium: 15000,  // 15 seconds - for API calls
    long: 30000,    // 30 seconds - for complex operations like AI responses
    aiResponse: 45000 // 45 seconds - for AI tutoring responses
  },
  
  // Test selectors (fallback if page objects don't work)
  selectors: {
    auth: {
      loginForm: '[data-testid="login-form"]',
      emailInput: '[data-testid="email-input"]',
      passwordInput: '[data-testid="password-input"]',
      loginButton: '[data-testid="login-button"]',
      signupLink: '[data-testid="signup-link"]'
    },
    dashboard: {
      welcomeMessage: '[data-testid="welcome-message"]',
      performanceChart: '[data-testid="performance-chart"]',
      progressChart: '[data-testid="progress-chart"]',
      navigationMenu: '[data-testid="navigation-menu"]'
    },
    recommendations: {
      recommendationsList: '[data-testid="recommendations-list"]',
      recommendationCard: '[data-testid="recommendation-card"]',
      skillRecommendation: '[data-testid="skill-recommendation"]'
    },
    tutor: {
      chatInterface: '[data-testid="chat-interface"]',
      messageInput: '[data-testid="message-input"]',
      sendButton: '[data-testid="send-button"]',
      chatMessages: '[data-testid="chat-messages"]',
      aiResponse: '[data-testid="ai-response"]'
    }
  }
};