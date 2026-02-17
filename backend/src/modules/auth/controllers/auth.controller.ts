import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
  Logger,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { EmbedTokenService } from '../services/embed-token.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { Role } from '../../../shared/types/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { SignupDto } from '../dto/signup.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ForgotPasswordResponseDto } from '../dto/forgot-password-response.dto';
import { GenerateEmbedTokenDto } from '../dto/generate-embed-token.dto';
import { EmbedTokenResponseDto } from '../dto/embed-token-response.dto';
import {
  ValidateEmbedTokenRequestDto,
  ValidateEmbedTokenResponseDto,
} from '../dto/validate-embed-token.dto';
import { ConfigService } from '@nestjs/config';

// Create interface for the request with user property
interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
@ApiTags('Authentication')
@ApiBearerAuth()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly embedTokenService: EmbedTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description: 'Login successful',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      const result = await this.authService.login(user);
      return res.json(result);
    } catch (error) {
      this.logger.error(
        `Login failed for user: ${loginDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: { refreshToken: string },
    @Res() res: Response,
  ) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return res.json(result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('auth:logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    await this.authService.logout(req.user.sub);
    return res.json({ message: 'Logout successful' });
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // This endpoint initiates the Google OAuth flow
    // Passport will handle the redirect to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google OAuth successful' })
  @ApiResponse({ status: 401, description: 'Google OAuth failed' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;

      if (!user) {
        return res
          .status(401)
          .json({ message: 'Google authentication failed' });
      }

      // Generate JWT tokens for the authenticated user
      const result = await this.authService.login(user);

      // Redirect to frontend with tokens as query parameters
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    type: AuthResponseDto,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with this email already exists',
  })
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    try {
      const result = await this.authService.signup(signupDto);
      return res.json(result);
    } catch (error) {
      this.logger.error(
        `Signup failed for user: ${signupDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    type: ForgotPasswordResponseDto,
    description: 'Password reset link sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Res() res: Response) {
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      return res.json(result);
    } catch (error) {
      this.logger.error(
        `Forgot password failed for email: ${forgotPasswordDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password has been reset successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      return res.json(result);
    } catch (error) {
      this.logger.error(
        'Password reset failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Post('embed/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate embed token and URL (admin only)' })
  @ApiBody({ type: GenerateEmbedTokenDto })
  @ApiResponse({
    status: 200,
    type: EmbedTokenResponseDto,
    description: 'Embed URL generated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async generateEmbedToken(
    @Body() dto: GenerateEmbedTokenDto,
    @Res() res: Response,
  ) {
    const token = this.embedTokenService.generateToken({
      siteId: dto?.siteId,
    });
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173';
    const embedUrl = `${frontendUrl}?embed_token=${token}`;
    return res.json({ embedUrl });
  }

  @Post('embed/validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate embed token (public)' })
  @ApiBody({ type: ValidateEmbedTokenRequestDto })
  @ApiResponse({
    status: 200,
    type: ValidateEmbedTokenResponseDto,
    description: 'Token validation result',
  })
  async validateEmbedToken(
    @Body() dto: ValidateEmbedTokenRequestDto,
    @Res() res: Response,
  ) {
    const result = this.embedTokenService.validateToken(dto.embedToken);
    return res.json(result);
  }

  @Post('embed/session')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange valid embed token for JWT session (public)' })
  @ApiBody({ type: ValidateEmbedTokenRequestDto })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description: 'Embed session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid embed token or embed viewer unavailable' })
  async createEmbedSession(
    @Body() dto: ValidateEmbedTokenRequestDto,
    @Res() res: Response,
  ) {
    const { valid } = this.embedTokenService.validateToken(dto.embedToken);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid embed token' });
    }
    const embedViewerUser = await this.authService.getEmbedViewerUser();
    const result = await this.authService.login(embedViewerUser);
    return res.json(result);
  }
}
