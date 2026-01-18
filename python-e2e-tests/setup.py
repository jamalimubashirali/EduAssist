#!/usr/bin/env python3
"""
Setup script for EduAssist Python E2E Tests
Installs dependencies and verifies ChromeDriver setup
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("=" * 60)
    print("🚀 EduAssist Python E2E Tests Setup")
    print("=" * 60)
    
    # Check Python version
    python_version = sys.version_info
    print(f"🐍 Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        return False
    
    # Clear WebDriverManager cache (helps with ChromeDriver issues)
    print("🧹 Clearing WebDriverManager cache...")
    wdm_cache_paths = [
        os.path.expanduser("~/.wdm"),
        os.path.expanduser("~/AppData/Local/.wdm"),  # Windows
        os.path.expanduser("~/Library/Caches/.wdm")  # macOS
    ]
    
    for cache_path in wdm_cache_paths:
        if os.path.exists(cache_path):
            try:
                if os.name == 'nt':  # Windows
                    subprocess.run(f'rmdir /s /q "{cache_path}"', shell=True, check=True)
                else:  # Unix-like
                    subprocess.run(f'rm -rf "{cache_path}"', shell=True, check=True)
                print(f"✅ Cleared cache: {cache_path}")
            except:
                print(f"⚠️ Could not clear cache: {cache_path}")
    
    # Test ChromeDriver setup
    print("\n🧪 Testing ChromeDriver setup...")
    try:
        result = subprocess.run([sys.executable, "test_driver_setup.py"], 
                              capture_output=True, text=True, timeout=60)
        
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        
        if result.returncode == 0:
            print("✅ ChromeDriver setup test passed!")
        else:
            print("⚠️ ChromeDriver setup test had issues")
            
    except subprocess.TimeoutExpired:
        print("⚠️ ChromeDriver test timed out")
    except Exception as e:
        print(f"⚠️ ChromeDriver test error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Make sure your EduAssist app is running:")
    print("   cd .. && npm run dev")
    print("\n2. Run the tests:")
    print("   pytest tests/test_authentication.py -v -s")
    print("\n3. Or run the complete flow test:")
    print("   pytest tests/test_eduassist_complete_flow.py -v -s")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)