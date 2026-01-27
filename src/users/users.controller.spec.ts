import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserId = new Types.ObjectId().toString();
  const mockUserProfile = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    timezone: 'UTC',
    preferred_language: 'en',
    fast_goal_per_week: 3,
    notification_enabled: true,
    stats: {
      total_fasts: 10,
      completed_fasts: 7,
      remaining_fasts: 3,
      completion_rate: 70,
      current_streak: 2,
      longest_streak: 5,
      last_fast_date: '2026-01-25',
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-01-27T00:00:00.000Z',
  };

  const mockRequest = {
    user: {
      sub: mockUserId,
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findAll: jest.fn(),
            findUserById: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            getUserProfile: jest.fn(),
            updateUserProfile: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile with statistics', async () => {
      jest.spyOn(usersService, 'getUserProfile').mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUserProfile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return updated profile', async () => {
      const updateDto = {
        firstName: 'Jane',
        fast_goal_per_week: 4,
      };

      const updatedProfile = {
        ...mockUserProfile,
        firstName: 'Jane',
        fast_goal_per_week: 4,
      };

      jest.spyOn(usersService, 'updateUserProfile').mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith(mockUserId, updateDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        _id: new Types.ObjectId(mockUserId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
      };

      jest.spyOn(usersService, 'findUserById').mockResolvedValue(mockUser as any);

      const result = await controller.findOne(mockUserId);

      expect(result).toEqual(mockUser);
      expect(usersService.findUserById).toHaveBeenCalledWith(mockUserId);
    });
  });
});