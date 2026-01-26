import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy, GoogleProfile } from './google.strategy';
import { AuthService } from '../auth.service';
import { AuthResponseDto } from '../dto';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'jwt-token-123',
    user: {
      _id: 'user-id-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

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

  beforeEach(async () => {
    const mockAuthService = {
      handleGoogleAuth: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'google.clientId': 'test-client-id',
          'google.clientSecret': 'test-client-secret',
          'google.callbackUrl': 'http://localhost:3000/api/auth/google/callback',
        };
        return config[key as keyof typeof config];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should successfully validate Google profile and return auth response', async () => {
      // Arrange
      authService.handleGoogleAuth.mockResolvedValue(mockAuthResponse);
      const done = jest.fn();

      // Act
      await strategy.validate('access-token', 'refresh-token', mockGoogleProfile, done);

      // Assert
      expect(authService.handleGoogleAuth).toHaveBeenCalledWith(mockGoogleProfile);
      expect(done).toHaveBeenCalledWith(null, mockAuthResponse);
    });

    it('should handle authentication errors and call done with error', async () => {
      // Arrange
      const error = new Error('Authentication failed');
      authService.handleGoogleAuth.mockRejectedValue(error);
      const done = jest.fn();

      // Act
      await strategy.validate('access-token', 'refresh-token', mockGoogleProfile, done);

      // Assert
      expect(authService.handleGoogleAuth).toHaveBeenCalledWith(mockGoogleProfile);
      expect(done).toHaveBeenCalledWith(error, false);
    });

    it('should handle profile with different structure', async () => {
      // Arrange
      const customProfile: GoogleProfile = {
        id: 'google-456',
        emails: [{ value: 'jane.smith@gmail.com', verified: true }],
        name: {
          givenName: 'Jane',
          familyName: 'Smith',
        },
        photos: [],
        provider: 'google',
      };

      const customAuthResponse: AuthResponseDto = {
        access_token: 'jwt-token-456',
        user: {
          _id: 'user-id-456',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@gmail.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      authService.handleGoogleAuth.mockResolvedValue(customAuthResponse);
      const done = jest.fn();

      // Act
      await strategy.validate('access-token', 'refresh-token', customProfile, done);

      // Assert
      expect(authService.handleGoogleAuth).toHaveBeenCalledWith(customProfile);
      expect(done).toHaveBeenCalledWith(null, customAuthResponse);
    });
  });
});