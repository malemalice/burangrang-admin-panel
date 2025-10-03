import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../core/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import * as crypto from 'crypto';
import { SignupDto } from '../dto/signup.dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<AuthenticatedUser> {
    this.logger.debug(`Attempting to validate user: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      this.logger.warn(`User not found with email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
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

    this.logger.debug(`User ${email} authenticated successfully`);
    const { password: _password, ...result } = user;
    return result as AuthenticatedUser;
  }

  async login(user: AuthenticatedUser) {
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: 3600 }); // 1 hour in seconds
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
    // Use a transaction to ensure atomicity and prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      // First, delete any existing refresh tokens for this user
      const deleteResult = await tx.refreshToken.deleteMany({
        where: { userId },
      });

      this.logger.debug(
        `Deleted ${deleteResult.count} existing refresh token(s) for user ${userId}`,
      );

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
        if (errorCode === 'P2002') {
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
      include: { user: { include: { role: true } } },
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

    this.logger.debug(
      `Deleted ${deleteResult.count} refresh token(s) for user ${user.id}`,
    );

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

  async logout(userId: string) {
    try {
      // Clear refresh token in database
      const deleteResult = await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });

      this.logger.debug(
        `Logged out user ${userId}, deleted ${deleteResult.count} refresh token(s)`,
      );

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
    this.logger.debug(`Attempting to signup user: ${signupDto.email}`);

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

    this.logger.debug(`User created successfully: ${user.email}`);

    // Create customer profile if phone is provided
    if (signupDto.phone) {
      await this.prisma.customer.create({
        data: {
          userId: user.id,
          phone: signupDto.phone,
        },
      });
    }

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
}
