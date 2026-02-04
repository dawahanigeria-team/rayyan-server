import { IsOptional, IsEnum, IsDateString, IsMongoId, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FastType } from '../schemas/fast.schema';

export class CreateFastRequestDto {
  @ApiPropertyOptional({ enum: FastType, example: 'sunnah', description: 'Type of fast' })
  @IsOptional()
  @IsEnum(FastType)
  type?: FastType;

  @ApiPropertyOptional({ example: '2026-02-04', description: 'Date of the fast in ISO format (YYYY-MM-DD). Defaults to today.' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '04-02-2026', description: 'Legacy date format (DD-MM-YYYY)' })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'Fast name must be in DD-MM-YYYY format',
  })
  name?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Year bucket ID for Qada fasts' })
  @IsOptional()
  @IsMongoId()
  yearBucketId?: string;
}
