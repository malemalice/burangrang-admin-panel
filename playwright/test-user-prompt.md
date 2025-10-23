# AI Prompt: Generate Playwright Test Code for Users Module

## Context
You are tasked with creating comprehensive Playwright test suites for a React-based admin panel's Users module. The application uses:
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Shadcn/ui components
- REST API backend
- JWT authentication

## Application Structure
```
frontend/src/pages/users/
├── UsersPage.tsx (main listing page with search, filters, pagination)
├── CreateUserPage.tsx (user creation form)
├── EditUserPage.tsx (user editing form)
├── UserForm.tsx (shared form component)
└── UserDetailPage.tsx (user details view)
```

## API Endpoints
- GET `/users` - List users with pagination/search/filters
- POST `/users` - Create user
- GET `/users/:id` - Get user details
- PATCH `/users/:id` - Update user
- DELETE `/users/:id` - Delete user

## Priority 1 Test Cases (Critical)

### 1. User CRUD Operations
- Create new user with valid data
- Read user details
- Update existing user
- Delete user with confirmation

### 2. Form Validation
- Required field validation (firstName, lastName, email, role, office)
- Email format validation
- Password minimum length (6 characters)
- Handle empty form submissions
- Handle invalid email formats

### 3. Authentication & Authorization
- Login required to access user pages
- Proper redirect after login
- JWT token handling
- Session persistence

### 4. Data Display Accuracy
- User list shows correct data
- User details display all fields correctly
- Status badges display correctly
- Date formatting works properly

## Priority 2 Test Cases (High)

### 1. Search and Filtering
- Search by name
- Search by email
- Filter by role, office, department, job position
- Filter by status (active/inactive)
- Multiple filter combinations
- Filter reset functionality

### 2. Pagination
- Page navigation (next/previous)
- Page size changes
- Correct page count calculation
- Pagination with filters applied

### 3. Error Handling
- Network error handling
- Invalid user ID handling
- Duplicate email error handling
- Server error responses
- Loading states display correctly

### 4. Navigation
- Routing between user pages
- Browser back/forward navigation
- Deep linking to user pages
- Navigation after form submissions

## Test Data Requirements
- Test user accounts with different roles
- Test users with different statuses
- Users with/without optional fields (department, job position)
- Various email formats and edge cases

## Testing Approach
1. Use MCP Playwright browser tools for automation
2. Create page object models for reusability
3. Use descriptive test names and organize by feature
4. Include proper setup/teardown
5. Handle async operations correctly
6. Test both happy path and error scenarios
7. Use data-driven testing where appropriate
8. Include visual verification of UI elements

## Generate the following:

### 1. Page Object Models for:
- LoginPage
- UsersListPage
- UserFormPage
- UserDetailPage

### 2. Test Suites organized by:
- `auth.spec.ts` - Authentication tests
- `users-crud.spec.ts` - CRUD operations
- `users-search-filter.spec.ts` - Search and filtering
- `users-pagination.spec.ts` - Pagination testing
- `users-validation.spec.ts` - Form validation
- `users-navigation.spec.ts` - Navigation testing
- `users-error-handling.spec.ts` - Error scenarios

### 3. Test Data Setup utilities
### 4. Helper functions for common operations
### 5. Configuration files for test environment

## Requirements
- Use modern Playwright syntax
- Include proper error handling
- Add meaningful assertions
- Use page object pattern
- Include screenshots on failures
- Handle dynamic content loading
- Test responsive behavior where relevant
- Use TypeScript for type safety

## Base URLs
- Application: `http://localhost:3000` (or your dev server)
- API: `http://localhost:8000/api` (or your backend)

## Credentials
- Admin users.
    - user: admin@example.com
    - password: admin

Please generate complete, runnable Playwright test code that covers all the Priority 1 and 2 test cases mentioned above. Include setup instructions and any necessary configuration files.

## Workflow Steps
1. **First, use MCP Playwright tools** to manually verify each test case and document the exact steps, selectors, and expected behaviors
2. **Then, generate the automated test code** based on the MCP testing results and documented behaviors
3. **Run the generated tests** and fix any failures that occur
4. **Use todo action lists** to track progress for this long-running task

## Additional Requirements
- I can confirm most of the functionality is passed when i test manually. I expect this test code will guard what i've worked
- Document the MCP testing steps first before generating test code
- Ensure the automated tests match the exact manual testing workflow
- After the test code was generated, do run the test and fix the test code if any failed 
exist.
- This job request i assume will be long, so please put todo action list, and use that as 
references. So i hope this request session will not be broken until all test was passed during `npm test`
