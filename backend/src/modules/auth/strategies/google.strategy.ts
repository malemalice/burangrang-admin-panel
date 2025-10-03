import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  StrategyOptions,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/services/prisma.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('app.googleClientId');
    const clientSecret = configService.get<string>('app.googleClientSecret');
    const callbackURL = configService.get<string>('app.googleCallbackUrl');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Google OAuth configuration is missing. Please check your environment variables.',
      );
    }

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: false,
      // Enable PKCE for additional security
      pkce: true,
      // Enable state parameter for CSRF protection
      state: true,
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile;

    const email = emails?.[0]?.value;
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';

    if (!email) {
      return done(new Error('No email found in Google profile'), false);
    }

    try {
      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });

      if (!user) {
        // Get default role (USER role)
        const defaultRole = await this.prisma.role.findFirst({
          where: { name: 'User' },
        });

        if (!defaultRole) {
          return done(new Error('Default role not found'), false);
        }

        // Get default office
        const defaultOffice = await this.prisma.office.findFirst({
          where: { isActive: true },
        });

        if (!defaultOffice) {
          return done(new Error('Default office not found'), false);
        }

        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            roleId: defaultRole.id,
            officeId: defaultOffice.id,
            isActive: true,
            // No password for OAuth users
            password: null as any,
          },
          include: { role: true },
        });
      } else {
        // User exists - check if they have a password set
        if (user.password) {
          // User was registered manually with password, allow SSO login
          // Update profile if needed
          if (user.firstName !== firstName || user.lastName !== lastName) {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: {
                firstName,
                lastName,
              },
              include: { role: true },
            });
          }
        } else {
          // User was created via SSO before, update their profile if needed
          if (user.firstName !== firstName || user.lastName !== lastName) {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: {
                firstName,
                lastName,
              },
              include: { role: true },
            });
          }
        }
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const userPayload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      return done(null, userPayload);
    } catch (error) {
      return done(error, false);
    }
  }
}
