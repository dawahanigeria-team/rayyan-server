import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FastsService } from './fasts.service';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto } from './dto';
import { Fast } from './schemas/fast.schema';

@Controller('fasts')
export class FastsController {
  constructor(private readonly fastsService: FastsService) {}

  @Get()
  async getUserFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.fastsService.getUserFasts(userId);
  }

  @Post()
  async createFast(
    @Query('user') userId: string,
    @Body() createFastDto: CreateFastDto,
  ): Promise<Fast> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.fastsService.createFast(userId, createFastDto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new HttpException(
          'A fast with this date already exists for this user',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        error.message || 'Failed to create fast',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('missedfast')
  async getMissedFasts(@Query('user') userId: string): Promise<Fast[]> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.fastsService.getMissedFasts(userId);
  }

  @Post('bulkfasts')
  async createBulkFasts(@Body() bulkFastsDto: BulkFastsDto): Promise<Fast[]> {
    // Note: User ID should be extracted from JWT token in a real implementation
    // For now, we'll expect it in the request body or handle it differently
    console.log('Bulk fasts request:', bulkFastsDto);
    throw new HttpException('Bulk fasts endpoint not fully implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get(':id')
  async getFastById(
    @Param('id') fastId: string,
    @Query('user') userId: string,
  ): Promise<Fast> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    
    const fast = await this.fastsService.getFastById(fastId, userId);
    if (!fast) {
      throw new HttpException('Fast not found', HttpStatus.NOT_FOUND);
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
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    const fast = await this.fastsService.updateFastStatus(
      fastId,
      userId,
      updateFastStatusDto,
    );
    if (!fast) {
      throw new HttpException('Fast not found', HttpStatus.NOT_FOUND);
    }
    return fast;
  }
}