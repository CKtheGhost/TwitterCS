# Testing Strategy for Social Engagement Platform

This document outlines the testing approach and methodology for the Social Engagement Platform's backend services.

## Testing Levels

Our testing strategy includes multiple levels of tests to ensure comprehensive coverage:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interaction between components
3. **End-to-End Tests** - Test complete user flows and scenarios

## Test Structure

Tests are organized in the following directory structure:

```
/tests
  /unit            # Unit tests for individual components
    /controllers   # Tests for controller functions
    /services      # Tests for service functions
    /models        # Tests for model methods
  /integration     # Tests for API routes and component integration
  /e2e             # End-to-end tests for complete user flows
  /fixtures        # Shared test data and utilities
  setupTests.js    # Jest setup file with MongoDB memory server configuration
```

## Testing Tools and Libraries

- **Jest** - Main test runner and framework
- **Chai** - Assertion library for readable test cases
- **Sinon** - Mocking, stubbing, and spying library
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB for testing without a real database

## Running Tests

The following npm scripts are available for running tests:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Run tests with coverage report
npm run test:coverage
```

## MongoDB Memory Server Integration

For testing database interactions without a real MongoDB instance, we use the `mongodb-memory-server` package. This creates an in-memory MongoDB server for tests.

The setup is configured in `tests/setupTests.js` and includes:

1. Starting an in-memory MongoDB server
2. Connecting mongoose to this server
3. Seeding test data from fixtures
4. Cleaning up after tests

## Test Data and Fixtures

Centralized test data is located in `tests/fixtures/testData.js`. This includes:

- Mock quests
- Mock quest completions
- Mock users
- Test tokens
- Sample request payloads

Using shared fixtures ensures consistent test data across all test levels.

## Mocking External Services

External services are mocked for testing to isolate the system under test:

- **botDetectionService** - Mocked to always return non-bot results
- **consentService** - Mocked to indicate consent for test users
- **ethicalDataService** - Mocked to verify quest completions
- **web3Service** - Mocked to simulate blockchain interactions

## Test Coverage Goals

We aim for the following test coverage thresholds:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Coverage reports are generated when running `npm run test:coverage`.

## Continuous Integration

Tests are automatically run in the CI/CD pipeline through GitHub Actions. Tests must pass before code can be merged to the main branch.

## Adding New Tests

When adding new features, follow this testing process:

1. Create unit tests for individual components
2. Create integration tests for API routes
3. Update or add end-to-end tests for user flows
4. Add any necessary fixtures to `testData.js`
5. Run the full test suite to ensure nothing breaks

## Testing Best Practices

- Tests should be independent and not rely on the state from other tests
- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert
- Mock external dependencies appropriately
- Prefer testing behavior over implementation details
- Keep fixtures up-to-date with the data model
- Group related tests in describes blocks for better organization

## E2E Test Scenarios

Our end-to-end tests cover complete user flows, including:

1. Quest creation by admin
2. Viewing available quests 
3. Completing quests with validation
4. Quest verification process
5. User statistics and progression
6. Error handling and edge cases

Detailed information about the E2E tests implementation can be found in [E2E_TESTS.md](tests/E2E_TESTS.md).

## Quest Lifecycle End-to-End Flow

The main end-to-end test flow covers the complete lifecycle of a quest:

1. **Quest Creation**: Admin creates a new quest with specific requirements
2. **Quest Discovery**: User browses and finds the newly created quest
3. **Quest Completion**: User completes the quest by submitting required content
4. **Verification**: System validates the submission and rewards the user
5. **User Progress**: User sees the completion in their history and updated stats
6. **Quest Management**: Admin updates and eventually deactivates the quest

This flow ensures that all components work together correctly from creation to completion.