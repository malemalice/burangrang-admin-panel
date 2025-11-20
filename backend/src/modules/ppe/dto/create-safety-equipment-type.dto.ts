import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSafetyEquipmentTypeDto {
    @ApiProperty({ description: 'The name of the safety equipment type' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'The unique code of the safety equipment type' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        required: false,
        description: 'The description of the safety equipment type',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        default: true,
        description: 'Whether the safety equipment type is active',
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
    })
    isActive?: boolean = true;
}

