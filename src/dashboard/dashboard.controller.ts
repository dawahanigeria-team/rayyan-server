import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DashboardService, DashboardData, SettingsData } from './dashboard.service';
import { SunnahOpportunitiesService, SunnahOpportunity, HijriDate } from './services/sunnah-opportunities.service';
import { Fast } from '../fasts/schemas/fast.schema';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly sunnahService: SunnahOpportunitiesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data', description: 'Get aggregated dashboard data including greeting, fast status, Qada balance, Sunnah opportunities, and circle preview' })
  @ApiResponse({ status: 200, description: 'Dashboard data for Today screen' })
  async getDashboard(@CurrentUser('sub') userId: string): Promise<DashboardData> {
    return this.dashboardService.getDashboard(userId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get settings data', description: 'Get user settings including fiqh preferences and privacy settings' })
  @ApiResponse({ status: 200, description: 'User settings data' })
  async getSettings(@CurrentUser('sub') userId: string): Promise<SettingsData> {
    return this.dashboardService.getSettings(userId);
  }

  @Post('quick-log')
  @ApiOperation({ summary: 'Quick log fast', description: 'Quickly log a fast for today with optional type' })
  @ApiBody({ schema: { properties: { type: { type: 'string', enum: ['qada', 'sunnah'], description: 'Optional fast type' } } } })
  @ApiResponse({ status: 201, description: 'Fast logged successfully' })
  @ApiResponse({ status: 400, description: 'Fast already logged for today' })
  async quickLogFast(
    @CurrentUser('sub') userId: string,
    @Body() body: { type?: 'qada' | 'sunnah' },
  ): Promise<Fast> {
    try {
      return await this.dashboardService.quickLogFast(userId, body.type);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('sunnah-opportunities')
  @ApiOperation({ summary: 'Get Sunnah opportunities', description: 'Get all Sunnah fasting opportunities for the current month' })
  @ApiResponse({ status: 200, description: 'List of Sunnah fasting opportunities' })
  async getSunnahOpportunities(): Promise<SunnahOpportunity[]> {
    return this.sunnahService.getOpportunities();
  }

  @Get('sunnah-upcoming')
  @ApiOperation({ summary: 'Get upcoming Sunnah opportunities', description: 'Get Sunnah opportunities for the next 7 days' })
  @ApiResponse({ status: 200, description: 'List of upcoming Sunnah opportunities' })
  async getUpcomingSunnahOpportunities(): Promise<SunnahOpportunity[]> {
    return this.sunnahService.getUpcomingOpportunities();
  }

  @Get('hijri-date')
  @ApiOperation({ summary: 'Get current Hijri date', description: 'Get the current Hijri (Islamic) date' })
  @ApiResponse({ status: 200, description: 'Current Hijri date with formatted string' })
  async getHijriDate(): Promise<{ date: HijriDate; formatted: string }> {
    return this.sunnahService.getCurrentHijriInfo();
  }
}
