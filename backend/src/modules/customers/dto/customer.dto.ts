import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { UserDto } from '../../users/dto/user.dto';

export class CustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Associated User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @Expose()
  phone?: string;

  @ApiProperty({ description: 'Address', required: false })
  @Expose()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @Expose()
  city?: string;

  @ApiProperty({ description: 'State', required: false })
  @Expose()
  state?: string;

  @ApiProperty({ description: 'Country', required: false })
  @Expose()
  country?: string;

  @ApiProperty({ description: 'Postal code', required: false })
  @Expose()
  postalCode?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Gender', required: false })
  @Expose()
  gender?: string;

  @ApiProperty({ description: 'Is customer active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Associated user information', required: false })
  @Expose()
  @Type(() => UserDto)
  @Transform(({ value }): UserDto | undefined => {
    if (!value) return undefined;
    // Ensure proper serialization of nested objects
    if (typeof value === 'object' && value !== null) {
      return new UserDto(value as Partial<UserDto>);
    }
    return value as UserDto;
  })
  user?: UserDto;

  constructor(partial: Partial<CustomerDto>) {
    Object.assign(this, partial);
  }
}
