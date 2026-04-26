import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class StartHealthScreeningDto {
  @ApiProperty({
    required: false,
    description: 'Published health questionnaire id; if omitted, uses latest published template',
  })
  @IsOptional()
  @IsUUID()
  quizId?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional worker profile id (`t_worker`) to link this declaration (e.g. work-permit context)',
  })
  @IsOptional()
  @IsUUID()
  workerId?: string;
}
