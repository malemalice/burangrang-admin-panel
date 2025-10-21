import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset link sent to your email',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Reset token for testing (only in development)',
    example: 'abc123def456ghi789',
    required: false,
  })
  @Expose()
  resetToken?: string;

  constructor(partial: Partial<ForgotPasswordResponseDto>) {
    Object.assign(this, partial);
  }
}
