# Information Management System

## Project Overview
This is an information management system with basic modules for user management, role management (with permissions), menu management, and office management master data. The system follows a modern web application architecture with separate frontend and backend services.

## Technical Stack

### Backend
- NestJS (Node.js framework)
- Prisma (ORM)
- REST API architecture
- Clean Code Architecture implementation

### Frontend
- React.js with Vite
- shadcn/ui components
- Clean Code Architecture implementation

## Core Features
1. User Management
   - User CRUD operations
   - User authentication and authorization
   - User profile management

2. Role Management
   - Role CRUD operations
   - Permission assignment
   - Role-based access control

3. Menu Management
   - Menu CRUD operations
   - Menu hierarchy management
   - Menu access control

4. Office Management (Master Data)
   - Office CRUD operations
   - Office hierarchy management
   - Office-related data management

## UI/UX Requirements
- Admin panel layout with side menu
- Confirmation alerts
- Toast notifications
- Pagination
- Column filtering
- Search functionality on index/table pages

## Architecture Requirements
- Clean Code Architecture implementation
- REST API communication between frontend and backend
- Proper error handling
- Input validation
- Security best practices

## Development Guidelines
1. Follow Clean Code principles
2. Implement proper error handling
3. Use TypeScript for type safety
4. Follow REST API best practices
5. Implement proper authentication and authorization
6. Use proper state management
7. Implement responsive design
8. Follow accessibility guidelines 


create information management system, consist of basic modul for user management, role management (with permissions inside it), menu management, and master data for office management. Layout will be like admin panel, with sidemenu. tech stack, separate frontend and backend, communicate using rest. backend use nest js with prisma as orm. frontend use react js with vite, ui/ux component use shadcn. Add also basic fitur for admin panel,like confirm alert, alert, notification using toast, pagination, column filter and search on index page/table page. Both need to implement clean code architecture. Do this first, put your understanding context inside prompt.md, to be used later for communication with you. Then create todo checklist of the feature, update the checklist if you had done build it. After finish, please check again for errors


create frontend boilerplate, store on frontend folder, use react vite, with shadcn/ui. layout was admin panel with sidemenu item, and main content. create dummy for login page, dashboard, user management, with implementation of basic function like add, edit, delete, pagination, column filter, search, alert dialog, toast notification, loading state. no need to connect to backend, just create dummy data.

please understand the requirements first, explain the problem and the fix step, then write the code if needed