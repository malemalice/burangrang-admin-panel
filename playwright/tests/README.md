# Playwright Test Suite

## 📁 Directory Structure

```
tests/
├── constants/           # Global constants (credentials, URLs, etc.)
│   └── index.ts        # Centralized configuration
├── types/              # TypeScript type definitions
│   └── index.ts        # Test-specific interfaces
├── utils/              # Test utilities and helpers
│   ├── index.ts        # Utility exports
│   └── test-helpers.ts # Common test functions
├── page-objects/       # Page Object Models
│   ├── index.ts        # POM exports
│   ├── LoginPage.ts    # Login page interactions
│   ├── UsersListPage.ts# Users list page
│   ├── UserFormPage.ts # User form interactions
│   └── UserDetailPage.ts# User detail page
├── auth/               # Authentication tests
│   ├── auth.spec.ts    # Authentication flow tests
│   └── login.spec.ts   # Login functionality tests
├── users/              # Users module tests
│   ├── users-crud.spec.ts      # Create, Read, Update, Delete
│   ├── users-validation.spec.ts# Form validation tests
│   ├── users-search-filter.spec.ts# Search and filter tests
│   ├── users-navigation.spec.ts# Navigation tests
│   ├── users-error-handling.spec.ts# Error scenarios
│   └── users-manual-testing.spec.ts# Manual test cases
└── shared/             # Shared/investigation tests
    ├── navigation-test.spec.ts    # Navigation testing
    └── settings-investigation.spec.ts# Settings exploration
```

## 🚀 Best Practices

### KISS Principle (Keep It Simple, Stupid)
- **Single Responsibility**: Each test file focuses on one module/feature
- **Clear Naming**: Test files and functions have descriptive names
- **Minimal Dependencies**: Tests are independent and don't rely on each other
- **Simple Assertions**: Use straightforward expect statements

### Constants & Configuration
- **Centralized Config**: All constants in `constants/index.ts`
- **No Duplication**: Never hardcode URLs, credentials, or timeouts
- **Environment Aware**: Different configs for dev/staging/prod

### Test Organization
- **Module-Based**: Tests grouped by application modules
- **Page Objects**: All UI interactions abstracted into POMs
- **Shared Utilities**: Common functions in `utils/`
- **Type Safety**: Full TypeScript support with custom types

## 📝 Usage Examples

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { TEST_CREDENTIALS, TIMEOUTS } from '../constants';
import { LoginPage } from '../page-objects';

test('Example test', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Use centralized constants
  await loginPage.login(TEST_CREDENTIALS.ADMIN.email, TEST_CREDENTIALS.ADMIN.password);

  // Use centralized timeouts
  await page.waitForTimeout(TIMEOUTS.ELEMENT_WAIT);
});
```

### Adding New Module Tests
1. Create module directory: `mkdir tests/new-module`
2. Add test files: `new-module.spec.ts`, `new-module-validation.spec.ts`
3. Create/update page objects in `page-objects/`
4. Add constants to `constants/index.ts`
5. Update imports and exports

## 🛠️ Available Constants

### URLs
```typescript
import { BASE_URLS } from './constants';
// BASE_URLS.FRONTEND = 'http://localhost:8080'
// BASE_URLS.BACKEND = 'http://localhost:3000'
```

### Credentials
```typescript
import { TEST_CREDENTIALS } from './constants';
// TEST_CREDENTIALS.ADMIN.email
// TEST_CREDENTIALS.ADMIN.password
// TEST_CREDENTIALS.USER.email
```

### Timeouts
```typescript
import { TIMEOUTS } from './constants';
// TIMEOUTS.NAVIGATION = 10000
// TIMEOUTS.ELEMENT_WAIT = 5000
// TIMEOUTS.API_RESPONSE = 10000
```

### Test Data
```typescript
import { TEST_DATA } from './constants';
// TEST_DATA.USERS.VALID_USER
// TEST_DATA.ROLES
// TEST_DATA.OFFICES
```

## 🎯 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Module
```bash
npx playwright test users/
npx playwright test auth/
```

### Run with Specific Browser
```bash
npx playwright test --project=chromium
```

### Debug Mode
```bash
npx playwright test --headed --debug
```

## 📊 Test Results

- Results saved in `test-results/` directory
- Screenshots saved in `screenshots/` directory
- Videos saved for failed tests
- HTML report generated automatically

## 🔧 Maintenance

### Adding New Constants
1. Add to `constants/index.ts`
2. Export from the file
3. Import in test files as needed

### Creating New Page Objects
1. Create in `page-objects/` directory
2. Follow existing patterns
3. Export from `page-objects/index.ts`

### Adding New Test Types
1. Add to `types/index.ts`
2. Use in test files for type safety

## 📈 Scalability

This structure scales well for:
- **Multiple Modules**: Each module gets its own directory
- **Shared Components**: Common utilities in `utils/`
- **Large Teams**: Clear separation of concerns
- **CI/CD Integration**: Easy to run specific test suites
- **Maintenance**: Centralized configuration and utilities
