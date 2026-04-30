import { RouteConfig } from '@/core/routes/types';
import HealthScreeningsPage from '../pages/HealthScreeningsPage';
import HealthScreeningFillPage from '../pages/HealthScreeningFillPage';
import HealthScreeningDetailPage from '../pages/HealthScreeningDetailPage';

const healthScreeningRoutes: RouteConfig[] = [
  { path: '/health-screenings', component: HealthScreeningsPage },
  { path: '/health-screenings/:id/fill', component: HealthScreeningFillPage },
  { path: '/health-screenings/:id', component: HealthScreeningDetailPage },
];

export default healthScreeningRoutes;
