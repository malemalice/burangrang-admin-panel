# Information Management System

A modern web application for managing users, roles, menus, and offices. Built with NestJS (backend) and React + Vite (frontend).

## Features

- 🔐 User Authentication & Authorization
- 👥 User Management
- 🎭 Role-based Access Control
- 📑 Menu Management
- 🏢 Office Management
- 🎨 Modern UI with shadcn/ui
- 📱 Responsive Design

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v13 or higher)

## Project Structure

```
.
├── backend/         # NestJS backend application
├── frontend/        # React + Vite frontend application
└── README.md       # This file
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   JWT_SECRET="your-jwt-secret"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

The backend server will be running at `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be running at `http://localhost:5173`.

## Default Admin Account

After running migrations, a default admin account will be created:

```
Email: admin@example.com
Password: admin123
```

## API Documentation

The API documentation is available at `http://localhost:3000/api` when running the backend server.

## Available Scripts

### Backend

- `npm run start:dev` - Start the development server
- `npm run build` - Build the application
- `npm run start:prod` - Start the production server
- `npm run test` - Run tests
- `npm run lint` - Run linter

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm run preview` - Preview the production build
- `npm run lint` - Run linter

## Environment Variables

### Backend (.env)

| Variable      | Description           | Default Value |
|---------------|--------------------|---------------|
| DATABASE_URL  | PostgreSQL connection URL | - |
| JWT_SECRET   | Secret for JWT tokens | - |
| PORT         | Server port number | 3000 |

### Frontend (.env)

| Variable      | Description           | Default Value |
|---------------|--------------------|---------------|
| VITE_API_URL  | Backend API URL | http://localhost:3000 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 