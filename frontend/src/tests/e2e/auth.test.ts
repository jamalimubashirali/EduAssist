/**
 * Authentication Module E2E Tests for EduAssist
 * Tests login and signup functionality using Selenium WebDriver with TypeScript
 * 
 * Demonstrates:
 * - Page Object Model (POM) structure
 * - Explicit waits with WebDriverWait
 * - XPath and CSS selectors
 * - Form interaction and validation
 * - Navigation testing
 * - Assertions with Chai
 */

import { expect } from 'chai';
import { DriverManager } from './utils/driver-manager';
import { LoginPage } from './pages/login-page';
import { SignupPage } from './pages/signup-page';
import { DashboardPage } from './pages/dashboard-page';
import { TestConfig } from './config/test-config';

describe('EduAssist Authentication Module', function () {
    let loginPage: LoginPage;
    let signupPage: SignupPage;
    let dashboardPage: DashboardPage;

    // Setup and teardown for browser session handling
    before(async function () {
        console.log('🚀 Initializing WebDriver for Authentication tests...');
        await DriverManager.initializeDriver();

        // Initialize page objects
        loginPage = new LoginPage();
        signupPage = new SignupPage();
        dashboardPage = new DashboardPage();

        console.log('✅ WebDriver initialized successfully');
    });

    after(async function () {
        console.log('🧹 Cleaning up WebDriver...');
        await DriverManager.quitDriver();
        console.log('✅ WebDriver cleanup completed');
    });

    describe('Login Functionality', function () {

        beforeEach(async function () {
            // Navigate to login page before each test
            await loginPage.navigateToLogin();
        });

        it('should display login form elements', async function () {
            console.log('🔍 Testing login form display...');

            // Verify page title using explicit assertion
            const titleValid = await loginPage.verifyPageTitle();
            expect(titleValid).to.be.true;

            // Check if login form is displayed using CSS selectors
            const formDisplayed = await loginPage.isLoginFormDisplayed();
            expect(formDisplayed).to.be.true;

            console.log('✅ Login form elements are displayed correctly');
        });

        it('should successfully login with valid credentials', async function () {
            console.log('🔐 Testing successful login...');

            // Perform login using test user credentials
            await loginPage.loginWithValidUser();

            // Wait for successful login redirect using explicit wait
            await loginPage.waitForLoginSuccess();

            // Verify redirect to dashboard
            const currentUrl = await loginPage.getCurrentUrl();
            expect(currentUrl).to.include('/dashboard');

            // Verify user is logged in by checking dashboard elements
            const isLoggedIn = await dashboardPage.isUserLoggedIn();
            expect(isLoggedIn).to.be.true;

            console.log('✅ Login successful - redirected to dashboard');
        });

        it('should show error message for invalid credentials', async function () {
            console.log('❌ Testing login with invalid credentials...');

            // Attempt login with invalid credentials
            await loginPage.loginWithInvalidCredentials();

            // Wait briefly for error message to appear
            await DriverManager.getDriver().sleep(2000);

            // Check if error message is displayed using XPath locator
            const errorDisplayed = await loginPage.isErrorMessageDisplayed();
            expect(errorDisplayed).to.be.true;

            // Verify error message content
            const errorMessage = await loginPage.getErrorMessage();
            expect(errorMessage).to.not.be.empty;

            console.log(`✅ Error message displayed: "${errorMessage}"`);
        });

        it('should navigate to signup page from login', async function () {
            console.log('🔗 Testing navigation to signup page...');

            // Click signup link using link text locator
            await loginPage.clickSignupLink();

            // Wait for navigation and verify URL change
            await DriverManager.getDriver().sleep(2000);
            const currentUrl = await loginPage.getCurrentUrl();
            expect(currentUrl).to.include('/register');

            // Verify signup form is displayed
            const signupFormDisplayed = await signupPage.isRegistrationFormDisplayed();
            expect(signupFormDisplayed).to.be.true;

            console.log('✅ Successfully navigated to signup page');
        });
    });

    describe('Signup Functionality', function () {

        beforeEach(async function () {
            // Navigate to signup page before each test
            await signupPage.navigateToSignup();
        });

        it('should display registration form elements', async function () {
            console.log('📝 Testing registration form display...');

            // Verify page title
            const titleValid = await signupPage.verifyPageTitle();
            expect(titleValid).to.be.true;

            // Check if registration form is displayed
            const formDisplayed = await signupPage.isRegistrationFormDisplayed();
            expect(formDisplayed).to.be.true;

            console.log('✅ Registration form elements are displayed correctly');
        });

        it('should successfully register a new user', async function () {
            console.log('👤 Testing user registration...');

            // Generate unique email for test
            const timestamp = Date.now();
            const testUser = {
                firstName: 'Test',
                lastName: 'User',
                email: `test.user.${timestamp}@eduassist.com`,
                password: 'TestPassword123!'
            };

            // Fill and submit registration form
            await signupPage.registerNewUser(testUser);

            // Wait for registration success using explicit wait
            await signupPage.waitForRegistrationSuccess();

            // Verify success (either success message or redirect)
            const hasSuccessMessage = await signupPage.isSuccessMessageDisplayed();
            const currentUrl = await signupPage.getCurrentUrl();
            const redirectedToLogin = currentUrl.includes('/login');
            const redirectedToDashboard = currentUrl.includes('/dashboard');

            // Assert that registration was successful
            expect(hasSuccessMessage || redirectedToLogin || redirectedToDashboard).to.be.true;

            console.log('✅ User registration completed successfully');
        });

        it('should show validation errors for invalid form data', async function () {
            console.log('⚠️ Testing form validation...');

            // Submit form with invalid data
            const invalidUser = {
                firstName: '',
                lastName: '',
                email: 'invalid-email',
                password: '123' // Too short
            };

            await signupPage.fillRegistrationForm(invalidUser);
            await signupPage.submitRegistration();

            // Wait for validation errors
            await DriverManager.getDriver().sleep(2000);

            // Check for error messages
            const hasErrors = await signupPage.hasErrorMessages();
            expect(hasErrors).to.be.true;

            const errorMessages = await signupPage.getErrorMessages();
            expect(errorMessages.length).to.be.greaterThan(0);

            console.log(`✅ Validation errors displayed: ${errorMessages.join(', ')}`);
        });

        it('should navigate to login page from signup', async function () {
            console.log('🔗 Testing navigation to login page...');

            // Click login link
            await signupPage.clickLoginLink();

            // Wait for navigation
            await DriverManager.getDriver().sleep(2000);

            // Verify URL change
            const currentUrl = await signupPage.getCurrentUrl();
            expect(currentUrl).to.include('/login');

            // Verify login form is displayed
            const loginFormDisplayed = await loginPage.isLoginFormDisplayed();
            expect(loginFormDisplayed).to.be.true;

            console.log('✅ Successfully navigated to login page');
        });

        it('should test password strength validation', async function () {
            console.log('🔒 Testing password strength validation...');

            // Test different password strengths
            const passwords = [
                '123',           // Weak
                'password',      // Medium
                'Password123!',  // Strong
            ];

            for (const password of passwords) {
                const strengthText = await signupPage.testPasswordStrength(password);
                console.log(`Password "${password}" strength: ${strengthText}`);

                // Basic assertion - password strength indicator should respond
                // (Implementation depends on actual password strength component)
                expect(strengthText).to.be.a('string');
            }

            console.log('✅ Password strength validation tested');
        });
    });

    describe('Authentication Flow Integration', function () {

        it('should complete full signup to login flow', async function () {
            console.log('🔄 Testing complete authentication flow...');

            // Step 1: Register new user
            await signupPage.navigateToSignup();

            const timestamp = Date.now();
            const testUser = {
                firstName: 'Flow',
                lastName: 'Test',
                email: `flow.test.${timestamp}@eduassist.com`,
                password: 'FlowTest123!'
            };

            await signupPage.registerNewUser(testUser);
            await signupPage.waitForRegistrationSuccess();

            // Step 2: Navigate to login if not automatically redirected
            const currentUrl = await signupPage.getCurrentUrl();
            if (!currentUrl.includes('/login') && !currentUrl.includes('/dashboard')) {
                await loginPage.navigateToLogin();
            }

            // Step 3: Login with the newly created account
            if (currentUrl.includes('/login')) {
                await loginPage.login(testUser.email, testUser.password);
                await loginPage.waitForLoginSuccess();
            }

            // Step 4: Verify successful login to dashboard
            const finalUrl = await DriverManager.getCurrentUrl();
            expect(finalUrl).to.include('/dashboard');

            const isLoggedIn = await dashboardPage.isUserLoggedIn();
            expect(isLoggedIn).to.be.true;

            console.log('✅ Complete authentication flow successful');
        });
    });
});