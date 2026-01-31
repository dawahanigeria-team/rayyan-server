import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SakuService, SakuSummary } from '../saku/saku.service';
import { CreateCircleDto, JoinCircleDto } from './dto/create-circle.dto';
import { Saku } from '../saku/schemas/saku.schema';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Circles')
@ApiBearerAuth('JWT-auth')
@Controller('circles')
@UseGuards(JwtAuthGuard)
export class CirclesController {
  constructor(private readonly sakuService: SakuService) {}

  @Post()
  @ApiOperation({ summary: 'Create a circle', description: 'Create a new accountability circle (max 5 members)' })
  @ApiResponse({ status: 201, description: 'Circle created successfully' })
  @ApiResponse({ status: 400, description: 'User already in a circle' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createCircleDto: CreateCircleDto,
  ): Promise<Saku> {
    return this.sakuService.create(userId, createCircleDto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a circle', description: 'Join an existing circle using an invite code' })
  @ApiResponse({ status: 200, description: 'Successfully joined circle' })
  @ApiResponse({ status: 400, description: 'Invalid code, circle full, or already in a circle' })
  async join(
    @CurrentUser('sub') userId: string,
    @Body() joinCircleDto: JoinCircleDto,
  ): Promise<Saku> {
    return this.sakuService.join(userId, joinCircleDto);
  }

  @Get('my-circle')
  @ApiOperation({ summary: 'Get my circle', description: 'Get the current user\'s circle details and members' })
  @ApiResponse({ status: 200, description: 'Circle details with member statuses' })
  async getMyCircle(@CurrentUser('sub') userId: string): Promise<SakuSummary | null> {
    return this.sakuService.getSakuSummary(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get circle (alias)', description: 'Alias for GET /circles/my-circle' })
  @ApiResponse({ status: 200, description: 'Circle details' })
  async getCircle(@CurrentUser('sub') userId: string): Promise<Saku | null> {
    return this.sakuService.getMySaku(userId);
  }
}
