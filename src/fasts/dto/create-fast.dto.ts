import { IsString, IsOptional, Matches, MaxLength, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FastType, SunnahFastType } from '../schemas/fast.schema';

export class CreateFastDto {
  @ApiProperty({ example: '15-01-2024', description: 'Date of the fast in DD-MM-YYYY format' })
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'Fast name must be in DD-MM-YYYY format',
  })
  name!: string;

  @ApiPropertyOptional({ example: 'First day of Ramadan', description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({ enum: FastType, example: 'sunnah', description: 'Type of fast' })
  @IsOptional()
  @IsEnum(FastType)
  type?: FastType;

  @ApiPropertyOptional({ enum: SunnahFastType, example: 'monday', description: 'Sunnah fast type (only if type is sunnah)' })
  @IsOptional()
  @IsEnum(SunnahFastType)
  sunnahType?: SunnahFastType;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Year bucket ID for Qada fasts' })
  @IsOptional()
  @IsMongoId()
  yearBucketId?: string;
}