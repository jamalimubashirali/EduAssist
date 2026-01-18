#!/usr/bin/env python3
"""
Simple script to test ChromeDriver setup
Run this to verify if the WebDriver issues are resolved
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.driver_manager import DriverManager

def test_driver_setup():
    """Test if ChromeDriver can be initialized"""
    print("🧪 Testing ChromeDriver setup...")
    
    try:
        # Initialize driver
        driver = DriverManager.initialize_driver()
        print("✅ ChromeDriver initialized successfully!")
        
        # Test basic navigation
        print("🌐 Testing navigation to Google...")
        try:
            driver.get("https://www.google.com")
            
            title = driver.title
            print(f"📄 Page title: {title}")
            
            if "Google" in title:
                print("✅ Navigation test successful!")
            else:
                print("⚠️ Navigation test failed - unexpected title")
        except Exception as nav_error:
            print(f"⚠️ Navigation test failed: {nav_error}")
            print("   This might be a network issue, but ChromeDriver is working!")
        
        # Test local navigation (if your app is running)
        print("🏠 Testing navigation to localhost:3000...")
        try:
            driver.get("http://localhost:3000")
            local_title = driver.title
            print(f"📄 Local page title: {local_title}")
            
            if local_title and local_title != "":
                print("✅ Local navigation successful!")
            else:
                print("⚠️ Local navigation failed - is your app running on localhost:3000?")
        except Exception as e:
            print(f"⚠️ Local navigation failed: {e}")
            print("   Make sure your EduAssist app is running with 'npm run dev'")
        
        return True
        
    except Exception as e:
        print(f"❌ ChromeDriver setup failed: {e}")
        print("\n💡 Troubleshooting steps:")
        print("1. Make sure Google Chrome is installed")
        print("2. Try: pip install --upgrade selenium webdriver-manager")
        print("3. Clear WebDriverManager cache:")
        print("   - Windows: rmdir /s %USERPROFILE%\\.wdm")
        print("   - Linux/Mac: rm -rf ~/.wdm")
        print("4. Restart your terminal/command prompt")
        return False
    
    finally:
        # Clean up
        try:
            DriverManager.quit_driver()
            print("🧹 Driver cleanup completed")
        except:
            pass

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 EduAssist ChromeDriver Setup Test")
    print("=" * 50)
    
    success = test_driver_setup()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ChromeDriver setup is working!")
        print("You can now run the E2E tests with:")
        print("   pytest tests/test_authentication.py -v -s")
    else:
        print("❌ ChromeDriver setup needs fixing")
        print("Please follow the troubleshooting steps above")
    print("=" * 50)