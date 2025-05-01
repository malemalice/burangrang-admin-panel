# Office Nexus System - Frontend

This is the frontend application for the Office Nexus System, built with React, Vite, TypeScript, and Shadcn UI components.

## Tech Stack

- **React 18** - A JavaScript library for building user interfaces
- **Vite** - Next generation frontend tooling
- **TypeScript** - JavaScript with syntax for types
- **Tailwind CSS** - A utility-first CSS framework
- **Shadcn UI** - Beautifully designed components built with Radix UI and Tailwind CSS
- **Lucide Icons** - Beautiful & consistent icons
- **React Router DOM** - Declarative routing for React
- **React Query** - Data fetching and state management library
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

## Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd <repository-name>/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) to view the application in your browser

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run build:dev` - Builds the app with development mode
- `npm run lint` - Runs the linter
- `npm run preview` - Locally preview the production build

## Project Structure

```
frontend/
├── public/            # Static files
├── src/
│   ├── components/    # Reusable components
│   │   └── ui/        # UI components from shadcn
│   ├── lib/           # Utility functions and hooks
│   ├── pages/         # Page components
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Application entry point
├── .eslintrc.js       # ESLint configuration
├── index.html         # HTML template
├── package.json       # Dependencies and scripts
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

## Features

- Modern and responsive UI built with Tailwind CSS
- Component library built with Radix UI primitives
- Type-safe code with TypeScript
- Fast development and build times with Vite
- Efficient data fetching with React Query
- Form validation with React Hook Form and Zod

## Best Practices

- Follow the established code style and structure
- Create reusable components
- Use TypeScript types for all props and state
- Use React Query for data fetching
- Use React Hook Form for form handling
- Keep components small and focused on a single responsibility

## License

[MIT](LICENSE)
