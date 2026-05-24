> [← Backend TRD Index](./index.md)
>
> *Env config (`CORS_ORIGINS`, `JWT_SECRET`, `DATABASE_URL`), Dockerfile, production optimisations (helmet / compression / rate-limit), and `/health` + `/ready` endpoints.*

## Deployment Considerations

### 1. Environment Configuration

```typescript
// config/app.config.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    // Support multiple frontend domains
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',  // webapp frontend
          'http://localhost:5173',  // webv2 frontend
          'http://localhost:3001',  // additional frontend if needed
        ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  },
});
```

#### Environment Variables

```env
# CORS Configuration - Multiple Frontend Domains
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:3001,https://yourdomain.com"

# Production Example:
# CORS_ORIGINS="https://admin.soulyousee.com,https://app.soulyousee.com,https://soulyousee.com"
```

### 2. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 3. Production Optimizations

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'], // Disable debug logs in production
  });

  // Security headers
  app.use(helmet());

  // CORS configuration with multiple domains
  const corsConfig = configService.get('app.cors');
  app.enableCors({
    origin: corsConfig.origins,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  await app.listen(3000);
}
```

### 4. Health Checks and Monitoring

```typescript
// app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  async getReadiness(): Promise<object> {
    // Check database connection, external services, etc.
    return {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
```
