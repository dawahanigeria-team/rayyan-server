import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCircleDto {
  @ApiProperty({ example: "Fatima's Saku", description: 'Name of the circle (2-50 characters)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: 'A group for fasting accountability', description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class JoinCircleDto {
  @ApiProperty({ example: 'RAYAN-7K4M', description: 'Invite code to join the circle' })
  @IsString()
  @MinLength(6)
  @MaxLength(12)
  inviteCode!: string;
}
