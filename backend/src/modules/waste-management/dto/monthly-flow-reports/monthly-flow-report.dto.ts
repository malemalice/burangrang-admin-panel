import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MonthlyFlowReportDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() reportCode: string;
  @ApiProperty() @Expose() treatmentPlantId: string;
  @ApiProperty() @Expose() reportMonth: string;
  @ApiProperty() @Expose() reportYear: number;
  @ApiProperty() @Expose() totalVolume: number;
  @ApiProperty() @Expose() averageDailyFlow: number;
  @ApiProperty({ required: false }) @Expose() peakFlow?: number;
  @ApiProperty({ required: false }) @Expose() minimumFlow?: number;
  @ApiProperty({ required: false }) @Expose() reportDocumentUrl?: string;
  @ApiProperty() @Expose() submittedBy: string;
  @ApiProperty() @Expose() submittedAt: Date;
  @ApiProperty({ required: false }) @Expose() receivedBy?: string;
  @ApiProperty({ required: false }) @Expose() receivedAt?: Date;
  @ApiProperty() @Expose() status: string;
  @ApiProperty({ required: false }) @Expose() reviewedBy?: string;
  @ApiProperty({ required: false }) @Expose() reviewedAt?: Date;
  @ApiProperty({ required: false }) @Expose() reviewNotes?: string;
  @ApiProperty({ required: false }) @Expose() archivedAt?: Date;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;
  @ApiProperty({ required: false }) @Expose() treatmentPlant?: {
    id: string;
    name: string;
    code: string;
  };
  @ApiProperty({ required: false }) @Expose() submitter?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  constructor(partial: Partial<MonthlyFlowReportDto>) {
    Object.assign(this, partial);
  }
}
