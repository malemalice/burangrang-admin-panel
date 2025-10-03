import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  cors: {
    // Support multiple frontend domains
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : [
          'http://localhost:3000', // webapp frontend
          'http://localhost:5173', // webv2 frontend
          'http://localhost:3001', // additional frontend if needed
        ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
    ],
  },
}));
