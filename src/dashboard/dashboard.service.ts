import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Fast } from '../fasts/schemas/fast.schema';
import { Saku, SakuDocument } from '../saku/schemas/saku.schema';
import { SunnahOpportunitiesService, SunnahOpportunity } from './services/sunnah-opportunities.service';
import { YearBucketsService, YearBucketWithProgress, LedgerSummary } from '../year-buckets/year-buckets.service';
import { FastsService, FastStats } from '../fasts/fasts.service';

export interface DashboardData {
  greeting: {
    name: string;
    message: string;
  };
  today: {
    date: string;
    hijriDate: string;
    hasLoggedFast: boolean;
    todayFast: Fast | null;
  };
  qadaBalance: {
    totalRemaining: number;
    totalCompleted: number;
    featuredBucket: YearBucketWithProgress | null;
  };
  sunnahOpportunities: SunnahOpportunity[];
  sakuPreview: {
    hasSaku: boolean;
    sakuId?: string;
    sakuName?: string;
    memberCount?: number;
  };
  yearBuckets: YearBucketWithProgress[];
  stats: FastStats;
}

export interface SettingsData {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    initials: string;
    joinedDate: Date;
  };
  stats: FastStats;
  ledgerSummary: LedgerSummary;
  preferences: {
    timezone: string;
    language: string;
    theme: string;
    schoolOfThought: string;
    prayerCalculationMethod: string;
  };
  notifications: {
    enabled: boolean;
    whiteDays: boolean;
    shabanSprint: boolean;
    iftarReminder: boolean;
    mondayThursday: boolean;
  };
  privacy: {
    accountPrivacy: string;
    showProgressInSaku: boolean;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Saku.name) private readonly sakuModel: Model<SakuDocument>,
    private readonly sunnahService: SunnahOpportunitiesService,
    private readonly yearBucketsService: YearBucketsService,
    private readonly fastsService: FastsService,
  ) {}

  private getGreetingMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async getDashboard(userId: string): Promise<DashboardData> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get today's fast
    const todayFast = await this.fastsService.getTodayFast(userId);

    // Get ledger summary and year buckets
    const ledgerSummary = await this.yearBucketsService.getLedgerSummary(userId);
    const yearBuckets = await this.yearBucketsService.findIncompleteByUser(userId);
    const featuredBucket = await this.yearBucketsService.findMostUrgent(userId);

    // Get saku preview
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    // Get sunnah opportunities
    const sunnahOpportunities = this.sunnahService.getOpportunities();

    // Get stats
    const stats = await this.fastsService.getStats(userId);

    // Get Hijri date
    const hijriInfo = this.sunnahService.getCurrentHijriInfo();

    return {
      greeting: {
        name: user.firstName,
        message: this.getGreetingMessage(),
      },
      today: {
        date: this.formatDate(new Date()),
        hijriDate: hijriInfo.formatted,
        hasLoggedFast: !!todayFast,
        todayFast,
      },
      qadaBalance: {
        totalRemaining: ledgerSummary.totalRemaining,
        totalCompleted: ledgerSummary.totalCompleted,
        featuredBucket,
      },
      sunnahOpportunities,
      sakuPreview: {
        hasSaku: !!saku,
        sakuId: saku?._id.toString(),
        sakuName: saku?.name,
        memberCount: saku?.members.length,
      },
      yearBuckets,
      stats,
    };
  }

  async getSettings(userId: string): Promise<SettingsData> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await this.fastsService.getStats(userId);
    const ledgerSummary = await this.yearBucketsService.getLedgerSummary(userId);

    const initials = `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase();

    return {
      profile: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        initials,
        joinedDate: user.createdAt,
      },
      stats,
      ledgerSummary,
      preferences: {
        timezone: user.timezone || 'UTC',
        language: user.preferred_language || 'en',
        theme: user.theme || 'system',
        schoolOfThought: user.school_of_thought || 'hanafi',
        prayerCalculationMethod: user.prayer_calculation_method || 'mwl',
      },
      notifications: {
        enabled: user.notification_enabled ?? true,
        whiteDays: user.notify_white_days ?? true,
        shabanSprint: user.notify_shaban_sprint ?? true,
        iftarReminder: user.notify_iftar_reminder ?? true,
        mondayThursday: user.notify_monday_thursday ?? true,
      },
      privacy: {
        accountPrivacy: user.account_privacy || 'friends_only',
        showProgressInSaku: user.show_progress_in_saku ?? true,
      },
    };
  }

  async quickLogFast(userId: string, type: 'qada' | 'sunnah' = 'sunnah'): Promise<Fast> {
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    // Check if already logged today
    const existing = await this.fastsService.getTodayFast(userId);
    if (existing) {
      throw new Error('Fast already logged for today');
    }

    // Get the most urgent bucket if logging Qada
    let yearBucketId: string | undefined;
    if (type === 'qada') {
      const urgentBucket = await this.yearBucketsService.findMostUrgent(userId);
      yearBucketId = urgentBucket?._id.toString();
    }

    // Determine sunnah type based on today's opportunities
    const opportunities = this.sunnahService.getOpportunities();
    let sunnahType: string | undefined;
    if (type === 'sunnah' && opportunities.length > 0) {
      sunnahType = opportunities[0].type;
    }

    return this.fastsService.createFast(userId, {
      name: dateString,
      type: type as any,
      sunnahType: sunnahType as any,
      yearBucketId,
    });
  }
}
