import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthUserDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  role: string;

  constructor(partial: Partial<AuthUserDto>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  @ApiProperty()
  @Expose()
  accessToken: string;

  @ApiProperty()
  @Expose()
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto })
  @Expose()
  user: AuthUserDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
