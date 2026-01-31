import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReasonBreakdownDto } from './create-year-bucket.dto';

export class UpdateYearBucketDto {
  @ApiPropertyOptional({ example: 'Ramadan 1445', description: 'Updated name for this year bucket' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 15, description: 'Updated total days owed' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  totalDaysOwed?: number;

  @ApiPropertyOptional({ type: [ReasonBreakdownDto], description: 'Updated reason breakdown' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReasonBreakdownDto)
  reasonBreakdown?: ReasonBreakdownDto[];

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class IncrementCompletedDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Number of days to increment (defaults to 1)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  count?: number;
}
