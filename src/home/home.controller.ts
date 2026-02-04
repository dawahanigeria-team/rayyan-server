import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HomeService, HomeDashboardData } from './home.service';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Home')
@ApiBearerAuth('JWT-auth')
@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get home dashboard data', description: 'Returns all data needed for the home screen in a single call' })
  @ApiResponse({ status: 200, description: 'Home dashboard data' })
  async getDashboard(@CurrentUser('sub') userId: string): Promise<HomeDashboardData> {
    return this.homeService.getDashboard(userId);
  }
}
