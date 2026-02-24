import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WeightReportItemDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() weightReportId: string;
  @ApiProperty() @Expose() wasteTypeId: string;
  @ApiProperty() @Expose() weight: number;
  @ApiProperty() @Expose() unit: string;
  @ApiProperty() @Expose() order: number;
  @ApiProperty({ required: false }) @Expose() notes?: string;
  @ApiProperty({ required: false }) @Expose() wasteType?: {
    id: string;
    name: string;
    code: string;
    wasteType: string;
  };

  constructor(partial: Partial<WeightReportItemDto>) {
    Object.assign(this, partial);
  }
}

export class WeightReportDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() reportCode: string;
  @ApiProperty() @Expose() sourceId: string;
  @ApiProperty() @Expose() storageLocationId: string;
  @ApiProperty() @Expose() reportDate: Date;
  @ApiProperty() @Expose() reportMonth: string;
  @ApiProperty() @Expose() reportYear: number;
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
  @ApiProperty({ required: false }) @Expose() source?: {
    id: string;
    name: string;
    code: string;
  };
  @ApiProperty({ required: false }) @Expose() storageLocation?: {
    id: string;
    name: string;
    code: string;
  };
  @ApiProperty({ required: false }) @Expose() submitter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  @ApiProperty({ required: false, type: [WeightReportItemDto] })
  @Expose()
  items?: WeightReportItemDto[];

  constructor(partial: Partial<WeightReportDto>) {
    Object.assign(this, partial);
  }
}
