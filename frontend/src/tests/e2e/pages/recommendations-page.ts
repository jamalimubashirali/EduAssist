/**
 * Recommendations Page Object Model for EduAssist Recommendation Module
 * Demonstrates testing personalized learning and skill recommendations
 */

import { By, WebElement } from 'selenium-webdriver';
import { BasePage } from './base-page';
import { TestConfig } from '../config/test-config';

export class RecommendationsPage extends BasePage {
  
  // Recommendations page elements using various locator strategies
  private readonly pageTitle = By.css('h1, .page-title, [data-testid="page-title"]');
  private readonly recommendationsList = By.css('.recommendations-list, [data-testid="recommendations-list"], .recommendations-container');
  private readonly recommendationCard = By.css('.recommendation-card, [data-testid="recommendation-card"], .recommendation-item');
  private readonly skillRecommendation = By.css('.skill-recommendation, [data-testid="skill-recommendation"]');
  private readonly learningPathRecommendation = By.css('.learning-path, [data-testid="learning-path"]');
  private readonly filterButtons = By.css('.filter-button, [data-testid="filter-button"], .recommendation-filter');
  private readonly sortDropdown = By.css('.sort-dropdown, [data-testid="sort-dropdown"], select');
  private readonly loadMoreButton = By.css('.load-more, [data-testid="load-more"], .pagination-button');
  private readonly refreshButton = By.css('.refresh-recommendations, [data-testid="refresh-button"]');
  
  // Individual recommendation elements
  private readonly recommendationTitle = By.css('.recommendation-title, .card-title, h3');
  private readonly recommendationDescription = By.css('.recommendation-description, .card-description, p');
  private readonly difficultyLevel = By.css('.difficulty, [data-testid="difficulty-level"]');
  private readonly estimatedTime = By.css('.estimated-time, [data-testid="estimated-time"]');
  private readonly startButton = By.css('.start-recommendation, [data-testid="start-button"], .cta-button');
  private readonly bookmarkButton = By.css('.bookmark, [data-testid="bookmark-button"], .save-button');
  
  // Filter and search elements
  private readonly searchInput = By.css('input[type="search"], .search-input, [data-testid="search-input"]');
  private readonly categoryFilter = By.css('.category-filter, [data-testid="category-filter"]');
  private readonly difficultyFilter = By.css('.difficulty-filter, [data-testid="difficulty-filter"]');
  private readonly typeFilter = By.css('.type-filter, [data-testid="type-filter"]');
  
  // Loading and empty states
  private readonly loadingSpinner = By.css('.loading, .spinner, [data-testid="loading"]');
  private readonly emptyState = By.css('.empty-state, [data-testid="empty-state"], .no-recommendations');
  private readonly errorMessage = By.css('.error-message, [data-testid="error-message"], .alert-error');

  /**
   * Navigate to recommendations page
   */
  async navigateToRecommendations(): Promise<void> {
    await this.driver.get(`${TestConfig.baseUrl}/recommendations`);
    await this.waitForPageLoad();
    await this.waitForRecommendationsLoad();
  }

  /**
   * Wait for recommendations to load
   * Demonstrates waiting for dynamic content with loading states
   */
  async waitForRecommendationsLoad(): Promise<void> {
    // Wait for loading spinner to disappear
    try {
      await this.driver.wait(async () => {
        const isLoading = await this.isElementDisplayed(this.loadingSpinner);
        return !isLoading;
      }, TestConfig.timeouts.medium);
    } catch (error) {
      // Loading spinner might not be present
    }

    // Wait for recommendations list or empty state
    await this.driver.wait(async () => {
      const hasRecommendations = await this.isElementDisplayed(this.recommendationsList);
      const hasEmptyState = await this.isElementDisplayed(this.emptyState);
      return hasRecommendations || hasEmptyState;
    }, TestConfig.timeouts.medium);
  }

