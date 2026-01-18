#!/usr/bin/env python3
"""
Test Runner for EduAssist Python E2E Tests
Provides convenient commands to run different test suites
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(command, description):
    """Run a command and handle output"""
    print(f"\n🚀 {description}")
    print("=" * 60)
    
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=False, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False


def main():
    parser = argparse.ArgumentParser(description="EduAssist E2E Test Runner")
    parser.add_argument("--suite", choices=["auth", "dashboard", "complete", "all"], 
                       default="all", help="Test suite to run")
    parser.add_argument("--headless", action="store_true", 
                       help="Run tests in headless mode")
    parser.add_argument("--html", action="store_true", 
                       help="Generate HTML report")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Verbose output")
    
    args = parser.parse_args()
    
    # Set environment variables
    if args.headless:
        os.environ["HEADLESS"] = "true"
    
    # Base pytest command
    base_cmd = "python -m pytest"
    
    if args.verbose:
        base_cmd += " -v -s"
    
    if args.html:
        base_cmd += " --html=reports/report.html --self-contained-html"
        # Create reports directory
        Path("reports").mkdir(exist_ok=True)
    
    # Test suite commands
    test_commands = {
        "auth": f"{base_cmd} tests/test_authentication.py",
        "dashboard": f"{base_cmd} tests/test_dashboard.py", 
        "complete": f"{base_cmd} tests/test_complete_suite.py",
        "all": f"{base_cmd} tests/"
    }
    
    print("🎯 EduAssist Python E2E Test Runner")
    print(f"📊 Running test suite: {args.suite}")
    print(f"🖥️ Headless mode: {args.headless}")
    print(f"📄 HTML report: {args.html}")
    
    # Run selected test suite
    if args.suite in test_commands:
        success = run_command(test_commands[args.suite], f"{args.suite.title()} Tests")
        
        if args.html and success:
            print(f"\n📄 HTML report generated: reports/report.html")
        
        sys.exit(0 if success else 1)
    else:
        print(f"❌ Unknown test suite: {args.suite}")
        sys.exit(1)


if __name__ == "__main__":
    main()