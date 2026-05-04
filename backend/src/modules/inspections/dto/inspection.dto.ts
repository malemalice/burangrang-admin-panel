import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { InspectionItemDto } from './inspection-item.dto';
import { InspectionInspectorDto } from './inspection-inspector.dto';
import { AreaDto } from 'src/modules/areas/dto/area.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class InspectionDto {
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
  inspectionDate: Date;

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

  @ApiProperty({ type: () => InspectionItemDto, isArray: true })
  @Expose()
  items: InspectionItemDto[];

  @ApiProperty({ type: () => InspectionInspectorDto, isArray: true })
  @Expose()
  inspectors: InspectionInspectorDto[];

  @ApiProperty({ required: false, nullable: true, description: 'Percentage of checklist items rated (0–100), null if no checklists attached' })
  @Expose()
  finalInspectionValue: number | null;

  constructor(partial: Partial<InspectionDto>) {
    Object.assign(this, partial);
  }
}
