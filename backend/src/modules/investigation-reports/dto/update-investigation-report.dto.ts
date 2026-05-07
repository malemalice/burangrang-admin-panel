import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateInvestigationReportDto } from './create-investigation-report.dto';

export class UpdateInvestigationReportDto extends PartialType(
  OmitType(CreateInvestigationReportDto, ['incidentId'] as const),
) {}
