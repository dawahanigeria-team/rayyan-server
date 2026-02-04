import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { LoggingMiddleware } from './common';
import { UsersModule } from './users';
import { FastsModule } from './fasts';
import { AuthModule } from './auth';
import { MailModule } from './mail';
import { YearBucketsModule } from './year-buckets';
import { SakuModule } from './saku';
import { DashboardModule } from './dashboard';
import { LedgerModule } from './ledger';
import { CirclesModule } from './circles';
import { HomeModule } from './home';
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
    MailModule,
    AuthModule,
    UsersModule,
    FastsModule,
    YearBucketsModule,
    SakuModule,
    DashboardModule,
    LedgerModule,
    CirclesModule,
    HomeModule,
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
