import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity of items' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ 
    description: 'Custom price set by user (only valid if product allows free pricing)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

