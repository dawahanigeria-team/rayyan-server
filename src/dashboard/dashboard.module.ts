import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SunnahOpportunitiesService } from './services/sunnah-opportunities.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Saku, SakuSchema } from '../saku/schemas/saku.schema';
import { YearBucketsModule } from '../year-buckets/year-buckets.module';
import { FastsModule } from '../fasts/fasts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Saku.name, schema: SakuSchema },
    ]),
    YearBucketsModule,
    FastsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, SunnahOpportunitiesService],
  exports: [DashboardService, SunnahOpportunitiesService],
})
export class DashboardModule {}
