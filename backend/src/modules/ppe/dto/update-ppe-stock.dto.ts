import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePPEStockDto {
    @ApiProperty({ required: false, description: 'Date when PPE was received' })
    @IsDateString()
    @IsOptional()
    receivedDate?: string;

    @ApiProperty({ required: false, description: 'Optional notes for the stock entry' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false, description: 'Whether the stock entry is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

