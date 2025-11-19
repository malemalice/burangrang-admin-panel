import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ApprovedQuantitiesDto {
    [key: string]: number;
}

class IssuedQuantitiesDto {
    [key: string]: number;
}

export class UpdatePPEWithdrawalDto {
    @ApiProperty({ required: false, description: 'Approved quantities per item (for approval action)' })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => ApprovedQuantitiesDto)
    approvedQuantities?: Record<string, number>;

    @ApiProperty({ required: false, description: 'Issued quantities per item (for collect action)' })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => IssuedQuantitiesDto)
    issuedQuantities?: Record<string, number>;

    @ApiProperty({ required: false, description: 'User ID who collected the withdrawal' })
    @IsString()
    @IsOptional()
    collectedBy?: string;

    @ApiProperty({ required: false, description: 'Optional notes' })
    @IsString()
    @IsOptional()
    notes?: string;
}

