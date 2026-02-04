import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FastsController } from './fasts.controller';
import { FastsService } from './fasts.service';
import { Fast, FastSchema } from './schemas/fast.schema';
import { YearBucket, YearBucketSchema } from '../year-buckets/schemas/year-bucket.schema';
import { YearBucketsModule } from '../year-buckets/year-buckets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fast.name, schema: FastSchema },
      { name: YearBucket.name, schema: YearBucketSchema },
    ]),
    YearBucketsModule,
  ],
  controllers: [FastsController],
  providers: [FastsService],
  exports: [FastsService, MongooseModule],
})
export class FastsModule {}
