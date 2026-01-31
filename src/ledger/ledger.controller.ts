import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { LogFastDto, LedgerSummaryDto, LedgerFastType } from './dto/log-fast.dto';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Ledger')
@ApiBearerAuth('JWT-auth')
@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get ledger summary', description: 'Get aggregated spiritual ledger summary including Qada balance and fasts completed' })
  @ApiResponse({ status: 200, description: 'Ledger summary data' })
  async getSummary(@CurrentUser('sub') userId: string): Promise<LedgerSummaryDto> {
    return this.ledgerService.getSummary(userId);
  }

  @Post('fasts')
  @ApiOperation({ summary: 'Log a fast', description: 'Log a new fast entry to the spiritual ledger' })
  @ApiResponse({ status: 201, description: 'Fast logged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or duplicate fast' })
  async logFast(
    @CurrentUser('sub') userId: string,
    @Body() logFastDto: LogFastDto,
  ) {
    try {
      return await this.ledgerService.logFast(userId, logFastDto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException('A fast for this date already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('fasts')
  @ApiOperation({ summary: 'Get fast history', description: 'Get all logged fasts, optionally filtered by type' })
  @ApiQuery({ name: 'type', required: false, enum: LedgerFastType, description: 'Filter by fast type' })
  @ApiResponse({ status: 200, description: 'List of fasts' })
  async getFastHistory(
    @CurrentUser('sub') userId: string,
    @Query('type') type?: LedgerFastType,
  ) {
    return this.ledgerService.getFastHistory(userId, type);
  }
}
