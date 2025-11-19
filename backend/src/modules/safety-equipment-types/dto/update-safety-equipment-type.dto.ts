import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSafetyEquipmentTypeDto {
    @ApiProperty({
        required: false,
        description: 'The name of the safety equipment type',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        required: false,
        description: 'The unique code of the safety equipment type',
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({
        required: false,
        description: 'The description of the safety equipment type',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        required: false,
        description: 'Whether the safety equipment type is active',
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
    })
    isActive?: boolean;
}

