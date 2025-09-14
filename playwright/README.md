# Playwright E2E Tests for Admin Panel

This directory contains end-to-end tests for the admin panel application using Playwright.

## Setup

1. Make sure your frontend is running on `http://localhost:8080`
2. Make sure your backend is running on `http://localhost:3000`
3. Install dependencies: `npm install`
4. Install browsers: `npx playwright install`

## Running Tests

### All Tests
```bash
npm test
```

### Login Tests Only
```bash
npm run test:login
```

### Run with Browser UI (Headed Mode)
```bash
npm run test:headed
npm run test:login:headed
```

### Debug Mode
```bash
npm run test:debug
```

### Interactive UI Mode
```bash
npm run test:ui
```

### View Test Report
```bash
npm run test:report
```

## Test Structure

### Login Tests (`tests/login.spec.ts`)

The login test suite includes:

1. **Navigate to login page** - Verifies login page loads with all form elements
2. **Valid credentials test** - Tests login with `admin@example.com` / `admin123`
3. **Invalid credentials test** - Tests error handling with wrong credentials
4. **Empty form submission** - Tests form validation
5. **JWT token verification** - Checks if JWT tokens are properly stored
6. **Logout functionality** - Tests logout and token cleanup
7. **Backend integration** - Monitors network requests to verify API calls

### Screenshots

All tests automatically capture screenshots at key points:
- `01-login-page-initial.png` - Initial login page
- `02-login-form-filled.png` - Form with valid credentials
- `03-after-login-attempt.png` - After login attempt
- `04-invalid-credentials-filled.png` - Form with invalid credentials
- `05-after-invalid-login.png` - Error state
- `06-empty-form-submission.png` - Validation errors
- `07-jwt-token-verified.png` - Successful authentication
- `08-before-logout.png` - Before logout
- `09-after-logout.png` - After logout
- `10-authentication-flow-complete.png` - Complete flow

## Configuration

The tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:8080`
- Multiple browsers: Chrome, Firefox, Safari, Mobile
- Screenshots on failure
- Video recording on failure
- HTML report generation

## Test Data

Default test credentials:
- Valid: `admin@example.com` / `admin`
- Invalid: `wrong@example.com` / `wrongpassword`

## Troubleshooting

1. **Tests fail to connect**: Ensure both frontend and backend are running
2. **Element not found**: Check if login form selectors match your actual implementation
3. **Screenshots not generated**: Check `screenshots/` directory permissions
4. **JWT token issues**: Verify your app stores tokens in localStorage with standard keys

## Customization

To modify test data or selectors, edit `tests/login.spec.ts`:
- Update `TEST_CREDENTIALS` for different test data
- Modify selectors to match your form elements
- Add additional test cases as needed
