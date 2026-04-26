import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { WorkPermitsService } from './work-permits.service';
import { GenerateWorkPermitPublicLinkDto } from './dto/generate-work-permit-public-link.dto';
import { PublicWorkPermitLinkResponseDto } from './dto/public-work-permit-link-response.dto';
import { UpdateWorkPermitDto } from './dto/update-work-permit.dto';
import { SubmitWorkPermitDto } from './dto/submit-work-permit.dto';
import { SignSkWorkPermitDto } from './dto/sign-sk-work-permit.dto';
import { PublicWorkPermitByTokenResponseDto } from './dto/public-work-permit-by-token-response.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
  userContext?: any;
}

@ApiTags('work-permits')
@Controller('work-permits')
export class WorkPermitsPublicController {
  constructor(private readonly workPermitsService: WorkPermitsService) {}

  @Post('public-links')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('work-permit:update')
  @ApiOperation({
    summary: 'Generate a 24h anonymous applicant link for a work permit',
  })
  @ApiBody({ type: GenerateWorkPermitPublicLinkDto })
  async generatePublicLink(
    @Body() dto: GenerateWorkPermitPublicLinkDto,
    @Req() req: RequestWithUser,
  ): Promise<PublicWorkPermitLinkResponseDto> {
    return this.workPermitsService.generatePublicFillLink(
      dto,
      req.user.id,
      req.userContext,
    );
  }

  @Get('public/:token')
  @Public()
  @ApiOperation({
    summary: 'Get work permit detail for anonymous applicant flow (valid token, no login)',
  })
  async getPublicByToken(
    @Param('token') token: string,
  ): Promise<PublicWorkPermitByTokenResponseDto> {
    return this.workPermitsService.getPublicWorkPermitByToken(
      decodeURIComponent(token),
    );
  }

  @Patch('public/:token')
  @Public()
  @ApiOperation({
    summary: 'Update work permit in anonymous applicant flow (token)',
  })
  @ApiBody({ type: UpdateWorkPermitDto })
  async updatePublicByToken(
    @Param('token') token: string,
    @Body() dto: UpdateWorkPermitDto,
  ) {
    return this.workPermitsService.updatePublicWorkPermitByToken(
      decodeURIComponent(token),
      dto,
    );
  }

  @Post('public/:token/submit')
  @Public()
  @ApiOperation({
    summary: 'Submit work permit in anonymous applicant flow (token)',
  })
  @ApiBody({ type: SubmitWorkPermitDto })
  async submitPublicByToken(
    @Param('token') token: string,
    @Body() dto: SubmitWorkPermitDto,
  ) {
    return this.workPermitsService.submitPublicWorkPermitByToken(
      decodeURIComponent(token),
      dto,
    );
  }

  @Post('public/:token/sign-sk')
  @Public()
  @ApiOperation({
    summary:
      'Sign safety guideline (applicant) in anonymous flow — only WAITING_APPLICANT_SIGN (token)',
  })
  @ApiBody({ type: SignSkWorkPermitDto })
  async signSkPublicByToken(
    @Param('token') token: string,
    @Body() dto: SignSkWorkPermitDto,
  ) {
    return this.workPermitsService.signSkPublicWorkPermitByToken(
      decodeURIComponent(token),
      dto,
    );
  }
}

