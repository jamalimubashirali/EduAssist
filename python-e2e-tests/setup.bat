@echo off
REM Setup script for EduAssist Python E2E Tests on Windows
echo ========================================
echo EduAssist Python E2E Tests Setup
echo ========================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python is installed

REM Install requirements
echo 🔧 Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Clear WebDriverManager cache
echo 🧹 Clearing WebDriverManager cache...
if exist "%USERPROFILE%\.wdm" (
    rmdir /s /q "%USERPROFILE%\.wdm"
    echo ✅ Cleared WebDriverManager cache
)

REM Test ChromeDriver setup
echo 🧪 Testing ChromeDriver setup...
python test_driver_setup.py

echo.
echo ========================================
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo 1. Start your EduAssist app:
echo    cd .. ^&^& npm run dev
echo.
echo 2. Run the tests:
echo    pytest tests/test_authentication.py -v -s
echo.
echo 3. Or run complete flow test:
echo    pytest tests/test_eduassist_complete_flow.py -v -s
echo ========================================
pause