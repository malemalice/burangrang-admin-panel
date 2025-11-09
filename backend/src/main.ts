import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Enable CORS with multiple frontend domains
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origins,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  // trust proxy
  app.set('trust proxy', 1); // add this (or true) before the session middleware

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
      whitelist: true,
    }),
  );

  // Enable class-transformer serialization with safe options
  // CRITICAL: excludeExtraneousValues MUST be true to prevent serializing Prisma internals
  // This ensures only properties with @Expose() decorator are serialized
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      enableImplicitConversion: true,
      excludeExtraneousValues: true,  // ✅ Only serialize @Expose() properties
    }),
  );

  // Enable guards
  app.useGlobalGuards(new JwtAuthGuard(reflector));

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
