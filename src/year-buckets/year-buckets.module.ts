import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YearBucketsController } from './year-buckets.controller';
import { YearBucketsService } from './year-buckets.service';
import { YearBucket, YearBucketSchema } from './schemas/year-bucket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: YearBucket.name, schema: YearBucketSchema },
    ]),
  ],
  controllers: [YearBucketsController],
  providers: [YearBucketsService],
  exports: [YearBucketsService],
})
export class YearBucketsModule {}
