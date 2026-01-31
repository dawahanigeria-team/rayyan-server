import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, UserProfileResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user', description: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  async getMe(@Request() req: any): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    return this.usersService.getUserProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user', description: 'Update the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Updated user profile' })
  async updateMe(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    return this.usersService.updateUserProfile(userId, updateProfileDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get profile (alias)', description: 'Alias for GET /users/me' })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    return this.usersService.getUserProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update profile (alias)', description: 'Alias for PATCH /users/me' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    return this.usersService.updateUserProfile(userId, updateProfileDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}