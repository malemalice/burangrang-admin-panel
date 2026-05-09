import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { PermissionsGuard } from './shared/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './core/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const prismaService = app.get(PrismaService);

  // Enable CORS with multiple frontend domains
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origins,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  // Keep compatibility for both Zoho webhook routes when signature auth mode is enabled.
  // Nest rawBody option already captures body, this only normalizes string rawBody fallback.
  app.use(['/webhooks/zoho', '/integrations/zoho/webhook'], (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const rawBody = (req as express.Request & { rawBody?: Buffer | string }).rawBody;

    if (Buffer.isBuffer(rawBody)) {
      (req as express.Request & { rawBody?: string }).rawBody = rawBody.toString('utf8');
    }

    next();
  });

  // Use cookie parser
  app.use(cookieParser());

  // Configure session middleware for OAuth 2.0 + PKCE
  app.use(
    session({
      secret: configService.get('app.sessionSecret') || 'your-session-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable guards
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Information Management System API')
    .setDescription('The Information Management System API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
