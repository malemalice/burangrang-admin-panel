import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePPEStockItemDto } from './create-ppe-stock-item.dto';

export class CreatePPEStockDto {
    @ApiProperty({ description: 'Date when PPE was received' })
    @IsDateString()
    @IsNotEmpty()
    receivedDate: string;

    @ApiProperty({ required: false, description: 'Optional notes for the stock entry' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ type: [CreatePPEStockItemDto], description: 'List of PPE items in this stock entry' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePPEStockItemDto)
    items: CreatePPEStockItemDto[];
}

