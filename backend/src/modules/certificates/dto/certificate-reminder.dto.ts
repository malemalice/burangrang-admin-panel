import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CertificateReminderDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    certificateId: string;

    @ApiProperty({ required: false })
    @Expose()
    certificate?: any;

    @ApiProperty()
    @Expose()
    reminderDate: Date;

    @ApiProperty()
    @Expose()
    isSent: boolean;

    @ApiProperty({ required: false })
    @Expose()
    sentAt?: Date | null;

    @ApiProperty()
    @Expose()
    recipientId: string;

    @ApiProperty({ required: false })
    @Expose()
    recipient?: any;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    constructor(partial: Partial<CertificateReminderDto>) {
        Object.assign(this, partial);
    }
}

