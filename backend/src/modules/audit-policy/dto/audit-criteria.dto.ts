import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AuditClauseDto } from './audit-clause.dto';
import { AuditElementDto } from './audit-element.dto';

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

  @ApiProperty({ required: false, type: AuditClauseDto })
  @Expose()
  auditClause?: AuditClauseDto & {
    auditElement?: AuditElementDto;
  };

  constructor(partial: Partial<AuditCriteriaDto>) {
    Object.assign(this, partial);
  }
}
