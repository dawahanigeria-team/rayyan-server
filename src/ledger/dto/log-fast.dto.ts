import { IsString, IsOptional, IsEnum, IsMongoId, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LedgerFastType {
  QADA = 'qada',
  SUNNAH = 'sunnah',
  KAFFARAH = 'kaffarah',
  NAFL = 'nafl',
}

export class LogFastDto {
  @ApiProperty({ example: '2026-01-31', description: 'Date of the fast in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @ApiPropertyOptional({ enum: LedgerFastType, example: 'qada', description: 'Type of fast' })
  @IsOptional()
  @IsEnum(LedgerFastType)
  type?: LedgerFastType;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Year bucket ID (auto-resolves if null for qada)' })
  @IsOptional()
  @IsMongoId()
  yearBucketId?: string;
}

export class LedgerSummaryDto {
  @ApiProperty({ example: 12, description: 'Total Qada days remaining' })
  qadaBalance!: number;

  @ApiProperty({ example: 45, description: 'Total fasts completed' })
  fastsCompleted!: number;

  @ApiPropertyOptional({ description: 'Current active year bucket' })
  currentYearBucket?: {
    id: string;
    name: string;
    progress: number;
  } | null;
}
