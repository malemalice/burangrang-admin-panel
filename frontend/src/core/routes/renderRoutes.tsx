import React from 'react';
import { Route } from 'react-router-dom';
import { RouteConfig } from './types';
import MainLayout from '@/core/components/layout/MainLayout';
import { ProtectedRoute } from '@/core/lib/auth';

/**
 * Render route based on configuration
 */
const renderRoute = (route: RouteConfig, isProtected: boolean = true): React.ReactNode => {
  const Component = route.component;
  
  // For non-protected routes like login
  if (!isProtected) {
    return <Route key={route.path} path={route.path} element={<Component />} />;
  }

  // For protected routes, wrap with MainLayout and ProtectedRoute
  return (
    <Route
      key={route.path}
      path={route.path}
      element={
        <ProtectedRoute>
          <MainLayout>
            <Component />
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