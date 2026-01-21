import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { AreaDto } from 'src/modules/areas/dto/area.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class AuditElementDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  constructor(partial: Partial<AuditElementDto>) {
    Object.assign(this, partial);
  }
}

export class AuditScheduleDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty({ type: [String], description: 'Array of area IDs' })
  @Expose()
  areaIds: string[];

  @ApiProperty({ type: [AreaDto], description: 'Array of areas' })
  @Expose()
  areas: AreaDto[];

  @ApiProperty()
  @Expose()
  auditDate: Date;

  @ApiProperty()
  @Expose()
  auditElementId: string;

  @ApiProperty({ type: AuditElementDto })
  @Expose()
  auditElement: AuditElementDto;

  @ApiProperty({ enum: GeneralStatusEnum })
  @Expose()
  status: GeneralStatusEnum;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  creator: UserDto;

  @ApiProperty({ type: [UserDto], description: 'Array of auditors' })
  @Expose()
  auditors: UserDto[];

  constructor(partial: Partial<AuditScheduleDto>) {
    Object.assign(this, partial);
  }
}
