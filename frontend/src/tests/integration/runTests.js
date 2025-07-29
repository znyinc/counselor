/**
 * Integration Test Runner
 * Runs all integration tests with proper setup and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test categories
const testCategories = {
  userJourney: 'userJourney.test.tsx',
  languageSwitching: 'languageSwitching.test.tsx',
  webhookNotifications: 'webhookNotifications.test.tsx',
  analyticsCollection: 'analyticsCollection.test.tsx',
  aiRecommendationQuality: 'aiRecommendationQuality.test.tsx',
  performance: 'performanceTests.test.tsx',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

function generateTestReport(results) {
  const reportPath = path.join(__dirname, 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nTest report generated: ${reportPath}`, colors.cyan);
  
  return report;
}

function printSummary(report) {
  log('\n' + '='.repeat(60), colors.bright);
  log('INTEGRATION TEST SUMMARY', colors.bright);
  log('='.repeat(60), colors.bright);
  
  log(`Total Tests: ${report.summary.total}`, colors.blue);
  log(`Passed: ${report.summary.passed}`, colors.green);
  log(`Failed: ${report.summary.failed}`, colors.red);
  
  const successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? colors.green : colors.yellow);
  
  if (report.summary.failed > 0) {
    log('\nFailed Tests:', colors.red);
    report.results
      .filter(r => !r.success)
      .forEach(r => log(`  - ${r.category}`, colors.red));
  }
  
  log('='.repeat(60), colors.bright);
}

async function runIntegrationTests() {
  log('Starting Integration Tests...', colors.bright);
  log('='.repeat(60), colors.bright);
  
  const results = [];
  const startTime = Date.now();
  
  // Check if backend is running
  log('Checking backend availability...', colors.yellow);
  const backendCheck = runCommand('curl -f http://localhost:3001/health || echo "Backend not running"');
  if (!backendCheck.success || backendCheck.output.includes('Backend not running')) {
    log('Warning: Backend server not detected. Some tests may fail.', colors.yellow);
    log('Start backend with: cd backend && npm run dev', colors.yellow);
  }
  
  // Run each test category
  for (const [category, testFile] of Object.entries(testCategories)) {
    log(`\nRunning ${category} tests...`, colors.cyan);
    
    const testCommand = `npm test -- --testPathPattern="${testFile}" --watchAll=false --coverage=false --verbose`;
    const result = runCommand(testCommand, { cwd: process.cwd() });
    
    results.push({
      category,
      testFile,
      success: result.success,
      output: result.output,
      timestamp: new Date().toISOString(),
    });
    
    if (result.success) {
      log(`✅ ${category} tests passed`, colors.green);
    } else {
      log(`❌ ${category} tests failed`, colors.red);
      log(`Error: ${result.output.split('\n').slice(-10).join('\n')}`, colors.red);
    }
  }
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate and display report
  const report = generateTestReport(results);
  printSummary(report);
  
  log(`\nTotal execution time: ${totalTime}s`, colors.blue);
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Integration Test Runner', colors.bright);
  log('Usage: node runTests.js [options]', colors.blue);
  log('\nOptions:');
  log('  --help, -h     Show this help message');
  log('  --category     Run specific test category');
  log('  --list         List available test categories');
  log('\nAvailable categories:');
  Object.keys(testCategories).forEach(cat => log(`  - ${cat}`));
  process.exit(0);
}

if (args.includes('--list')) {
  log('Available test categories:', colors.bright);
  Object.entries(testCategories).forEach(([cat, file]) => {
    log(`  ${cat}: ${file}`, colors.blue);
  });
  process.exit(0);
}

const categoryIndex = args.indexOf('--category');
if (categoryIndex !== -1 && args[categoryIndex + 1]) {
  const category = args[categoryIndex + 1];
  if (testCategories[category]) {
    log(`Running ${category} tests only...`, colors.cyan);
    const testCommand = `npm test -- --testPathPattern="${testCategories[category]}" --watchAll=false`;
    const result = runCommand(testCommand);
    process.exit(result.success ? 0 : 1);
  } else {
    log(`Unknown category: ${category}`, colors.red);
    log('Available categories:', colors.yellow);
    Object.keys(testCategories).forEach(cat => log(`  - ${cat}`));
    process.exit(1);
  }
}

// Run all tests
runIntegrationTests().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});