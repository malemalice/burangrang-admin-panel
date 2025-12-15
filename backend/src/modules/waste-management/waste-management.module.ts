import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';

// Controllers
import {
  WasteSourcesController,
  WasteTypesController,
  TreatmentPlantsController,
  WaterQualityLabReportsController,
  WaterQualityParametersController,
  StorageLocationsController,
  MonthlyFlowReportsController,
  WeightReportsController,
  DispatchOrdersController,
} from './controllers';

// Services
import {
  WasteSourcesService,
  WasteTypesService,
  TreatmentPlantsService,
  WaterQualityLabReportsService,
  WaterQualityParametersService,
  StorageLocationsService,
  MonthlyFlowReportsService,
  WeightReportsService,
  DispatchOrdersService,
} from './services';

@Module({
  imports: [SharedModule],
  controllers: [
    WasteSourcesController,
    WasteTypesController,
    TreatmentPlantsController,
    WaterQualityLabReportsController,
    WaterQualityParametersController,
    StorageLocationsController,
    MonthlyFlowReportsController,
    WeightReportsController,
    DispatchOrdersController,
  ],
  providers: [
    WasteSourcesService,
    WasteTypesService,
    TreatmentPlantsService,
    WaterQualityLabReportsService,
    WaterQualityParametersService,
    StorageLocationsService,
    MonthlyFlowReportsService,
    WeightReportsService,
    DispatchOrdersService,
  ],
  exports: [
    WasteSourcesService,
    WasteTypesService,
    TreatmentPlantsService,
    WaterQualityLabReportsService,
    WaterQualityParametersService,
    StorageLocationsService,
    MonthlyFlowReportsService,
    WeightReportsService,
    DispatchOrdersService,
  ],
})
export class WasteManagementModule {}
