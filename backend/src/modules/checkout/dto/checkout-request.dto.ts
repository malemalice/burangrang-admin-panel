import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemDto } from './cart-item.dto';

export class CheckoutRequestDto {
  // Customer Information
  @ApiProperty({ description: 'Customer email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Customer first name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ required: false, description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  // Cart Items
  @ApiProperty({ type: [CartItemDto], description: 'Cart items to purchase' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  // Payment Information
  @ApiProperty({
    description: 'Payment method code (e.g., QRIS, OVO, DANA, BCA)',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodCode: string;
}
