import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  HasInjuredPersonEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
} from '@prisma/client';

export class CreateIncidentInjuredPersonDto {
  @IsNotEmpty()
  @IsEnum(HasInjuredPersonEnum)
  @ApiProperty({ enum: HasInjuredPersonEnum })
  hasInjuredPerson: HasInjuredPersonEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  injuredPersonName?: string;

  @IsEnum(GenderEnum)
  @IsOptional()
  @ApiProperty({ enum: GenderEnum, required: false })
  gender?: GenderEnum;

  @IsEnum(LevelOfInjuryEnum)
  @IsOptional()
  @ApiProperty({ enum: LevelOfInjuryEnum, default: 'NOT_SPECIFIED' })
  levelOfInjury?: LevelOfInjuryEnum;

  @IsEnum(InjuredBodyPartEnum)
  @IsOptional()
  @ApiProperty({ enum: InjuredBodyPartEnum, default: 'NOT_SPECIFIED' })
  injuredBodyPart?: InjuredBodyPartEnum;

  @IsEnum(TypeOfInjuryEnum)
  @IsOptional()
  @ApiProperty({ enum: TypeOfInjuryEnum, default: 'NOT_SPECIFIED' })
  typeOfInjury?: TypeOfInjuryEnum;

  @IsEnum(MechanismOfInjuryEnum)
  @IsOptional()
  @ApiProperty({ enum: MechanismOfInjuryEnum, default: 'NOT_SPECIFIED' })
  mechanismOfInjury?: MechanismOfInjuryEnum;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  departmentId?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
