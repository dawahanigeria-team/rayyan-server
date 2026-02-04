import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { HomeService } from './home.service';
import { User } from '../users/schemas/user.schema';
import { Saku } from '../saku/schemas/saku.schema';
import { YearBucketsService } from '../year-buckets/year-buckets.service';
import { FastsService } from '../fasts/fasts.service';
import { SunnahOpportunitiesService } from '../dashboard/services/sunnah-opportunities.service';
import { FastType } from '../fasts/schemas/fast.schema';

describe('HomeService', () => {
  let service: HomeService;
  let userModel: Model<any>;
  let sakuModel: Model<any>;
  let yearBucketsService: YearBucketsService;
  let fastsService: FastsService;
  let sunnahService: SunnahOpportunitiesService;

  const userId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Saku.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: YearBucketsService,
          useValue: {
            getLedgerSummary: jest.fn(),
            findAllByUser: jest.fn(),
            findMostUrgent: jest.fn(),
          },
        },
        {
          provide: FastsService,
          useValue: {
            getTodayFast: jest.fn(),
          },
        },
        {
          provide: SunnahOpportunitiesService,
          useValue: {
            getOpportunities: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    userModel = module.get<Model<any>>(getModelToken(User.name));
    sakuModel = module.get<Model<any>>(getModelToken(Saku.name));
    yearBucketsService = module.get<YearBucketsService>(YearBucketsService);
    fastsService = module.get<FastsService>(FastsService);
    sunnahService = module.get<SunnahOpportunitiesService>(SunnahOpportunitiesService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should build home dashboard response', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-04T08:00:00Z'));

    const mockUser = {
      _id: new Types.ObjectId(userId),
      firstName: 'Aisha',
      lastName: 'Ali',
    };

    const mockSaku = {
      inviteCode: 'ABC123',
      members: [{}, {}],
    };

    const mockYearBucket = {
      _id: new Types.ObjectId(),
      name: 'Ramadan 2024',
      hijriYear: 1445,
      totalDaysOwed: 20,
      completedDays: 13,
      isCompleted: false,
    };

    const mockFast = {
      _id: new Types.ObjectId(),
      type: FastType.QADA,
      createdAt: new Date('2026-02-04T05:00:00Z'),
    };

    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (sakuModel.findOne as jest.Mock).mockResolvedValue(mockSaku);
    (yearBucketsService.getLedgerSummary as jest.Mock).mockResolvedValue({
      totalRemaining: 7,
      totalCompleted: 13,
      totalOwed: 20,
      bucketCount: 1,
      completedBuckets: 0,
    });
    (yearBucketsService.findAllByUser as jest.Mock).mockResolvedValue([mockYearBucket]);
    (yearBucketsService.findMostUrgent as jest.Mock).mockResolvedValue(mockYearBucket);
    (fastsService.getTodayFast as jest.Mock).mockResolvedValue(mockFast);
    (sunnahService.getOpportunities as jest.Mock).mockImplementation((date?: Date) => {
      const iso = date?.toISOString().slice(0, 10);
      if (iso === '2026-02-04') {
        return [
          {
            type: 'white_days',
            name: 'White Days',
            description: '13th, 14th, 15th of this month',
            isToday: true,
          },
        ];
      }
      return [];
    });

    const result = await service.getDashboard(userId);

    expect(result.user).toEqual({ id: mockUser._id.toString(), name: 'Aisha' });
    expect(result.qadaBalance).toEqual({
      remaining: 7,
      totalMissed: 20,
      completed: 13,
      progress: 0.65,
      primaryYear: 'Ramadan 2024',
    });
    expect(result.circle).toEqual({
      hasCircle: true,
      memberCount: 2,
      inviteCode: 'ABC123',
    });
    expect(result.todayStatus).toEqual({
      isFasting: true,
      fastType: 'qada',
      loggedAt: mockFast.createdAt.toISOString(),
    });
    expect(result.yearBuckets[0]).toEqual({
      id: mockYearBucket._id.toString(),
      year: 'Ramadan 2024',
      hijriYear: 1445,
      totalDays: 20,
      completedDays: 13,
      missedDays: 7,
      progress: 0.65,
      isComplete: false,
    });
    expect(result.sunnahOpportunities[0]).toEqual({
      id: 'white_days',
      name: 'White Days',
      description: '13th, 14th, 15th of this month',
      daysCount: 1,
      dates: ['2026-02-04'],
      isActive: true,
    });
  });

  it('should throw NotFoundException when user is missing', async () => {
    (userModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.getDashboard(userId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
