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
import { YearBucketsService, YearBucketWithProgress, LedgerSummary } from './year-buckets.service';
import { CreateYearBucketDto, UpdateYearBucketDto, IncrementCompletedDto } from './dto';
import { YearBucket } from './schemas/year-bucket.schema';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { ResourceNotFoundException, ResourceAlreadyExistsException } from '../common/exceptions';

@ApiTags('Year Buckets')
@ApiBearerAuth('JWT-auth')
@Controller('year-buckets')
@UseGuards(JwtAuthGuard)
export class YearBucketsController {
  constructor(private readonly yearBucketsService: YearBucketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new year bucket', description: 'Create a new Qada tracking bucket for a specific Hijri year' })
  @ApiResponse({ status: 201, description: 'Year bucket created successfully' })
  @ApiResponse({ status: 409, description: 'Year bucket for this Hijri year already exists' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createYearBucketDto: CreateYearBucketDto,
  ): Promise<YearBucket> {
    try {
      return await this.yearBucketsService.create(userId, createYearBucketDto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ResourceAlreadyExistsException(
          'YearBucket',
          'hijriYear',
          createYearBucketDto.hijriYear.toString(),
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all year buckets', description: 'Retrieve all year buckets for the current user with progress info' })
  @ApiResponse({ status: 200, description: 'List of year buckets with progress' })
  async findAll(
    @CurrentUser('sub') userId: string,
  ): Promise<YearBucketWithProgress[]> {
    return this.yearBucketsService.findAllByUser(userId);
  }

  @Get('incomplete')
  @ApiOperation({ summary: 'Get incomplete year buckets', description: 'Retrieve only year buckets that have remaining Qada days' })
  @ApiResponse({ status: 200, description: 'List of incomplete year buckets' })
  async findIncomplete(
    @CurrentUser('sub') userId: string,
  ): Promise<YearBucketWithProgress[]> {
    return this.yearBucketsService.findIncompleteByUser(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get ledger summary', description: 'Get aggregated summary of all Qada fasts owed and completed' })
  @ApiResponse({ status: 200, description: 'Ledger summary with totals and breakdown' })
  async getLedgerSummary(
    @CurrentUser('sub') userId: string,
  ): Promise<LedgerSummary> {
    return this.yearBucketsService.getLedgerSummary(userId);
  }

  @Get('most-urgent')
  @ApiOperation({ summary: 'Get most urgent bucket', description: 'Get the year bucket with the most days remaining (for featured display)' })
  @ApiResponse({ status: 200, description: 'Most urgent year bucket or null' })
  async findMostUrgent(
    @CurrentUser('sub') userId: string,
  ): Promise<YearBucketWithProgress | null> {
    return this.yearBucketsService.findMostUrgent(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get year bucket by ID' })
  @ApiResponse({ status: 200, description: 'Year bucket details' })
  @ApiResponse({ status: 404, description: 'Year bucket not found' })
  async findOne(
    @Param('id') bucketId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<YearBucketWithProgress> {
    const bucket = await this.yearBucketsService.findById(bucketId, userId);
    if (!bucket) {
      throw new ResourceNotFoundException('YearBucket', bucketId);
    }
    return bucket;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update year bucket' })
  @ApiResponse({ status: 200, description: 'Year bucket updated' })
  @ApiResponse({ status: 404, description: 'Year bucket not found' })
  async update(
    @Param('id') bucketId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateYearBucketDto: UpdateYearBucketDto,
  ): Promise<YearBucket> {
    const bucket = await this.yearBucketsService.update(
      bucketId,
      userId,
      updateYearBucketDto,
    );
    if (!bucket) {
      throw new ResourceNotFoundException('YearBucket', bucketId);
    }
    return bucket;
  }

  @Post(':id/increment')
  @ApiOperation({ summary: 'Increment completed days', description: 'Add completed Qada days to the bucket' })
  @ApiResponse({ status: 200, description: 'Completed days incremented' })
  @ApiResponse({ status: 404, description: 'Year bucket not found' })
  async incrementCompleted(
    @Param('id') bucketId: string,
    @CurrentUser('sub') userId: string,
    @Body() incrementDto: IncrementCompletedDto,
  ): Promise<YearBucket> {
    const bucket = await this.yearBucketsService.incrementCompleted(
      bucketId,
      userId,
      incrementDto,
    );
    if (!bucket) {
      throw new ResourceNotFoundException('YearBucket', bucketId);
    }
    return bucket;
  }

  @Post(':id/decrement')
  @ApiOperation({ summary: 'Decrement completed days', description: 'Remove completed Qada days from the bucket (e.g., if logged in error)' })
  @ApiResponse({ status: 200, description: 'Completed days decremented' })
  @ApiResponse({ status: 404, description: 'Year bucket not found' })
  async decrementCompleted(
    @Param('id') bucketId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { count?: number },
  ): Promise<YearBucket> {
    const bucket = await this.yearBucketsService.decrementCompleted(
      bucketId,
      userId,
      body.count,
    );
    if (!bucket) {
      throw new ResourceNotFoundException('YearBucket', bucketId);
    }
    return bucket;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete year bucket' })
  @ApiResponse({ status: 204, description: 'Year bucket deleted' })
  @ApiResponse({ status: 404, description: 'Year bucket not found' })
  async delete(
    @Param('id') bucketId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<void> {
    const deleted = await this.yearBucketsService.delete(bucketId, userId);
    if (!deleted) {
      throw new ResourceNotFoundException('YearBucket', bucketId);
    }
  }
}
