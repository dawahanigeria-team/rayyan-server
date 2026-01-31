import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SakuService, SakuSummary } from './saku.service';
import { CreateSakuDto, JoinSakuDto, UpdatePrivacyDto, SendActionDto } from './dto';
import { Saku } from './schemas/saku.schema';
import { SakuAction } from './schemas/saku-action.schema';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Saku')
@ApiBearerAuth('JWT-auth')
@Controller('saku')
@UseGuards(JwtAuthGuard)
export class SakuController {
  constructor(private readonly sakuService: SakuService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new circle', description: 'Create a new accountability circle (max 5 members)' })
  @ApiResponse({ status: 201, description: 'Circle created successfully' })
  @ApiResponse({ status: 400, description: 'User already in a circle' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createSakuDto: CreateSakuDto,
  ): Promise<Saku> {
    return this.sakuService.create(userId, createSakuDto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a circle', description: 'Join an existing circle using an invite code' })
  @ApiResponse({ status: 200, description: 'Successfully joined circle' })
  @ApiResponse({ status: 400, description: 'Invalid code, circle full, or already in a circle' })
  async join(
    @CurrentUser('sub') userId: string,
    @Body() joinSakuDto: JoinSakuDto,
  ): Promise<Saku> {
    return this.sakuService.join(userId, joinSakuDto);
  }

  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave circle', description: 'Leave current circle. If owner, circle is deleted.' })
  @ApiResponse({ status: 204, description: 'Left circle successfully' })
  async leave(@CurrentUser('sub') userId: string): Promise<void> {
    return this.sakuService.leave(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my circle', description: 'Get the circle the current user belongs to' })
  @ApiResponse({ status: 200, description: 'Circle details or null if not in a circle' })
  async getMySaku(@CurrentUser('sub') userId: string): Promise<Saku | null> {
    return this.sakuService.getMySaku(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get circle summary', description: 'Get circle with member statuses based on privacy settings' })
  @ApiResponse({ status: 200, description: 'Circle summary with member fasting statuses' })
  async getSakuSummary(
    @CurrentUser('sub') userId: string,
  ): Promise<SakuSummary | null> {
    return this.sakuService.getSakuSummary(userId);
  }

  @Put('privacy')
  @ApiOperation({ summary: 'Update privacy settings', description: 'Update your privacy tier in the circle' })
  @ApiResponse({ status: 200, description: 'Privacy updated' })
  async updatePrivacy(
    @CurrentUser('sub') userId: string,
    @Body() updatePrivacyDto: UpdatePrivacyDto,
  ): Promise<Saku> {
    return this.sakuService.updatePrivacy(userId, updatePrivacyDto);
  }

  @Post('action')
  @ApiOperation({ summary: 'Send action', description: 'Send a nudge or dua request to circle members' })
  @ApiResponse({ status: 201, description: 'Action sent successfully' })
  async sendAction(
    @CurrentUser('sub') userId: string,
    @Body() sendActionDto: SendActionDto,
  ): Promise<SakuAction> {
    return this.sakuService.sendAction(userId, sendActionDto);
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get recent actions', description: 'Get recent nudges and dua requests in the circle' })
  @ApiResponse({ status: 200, description: 'List of recent actions' })
  async getRecentActions(
    @CurrentUser('sub') userId: string,
  ): Promise<SakuAction[]> {
    return this.sakuService.getRecentActions(userId);
  }

  @Delete('member/:memberId')
  @ApiOperation({ summary: 'Remove member', description: 'Remove a member from the circle (owner only)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Not authorized (not owner)' })
  async removeMember(
    @CurrentUser('sub') userId: string,
    @Param('memberId') memberId: string,
  ): Promise<Saku> {
    return this.sakuService.removeMember(userId, memberId);
  }

  @Post('regenerate-code')
  @ApiOperation({ summary: 'Regenerate invite code', description: 'Generate a new invite code (owner only)' })
  @ApiResponse({ status: 200, description: 'New invite code generated' })
  @ApiResponse({ status: 403, description: 'Not authorized (not owner)' })
  async regenerateInviteCode(@CurrentUser('sub') userId: string): Promise<Saku> {
    return this.sakuService.regenerateInviteCode(userId);
  }
}
