import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FastsService } from './fasts.service';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto } from './dto';
import { Fast } from './schemas/fast.schema';
import { ResourceNotFoundException, ResourceAlreadyExistsException } from '../common/exceptions';

@ApiTags('Fasts')
@Controller('fasts')
export class FastsController {
  constructor(private readonly fastsService: FastsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user fasts', description: 'Get all fasts for a user' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of fasts' })
  async getUserFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.fastsService.getUserFasts(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fast', description: 'Log a new fast for a specific date' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Fast created successfully' })
  @ApiResponse({ status: 409, description: 'Fast already exists for this date' })
  async createFast(
    @Query('user') userId: string,
    @Body() createFastDto: CreateFastDto,
  ): Promise<Fast> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    try {
      return await this.fastsService.createFast(userId, createFastDto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ResourceAlreadyExistsException('Fast', 'date', createFastDto.name);
      }
      throw new BadRequestException(error.message || 'Failed to create fast');
    }
  }

  @Get('missedfast')
  @ApiOperation({ summary: 'Get missed fasts', description: 'Get all fasts marked as missed (status=false)' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of missed fasts' })
  async getMissedFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.fastsService.getMissedFasts(userId);
  }

  @Post('bulkfasts')
  @ApiOperation({ summary: 'Create bulk fasts', description: 'Create multiple fasts at once' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Fasts created successfully' })
  @ApiResponse({ status: 409, description: 'One or more fasts already exist' })
  async createBulkFasts(
    @Query('user') userId: string,
    @Body() bulkFastsDto: BulkFastsDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
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
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Fast details' })
  @ApiResponse({ status: 404, description: 'Fast not found' })
  async getFastById(
    @Param('id') fastId: string,
    @Query('user') userId: string,
  ): Promise<Fast> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    const fast = await this.fastsService.getFastById(fastId, userId);
    if (!fast) {
      throw new ResourceNotFoundException('Fast', fastId);
    }
    return fast;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update fast status', description: 'Update the completion status of a fast' })
  @ApiQuery({ name: 'user', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Fast status updated' })
  @ApiResponse({ status: 404, description: 'Fast not found' })
  async updateFastStatus(
    @Param('id') fastId: string,
    @Query('user') userId: string,
    @Body() updateFastStatusDto: UpdateFastStatusDto,
  ): Promise<Fast> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

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
}