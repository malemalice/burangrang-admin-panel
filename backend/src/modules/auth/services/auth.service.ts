import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import * as crypto from 'crypto';
import { SignupDto } from '../dto/signup.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PRISMA_ERROR_CODES } from '../../../shared/constants/prisma-errors';
import { MailService } from '../../mail/mail.service';

interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions?: { name: string }[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: { select: { name: true } } } } },
    });

    if (!user) {
      this.logger.warn(`User not found with email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${email}`);
      throw new UnauthorizedException('Account is inactive. Please contact administrator.');
    }

    if (!user.password) {
      this.logger.error(`User ${email} has no password set`);
      throw new UnauthorizedException('Invalid credentials');
    }

    let isPasswordValid: boolean;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      isPasswordValid = await bcrypt.compare(plainPassword, user.password);
    } catch (error) {
      this.logger.error(
        'Error comparing password',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _password, ...result } = user;
    return result as AuthenticatedUser;
  }

  async login(user: AuthenticatedUser) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: 3600 }); // 1 hour in seconds
    const refreshToken = await this.createRefreshToken(user.id);

    const permissionNames =
      user.role.permissions?.map((p) => p.name) ?? [];

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: permissionNames,
      },
    };
  }

  async createRefreshToken(userId: string) {
    // Use a transaction to ensure atomicity and prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      // First, delete any existing refresh tokens for this user
      const deleteResult = await tx.refreshToken.deleteMany({
        where: { userId },
      });


      // Add randomness to the token to ensure uniqueness
      const randomStr = crypto.randomBytes(32).toString('hex');

      const token = this.jwtService.sign(
        { sub: userId, random: randomStr },
        { expiresIn: '7d' },
      );

      try {
        await tx.refreshToken.create({
          data: {
            token,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Error creating refresh token: ${errorMessage}`);
        
        // In case of unique constraint error, try again with more randomness
        const errorCode =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code: unknown }).code)
            : '';
        if (errorCode === PRISMA_ERROR_CODES.UNIQUE_VIOLATION) {
          this.logger.warn(
            `Token collision detected for user ${userId}, generating new token with extra randomness`,
          );
          
          const extraRandomStr = crypto.randomBytes(64).toString('hex');
          const newToken = this.jwtService.sign(
            { sub: userId, random: extraRandomStr, timestamp: Date.now() },
            { expiresIn: '7d' },
          );

          await tx.refreshToken.create({
            data: {
              token: newToken,
              userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });

          return newToken;
        }
        throw error;
      }

      return token;
    });
  }

  async refreshToken(body: { refreshToken?: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: body.refreshToken },
      include: {
        user: {
          include: {
            role: { include: { permissions: { select: { name: true } } } },
          },
        },
      },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...user } = refreshToken.user;
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
      role: user.role.name,
    }, { expiresIn: 3600 }); // 1 hour in seconds

    // Delete the used refresh token using deleteMany to avoid race condition errors
    // This won't throw an error if the record doesn't exist (P2025)
    const deleteResult = await this.prisma.refreshToken.deleteMany({
      where: { id: refreshToken.id },
    });


    // Create new refresh token
    const newRefreshToken = await this.createRefreshToken(user.id);

    const permissionNames =
      user.role.permissions?.map((p) => p.name) ?? [];

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: permissionNames,
      },
    };
  }

  async logout(userId: string) {
    try {
      // Clear refresh token in database
      const deleteResult = await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });


      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error during logout for user ${userId}: ${errorMessage}`,
      );
      
      // Don't throw error for logout - it should always succeed
      // even if token deletion fails
      return { success: true };
    }
  }

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      this.logger.warn(`User already exists with email: ${signupDto.email}`);
      throw new ConflictException('User with this email already exists');
    }

    // Get default role (User role)
    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'User' },
    });

    if (!defaultRole) {
      this.logger.error('Default role "User" not found');
      throw new BadRequestException('Default role not found');
    }

    // Get default office
    const defaultOffice = await this.prisma.office.findFirst({
      where: { isActive: true },
    });

    if (!defaultOffice) {
      this.logger.error('No active office found');
      throw new BadRequestException('No active office found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        password: hashedPassword,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        roleId: defaultRole.id,
        officeId: defaultOffice.id,
        isActive: true,
      },
      include: { role: true },
    });

    // Generate JWT tokens
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: 3600 }); // 1 hour
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      this.logger.warn(`Password reset requested for OAuth-only user: ${email}`);
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in database
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        email: user.email,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send password reset email (non-blocking failure)
    try {
      await this.mailService.sendPasswordResetEmail({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        resetLink: resetUrl,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to send reset email to ${email}: ${errorMessage}`);
    }

    return {
      message: 'Password reset link sent to your email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find the reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      this.logger.warn(`Invalid password reset token attempted: ${token}`);
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      this.logger.warn(`Expired password reset token attempted: ${token}`);
      // Clean up expired token
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is already used
    if (resetToken.isUsed) {
      this.logger.warn(`Already used password reset token attempted: ${token}`);
      throw new BadRequestException('Reset token has already been used');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await this.prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { isUsed: true },
      });
    });

    this.logger.log(`Password reset successful for user: ${resetToken.email}`);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
