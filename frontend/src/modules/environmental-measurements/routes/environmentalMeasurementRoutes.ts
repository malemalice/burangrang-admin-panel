import { RouteConfig } from '@/core/routes/types';
import {
  EnvironmentalMeasurementsPage,
  CreateEnvironmentalMeasurementPage,
  EditEnvironmentalMeasurementPage,
} from '../pages';

/**
 * Environmental measurements module routes
 */
const environmentalMeasurementRoutes: RouteConfig[] = [
  {
    path: '/environmental-measurements',
    component: EnvironmentalMeasurementsPage,
  },
  {
    path: '/environmental-measurements/new',
    component: CreateEnvironmentalMeasurementPage,
  },
  {
    path: '/environmental-measurements/:id/edit',
    component: EditEnvironmentalMeasurementPage,
  },
];

export default environmentalMeasurementRoutes;
