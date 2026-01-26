import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import type { User } from '../../users/interfaces/user.interface';

/**
 * Example controller demonstrating how to use JWT authentication
 * This shows the proper way to protect routes and extract user information
 */
@Controller('protected')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class ProtectedResourceController {
  
  @Get('profile')
  getUserProfile(@GetUser() user: User) {
    // The user is automatically extracted from the JWT token
    // and injected into this parameter by the GetUser decorator
    return {
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  @Get('dashboard')
  getDashboard(@GetUser() user: User) {
    return {
      message: `Welcome to your dashboard, ${user.firstName}!`,
      userId: user._id,
    };
  }
}