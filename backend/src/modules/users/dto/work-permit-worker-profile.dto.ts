import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class WorkPermitWorkerProfileProfessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class WorkPermitWorkerProfilePermitCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class WorkPermitWorkerProfilePermitSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  company?: WorkPermitWorkerProfilePermitCompanyDto;
}

export class WorkPermitWorkerProfileQuizSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class WorkPermitWorkerProfileHealthScreeningDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  quizId: string;

  @ApiProperty({ required: false })
  quiz?: WorkPermitWorkerProfileQuizSummaryDto;
}

export class WorkPermitWorkerProfileAssignmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  idNumber?: string | null;

  @ApiProperty({ required: false, nullable: true })
  certificateUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  healthDeclarationUrl?: string | null;

  @ApiProperty({
    type: WorkPermitWorkerProfileProfessionDto,
    required: false,
    description: 'From the worker user profile (same for all assignments)',
  })
  profession?: WorkPermitWorkerProfileProfessionDto;

  @ApiProperty({ type: WorkPermitWorkerProfilePermitSummaryDto })
  workPermit: WorkPermitWorkerProfilePermitSummaryDto;

  @ApiProperty({
    required: false,
    nullable: true,
    type: WorkPermitWorkerProfileHealthScreeningDto,
  })
  healthScreening?: WorkPermitWorkerProfileHealthScreeningDto | null;
}

export class WorkPermitWorkerProfileResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: [WorkPermitWorkerProfileAssignmentDto] })
  assignments: WorkPermitWorkerProfileAssignmentDto[];
}
