import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SendVerificationEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsUrl()
  verificationLink: string;

  constructor(partial: Partial<SendVerificationEmailDto>) {
    Object.assign(this, partial);
  }
}

export class SendPasswordResetEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsUrl()
  resetLink: string;

  constructor(partial: Partial<SendPasswordResetEmailDto>) {
    Object.assign(this, partial);
  }
}

export class SendTeamInvitationEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inviterName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  teamName: string;

  @ApiProperty()
  @IsUrl()
  invitationLink: string;

  constructor(partial: Partial<SendTeamInvitationEmailDto>) {
    Object.assign(this, partial);
  }
}

export class SendPasswordChangeEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  changedAt?: Date;

  constructor(partial: Partial<SendPasswordChangeEmailDto>) {
    Object.assign(this, partial);
  }
}

export class SendUserCreatedEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loginUrl: string;

  constructor(partial: Partial<SendUserCreatedEmailDto>) {
    Object.assign(this, partial);
  }
}

export class SendTemplatedEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Template code, e.g. verification, password-reset', type: String })
  @IsString()
  template: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ type: Object })
  context: Record<string, unknown>;

  constructor(partial: Partial<SendTemplatedEmailDto>) {
    Object.assign(this, partial);
  }
}


