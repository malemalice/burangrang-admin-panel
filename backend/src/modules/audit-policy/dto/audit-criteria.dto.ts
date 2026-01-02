import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuditCriteriaDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty()
  @Expose()
  auditClauseId: string;

  @ApiProperty({ enum: ['INITIAL', 'TRANSITION_LEVEL', 'ADVANCE_LEVEL'] })
  @Expose()
  transitionType: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<AuditCriteriaDto>) {
    Object.assign(this, partial);
  }
}
