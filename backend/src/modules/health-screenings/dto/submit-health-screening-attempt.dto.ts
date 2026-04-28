import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class SubmitHealthScreeningAttemptDto {
  @ApiProperty({ description: 'Must be true: user declares answers are true' })
  @Equals(true)
  ackTruth!: boolean;

  @ApiProperty({
    description:
      'Must be true: user accepts possible disciplinary action for false statements',
  })
  @Equals(true)
  ackDiscipline!: boolean;
}
