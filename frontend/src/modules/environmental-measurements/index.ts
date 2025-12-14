/**
 * Environmental Measurements Module
 * 
 * This module handles environmental measurement recording and management
 * for rooms, including lighting, noise, humidity, and temperature data.
 */

export * from './pages';
export * from './types/environmental-measurement.types';
export { default as environmentalMeasurementService } from './services/environmentalMeasurementService';
export { default as environmentalMeasurementRoutes } from './routes/environmentalMeasurementRoutes';
