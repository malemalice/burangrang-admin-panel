import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditReportCriteriaGroupDto {
  @ApiProperty() total: number;
  @ApiProperty() comply: number;
  @ApiProperty() notComplyMinor: number;
  @ApiProperty() notComplyMajor: number;
  @ApiProperty() notAssessed: number;
}

export class AuditReportElementDto {
  @ApiProperty() elementId: string;
  @ApiProperty() elementCode: string;
  @ApiProperty() elementName: string;
  @ApiProperty() hasAudit: boolean;
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) initial: AuditReportCriteriaGroupDto;
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) transitionLevel: AuditReportCriteriaGroupDto;
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) advanceLevel: AuditReportCriteriaGroupDto;
}

export class AuditReportSummaryDto {
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) initial: AuditReportCriteriaGroupDto;
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) transitionLevel: AuditReportCriteriaGroupDto;
  @ApiProperty({ type: AuditReportCriteriaGroupDto }) advanceLevel: AuditReportCriteriaGroupDto;
}

export class AuditReportPeriodDto {
  @ApiProperty() id: string;
  @ApiProperty() month: number;
  @ApiProperty() year: number;
}

export class AuditReportDto {
  @ApiPropertyOptional({ type: AuditReportPeriodDto, nullable: true })
  period: AuditReportPeriodDto | null;

  @ApiProperty({ type: [AuditReportElementDto] })
  elements: AuditReportElementDto[];

  @ApiProperty({ type: AuditReportSummaryDto })
  summary: AuditReportSummaryDto;
}
