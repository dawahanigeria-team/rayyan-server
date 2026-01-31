import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSakuDto {
  @ApiProperty({ example: 'Fasting Friends', description: 'Name of the circle (2-50 characters)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: 'A group for accountability', description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
