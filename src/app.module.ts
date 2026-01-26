import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { LoggingMiddleware } from './common';
import { UsersModule } from './users';
import { FastsModule } from './fasts';
import { AuthModule } from './auth';
import configuration from './config/configuration';
import { EnvironmentVariables } from './config/validation';
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (config: Record<string, unknown>) => {
        const validatedConfig = plainToClass(EnvironmentVariables, config, {
          enableImplicitConversion: true,
        });
        const errors = validateSync(validatedConfig, {
          skipMissingProperties: false,
        });

        if (errors.length > 0) {
          throw new Error(errors.toString());
        }
        return validatedConfig;
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    FastsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Configure request logging middleware for all routes
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');
  }
}
