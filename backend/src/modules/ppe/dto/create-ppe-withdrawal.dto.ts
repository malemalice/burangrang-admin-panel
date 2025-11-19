import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePPEWithdrawalItemDto } from './create-ppe-withdrawal-item.dto';

export class CreatePPEWithdrawalDto {
    @ApiProperty({ description: 'Date of withdrawal request' })
    @IsDateString()
    @IsNotEmpty()
    withdrawalDate: string;

    @ApiProperty({ required: false, description: 'User ID for whom PPE is requested (optional if using requestedForName)' })
    @IsUUID()
    @IsOptional()
    requestedFor?: string;

    @ApiProperty({ required: false, description: 'Name of person for whom PPE is requested (if not a user)' })
    @IsString()
    @IsOptional()
    requestedForName?: string;

    @ApiProperty({ description: 'Department ID of requester' })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;

    @ApiProperty({ required: false, description: 'Job position ID (optional if using jobPositionName)' })
    @IsUUID()
    @IsOptional()
    jobPositionId?: string;

    @ApiProperty({ required: false, description: 'Job position name (if not from master data)' })
    @IsString()
    @IsOptional()
    jobPositionName?: string;

    @ApiProperty({ required: false, description: 'URL to withdrawal letter document' })
    @IsString()
    @IsOptional()
    withdrawalLetterUrl?: string;

    @ApiProperty({ required: false, description: 'Optional notes' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ type: [CreatePPEWithdrawalItemDto], description: 'List of PPE items to withdraw' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePPEWithdrawalItemDto)
    items: CreatePPEWithdrawalItemDto[];
}

