import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { MailService } from './mail.service';
import { SendTemplatedEmailDto } from './dto/mail.dto';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test sending a templated email (public endpoint)' })
  @ApiBody({ type: SendTemplatedEmailDto })
  @ApiResponse({ status: 200, description: 'Email queued/sent' })
  async testSend(@Body() dto: SendTemplatedEmailDto): Promise<{ ok: boolean }> {
    await this.mailService.sendTemplatedMail(dto);
    return { ok: true };
  }
}


