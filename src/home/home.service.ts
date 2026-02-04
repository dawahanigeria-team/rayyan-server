import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Saku, SakuDocument } from '../saku/schemas/saku.schema';
import { YearBucketsService, YearBucketWithProgress } from '../year-buckets/year-buckets.service';
import { FastsService } from '../fasts/fasts.service';
import { SunnahOpportunitiesService, SunnahOpportunity } from '../dashboard/services/sunnah-opportunities.service';

export interface HomeDashboardData {
  user: {
    id: string;
    name?: string;
  };
  qadaBalance: {
    remaining: number;
    totalMissed: number;
    completed: number;
    progress: number;
    primaryYear: string;
  };
  sunnahOpportunities: Array<{
    id: string;
    name: string;
    description: string;
    daysCount: number;
    dates: string[];
    isActive: boolean;
  }>;
  circle: {
    hasCircle: boolean;
    memberCount?: number;
    inviteCode?: string;
  } | null;
  yearBuckets: Array<{
    id: string;
    year: string;
    hijriYear: number;
    totalDays: number;
    completedDays: number;
    missedDays: number;
    progress: number;
    isComplete: boolean;
  }>;
  todayStatus: {
    isFasting: boolean;
    fastType?: 'qada' | 'sunnah' | 'kaffarah' | 'nafl';
    loggedAt?: string;
  };
}

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Saku.name) private readonly sakuModel: Model<SakuDocument>,
    private readonly yearBucketsService: YearBucketsService,
    private readonly fastsService: FastsService,
    private readonly sunnahService: SunnahOpportunitiesService,
  ) {}

  async getDashboard(userId: string): Promise<HomeDashboardData> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [todayFast, ledgerSummary, yearBuckets, primaryBucket, saku] =
      await Promise.all([
        this.fastsService.getTodayFast(userId),
        this.yearBucketsService.getLedgerSummary(userId),
        this.yearBucketsService.findAllByUser(userId),
        this.yearBucketsService.findMostUrgent(userId),
        this.sakuModel.findOne({ 'members.user': new Types.ObjectId(userId) }),
      ]);

    const qadaProgress =
      ledgerSummary.totalOwed === 0
        ? 0
        : Number((ledgerSummary.totalCompleted / ledgerSummary.totalOwed).toFixed(2));

    return {
      user: {
        id: user._id.toString(),
        name: user.firstName || undefined,
      },
      qadaBalance: {
        remaining: ledgerSummary.totalRemaining,
        totalMissed: ledgerSummary.totalOwed,
        completed: ledgerSummary.totalCompleted,
        progress: qadaProgress,
        primaryYear: primaryBucket?.name ?? '',
      },
      sunnahOpportunities: this.buildSunnahOpportunities(),
      circle: saku
        ? {
            hasCircle: true,
            memberCount: saku.members.length,
            inviteCode: saku.inviteCode,
          }
        : { hasCircle: false },
      yearBuckets: this.mapYearBuckets(yearBuckets),
      todayStatus: todayFast
        ? {
            isFasting: true,
            fastType: todayFast.type,
            loggedAt: todayFast.createdAt.toISOString(),
          }
        : {
            isFasting: false,
          },
    };
  }

  private mapYearBuckets(buckets: YearBucketWithProgress[]) {
    return buckets.map((bucket) => {
      const totalDays = bucket.totalDaysOwed;
      const completedDays = bucket.completedDays;
      const missedDays = Math.max(0, totalDays - completedDays);
      const progress = totalDays === 0 ? 0 : Number((completedDays / totalDays).toFixed(2));

      return {
        id: bucket._id.toString(),
        year: bucket.name,
        hijriYear: bucket.hijriYear,
        totalDays,
        completedDays,
        missedDays,
        progress,
        isComplete: bucket.isCompleted,
      };
    });
  }

  private buildSunnahOpportunities(): HomeDashboardData['sunnahOpportunities'] {
    const startDate = new Date();
    const rangeDays = 30;
    const opportunitiesByType = new Map<
      string,
      { id: string; name: string; description: string; dates: string[]; isActive: boolean }
    >();

    for (let i = 0; i < rangeDays; i += 1) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const isoDate = checkDate.toISOString().slice(0, 10);

      const dayOpportunities = this.sunnahService.getOpportunities(checkDate);
      dayOpportunities.forEach((opportunity: SunnahOpportunity) => {
        const existing = opportunitiesByType.get(opportunity.type);
        const entry = existing ?? {
          id: opportunity.type,
          name: opportunity.name,
          description: opportunity.description,
          dates: [],
          isActive: false,
        };

        entry.dates.push(isoDate);
        if (i === 0) {
          entry.isActive = true;
        }

        opportunitiesByType.set(opportunity.type, entry);
      });
    }

    return Array.from(opportunitiesByType.values()).map((opportunity) => ({
      ...opportunity,
      daysCount: opportunity.dates.length,
    }));
  }
}
