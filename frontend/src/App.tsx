import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import routes, { publicRoutes, notFoundRoute } from "./routes";
import { renderRoutes, renderRoute } from "./routes/renderRoutes";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * App wrapper with the needed providers
 */
const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

/**
 * Main application component
 */
const App = () => (
  <AppWrapper>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes (login) */}
          {renderRoutes(publicRoutes, false)}
          
          {/* Protected routes with layout */}
          {renderRoutes(routes)}
          
          {/* Not found route */}
          {renderRoute(notFoundRoute, false)}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </AppWrapper>
);

export default App;
