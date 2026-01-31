import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MissedReason } from '../schemas/year-bucket.schema';

export class ReasonBreakdownDto {
  @ApiProperty({ enum: MissedReason, example: 'illness', description: 'Reason for missing the fast' })
  @IsEnum(MissedReason)
  reason!: MissedReason;

  @ApiProperty({ example: 5, description: 'Number of days missed for this reason' })
  @IsNumber()
  @Min(0)
  count!: number;
}

export class CreateYearBucketDto {
  @ApiProperty({ example: 'Ramadan 1445', description: 'Name/label for this year bucket' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: 1445, description: 'Hijri year (1400-1500)' })
  @IsNumber()
  @Min(1400)
  @Max(1500)
  hijriYear!: number;

  @ApiProperty({ example: 10, description: 'Total number of Qada days owed (1-30)' })
  @IsNumber()
  @Min(1)
  @Max(30)
  totalDaysOwed!: number;

  @ApiPropertyOptional({ type: [ReasonBreakdownDto], description: 'Breakdown of missed days by reason' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReasonBreakdownDto)
  reasonBreakdown?: ReasonBreakdownDto[];

  @ApiPropertyOptional({ example: 'Missed due to pregnancy', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