  /**
   * Get all recommendation cards
   * Demonstrates working with multiple elements
   */
  async getRecommendationCards(): Promise<WebElement[]> {
    try {
      return await this.findElements(this.recommendationCard);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get recommendation count
   */
  async getRecommendationCount(): Promise<number> {
    const cards = await this.getRecommendationCards();
    return cards.length;
  }

  /**
   * Get recommendation details by index
   * Demonstrates data extraction from complex elements
   * @param index - Index of the recommendation card
   */
  async getRecommendationDetails(index: number): Promise<{
    title: string;
    description: string;
    difficulty: string;
    estimatedTime: string;
  }> {
    const cards = await this.getRecommendationCards();
    
    if (index >= cards.length) {
      throw new Error(`Recommendation at index ${index} not found`);
    }

    const card = cards[index];
    
    try {
      const title = await card.findElement(this.recommendationTitle).getText();
      const description = await card.findElement(this.recommendationDescription).getText();
      
      let difficulty = '';
      let estimatedTime = '';
      
      try {
        difficulty = await card.findElement(this.difficultyLevel).getText();
      } catch (error) {
        // Difficulty might not be present
      }
      
      try {
        estimatedTime = await card.findElement(this.estimatedTime).getText();
      } catch (error) {
        // Estimated time might not be present
      }

      return { title, description, difficulty, estimatedTime };
    } catch (error) {
      throw new Error(`Could not extract details from recommendation at index ${index}`);
    }
  }

  /**
   * Click on a recommendation card
   * @param index - Index of the recommendation to click
   */
  async clickRecommendation(index: number): Promise<void> {
    const cards = await this.getRecommendationCards();
    
    if (index >= cards.length) {
      throw new Error(`Recommendation at index ${index} not found`);
    }

    await cards[index].click();
    await this.driver.sleep(2000); // Wait for navigation or modal
  }

  /**
   * Start a recommendation
   * @param index - Index of the recommendation to start
   */
  async startRecommendation(index: number): Promise<void> {
    const cards = await this.getRecommendationCards();
    
    if (index >= cards.length) {
      throw new Error(`Recommendation at index ${index} not found`);
    }

    const card = cards[index];
    const startBtn = await card.findElement(this.startButton);
    await startBtn.click();
    
    // Wait for navigation or action completion
    await this.driver.sleep(2000);
  }

  /**
   * Bookmark a recommendation
   * @param index - Index of the recommendation to bookmark
   */
  async bookmarkRecommendation(index: number): Promise<void> {
    const cards = await this.getRecommendationCards();
    
    if (index >= cards.length) {
      throw new Error(`Recommendation at index ${index} not found`);
    }

    const card = cards[index];
    const bookmarkBtn = await card.findElement(this.bookmarkButton);
    await bookmarkBtn.click();
    
    // Wait for bookmark action to complete
    await this.driver.sleep(1000);
  }

  /**
   * Filter recommendations by category
   * Demonstrates dropdown/filter interaction
   * @param category - Category to filter by
   */
  async filterByCategory(category: string): Promise<void> {
    try {
      const categoryBtn = By.xpath(`//button[contains(text(), "${category}") or contains(@data-category, "${category}")]`);
      await this.clickElement(categoryBtn);
      
      // Wait for filtered results
      await this.waitForRecommendationsLoad();
    } catch (error) {
      console.log(`Category filter "${category}" not found`);
    }
  }

  /**
   * Filter recommendations by difficulty
   * @param difficulty - Difficulty level to filter by
   */
  async filterByDifficulty(difficulty: string): Promise<void> {
    try {
      const difficultyBtn = By.xpath(`//button[contains(text(), "${difficulty}") or contains(@data-difficulty, "${difficulty}")]`);
      await this.clickElement(difficultyBtn);
      
      // Wait for filtered results
      await this.waitForRecommendationsLoad();
    } catch (error) {
      console.log(`Difficulty filter "${difficulty}" not found`);
    }
  }

  /**
   * Search for recommendations
   * Demonstrates search functionality testing
   * @param searchTerm - Term to search for
   */
  async searchRecommendations(searchTerm: string): Promise<void> {
    await this.typeText(this.searchInput, searchTerm);
    
    // Wait for search results (debounced search or submit)
    await this.driver.sleep(2000);
    await this.waitForRecommendationsLoad();
  }

  /**
   * Sort recommendations
   * @param sortOption - Sort option to select
   */
  async sortRecommendations(sortOption: string): Promise<void> {
    try {
      const sortSelect = await this.findElement(this.sortDropdown);
      await sortSelect.click();
      
      const option = By.xpath(`//option[contains(text(), "${sortOption}")]`);
      await this.clickElement(option);
      
      // Wait for sorted results
      await this.waitForRecommendationsLoad();
    } catch (error) {
      console.log(`Sort option "${sortOption}" not found`);
    }
  }

  /**
   * Load more recommendations (pagination)
   */
  async loadMoreRecommendations(): Promise<void> {
    if (await this.isElementDisplayed(this.loadMoreButton)) {
      const initialCount = await this.getRecommendationCount();
      
      await this.clickElement(this.loadMoreButton);
      
      // Wait for new recommendations to load
      await this.driver.wait(async () => {
        const newCount = await this.getRecommendationCount();
        return newCount > initialCount;
      }, TestConfig.timeouts.medium);
    }
  }

  /**
   * Refresh recommendations
   */
  async refreshRecommendations(): Promise<void> {
    if (await this.isElementDisplayed(this.refreshButton)) {
      await this.clickElement(this.refreshButton);
      await this.waitForRecommendationsLoad();
    } else {
      // Fallback to page refresh
      await this.driver.navigate().refresh();
      await this.waitForPageLoad();
      await this.waitForRecommendationsLoad();
    }
  }

  /**
   * Check if recommendations are personalized
   * Demonstrates validation of personalized content
   */
  async areRecommendationsPersonalized(): Promise<boolean> {
    // Look for personalization indicators
    const personalizationIndicators = [
      'recommended for you',
      'based on your progress',
      'personalized',
      'tailored'
    ];

    try {
      const pageText = await this.driver.findElement(By.tagName('body')).getText();
      const lowerPageText = pageText.toLowerCase();
      
      return personalizationIndicators.some(indicator => 
        lowerPageText.includes(indicator)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return await this.isElementDisplayed(this.emptyState);
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
   * Verify page title
   */
  async verifyPageTitle(): Promise<boolean> {
    const title = await this.getPageTitle();
    return title.toLowerCase().includes('recommendation') || 
           title.toLowerCase().includes('suggested') ||
           title.toLowerCase().includes('eduassist');
  }

  /**
   * Validate recommendation card structure
   * Comprehensive validation of recommendation display
   */
  async validateRecommendationStructure(index: number): Promise<{
    hasTitle: boolean;
    hasDescription: boolean;
    hasStartButton: boolean;
    hasBookmarkButton: boolean;
  }> {
    const cards = await this.getRecommendationCards();
    
    if (index >= cards.length) {
      throw new Error(`Recommendation at index ${index} not found`);
    }

    const card = cards[index];
    
    return {
      hasTitle: await this.isElementPresentInCard(card, this.recommendationTitle),
      hasDescription: await this.isElementPresentInCard(card, this.recommendationDescription),
      hasStartButton: await this.isElementPresentInCard(card, this.startButton),
      hasBookmarkButton: await this.isElementPresentInCard(card, this.bookmarkButton)
    };
  }

  /**
   * Helper method to check if element is present within a card
   */
  private async isElementPresentInCard(card: WebElement, locator: By): Promise<boolean> {
    try {
      await card.findElement(locator);
      return true;
    } catch (error) {
      return false;
    }
  }
}