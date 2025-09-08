import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../core/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    this.logger.debug(`Attempting to validate user: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      this.logger.warn(`User not found with email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User found, comparing password`);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User ${email} authenticated successfully`);
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any, res: Response) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    // Return both tokens in the response body instead of cookies
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

  async createRefreshToken(userId: string) {
    // First, delete any existing refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Add randomness to the token to ensure uniqueness
    const randomStr = crypto.randomBytes(32).toString('hex');

    const token = this.jwtService.sign(
      { sub: userId, random: randomStr },
      { expiresIn: '7d' },
    );

    try {
      await this.prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      this.logger.error(`Error creating refresh token: ${error.message}`);
      // In case of unique constraint error, try again with more randomness
      if (error.code === 'P2002') {
        const extraRandomStr = crypto.randomBytes(64).toString('hex');
        const newToken = this.jwtService.sign(
          { sub: userId, random: extraRandomStr, timestamp: Date.now() },
          { expiresIn: '7d' },
        );

        await this.prisma.refreshToken.create({
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
  }

  async refreshToken(body: { refreshToken?: string }, res: Response) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: body.refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { password: _, ...user } = refreshToken.user;
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
      role: user.role.name,
    });

    // Delete the used refresh token
    await this.prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });

    // Create new refresh token
    const newRefreshToken = await this.createRefreshToken(user.id);

    // Return both tokens in response body
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async logout(userId: string, res: Response) {
    // Clear refresh token in database
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { success: true };
  }
}
