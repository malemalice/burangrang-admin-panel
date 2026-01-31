import { RouteConfig } from '@/core/routes/types';

// Treatment Plants
import TreatmentPlantsPage from '../pages/treatment-plants/TreatmentPlantsPage';
import CreateTreatmentPlantPage from '../pages/treatment-plants/CreateTreatmentPlantPage';
import EditTreatmentPlantPage from '../pages/treatment-plants/EditTreatmentPlantPage';

// Water Quality Parameters
import WaterQualityParametersPage from '../pages/water-quality-parameters/WaterQualityParametersPage';
import CreateWaterQualityParameterPage from '../pages/water-quality-parameters/CreateWaterQualityParameterPage';
import EditWaterQualityParameterPage from '../pages/water-quality-parameters/EditWaterQualityParameterPage';

// Waste Types
import WasteTypesPage from '../pages/waste-types/WasteTypesPage';
import CreateWasteTypePage from '../pages/waste-types/CreateWasteTypePage';
import EditWasteTypePage from '../pages/waste-types/EditWasteTypePage';

// Waste Sources
import WasteSourcesPage from '../pages/waste-sources/WasteSourcesPage';
import CreateWasteSourcePage from '../pages/waste-sources/CreateWasteSourcePage';
import EditWasteSourcePage from '../pages/waste-sources/EditWasteSourcePage';

// Storage Locations
import StorageLocationsPage from '../pages/storage-locations/StorageLocationsPage';
import CreateStorageLocationPage from '../pages/storage-locations/CreateStorageLocationPage';
import StorageLocationDetailPage from '../pages/storage-locations/StorageLocationDetailPage';
import EditStorageLocationPage from '../pages/storage-locations/EditStorageLocationPage';

// Monthly Flow Reports
import MonthlyFlowReportsPage from '../pages/monthly-flow-reports/MonthlyFlowReportsPage';
import CreateMonthlyFlowReportPage from '../pages/monthly-flow-reports/CreateMonthlyFlowReportPage';
import EditMonthlyFlowReportPage from '../pages/monthly-flow-reports/EditMonthlyFlowReportPage';

// Water Quality Lab Reports
import WaterQualityLabReportsPage from '../pages/water-quality-lab-reports/WaterQualityLabReportsPage';
import CreateWaterQualityLabReportPage from '../pages/water-quality-lab-reports/CreateWaterQualityLabReportPage';
import EditWaterQualityLabReportPage from '../pages/water-quality-lab-reports/EditWaterQualityLabReportPage';

// Weight Reports
import WeightReportsPage from '../pages/weight-reports/WeightReportsPage';
import CreateWeightReportPage from '../pages/weight-reports/CreateWeightReportPage';
import EditWeightReportPage from '../pages/weight-reports/EditWeightReportPage';

// Dispatch Orders
import DispatchOrdersPage from '../pages/dispatch-orders/DispatchOrdersPage';
import CreateDispatchOrderPage from '../pages/dispatch-orders/CreateDispatchOrderPage';
import EditDispatchOrderPage from '../pages/dispatch-orders/EditDispatchOrderPage';
import DispatchOrderDetailPage from '../pages/dispatch-orders/DispatchOrderDetailPage';

/**
 * Waste Management module routes
 */
const wasteManagementRoutes: RouteConfig[] = [
  // Treatment Plants
  { path: '/waste-management/treatment-plants', component: TreatmentPlantsPage },
  { path: '/waste-management/treatment-plants/create', component: CreateTreatmentPlantPage },
  { path: '/waste-management/treatment-plants/:id/edit', component: EditTreatmentPlantPage },

  // Water Quality Parameters
  { path: '/waste-management/water-quality-parameters', component: WaterQualityParametersPage },
  { path: '/waste-management/water-quality-parameters/create', component: CreateWaterQualityParameterPage },
  { path: '/waste-management/water-quality-parameters/:id/edit', component: EditWaterQualityParameterPage },

  // Waste Types
  { path: '/waste-management/waste-types', component: WasteTypesPage },
  { path: '/waste-management/waste-types/create', component: CreateWasteTypePage },
  { path: '/waste-management/waste-types/:id/edit', component: EditWasteTypePage },

  // Waste Sources
  { path: '/waste-management/waste-sources', component: WasteSourcesPage },
  { path: '/waste-management/waste-sources/create', component: CreateWasteSourcePage },
  { path: '/waste-management/waste-sources/:id/edit', component: EditWasteSourcePage },

  // Storage Locations
  { path: '/waste-management/storage-locations', component: StorageLocationsPage },
  { path: '/waste-management/storage-locations/create', component: CreateStorageLocationPage },
  { path: '/waste-management/storage-locations/:id', component: StorageLocationDetailPage },
  { path: '/waste-management/storage-locations/:id/edit', component: EditStorageLocationPage },

  // Monthly Flow Reports (Waste Water Flow Recording)
  { path: '/waste-management/monthly-flow-reports', component: MonthlyFlowReportsPage },
  { path: '/waste-management/monthly-flow-reports/create', component: CreateMonthlyFlowReportPage },
  { path: '/waste-management/monthly-flow-reports/:id/edit', component: EditMonthlyFlowReportPage },

  // Water Quality Lab Reports
  { path: '/waste-management/water-quality-lab-reports', component: WaterQualityLabReportsPage },
  { path: '/waste-management/water-quality-lab-reports/create', component: CreateWaterQualityLabReportPage },
  { path: '/waste-management/water-quality-lab-reports/:id/edit', component: EditWaterQualityLabReportPage },

  // Weight Reports (Solid Waste Recording)
  { path: '/waste-management/weight-reports', component: WeightReportsPage },
  { path: '/waste-management/weight-reports/create', component: CreateWeightReportPage },
  { path: '/waste-management/weight-reports/:id/edit', component: EditWeightReportPage },

  // Dispatch Orders
  { path: '/waste-management/dispatch-orders', component: DispatchOrdersPage },
  { path: '/waste-management/dispatch-orders/create', component: CreateDispatchOrderPage },
  { path: '/waste-management/dispatch-orders/:id/edit', component: EditDispatchOrderPage },
  { path: '/waste-management/dispatch-orders/:id', component: DispatchOrderDetailPage },
];

export default wasteManagementRoutes;
