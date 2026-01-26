import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import { GoogleProfile } from './strategies/google.strategy';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: 'user-id-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword123',
    toObject: jest.fn().mockReturnValue({
      _id: 'user-id-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    }),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findUserWithPassword: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByGoogleId: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          _id: 'user-id-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
      });
      expect(usersService.findUserWithPassword).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findUserWithPassword).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          _id: 'user-id-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedPassword123',
        },
      });
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.createUser).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      usersService.findUserByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user object when credentials are valid', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateUser('john.doe@example.com', 'password123');

      // Assert
      expect(result).toEqual({
        _id: 'user-id-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('john.doe@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      usersService.findUserWithPassword.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validateUser('john.doe@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateJwtToken', () => {
    it('should generate JWT token for user', () => {
      // Arrange
      const user = { _id: 'user-id-123', email: 'john.doe@example.com' };
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = service.generateJwtToken(user);

      // Assert
      expect(result).toBe('jwt-token-123');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user._id,
        email: user.email,
      });
    });
  });

  describe('handleGoogleAuth', () => {
    const mockGoogleProfile: GoogleProfile = {
      id: 'google-123',
      emails: [{ value: 'john.doe@example.com', verified: true }],
      name: {
        givenName: 'John',
        familyName: 'Doe',
      },
      photos: [{ value: 'https://example.com/photo.jpg' }],
      provider: 'google',
    };

    it('should authenticate existing user with Google ID', async () => {
      // Arrange
      usersService.findUserByGoogleId.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.handleGoogleAuth(mockGoogleProfile);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          _id: 'user-id-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedPassword123',
        },
      });
      expect(usersService.findUserByGoogleId).toHaveBeenCalledWith('google-123');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
    });

    it('should link Google account to existing user with same email', async () => {
      // Arrange
      usersService.findUserByGoogleId.mockResolvedValue(null);
      usersService.findUserByEmail.mockResolvedValue(mockUser as any);
      const updatedUser = { ...mockUser, googleId: 'google-123' };
      usersService.updateUser.mockResolvedValue(updatedUser as any);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.handleGoogleAuth(mockGoogleProfile);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          _id: 'user-id-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedPassword123',
          googleId: 'google-123',
        },
      });
      expect(usersService.findUserByGoogleId).toHaveBeenCalledWith('google-123');
      expect(usersService.findUserByEmail).toHaveBeenCalledWith('john.doe@example.com');
      expect(usersService.updateUser).toHaveBeenCalledWith(mockUser._id, { googleId: 'google-123' });
    });

    it('should create new user from Google profile', async () => {
      // Arrange
      usersService.findUserByGoogleId.mockResolvedValue(null);
      usersService.findUserByEmail.mockResolvedValue(null);
      const newUser = { ...mockUser, googleId: 'google-123' };
      usersService.createUser.mockResolvedValue(newUser as any);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.handleGoogleAuth(mockGoogleProfile);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          _id: 'user-id-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedPassword123',
          googleId: 'google-123',
        },
      });
      expect(usersService.createUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: expect.any(String),
        googleId: 'google-123',
      });
    });

    it('should throw UnauthorizedException when no email in Google profile', async () => {
      // Arrange
      const profileWithoutEmail: GoogleProfile = {
        ...mockGoogleProfile,
        emails: [],
      };

      // Act & Assert
      await expect(service.handleGoogleAuth(profileWithoutEmail)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});