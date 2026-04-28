import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ZohoTicketAddDataDto {
    @ApiProperty({ description: 'Zoho ticket ID' })
    @IsString()
    id: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    ticketNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    priority?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    departmentId?: string;
}
