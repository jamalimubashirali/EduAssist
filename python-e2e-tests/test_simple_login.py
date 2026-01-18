#!/usr/bin/env python3
"""
Simple login test to verify the fixed selectors work
"""

import sys
import os
import time

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.driver_manager import DriverManager, by_css, by_xpath
from config.test_config import config

def test_simple_login():
    """Test simple login functionality with fixed selectors"""
    print("🧪 Testing simple login with fixed selectors...")
    
    try:
        # Initialize driver
        driver = DriverManager.initialize_driver()
        print("✅ ChromeDriver initialized successfully!")
        
        # Navigate to login page
        print("🌐 Navigating to login page...")
        driver.get(f"{config.BASE_URL}/login")
        time.sleep(3)  # Wait for page to load
        
        # Check page title
        title = driver.title
        print(f"📄 Page title: '{title}'")
        
        # Try to find email field
        print("🔍 Looking for email field...")
        email_selectors = ['#email', 'input[type="email"]', 'input[name="email"]']
        email_found = False
        
        for selector in email_selectors:
            try:
                email_element = driver.find_element(*by_css(selector))
                if email_element.is_displayed():
                    print(f"✅ Found email field with selector: {selector}")
                    email_element.clear()
                    email_element.send_keys("demo@eduassist.com")
                    print("✅ Email entered successfully")
                    email_found = True
                    break
            except Exception as e:
                print(f"⚠️ Selector {selector} failed: {e}")
        
        if not email_found:
            print("❌ Could not find email field")
            return False
        
        # Try to find password field
        print("🔍 Looking for password field...")
        password_selectors = ['#password', 'input[type="password"]', 'input[name="password"]']
        password_found = False
        
        for selector in password_selectors:
            try:
                password_element = driver.find_element(*by_css(selector))
                if password_element.is_displayed():
                    print(f"✅ Found password field with selector: {selector}")
                    password_element.clear()
                    password_element.send_keys("demo123")
                    print("✅ Password entered successfully")
                    password_found = True
                    break
            except Exception as e:
                print(f"⚠️ Selector {selector} failed: {e}")
        
        if not password_found:
            print("❌ Could not find password field")
            return False
        
        # Try to find and click login button
        print("🔍 Looking for login button...")
        button_selectors = [
            'button[type="submit"]',
            '.game-button',
            'form button',
            'button'
        ]
        button_found = False
        
        for selector in button_selectors:
            try:
                button_elements = driver.find_elements(*by_css(selector))
                for button in button_elements:
                    if button.is_displayed() and button.is_enabled():
                        print(f"✅ Found login button with selector: {selector}")
                        button.click()
                        print("✅ Login button clicked")
                        button_found = True
                        break
                if button_found:
                    break
            except Exception as e:
                print(f"⚠️ Selector {selector} failed: {e}")
        
        if not button_found:
            print("❌ Could not find or click login button")
            return False
        
        # Wait for potential redirect
        print("⏳ Waiting for login response...")
        time.sleep(5)
        
        # Check current URL
        current_url = driver.current_url
        print(f"📍 Current URL: {current_url}")
        
        if '/dashboard' in current_url:
            print("🎉 Login successful - redirected to dashboard!")
            return True
        elif '/login' in current_url:
            print("⚠️ Still on login page - check credentials or form submission")
            
            # Check for error messages
            error_selectors = ['.text-red-400', '.error-message', '[role="alert"]']
            for selector in error_selectors:
                try:
                    error_elements = driver.find_elements(*by_css(selector))
                    for error in error_elements:
                        if error.is_displayed() and error.text.strip():
                            print(f"❌ Error message: {error.text}")
                except:
                    pass
            
            return False
        else:
            print(f"✅ Login appears successful - current URL: {current_url}")
            return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    
    finally:
        # Clean up
        try:
            DriverManager.quit_driver()
            print("🧹 Driver cleanup completed")
        except:
            pass

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 EduAssist Simple Login Test")
    print("=" * 60)
    
    success = test_simple_login()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Simple login test successful!")
        print("The fixed selectors are working correctly!")
    else:
        print("❌ Simple login test failed")
        print("Check the output above for specific issues")
    print("=" * 60)