import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { FastsController } from './fasts.controller';
import { FastsService } from './fasts.service';
import { YearBucketsService } from '../year-buckets/year-buckets.service';
import { FastType } from './schemas/fast.schema';

describe('FastsController', () => {
  let controller: FastsController;
  let fastsService: FastsService;
  let yearBucketsService: YearBucketsService;

  const userId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FastsController],
      providers: [
        {
          provide: FastsService,
          useValue: {
            createFast: jest.fn(),
            getTodayFast: jest.fn(),
            deleteFast: jest.fn(),
          },
        },
        {
          provide: YearBucketsService,
          useValue: {
            getLedgerSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FastsController>(FastsController);
    fastsService = module.get<FastsService>(FastsService);
    yearBucketsService = module.get<YearBucketsService>(YearBucketsService);
  });

  it('should create a fast from ISO date and return updated balance', async () => {
    const fastId = new Types.ObjectId();
    const createdAt = new Date('2026-02-04T00:00:00Z');

    (fastsService.createFast as jest.Mock).mockResolvedValue({
      _id: fastId,
      type: FastType.QADA,
      createdAt,
    });

    (yearBucketsService.getLedgerSummary as jest.Mock).mockResolvedValue({
      totalRemaining: 7,
      totalCompleted: 13,
      totalOwed: 20,
      bucketCount: 1,
      completedBuckets: 0,
    });

    const result = await controller.createFast(userId, {
      type: FastType.QADA,
      date: '2026-02-04',
    } as any);

    expect(fastsService.createFast).toHaveBeenCalledWith(userId, {
      name: '04-02-2026',
      type: FastType.QADA,
      yearBucketId: undefined,
    });

    expect(result).toEqual({
      id: fastId.toString(),
      type: 'qada',
      date: '2026-02-04',
      createdAt: createdAt.toISOString(),
      updatedQadaBalance: {
        remaining: 7,
        progress: 0.65,
      },
    });
  });

  it('should return today fast status when logged', async () => {
    const fastId = new Types.ObjectId();
    const createdAt = new Date('2026-02-04T01:00:00Z');

    (fastsService.getTodayFast as jest.Mock).mockResolvedValue({
      _id: fastId,
      type: FastType.SUNNAH,
      createdAt,
    });

    const result = await controller.getTodayFast(userId);

    expect(result).toEqual({
      logged: true,
      fast: {
        id: fastId.toString(),
        type: 'sunnah',
        loggedAt: createdAt.toISOString(),
      },
    });
  });

  it('should delete a fast', async () => {
    (fastsService.deleteFast as jest.Mock).mockResolvedValue(true);

    await expect(controller.deleteFast(userId, 'fast-id')).resolves.toBeUndefined();
    expect(fastsService.deleteFast).toHaveBeenCalledWith('fast-id', userId);
  });
});
