import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Configure Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rayyan API')
    .setDescription(`
## Rayyan Fasting Tracker API

A comprehensive API for tracking Islamic fasting practices including:

- **Fasts**: Log daily fasts with types (Qada, Sunnah, Kaffarah, Nafl)
- **Year Buckets**: Track missed fasts by year with reason breakdown
- **Saku (Circles)**: Connect with accountability partners
- **Dashboard**: Aggregated view of fasting status and opportunities
- **Sunnah Opportunities**: Recommended fasting days based on Islamic calendar

### Authentication
All endpoints (except auth) require a valid JWT token in the Authorization header:
\`Authorization: Bearer <token>\`
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Fasts', 'Fast logging and tracking')
    .addTag('Year Buckets', 'Qada fast tracking by year')
    .addTag('Saku', 'Circles/accountability groups')
    .addTag('Dashboard', 'Aggregated dashboard data')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Rayyan API Documentation',
  });

  // Enable global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Configure global exception filter for error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure CORS for client access
  const allowedOrigins = configService.get('nodeEnv') === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200']
    : configService.get<string[]>('cors.origins') || [];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Set global prefix for API routes
  app.setGlobalPrefix('api/v1');

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
void bootstrap();
