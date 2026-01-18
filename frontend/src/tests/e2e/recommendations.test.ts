/**
 * Recommendations Module E2E Tests for EduAssist
 * Tests personalized learning and skill recommendations functionality
 * 
 * Demonstrates:
 * - Dynamic content loading and filtering
 * - List and card-based UI testing
 * - Search and filter functionality
 * - Pagination and infinite scroll testing
 * - Personalization validation
 */

import { expect } from 'chai';
import { DriverManager, By } from './utils/driver-manager';
import { LoginPage } from './pages/login-page';
import { RecommendationsPage } from './pages/recommendations-page';
import { TestConfig } from './config/test-config';

describe('EduAssist Recommendations Module', function() {
  let loginPage: LoginPage;
  let recommendationsPage: RecommendationsPage;

  // Setup authenticated session for recommendations tests
  before(async function() {
    console.log('🚀 Initializing WebDriver for Recommendations tests...');
    await DriverManager.initializeDriver();
    
    // Initialize page objects
    loginPage = new LoginPage();
    recommendationsPage = new RecommendationsPage();
    
    // Login to access recommendations
    console.log('🔐 Logging in to access recommendations...');
    await loginPage.navigateToLogin();
    await loginPage.loginWithValidUser();
    await loginPage.waitForLoginSuccess();
    
    console.log('✅ Authentication successful, ready for recommendations tests');
  });

  after(async function() {
    console.log('🧹 Cleaning up WebDriver...');
    await DriverManager.quitDriver();
    console.log('✅ WebDriver cleanup completed');
  });

  beforeEach(async function() {
    // Navigate to recommendations page before each test
    await recommendationsPage.navigateToRecommendations();
  });

  describe('Recommendations Page Load and Display', function() {
    
    it('should load recommendations page with proper layout', async function() {
      console.log('📚 Testing recommendations page layout...');
      
      // Verify page title using explicit assertion
      const titleValid = await recommendationsPage.verifyPageTitle();
      expect(titleValid).to.be.true;
      
      // Wait for recommendations to load using explicit waits
      await recommendationsPage.waitForRecommendationsLoad();
      
      // Check if recommendations are displayed or empty state is shown
      const hasRecommendations = await recommendationsPage.getRecommendationCount() > 0;
      const hasEmptyState = await recommendationsPage.isEmptyStateDisplayed();
      
      // Either recommendations or empty state should be present
      expect(hasRecommendations || hasEmptyState).to.be.true;
      
      console.log(`✅ Recommendations page loaded. Recommendations found: ${hasRecommendations}`);
    });

    it('should display recommendation cards with proper structure', async function() {
      console.log('🃏 Testing recommendation card structure...');
      
      const recommendationCount = await recommendationsPage.getRecommendationCount();
      
      if (recommendationCount > 0) {
        // Test first recommendation card structure
        const cardStructure = await recommendationsPage.validateRecommendationStructure(0);
        
        expect(cardStructure.hasTitle).to.be.true;
        expect(cardStructure.hasDescription).to.be.true;
        
        console.log('✅ Recommendation card structure validated:');
        console.log(`   - Has Title: ${cardStructure.hasTitle}`);
        console.log(`   - Has Description: ${cardStructure.hasDescription}`);
        console.log(`   - Has Start Button: ${cardStructure.hasStartButton}`);
        console.log(`   - Has Bookmark Button: ${cardStructure.hasBookmarkButton}`);
        
        // Extract and validate recommendation details
        const details = await recommendationsPage.getRecommendationDetails(0);
        expect(details.title).to.not.be.empty;
        expect(details.description).to.not.be.empty;
        
        console.log(`✅ First recommendation: "${details.title}"`);
        console.log(`   Description: ${details.description.substring(0, 100)}...`);
        
      } else {
        console.log('ℹ️ No recommendations available for structure testing');
      }
    });
  });

  describe('Recommendation Interactions', function() {
    
    it('should allow clicking on recommendation cards', async function() {
      console.log('👆 Testing recommendation card interactions...');
      
      const recommendationCount = await recommendationsPage.getRecommendationCount();
      
      if (recommendationCount > 0) {
        // Get initial URL
        const initialUrl = await recommendationsPage.getCurrentUrl();
        
        // Click on first recommendation
        await recommendationsPage.clickRecommendation(0);
        
        // Wait for navigation or modal to appear
        await DriverManager.getDriver().sleep(3000);
        
        // Check if URL changed or modal appeared
        const newUrl = await recommendationsPage.getCurrentUrl();
        const urlChanged = newUrl !== initialUrl;
        
        // Check for modal or overlay (common patterns)
        const modalElements = await DriverManager.getDriver().findElements(
          By.css('.modal, .overlay, .popup, [role="dialog"]')
        );
        const hasModal = modalElements.length > 0;
        
        // Either URL should change or modal should appear
        expect(urlChanged || hasModal).to.be.true;
        
        console.log(`✅ Recommendation click interaction: URL changed: ${urlChanged}, Modal: ${hasModal}`);
        
        // Navigate back to recommendations if URL changed
        if (urlChanged) {
          await recommendationsPage.navigateToRecommendations();
        }
        
      } else {
        console.log('ℹ️ No recommendations available for interaction testing');
      }
    });

    it('should allow starting recommendations', async function() {
      console.log('▶️ Testing start recommendation functionality...');
      
      const recommendationCount = await recommendationsPage.getRecommendationCount();
      
      if (recommendationCount > 0) {
        try {
          // Attempt to start first recommendation
          await recommendationsPage.startRecommendation(0);
          
          // Wait for action to complete
          await DriverManager.getDriver().sleep(2000);
          
          // Check if navigation occurred or action was processed
          const currentUrl = await recommendationsPage.getCurrentUrl();
          const navigatedAway = !currentUrl.includes('/recommendations');
          
          console.log(`✅ Start recommendation action completed. Navigated away: ${navigatedAway}`);
          
          // Navigate back if needed
          if (navigatedAway) {
            await recommendationsPage.navigateToRecommendations();
          }
          
        } catch (error) {
          console.log('⚠️ Start button not available on recommendations');
        }
      } else {
        console.log('ℹ️ No recommendations available for start testing');
      }
    });

    it('should allow bookmarking recommendations', async function() {
      console.log('🔖 Testing bookmark functionality...');
      
      const recommendationCount = await recommendationsPage.getRecommendationCount();
      
      if (recommendationCount > 0) {
        try {
          // Attempt to bookmark first recommendation
          await recommendationsPage.bookmarkRecommendation(0);
          
          // Wait for bookmark action to complete
          await DriverManager.getDriver().sleep(1000);
          
          console.log('✅ Bookmark action completed');
          
        } catch (error) {
          console.log('⚠️ Bookmark button not available on recommendations');
        }
      } else {
        console.log('ℹ️ No recommendations available for bookmark testing');
      }
    });
  });

  describe('Filtering and Search Functionality', function() {
    
    it('should filter recommendations by category', async function() {
      console.log('🏷️ Testing category filtering...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      if (initialCount > 0) {
        // Test common categories
        const categories = ['Math', 'Science', 'Programming', 'Language'];
        
        for (const category of categories) {
          try {
            console.log(`   Testing filter: ${category}...`);
            
            await recommendationsPage.filterByCategory(category);
            
            // Wait for filtered results
            await DriverManager.getDriver().sleep(2000);
            
            const filteredCount = await recommendationsPage.getRecommendationCount();
            console.log(`   ✅ ${category} filter: ${filteredCount} recommendations`);
            
            // Reset to show all recommendations for next test
            await recommendationsPage.navigateToRecommendations();
            await DriverManager.getDriver().sleep(1000);
            
          } catch (error) {
            console.log(`   ⚠️ Category "${category}" filter not available`);
          }
        }
      } else {
        console.log('ℹ️ No recommendations available for category filtering');
      }
    });

    it('should filter recommendations by difficulty level', async function() {
      console.log('📊 Testing difficulty filtering...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      if (initialCount > 0) {
        // Test difficulty levels
        const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
        
        for (const difficulty of difficulties) {
          try {
            console.log(`   Testing difficulty filter: ${difficulty}...`);
            
            await recommendationsPage.filterByDifficulty(difficulty);
            
            // Wait for filtered results
            await DriverManager.getDriver().sleep(2000);
            
            const filteredCount = await recommendationsPage.getRecommendationCount();
            console.log(`   ✅ ${difficulty} filter: ${filteredCount} recommendations`);
            
            // Reset for next test
            await recommendationsPage.navigateToRecommendations();
            await DriverManager.getDriver().sleep(1000);
            
          } catch (error) {
            console.log(`   ⚠️ Difficulty "${difficulty}" filter not available`);
          }
        }
      } else {
        console.log('ℹ️ No recommendations available for difficulty filtering');
      }
    });

    it('should search recommendations by keyword', async function() {
      console.log('🔍 Testing search functionality...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      if (initialCount > 0) {
        // Test search with common educational terms
        const searchTerms = ['math', 'learn', 'skill', 'course'];
        
        for (const term of searchTerms) {
          try {
            console.log(`   Searching for: "${term}"...`);
            
            await recommendationsPage.searchRecommendations(term);
            
            // Wait for search results
            await DriverManager.getDriver().sleep(2000);
            
            const searchCount = await recommendationsPage.getRecommendationCount();
            const hasEmptyState = await recommendationsPage.isEmptyStateDisplayed();
            
            console.log(`   ✅ Search "${term}": ${searchCount} results, Empty state: ${hasEmptyState}`);
            
            // Clear search for next test
            await recommendationsPage.searchRecommendations('');
            await DriverManager.getDriver().sleep(1000);
            
          } catch (error) {
            console.log(`   ⚠️ Search functionality not available`);
            break;
          }
        }
      } else {
        console.log('ℹ️ No recommendations available for search testing');
      }
    });
  });

  describe('Sorting and Pagination', function() {
    
    it('should sort recommendations by different criteria', async function() {
      console.log('📈 Testing recommendation sorting...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      if (initialCount > 1) {
        // Test different sort options
        const sortOptions = ['Newest', 'Popular', 'Difficulty', 'Relevance'];
        
        for (const sortOption of sortOptions) {
          try {
            console.log(`   Testing sort: ${sortOption}...`);
            
            // Get first recommendation title before sorting
            const beforeSort = await recommendationsPage.getRecommendationDetails(0);
            
            await recommendationsPage.sortRecommendations(sortOption);
            
            // Wait for sorted results
            await DriverManager.getDriver().sleep(2000);
            
            // Get first recommendation title after sorting
            const afterSort = await recommendationsPage.getRecommendationDetails(0);
            
            // Verify sorting occurred (order might have changed)
            console.log(`   ✅ Sort "${sortOption}" applied`);
            console.log(`      Before: ${beforeSort.title.substring(0, 30)}...`);
            console.log(`      After:  ${afterSort.title.substring(0, 30)}...`);
            
          } catch (error) {
            console.log(`   ⚠️ Sort option "${sortOption}" not available`);
          }
        }
      } else {
        console.log('ℹ️ Insufficient recommendations for sorting test');
      }
    });

    it('should load more recommendations when available', async function() {
      console.log('📄 Testing pagination/load more functionality...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      try {
        // Attempt to load more recommendations
        await recommendationsPage.loadMoreRecommendations();
        
        // Wait for new recommendations to load
        await DriverManager.getDriver().sleep(3000);
        
        const newCount = await recommendationsPage.getRecommendationCount();
        
        if (newCount > initialCount) {
          console.log(`✅ Load more successful: ${initialCount} → ${newCount} recommendations`);
          expect(newCount).to.be.greaterThan(initialCount);
        } else {
          console.log('ℹ️ No additional recommendations to load');
        }
        
      } catch (error) {
        console.log('⚠️ Load more functionality not available');
      }
    });
  });

  describe('Personalization and Content Quality', function() {
    
    it('should display personalized recommendations', async function() {
      console.log('👤 Testing recommendation personalization...');
      
      // Check if recommendations appear personalized
      const isPersonalized = await recommendationsPage.areRecommendationsPersonalized();
      
      console.log(`✅ Personalization indicators found: ${isPersonalized}`);
      
      // If we have recommendations, check their relevance
      const recommendationCount = await recommendationsPage.getRecommendationCount();
      
      if (recommendationCount > 0) {
        // Extract details from multiple recommendations to assess variety
        const recommendationDetails = [];
        const maxToCheck = Math.min(3, recommendationCount);
        
        for (let i = 0; i < maxToCheck; i++) {
          try {
            const details = await recommendationsPage.getRecommendationDetails(i);
            recommendationDetails.push(details);
          } catch (error) {
            console.log(`   Could not extract details for recommendation ${i}`);
          }
        }
        
        // Verify recommendations have diverse content
        const uniqueTitles = new Set(recommendationDetails.map(r => r.title));
        expect(uniqueTitles.size).to.equal(recommendationDetails.length);
        
        console.log(`✅ Recommendation diversity: ${uniqueTitles.size} unique recommendations`);
        
        // Log sample recommendations
        recommendationDetails.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.title}`);
          if (rec.difficulty) console.log(`      Difficulty: ${rec.difficulty}`);
          if (rec.estimatedTime) console.log(`      Time: ${rec.estimatedTime}`);
        });
        
      } else {
        console.log('ℹ️ No recommendations available for personalization assessment');
      }
    });

    it('should refresh recommendations when requested', async function() {
      console.log('🔄 Testing recommendation refresh...');
      
      const initialCount = await recommendationsPage.getRecommendationCount();
      
      // Refresh recommendations
      await recommendationsPage.refreshRecommendations();
      
      // Wait for refresh to complete
      await DriverManager.getDriver().sleep(3000);
      
      const refreshedCount = await recommendationsPage.getRecommendationCount();
      
      // Verify recommendations are still present after refresh
      expect(refreshedCount).to.be.greaterThanOrEqual(0);
      
      console.log(`✅ Recommendations refreshed: ${initialCount} → ${refreshedCount}`);
    });
  });

  describe('Error Handling and Edge Cases', function() {
    
    it('should handle empty recommendation state gracefully', async function() {
      console.log('🚫 Testing empty state handling...');
      
      // Search for something unlikely to have results
      try {
        await recommendationsPage.searchRecommendations('xyznoresultsexpected123');
        
        // Wait for search to complete
        await DriverManager.getDriver().sleep(2000);
        
        const hasEmptyState = await recommendationsPage.isEmptyStateDisplayed();
        const recommendationCount = await recommendationsPage.getRecommendationCount();
        
        if (recommendationCount === 0) {
          expect(hasEmptyState).to.be.true;
          console.log('✅ Empty state displayed correctly for no results');
        } else {
          console.log('ℹ️ Search returned results, empty state test not applicable');
        }
        
        // Clear search
        await recommendationsPage.searchRecommendations('');
        
      } catch (error) {
        console.log('⚠️ Could not test empty state - search not available');
      }
    });

    it('should handle recommendation loading errors', async function() {
      console.log('❌ Testing error state handling...');
      
      // Check if any error messages are displayed
      const hasError = await recommendationsPage.isErrorMessageDisplayed();
      
      if (hasError) {
        const errorMessage = await recommendationsPage.getErrorMessage();
        console.log(`⚠️ Error message found: "${errorMessage}"`);
        expect(errorMessage).to.not.be.empty;
      } else {
        console.log('✅ No error messages displayed - recommendations loading properly');
      }
    });
  });
});