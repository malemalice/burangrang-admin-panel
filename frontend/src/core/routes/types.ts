import { ComponentType } from 'react';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  children?: RouteConfig[];
  index?: boolean;
  layout?: ComponentType<any>;
}

/**
 * Module routes configuration
 */
export interface ModuleRoutes {
  path?: string;
  routes: RouteConfig[];
  layout?: ComponentType<any>;
} 