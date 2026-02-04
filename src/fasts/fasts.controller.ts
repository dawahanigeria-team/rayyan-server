import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FastsService } from './fasts.service';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto, CreateFastRequestDto } from './dto';
import { Fast, FastType } from './schemas/fast.schema';
import { ResourceNotFoundException, ResourceAlreadyExistsException } from '../common/exceptions';
import { YearBucketsService } from '../year-buckets/year-buckets.service';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Fasts')
@ApiBearerAuth('JWT-auth')
@Controller('fasts')
@UseGuards(JwtAuthGuard)
export class FastsController {
  constructor(
    private readonly fastsService: FastsService,
    private readonly yearBucketsService: YearBucketsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user fasts', description: 'Get all fasts for a user' })
  @ApiResponse({ status: 200, description: 'List of fasts' })
  async getUserFasts(@CurrentUser('sub') userId: string): Promise<Fast[]> {
    return this.fastsService.getUserFasts(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fast', description: 'Log a new fast for a specific date' })
  @ApiBody({ type: CreateFastRequestDto })
  @ApiResponse({ status: 201, description: 'Fast created successfully' })
  @ApiResponse({ status: 409, description: 'Fast already exists for this date' })
  async createFast(
    @CurrentUser('sub') userId: string,
    @Body() createFastDto: CreateFastRequestDto,
  ): Promise<{
    id: string;
    type: 'qada' | 'sunnah' | 'kaffarah' | 'nafl';
    date: string;
    createdAt: string;
    updatedQadaBalance: {
      remaining: number;
      progress: number;
    };
  }> {
    try {
      const isoDate = this.resolveIsoDate(createFastDto);
      const fastName = createFastDto.name ?? this.formatIsoToName(isoDate);
      const type = createFastDto.type ?? FastType.SUNNAH;

      const fast = await this.fastsService.createFast(userId, {
        name: fastName,
        type,
        yearBucketId: createFastDto.yearBucketId,
      } as CreateFastDto);

      const ledgerSummary = await this.yearBucketsService.getLedgerSummary(userId);
      const progress =
        ledgerSummary.totalOwed === 0
          ? 0
          : Number((ledgerSummary.totalCompleted / ledgerSummary.totalOwed).toFixed(2));

      return {
        id: fast._id.toString(),
        type: fast.type,
        date: isoDate,
        createdAt: fast.createdAt.toISOString(),
        updatedQadaBalance: {
          remaining: ledgerSummary.totalRemaining,
          progress,
        },
      };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ResourceAlreadyExistsException('Fast', 'date', createFastDto.name ?? createFastDto.date ?? 'today');
      }
      throw new BadRequestException(error.message || 'Failed to create fast');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a fast', description: 'Undo a logged fast' })
  @ApiResponse({ status: 204, description: 'Fast deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fast not found' })
  async deleteFast(
    @CurrentUser('sub') userId: string,
    @Param('id') fastId: string,
  ): Promise<void> {
    const deleted = await this.fastsService.deleteFast(fastId, userId);
    if (!deleted) {
      throw new ResourceNotFoundException('Fast', fastId);
    }
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today fast status', description: 'Check if user already logged today' })
  @ApiResponse({ status: 200, description: 'Today fast status' })
  async getTodayFast(
    @CurrentUser('sub') userId: string,
  ): Promise<{
    logged: boolean;
    fast?: { id: string; type: 'qada' | 'sunnah' | 'kaffarah' | 'nafl'; loggedAt: string };
  }> {
    const todayFast = await this.fastsService.getTodayFast(userId);

    if (!todayFast) {
      return { logged: false };
    }

    return {
      logged: true,
      fast: {
        id: todayFast._id.toString(),
        type: todayFast.type,
        loggedAt: todayFast.createdAt.toISOString(),
      },
    };
  }

  @Get('missedfast')
  @ApiOperation({ summary: 'Get missed fasts', description: 'Get all fasts marked as missed (status=false)' })
  @ApiResponse({ status: 200, description: 'List of missed fasts' })
  async getMissedFasts(@CurrentUser('sub') userId: string): Promise<Fast[]> {
    return this.fastsService.getMissedFasts(userId);
  }

  @Post('bulkfasts')
  @ApiOperation({ summary: 'Create bulk fasts', description: 'Create multiple fasts at once' })
  @ApiResponse({ status: 201, description: 'Fasts created successfully' })
  @ApiResponse({ status: 409, description: 'One or more fasts already exist' })
  async createBulkFasts(
    @CurrentUser('sub') userId: string,
    @Body() bulkFastsDto: BulkFastsDto,
  ) {
    try {
      return await this.fastsService.createBulkFasts(userId, bulkFastsDto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ResourceAlreadyExistsException('Fast', 'dates', 'one or more of the provided dates');
      }
      throw new BadRequestException(error.message || 'Failed to create bulk fasts');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fast by ID' })
  @ApiResponse({ status: 200, description: 'Fast details' })
  @ApiResponse({ status: 404, description: 'Fast not found' })
  async getFastById(
    @Param('id') fastId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<Fast> {
    const fast = await this.fastsService.getFastById(fastId, userId);
    if (!fast) {
      throw new ResourceNotFoundException('Fast', fastId);
    }
    return fast;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update fast status', description: 'Update the completion status of a fast' })
  @ApiResponse({ status: 200, description: 'Fast status updated' })
  @ApiResponse({ status: 404, description: 'Fast not found' })
  async updateFastStatus(
    @Param('id') fastId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateFastStatusDto: UpdateFastStatusDto,
  ): Promise<Fast> {
    const fast = await this.fastsService.updateFastStatus(
      fastId,
      userId,
      updateFastStatusDto,
    );
    if (!fast) {
      throw new ResourceNotFoundException('Fast', fastId);
    }
    return fast;
  }

  private resolveIsoDate(dto: CreateFastRequestDto): string {
    if (dto.date) {
      return dto.date.slice(0, 10);
    }

    if (dto.name) {
      return this.formatNameToIso(dto.name);
    }

    return new Date().toISOString().slice(0, 10);
  }

  private formatIsoToName(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  }

  private formatNameToIso(name: string): string {
    const [day, month, year] = name.split('-');
    return `${year}-${month}-${day}`;
  }
}
