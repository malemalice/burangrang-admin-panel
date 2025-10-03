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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { Public } from '../../../shared/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';

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

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: { email: string; password: string },
    @Res() res: Response,
  ) {
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
  @UseGuards(JwtAuthGuard)
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
  async googleAuth(@Req() req: Request) {
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
        return res.status(401).json({ message: 'Google authentication failed' });
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
}
