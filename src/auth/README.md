# JWT Authentication Implementation

This document describes the JWT authentication implementation for the Rayyan Backend API.

## Overview

The JWT authentication system provides secure token-based authentication with the following components:

- **JWT Strategy**: Validates JWT tokens and extracts user information
- **JWT Guard**: Protects routes requiring authentication
- **Token Generation**: Creates JWT tokens during login/registration
- **User Extraction**: Decorator to easily access authenticated user data

## Components

### 1. JWT Strategy (`src/auth/strategies/jwt.strategy.ts`)

The JWT strategy handles token validation:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
```

**Features:**
- Extracts tokens from Authorization header (`Bearer <token>`)
- Validates token signature using JWT_SECRET
- Checks token expiration
- Validates user still exists in database
- Returns user object for request context

### 2. JWT Guard (`src/auth/guards/jwt-auth.guard.ts`)

Simple guard that uses the JWT strategy:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 3. Token Generation (`src/auth/auth.service.ts`)

Tokens are generated during login and registration:

```typescript
generateJwtToken(user: any): string {
  const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
  return this.jwtService.sign(payload);
}
```

**Token Payload Structure:**
```typescript
interface JwtPayload {
  sub: string;    // User ID
  email: string;  // User email
  iat?: number;   // Issued at (automatic)
  exp?: number;   // Expires at (automatic)
}
```

### 4. User Extraction Decorator (`src/auth/decorators/get-user.decorator.ts`)

Convenient decorator to extract authenticated user:

```typescript
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Module Configuration

The JWT module is configured in `src/auth/auth.module.ts`:

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET') || 'default-secret',
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
    },
  }),
  inject: [ConfigService],
})
```

## Usage Examples

### Protecting Individual Routes

```typescript
@Controller('api/resource')
export class ResourceController {
  
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtectedResource(@GetUser() user: User) {
    return { message: 'Protected data', userId: user._id };
  }

  @Get('public')
  getPublicResource() {
    return { message: 'Public data' };
  }
}
```

### Protecting Entire Controller

```typescript
@Controller('api/private')
@UseGuards(JwtAuthGuard)
export class PrivateController {
  
  @Get('data')
  getData(@GetUser() user: User) {
    return { data: 'private', user: user._id };
  }

  @Post('create')
  createResource(@GetUser() user: User, @Body() data: any) {
    // All routes in this controller are protected
    return this.service.create(user._id, data);
  }
}
```

### Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server creates JWT token with user ID and email
3. **Token Storage**: Client stores token (localStorage, cookies, etc.)
4. **Request Authentication**: Client sends token in Authorization header
5. **Token Validation**: Server validates token and extracts user
6. **Route Access**: User can access protected resources

### Request Format

```http
GET /api/protected/resource
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Features

1. **Token Expiration**: Tokens expire after configured time (default: 24h)
2. **Secret Management**: Uses environment variable for JWT secret
3. **User Validation**: Validates user still exists on each request
4. **Secure Headers**: Extracts token from Authorization header only
5. **Error Handling**: Returns 401 Unauthorized for invalid tokens

## Testing

The JWT authentication includes comprehensive tests:

- **Unit Tests**: `jwt.strategy.spec.ts` - Tests token validation logic
- **Service Tests**: `auth.service.spec.ts` - Tests token generation
- **Integration Tests**: End-to-end authentication flow testing

## Requirements Compliance

- **Requirement 1.6**: ✅ JWT tokens are validated and user identity extracted
- **Requirement 7.2**: ✅ Returns 401 Unauthorized for authentication failures

## Production Considerations

1. **Change JWT_SECRET**: Use a strong, unique secret in production
2. **Token Expiration**: Consider shorter expiration times for sensitive applications
3. **Token Refresh**: Implement refresh token mechanism for better UX
4. **Rate Limiting**: Add rate limiting to authentication endpoints
5. **Logging**: Log authentication events for security monitoring

## Next Steps

To use JWT authentication in your controllers:

1. Import `JwtAuthGuard` from `src/auth/guards/jwt-auth.guard`
2. Import `GetUser` decorator from `src/auth/decorators/get-user.decorator`
3. Add `@UseGuards(JwtAuthGuard)` to protected routes
4. Use `@GetUser() user: User` to access authenticated user data

Example implementation in fasts controller:

```typescript
@Controller('fasts')
@UseGuards(JwtAuthGuard)
export class FastsController {
  
  @Get()
  getUserFasts(@GetUser() user: User): Promise<Fast[]> {
    // No need for userId query parameter - get from JWT token
    return this.fastsService.getUserFasts(user._id.toString());
  }

  @Post()
  createFast(
    @GetUser() user: User,
    @Body() createFastDto: CreateFastDto,
  ): Promise<Fast> {
    return this.fastsService.createFast(user._id.toString(), createFastDto);
  }
}
```