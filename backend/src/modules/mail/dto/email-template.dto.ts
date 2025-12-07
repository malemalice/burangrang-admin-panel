import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmailTemplateDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  subjectTemplate: string;

  @ApiProperty()
  @Expose()
  bodyTemplate: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<EmailTemplateDto>) {
    Object.assign(this, partial);
  }
}


