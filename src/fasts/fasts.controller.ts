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
import { FastsService } from './fasts.service';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto } from './dto';
import { Fast } from './schemas/fast.schema';
import { ResourceNotFoundException, ResourceAlreadyExistsException } from '../common/exceptions';

@Controller('fasts')
export class FastsController {
  constructor(private readonly fastsService: FastsService) {}

  @Get()
  async getUserFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.fastsService.getUserFasts(userId);
  }

  @Post()
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
  async getMissedFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.fastsService.getMissedFasts(userId);
  }

  @Post('bulkfasts')
  async createBulkFasts(
    @Query('user') userId: string,
    @Body() bulkFastsDto: BulkFastsDto,
  ): Promise<Fast[]> {
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