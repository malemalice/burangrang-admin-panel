import { ApiProperty } from '@nestjs/swagger';
import { CompliantStatusEnum, GeneralStatusEnum } from '@prisma/client';

export class AuditItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  auditId: string;

  @ApiProperty()
  auditCriteriaId: string;

  @ApiProperty({ enum: GeneralStatusEnum })
  status: GeneralStatusEnum;

  @ApiProperty({ enum: CompliantStatusEnum })
  compliantStatus: CompliantStatusEnum;

  @ApiProperty({ required: false })
  evidence?: string;

  @ApiProperty({ required: false })
  recommendation?: string;

  @ApiProperty({ required: false })
  actionRealization?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [String], required: false })
  departmentIds?: string[];

  @ApiProperty({ type: [String], required: false })
  userIds?: string[];

  @ApiProperty({ type: [Object], required: false })
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;

  constructor(partial: Partial<AuditItemDto>) {
    Object.assign(this, partial);
  }
}
