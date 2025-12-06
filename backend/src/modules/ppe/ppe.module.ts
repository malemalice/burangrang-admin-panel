import { Module } from '@nestjs/common';
import { PPEService } from './ppe.service';
import { PPEController } from './ppe.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
    imports: [PrismaModule, SharedModule],
    controllers: [PPEController],
    providers: [PPEService],
    exports: [PPEService],
})
export class PPEModule { }

