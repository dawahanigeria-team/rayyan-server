import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStatsService } from './user-stats.service';
import { Fast } from '../../fasts/schemas/fast.schema';
import { User } from '../schemas/user.schema';

describe('UserStatsService', () => {
  let service: UserStatsService;
  let fastModel: Model<any>;
  let userModel: Model<any>;

  const mockUserId = new Types.ObjectId().toString();

  const mockFasts = [
    {
      _id: new Types.ObjectId(),
      name: '25-01-2026',
      status: true,
      user: new Types.ObjectId(mockUserId),
      toObject: () => ({ name: '25-01-2026', status: true }),
    },
    {
      _id: new Types.ObjectId(),
      name: '26-01-2026',
      status: true,
      user: new Types.ObjectId(mockUserId),
      toObject: () => ({ name: '26-01-2026', status: true }),
    },
    {
      _id: new Types.ObjectId(),
      name: '27-01-2026',
      status: false,
      user: new Types.ObjectId(mockUserId),
      toObject: () => ({ name: '27-01-2026', status: false }),
    },
  ];

  const mockUser = {
    _id: new Types.ObjectId(mockUserId),
    fast_goal_per_week: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatsService,
        {
          provide: getModelToken(Fast.name),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserStatsService>(UserStatsService);
    fastModel = module.get<Model<any>>(getModelToken(Fast.name));
    userModel = module.get<Model<any>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateUserStats', () => {
    it('should calculate user statistics correctly', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFasts),
      };

      jest.spyOn(fastModel, 'find').mockReturnValue(mockQuery as any);

      const result = await service.calculateUserStats(mockUserId);

      expect(result).toEqual({
        total_fasts: 3,
        completed_fasts: 2,
        remaining_fasts: 1,
        completion_rate: 67, // 2/3 * 100 rounded
        current_streak: 2,
        longest_streak: 2,
        last_fast_date: '2026-01-27',
      });

      expect(fastModel.find).toHaveBeenCalledWith({
        user: new Types.ObjectId(mockUserId),
      });
    });

    it('should handle empty fasts array', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(fastModel, 'find').mockReturnValue(mockQuery as any);

      const result = await service.calculateUserStats(mockUserId);

      expect(result).toEqual({
        total_fasts: 0,
        completed_fasts: 0,
        remaining_fasts: 0,
        completion_rate: 0,
        current_streak: 0,
        longest_streak: 0,
        last_fast_date: null,
      });
    });
  });

  describe('getUserFastingGoalProgress', () => {
    it('should calculate weekly goal progress', async () => {
      const mockUserQuery = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockFastQuery = {
        exec: jest.fn().mockResolvedValue(mockFasts.filter(f => f.status)),
      };

      jest.spyOn(userModel, 'findById').mockReturnValue(mockUserQuery as any);
      jest.spyOn(fastModel, 'find').mockReturnValue(mockFastQuery as any);

      const result = await service.getUserFastingGoalProgress(mockUserId);

      expect(result.weeklyGoal).toBe(3);
      expect(result.currentWeekCompleted).toBeGreaterThanOrEqual(0);
      expect(result.weekProgress).toBeGreaterThanOrEqual(0);
      expect(result.weekProgress).toBeLessThanOrEqual(100);
    });

    it('should use default goal when user not found', async () => {
      const mockUserQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      const mockFastQuery = {
        exec: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(userModel, 'findById').mockReturnValue(mockUserQuery as any);
      jest.spyOn(fastModel, 'find').mockReturnValue(mockFastQuery as any);

      const result = await service.getUserFastingGoalProgress(mockUserId);

      expect(result.weeklyGoal).toBe(2); // Default value
    });
  });
});