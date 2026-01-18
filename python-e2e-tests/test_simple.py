#!/usr/bin/env python3
"""
Simple test to verify the Python E2E setup is working
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all imports work correctly"""
    print("🔍 Testing imports...")
    
    try:
        from config.test_config import config
        print("✅ Config import successful")
        print(f"   Base URL: {config.BASE_URL}")
        print(f"   Headless: {config.HEADLESS}")
        
        from utils.driver_manager import DriverManager, by_css, by_xpath
        print("✅ Driver manager import successful")
        
        from pages.base_page import BasePage
        print("✅ Base page import successful")
        
        from pages.login_page import LoginPage
        print("✅ Login page import successful")
        
        from pages.dashboard_page import DashboardPage
        print("✅ Dashboard page import successful")
        
        print("✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_webdriver_setup():
    """Test WebDriver initialization"""
    print("\n🚀 Testing WebDriver setup...")
    
    try:
        from utils.driver_manager import DriverManager
        
        # Initialize driver
        driver = DriverManager.initialize_driver()
        print("✅ WebDriver initialized successfully")
        
        # Test basic navigation
        driver.get("https://www.google.com")
        title = driver.title
        print(f"✅ Navigation successful - Title: {title}")
        
        # Cleanup
        DriverManager.quit_driver()
        print("✅ WebDriver cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ WebDriver test failed: {e}")
        try:
            DriverManager.quit_driver()
        except:
            pass
        return False

def test_application_access():
    """Test access to the EduAssist application"""
    print("\n🌐 Testing application access...")
    
    try:
        from utils.driver_manager import DriverManager
        from config.test_config import config
        
        # Initialize driver
        driver = DriverManager.initialize_driver()
        print("✅ WebDriver initialized")
        
        # Try to access the application
        print(f"🔗 Attempting to access: {config.BASE_URL}")
        driver.get(config.BASE_URL)
        
        # Wait a moment for page to load
        import time
        time.sleep(3)
        
        title = driver.title
        current_url = driver.current_url
        
        print(f"📄 Page title: '{title}'")
        print(f"🌐 Current URL: {current_url}")
        
        # Check if page loaded (has some content)
        page_source_length = len(driver.page_source)
        print(f"📊 Page content length: {page_source_length} characters")
        
        if page_source_length > 100:  # Basic check for content
            print("✅ Application appears to be accessible")
            success = True
        else:
            print("⚠️ Application might not be running or accessible")
            success = False
        
        # Cleanup
        DriverManager.quit_driver()
        print("✅ WebDriver cleanup successful")
        
        return success
        
    except Exception as e:
        print(f"❌ Application access test failed: {e}")
        print("💡 Make sure your EduAssist application is running on http://localhost:3000")
        try:
            DriverManager.quit_driver()
        except:
            pass
        return False

def main():
    """Run all tests"""
    print("🎯 EduAssist Python E2E Setup Verification")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("WebDriver Setup Test", test_webdriver_setup),
        ("Application Access Test", test_application_access)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("=" * 50)
    print(f"Total: {passed + failed} | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("🎉 All tests passed! Your setup is ready for E2E testing.")
        return 0
    else:
        print("⚠️ Some tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())