import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: 'mockId',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue({
      _id: 'mockId',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
    select: jest.fn(),
  } as any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'john.doe@example.com';
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: email.toLowerCase() });
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const id = 'mockId';
      
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findUserById(id);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(id);
    });

    it('should return null for invalid id', async () => {
      const id = 'invalidId';
      
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Invalid ID')),
      });

      const result = await service.findUserById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const id = 'mockId';
      const updateData = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, ...updateData };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.updateUser(id, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const id = 'nonexistentId';
      const updateData = { firstName: 'Jane' };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateUser(id, updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
      };

      // Mock the constructor to return an object with save method
      const mockUserInstance = {
        ...createUserDto,
        save: jest.fn().mockResolvedValue(mockUser),
      };

      // Create a constructor function mock
      const MockUserConstructor = jest.fn().mockImplementation(() => mockUserInstance);

      // Replace the model with the constructor mock
      (service as any).userModel = MockUserConstructor;

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(MockUserConstructor).toHaveBeenCalledWith(createUserDto);
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
      };

      const mockUserInstance = {
        ...createUserDto,
        save: jest.fn().mockRejectedValue({ code: 11000, keyPattern: { email: 1 } }),
      };

      const MockUserConstructor = jest.fn().mockImplementation(() => mockUserInstance);
      (service as any).userModel = MockUserConstructor;

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.createUser(createUserDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const bcrypt = require('bcrypt');
      const password = 'Password123';
      const hashedPassword = 'hashedPassword123';

      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('validatePassword', () => {
    it('should validate password correctly', async () => {
      const bcrypt = require('bcrypt');
      const password = 'Password123';
      const hash = 'hashedPassword123';

      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validatePassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for invalid password', async () => {
      const bcrypt = require('bcrypt');
      const password = 'WrongPassword';
      const hash = 'hashedPassword123';

      bcrypt.compare.mockResolvedValue(false);

      const result = await service.validatePassword(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });

  describe('findUserWithPassword', () => {
    it('should find user with password field included', async () => {
      const email = 'john.doe@example.com';
      const userWithPassword = { ...mockUser, password: 'hashedPassword' };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(userWithPassword),
        }),
      });

      const result = await service.findUserWithPassword(email);

      expect(result).toEqual(userWithPassword);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: email.toLowerCase() });
    });
  });

  describe('findUserByGoogleId', () => {
    it('should find user by Google ID', async () => {
      const googleId = 'google123';

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findUserByGoogleId(googleId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ googleId });
    });
  });
});