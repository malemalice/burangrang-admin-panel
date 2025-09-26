import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { RouteConfig } from './types';
import MainLayout from '@/core/components/layout/MainLayout';
import { ProtectedRoute } from '@/core/lib/auth';

/**
 * Loading component for Suspense fallback
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
  </div>
);

/**
 * Render route based on configuration
 */
const renderRoute = (route: RouteConfig, isProtected: boolean = true): React.ReactNode => {
  const Component = route.component;
  
  // For non-protected routes like login
  if (!isProtected) {
    return (
      <Route 
        key={route.path} 
        path={route.path} 
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Component />
          </Suspense>
        } 
      />
    );
  }

  // For protected routes, wrap with MainLayout and ProtectedRoute
  return (
    <Route
      key={route.path}
      path={route.path}
      element={
        <ProtectedRoute>
          <MainLayout>
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          </MainLayout>
        </ProtectedRoute>
      }
    />
  );
};

/**
 * Render multiple routes from configuration
 */
const renderRoutes = (routes: RouteConfig[], isProtected: boolean = true): React.ReactNode[] => 
  routes.map((route) => renderRoute(route, isProtected));

export { renderRoute, renderRoutes }; 