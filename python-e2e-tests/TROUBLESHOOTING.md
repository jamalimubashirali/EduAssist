# EduAssist Python E2E Tests - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: `[WinError 193] %1 is not a valid Win32 application`

This is the ChromeDriver path issue you encountered. Here are the solutions:

#### Solution A: Quick Fix (Recommended)
```bash
# 1. Clear WebDriverManager cache
rmdir /s /q "%USERPROFILE%\.wdm"

# 2. Reinstall dependencies
pip install --upgrade selenium webdriver-manager

# 3. Test the setup
python test_driver_setup.py
```

#### Solution B: Use System ChromeDriver
1. Download ChromeDriver from https://chromedriver.chromium.org/
2. Extract `chromedriver.exe` to a folder (e.g., `C:\chromedriver\`)
3. Add that folder to your Windows PATH
4. Restart your terminal

#### Solution C: Manual ChromeDriver Setup
```python
# In utils/driver_manager.py, replace the initialization with:
service = Service("C:/path/to/your/chromedriver.exe")
cls._driver = webdriver.Chrome(service=service, options=chrome_options)
```

### Issue 2: Chrome Browser Not Found

#### Symptoms:
- `selenium.common.exceptions.WebDriverException: Message: unknown error: cannot find Chrome binary`

#### Solutions:
1. **Install Google Chrome** from https://www.google.com/chrome/
2. **Specify Chrome location** (if installed in non-standard location):
   ```python
   chrome_options.binary_location = "C:/Program Files/Google/Chrome/Application/chrome.exe"
   ```

### Issue 3: Port Already in Use

#### Symptoms:
- `selenium.common.exceptions.WebDriverException: Message: unknown error: Chrome failed to start`

#### Solutions:
```bash
# Kill existing Chrome processes
taskkill /f /im chrome.exe
taskkill /f /im chromedriver.exe

# Or restart your computer
```

### Issue 4: Permission Denied

#### Symptoms:
- `PermissionError: [WinError 5] Access is denied`

#### Solutions:
1. **Run as Administrator**: Right-click Command Prompt → "Run as administrator"
2. **Check antivirus**: Temporarily disable antivirus software
3. **Windows Defender**: Add Python and ChromeDriver to exclusions

### Issue 5: Tests Fail to Find Elements

#### Symptoms:
- `NoSuchElementException: Message: no such element`
- Tests pass but can't interact with your app

#### Solutions:
1. **Verify app is running**:
   ```bash
   # Make sure your EduAssist app is running
   cd .. && npm run dev
   # Should be accessible at http://localhost:3000
   ```

2. **Check selectors**: The tests use your actual CSS selectors. If you've changed your HTML structure, update the page objects.

3. **Add explicit waits**:
   ```python
   # Increase timeout for slow-loading elements
   WebDriverWait(driver, 30).until(
       EC.presence_of_element_located((By.ID, "email"))
   )
   ```

### Issue 6: Demo Account Login Fails

#### Symptoms:
- Tests can't login with demo account
- `demo@eduassist.com` / `demo123` doesn't work

#### Solutions:
1. **Verify demo account exists** in your database
2. **Update credentials** in `config/test_config.py`:
   ```python
   'valid_user': {
       'email': 'your-actual-demo@email.com',
       'password': 'your-actual-password'
   }
   ```

3. **Check login form** - ensure the form accepts the credentials

### Issue 7: AI Chat Tests Timeout

#### Symptoms:
- Learning Assistant tests timeout waiting for AI response

#### Solutions:
1. **This is expected** if your AI service isn't running
2. **Skip AI tests**:
   ```bash
   pytest -m "not ai" tests/
   ```
3. **Increase timeout** in `config/test_config.py`:
   ```python
   'ai_response': 60  # Increase from 45 to 60 seconds
   ```

## 🔧 Setup Verification

### Step 1: Run Setup Script
```bash
# Windows
setup.bat

# Or manually
python setup.py
```

### Step 2: Test ChromeDriver
```bash
python test_driver_setup.py
```

### Step 3: Test Basic Authentication
```bash
pytest tests/test_authentication.py::TestAuthentication::test_login_form_display -v -s
```

### Step 4: Run Complete Flow (if basic tests pass)
```bash
pytest tests/test_eduassist_complete_flow.py::TestEduAssistCompleteFlow::test_01_login_with_demo_account -v -s
```

## 🐛 Debug Mode

### Enable Verbose Logging
```bash
# Run tests with maximum verbosity
pytest -v -s --tb=long tests/

# Run single test with debug info
pytest tests/test_authentication.py::TestAuthentication::test_login_form_display -v -s --tb=long
```

### Take Screenshots on Failure
The tests automatically take screenshots on failures. Check the `screenshots/` folder.

### Run in Non-Headless Mode
```python
# In config/test_config.py, set:
HEADLESS = False
```

## 🆘 Still Having Issues?

### Check System Requirements
- **Python**: 3.8 or higher
- **Chrome**: Latest version installed
- **Windows**: Windows 10 or higher
- **RAM**: At least 4GB available
- **Disk Space**: 1GB free for ChromeDriver and cache

### Environment Check
```bash
# Check Python version
python --version

# Check pip version
pip --version

# Check installed packages
pip list | findstr selenium

# Check Chrome version
# Go to chrome://version/ in your browser
```

### Clean Installation
```bash
# 1. Uninstall existing packages
pip uninstall selenium webdriver-manager -y

# 2. Clear all caches
rmdir /s /q "%USERPROFILE%\.wdm"
rmdir /s /q "%USERPROFILE%\AppData\Local\pip\cache"

# 3. Reinstall
pip install selenium==4.15.0 webdriver-manager==4.0.0

# 4. Test
python test_driver_setup.py
```

### Contact Information
If you're still having issues:
1. Run `python test_driver_setup.py` and share the output
2. Share your Chrome version (chrome://version/)
3. Share your Python version (`python --version`)
4. Share any error messages in full

## 📋 Quick Reference

### Essential Commands
```bash
# Setup
pip install -r requirements.txt

# Clear cache
rmdir /s /q "%USERPROFILE%\.wdm"

# Test driver
python test_driver_setup.py

# Run auth tests
pytest tests/test_authentication.py -v -s

# Run complete flow
pytest tests/test_eduassist_complete_flow.py -v -s

# Run specific test
pytest tests/test_authentication.py::TestAuthentication::test_demo_account_login_functionality -v -s
```

### File Locations
- **ChromeDriver cache**: `%USERPROFILE%\.wdm\`
- **Screenshots**: `python-e2e-tests/screenshots/`
- **Test config**: `python-e2e-tests/config/test_config.py`
- **Page objects**: `python-e2e-tests/pages/`