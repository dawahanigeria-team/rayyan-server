import { Injectable } from '@nestjs/common';
import { FastsService } from '../fasts/fasts.service';
import { YearBucketsService } from '../year-buckets/year-buckets.service';
import { LogFastDto, LedgerSummaryDto, LedgerFastType } from './dto/log-fast.dto';
import { FastType } from '../fasts/schemas/fast.schema';

@Injectable()
export class LedgerService {
  constructor(
    private readonly fastsService: FastsService,
    private readonly yearBucketsService: YearBucketsService,
  ) {}

  async getSummary(userId: string): Promise<LedgerSummaryDto> {
    // Get ledger summary from year buckets
    const ledgerSummary = await this.yearBucketsService.getLedgerSummary(userId);

    // Get fast stats
    const fastStats = await this.fastsService.getStats(userId);

    // Get most urgent bucket for featured display
    const urgentBucket = await this.yearBucketsService.findMostUrgent(userId);

    return {
      qadaBalance: ledgerSummary.totalRemaining,
      fastsCompleted: fastStats.totalFasts,
      currentYearBucket: urgentBucket ? {
        id: urgentBucket._id.toString(),
        name: urgentBucket.name,
        progress: urgentBucket.progressPercentage / 100, // Convert to 0-1 range
      } : null,
    };
  }

  async logFast(userId: string, dto: LogFastDto) {
    // Convert date format from YYYY-MM-DD to DD-MM-YYYY for the fasts service
    const [year, month, day] = dto.date.split('-');
    const fastName = `${day}-${month}-${year}`;

    // Map ledger fast type to fast type
    const fastType = dto.type ? this.mapLedgerTypeToFastType(dto.type) : FastType.NAFL;

    // If qada and no yearBucketId provided, try to auto-resolve
    let yearBucketId = dto.yearBucketId;
    if (dto.type === LedgerFastType.QADA && !yearBucketId) {
      const urgentBucket = await this.yearBucketsService.findMostUrgent(userId);
      yearBucketId = urgentBucket?._id.toString();
    }

    // Create the fast
    const fast = await this.fastsService.createFast(userId, {
      name: fastName,
      type: fastType,
      yearBucketId,
    });

    return fast;
  }

  async getFastHistory(userId: string, type?: LedgerFastType) {
    if (type) {
      const fastType = this.mapLedgerTypeToFastType(type);
      return this.fastsService.getFastsByType(userId, fastType);
    }
    return this.fastsService.getUserFasts(userId);
  }

  private mapLedgerTypeToFastType(ledgerType: LedgerFastType): FastType {
    const mapping: Record<LedgerFastType, FastType> = {
      [LedgerFastType.QADA]: FastType.QADA,
      [LedgerFastType.SUNNAH]: FastType.SUNNAH,
      [LedgerFastType.KAFFARAH]: FastType.KAFFARAH,
      [LedgerFastType.NAFL]: FastType.NAFL,
    };
    return mapping[ledgerType];
  }
}
