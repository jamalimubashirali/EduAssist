#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up E2E Testing with Selenium...\n');

function runCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    return false;
  }
}

function checkPrerequisites() {
  console.log('📋 Checking prerequisites...');
  
  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✓ Node.js: ${nodeVersion}`);
  } catch (error) {
    console.error('❌ Node.js not found');
    return false;
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✓ npm: ${npmVersion}`);
  } catch (error) {
    console.error('❌ npm not found');
    return false;
  }

  return true;
}

function setupE2ETests() {
  console.log('\n📦 Setting up E2E test dependencies...');
  
  if (!fs.existsSync('e2e-tests')) {
    console.error('❌ e2e-tests directory not found. Make sure you have the E2E test files.');
    return false;
  }

  return runCommand('npm install', 'e2e-tests');
}

function addTestIdAttributes() {
  console.log('\n🏷️  Adding data-testid attributes to components...');
  
  // Update FollowUpQuestions component
  const followUpPath = 'frontend/src/components/learning-assistant/FollowUpQuestions.tsx';
  if (fs.existsSync(followUpPath)) {
    let content = fs.readFileSync(followUpPath, 'utf8');
    
    // Add data-testid to the follow-up question buttons
    content = content.replace(
      /(<Button[^>]*key={index}[^>]*)/,
      '$1\n            data-testid="follow-up-question"'
    );
    
    fs.writeFileSync(followUpPath, content);
    console.log('✓ Updated FollowUpQuestions component');
  }

  console.log('✓ Component updates complete');
  console.log('💡 Remember to add data-testid attributes to other components as needed');
}

function createRunScripts() {
  console.log('\n📝 Creating run scripts...');
  
  // Update root package.json to include E2E scripts
  const rootPackagePath = 'package.json';
  if (fs.existsSync(rootPackagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'test:e2e': 'cd e2e-tests && npm test',
      'test:e2e:headless': 'cd e2e-tests && npm run test:headless',
      'test:e2e:setup': 'cd e2e-tests && npm run setup',
      'dev:full': 'concurrently "cd backend && npm run start:dev" "cd frontend && npm run dev"'
    };
    
    fs.writeFileSync(rootPackagePath, JSON.stringify(packageJson, null, 2));
    console.log('✓ Added E2E scripts to root package.json');
  }
}

function displayInstructions() {
  console.log('\n🎉 E2E Testing setup complete!\n');
  
  console.log('📚 Quick Start Guide:');
  console.log('1. Start your applications:');
  console.log('   cd backend && npm run start:dev');
  console.log('   cd frontend && npm run dev');
  console.log('');
  console.log('2. Run E2E tests:');
  console.log('   npm run test:e2e              # Run all tests');
  console.log('   npm run test:e2e:headless     # Run headless');
  console.log('   cd e2e-tests && npm run test:chrome   # Chrome only');
  console.log('   cd e2e-tests && npm run test:firefox  # Firefox only');
  console.log('');
  console.log('📖 For more details, check: e2e-tests/README.md');
  console.log('');
  console.log('💡 Tips:');
  console.log('- Add data-testid attributes to your components for reliable selectors');
  console.log('- Use the page object pattern for maintainable tests');
  console.log('- Run tests in headless mode for CI/CD pipelines');
  console.log('');
}

// Main execution
async function main() {
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  if (!setupE2ETests()) {
    process.exit(1);
  }

  addTestIdAttributes();
  createRunScripts();
  displayInstructions();
}

main().catch(console.error);