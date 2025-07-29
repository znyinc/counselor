# End-to-End Integration Tests

This directory contains comprehensive integration tests for the AI Career Counseling Tool. These tests validate the complete user journey from form submission to results display, ensuring all components work together correctly.

## Test Categories

### 1. User Journey Tests (`userJourney.test.tsx`)
Tests the complete user flow from form submission to results display:
- **Happy Path Flow**: Complete form submission with valid data
- **Form Validation**: Error handling and validation feedback
- **Error Scenarios**: AI service failures, network timeouts, rate limiting
- **Performance**: Concurrent user handling and response times

### 2. Language Switching Tests (`languageSwitching.test.tsx`)
Validates internationalization functionality throughout the application:
- **Language Persistence**: Maintaining language preference across navigation
- **Form Validation Messages**: Error messages in selected language
- **API Error Messages**: Server error responses in correct language
- **Results Display**: Career recommendations in selected language
- **Number/Date Formatting**: Locale-specific formatting

### 3. Webhook Notifications Tests (`webhookNotifications.test.tsx`)
Tests the notification system integration:
- **Profile Submission Notifications**: Webhook triggers on form submission
- **Payload Validation**: Proper webhook payload structure
- **Error Handling**: Graceful handling of webhook failures
- **n8n Integration**: Compatibility with n8n workflow automation
- **Retry Logic**: Automatic retry on temporary failures

### 4. Analytics Collection Tests (`analyticsCollection.test.tsx`)
Validates analytics data collection and dashboard functionality:
- **Data Collection**: Anonymized analytics during user interactions
- **Dashboard Filtering**: Real-time filtering by region, board, time range
- **Privacy Compliance**: PII anonymization and data retention
- **Performance**: Large dataset handling and real-time updates
- **Export Functionality**: CSV/PDF export capabilities

### 5. AI Recommendation Quality Tests (`aiRecommendationQuality.test.tsx`)
Tests AI recommendation accuracy and NEP 2020 alignment:
- **NEP 2020 Compliance**: Multidisciplinary approach and equity principles
- **Recommendation Accuracy**: Match score validation and relevance
- **Comprehensive Information**: Complete career details and education paths
- **Service Performance**: Processing time and consistency
- **Edge Cases**: Unusual profiles and conflicting interests
- **Diversity**: Gender-inclusive and sector-diverse recommendations

### 6. Performance Tests (`performanceTests.test.tsx`)
Validates application performance under various conditions:
- **Load Performance**: Initial page load and navigation times
- **Form Performance**: Input responsiveness and validation speed
- **API Performance**: Response times and concurrent request handling
- **Memory Management**: Memory leak detection and resource usage
- **Chart Rendering**: Visualization performance and interactions
- **Mobile Performance**: Performance on mobile viewports

## Test Setup and Configuration

### Prerequisites
- Node.js 16+ and npm
- Backend server running on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Installation
```bash
# Install dependencies
npm install

# Install additional test dependencies
npm install --save-dev msw @testing-library/jest-dom @testing-library/user-event
```

### Running Tests

#### Run All Integration Tests
```bash
# Using the test runner script
node src/tests/integration/runTests.js

# Using npm directly
npm test -- --testPathPattern="integration" --watchAll=false
```

#### Run Specific Test Category
```bash
# Run only user journey tests
node src/tests/integration/runTests.js --category userJourney

# Run only performance tests
node src/tests/integration/runTests.js --category performance
```

#### Run Tests with Coverage
```bash
npm test -- --testPathPattern="integration" --coverage --watchAll=false
```

### Test Configuration

The tests use the following configuration:
- **Test Environment**: jsdom for DOM simulation
- **Timeout**: 30 seconds for long-running operations
- **Mock Service Worker**: API mocking for consistent test data
- **Performance Monitoring**: Built-in performance measurement utilities

## Mock Data and Services

### Mock Service Worker (MSW)
Tests use MSW to mock API responses:
- **Profile Submission**: Mock AI recommendations
- **Analytics Data**: Simulated dashboard data
- **Webhook Notifications**: Mock notification delivery
- **Error Scenarios**: Simulated service failures

### Test Data
Comprehensive mock data includes:
- **Student Profiles**: Various demographic and academic combinations
- **Career Recommendations**: Realistic career data with all required fields
- **Analytics Data**: Statistical data for dashboard testing

## Test Scenarios

### Happy Path Scenarios
- Complete form submission with valid data
- Successful AI recommendation generation
- Proper webhook notification delivery
- Analytics data collection and display

### Error Scenarios
- Form validation errors
- AI service unavailability
- Network timeouts and failures
- Rate limiting enforcement
- Invalid data handling

### Edge Cases
- Unusual student profiles
- Conflicting interests and aspirations
- Large form data
- Concurrent user sessions
- Mobile device constraints

## Performance Benchmarks

### Acceptable Performance Thresholds
- **Initial Page Load**: < 2 seconds
- **Form Input Response**: < 200ms
- **Language Switching**: < 500ms
- **API Response**: < 8 seconds
- **Chart Rendering**: < 3 seconds
- **Memory Usage**: < 10MB increase per session

### Load Testing
- **Concurrent Users**: Up to 5 simultaneous sessions
- **Form Submissions**: Multiple rapid submissions
- **Analytics Queries**: Large dataset handling

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:integration
```

### Test Reports
Tests generate comprehensive reports including:
- **Test Results**: Pass/fail status for each category
- **Performance Metrics**: Response times and resource usage
- **Coverage Reports**: Code coverage analysis
- **Error Logs**: Detailed failure information

## Debugging Tests

### Common Issues
1. **Backend Not Running**: Ensure backend server is started
2. **Port Conflicts**: Check that ports 3000 and 3001 are available
3. **Timeout Errors**: Increase timeout for slow operations
4. **Memory Issues**: Clear browser cache and restart tests

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --testPathPattern="integration" --verbose

# Run single test file for debugging
npm test -- --testPathPattern="userJourney.test.tsx" --watchAll=false
```

### Browser DevTools
Tests run in jsdom, but you can debug using:
- Console logs in test output
- Jest debugging with `--inspect-brk`
- React DevTools for component inspection

## Contributing

### Adding New Tests
1. Create test file in appropriate category
2. Follow existing naming conventions
3. Include both happy path and error scenarios
4. Add performance benchmarks where applicable
5. Update this README with new test descriptions

### Test Guidelines
- Use descriptive test names
- Include setup and teardown for each test
- Mock external dependencies consistently
- Validate both success and error responses
- Test accessibility and internationalization

### Code Coverage
Maintain minimum 80% code coverage for:
- Component rendering and interactions
- API endpoint functionality
- Error handling paths
- User workflow completion

## Troubleshooting

### Common Test Failures
- **Network Errors**: Check backend server status
- **Timeout Issues**: Increase Jest timeout configuration
- **Memory Leaks**: Ensure proper cleanup in test teardown
- **Flaky Tests**: Add proper wait conditions and assertions

### Performance Issues
- **Slow Tests**: Optimize mock data and reduce unnecessary operations
- **Memory Usage**: Monitor heap usage and clean up resources
- **Concurrent Failures**: Implement proper test isolation

For additional help, see the main project documentation or create an issue in the project repository.