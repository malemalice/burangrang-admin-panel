import { ApiProperty } from '@nestjs/swagger';
import { CompliantStatusEnum, GeneralStatusEnum } from '@prisma/client';

export class AuditResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  auditId: string;

  @ApiProperty()
  auditScheduleCode: string;

  @ApiProperty()
  auditElement: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty()
  auditClause: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty()
  auditCriteria: {
    id: string;
    name: string;
    code: string;
  };

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

  constructor(partial: Partial<AuditResultDto>) {
    Object.assign(this, partial);
  }
}
