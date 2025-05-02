import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS with frontend URL from environment
  app.enableCors({
    // origin: [configService.get('FRONTEND_URL') || 'http://localhost:5173'],
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization'
  });

  // Use cookie parser
  app.use(cookieParser());

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
