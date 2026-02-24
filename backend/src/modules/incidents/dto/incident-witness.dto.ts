import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GenderEnum } from '@prisma/client';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';

export class IncidentWitnessDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty({ required: false })
  @Expose()
  witnessName?: string;

  @ApiProperty({ enum: GenderEnum, required: false })
  @Expose()
  gender?: GenderEnum;

  @ApiProperty({ required: false })
  @Expose()
  departmentId?: string;

  @ApiProperty({ type: () => DepartmentDto, required: false })
  @Expose()
  department?: DepartmentDto;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<IncidentWitnessDto>) {
    Object.assign(this, partial);
  }
}
