
# Information Management System - Project Understanding

## Project Overview
This project is an Information Management System for office management with a modern admin panel interface. It features user management, role-based access control with granular permissions, menu management, and master data for office management.

## Architecture
The system follows clean code architecture principles with:

- **Frontend**: React with Vite, shadcn UI components, and organized feature modules
- **Backend**: NestJS with Prisma ORM (to be implemented separately)
- **Communication**: REST API

## Core Features
1. **User Management**:
   - User CRUD operations
   - User profile management
   - Account activation/deactivation

2. **Role Management**:
   - Role creation and configuration
   - Permission assignment to roles
   - Role assignment to users

3. **Menu Management**:
   - Dynamic menu configuration
   - Menu item CRUD
   - Menu permission mapping

4. **Master Data Management**:
   - Office locations
   - Departments
   - Positions
   - Assets

5. **Admin Panel Features**:
   - Confirmation alerts
   - Toast notifications
   - Table pagination
   - Column filtering and search
   - Responsive design

## UI/UX Approach
- Professional sidebar layout
- Consistent design language using shadcn components
- Responsive design for all device sizes
- Intuitive navigation and data presentation

## Development Todos
- [x] Project setup and initial structure
- [x] Admin panel layout with sidebar
- [x] Dashboard page
- [x] User management module
- [x] Role management module  
- [x] Menu management module
- [x] Master data module
- [ ] API integration with backend
- [ ] Authentication and authorization
- [ ] Deployment and documentation

## Implementation Notes
- The frontend will use React Query for API data fetching and caching
- Form validations will use react-hook-form with zod schema validation
- State management will primarily use React Query with minimal local state
