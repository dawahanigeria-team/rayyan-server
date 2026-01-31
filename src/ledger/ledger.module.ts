import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { FastsModule } from '../fasts/fasts.module';
import { YearBucketsModule } from '../year-buckets/year-buckets.module';

@Module({
  imports: [FastsModule, YearBucketsModule],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
