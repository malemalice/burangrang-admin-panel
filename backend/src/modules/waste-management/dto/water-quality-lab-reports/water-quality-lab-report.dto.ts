import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WaterQualityLabReportDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() reportCode: string;
  @ApiProperty() @Expose() treatmentPlantId: string;
  @ApiProperty() @Expose() reportDate: Date;
  @ApiProperty() @Expose() preparedBy: string;
  @ApiProperty({ required: false }) @Expose() reportDocumentUrl?: string;
  @ApiProperty({ required: false }) @Expose() summary?: string;
  @ApiProperty({ required: false }) @Expose() recommendations?: string;
  @ApiProperty({ required: false }) @Expose() analystSignature?: string;
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
  @ApiProperty({ required: false }) @Expose() preparer?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  constructor(partial: Partial<WaterQualityLabReportDto>) {
    Object.assign(this, partial);
  }
}
