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

    @ApiProperty({
        required: false,
        description: 'Zoho area value, mapped to HSE Area via zoho.incident.area_map',
    })
    @IsOptional()
    @IsString()
    area?: string;

    @ApiProperty({
        required: false,
        description:
            'Zoho risk category value, mapped to HSE RiskCategory via zoho.incident.risk_category_map',
    })
    @IsOptional()
    @IsString()
    riskCategory?: string;

    @ApiProperty({
        required: false,
        description:
            'Zoho incident type value, mapped to HSE IncidentTypeEnum via zoho.incident.incident_type_map',
    })
    @IsOptional()
    @IsString()
    incidentType?: string;

    @ApiProperty({
        required: false,
        description:
            'Zoho incident classification value, mapped to HSE IncidentClassificationEnum via zoho.incident.incident_classification_map',
    })
    @IsOptional()
    @IsString()
    incidentClassification?: string;
}
