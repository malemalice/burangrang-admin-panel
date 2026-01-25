import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
} from '@prisma/client';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';

export class IncidentInjuredPersonDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty({ required: false })
  @Expose()
  injuredPersonName?: string;

  @ApiProperty({ enum: GenderEnum, required: false })
  @Expose()
  gender?: GenderEnum;

  @ApiProperty({ enum: LevelOfInjuryEnum })
  @Expose()
  levelOfInjury: LevelOfInjuryEnum;

  @ApiProperty({ enum: InjuredBodyPartEnum })
  @Expose()
  injuredBodyPart: InjuredBodyPartEnum;

  @ApiProperty({ enum: TypeOfInjuryEnum })
  @Expose()
  typeOfInjury: TypeOfInjuryEnum;

  @ApiProperty({ enum: MechanismOfInjuryEnum })
  @Expose()
  mechanismOfInjury: MechanismOfInjuryEnum;

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

  constructor(partial: Partial<IncidentInjuredPersonDto>) {
    Object.assign(this, partial);
  }
}
