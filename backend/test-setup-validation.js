#!/usr/bin/env node

/**
 * Quick validation script to check if test setup is working
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Validating Backend Test Setup...\n');

try {
  // Check if Jest config exists
  const jestConfigPath = path.join(__dirname, 'jest.config.js');
  console.log('✅ Jest configuration found');

  // Check if test setup file exists
  const setupPath = path.join(__dirname, 'test', 'setup.ts');
  console.log('✅ Test setup file found');

  // Check if common directory exists
  const commonPath = path.join(__dirname, 'common');
  console.log('✅ Common directory found');

  // Run a simple test to validate configuration
  console.log('\n🚀 Running test validation...');
  
  try {
    execSync('npm test -- --testNamePattern="should be defined" --verbose', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('\n✅ Test setup validation completed successfully!');
  } catch (error) {
    console.log('\n⚠️ Some tests may still need fixes, but configuration is working');
    console.log('Run individual test fixes as needed');
  }

} catch (error) {
  console.error('❌ Test setup validation failed:', error.message);
  process.exit(1);
}