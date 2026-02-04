import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Saku, SakuSchema } from '../saku/schemas/saku.schema';
import { YearBucketsModule } from '../year-buckets/year-buckets.module';
import { FastsModule } from '../fasts/fasts.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Saku.name, schema: SakuSchema },
    ]),
    YearBucketsModule,
    FastsModule,
    DashboardModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
