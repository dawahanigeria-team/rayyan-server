import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, IsUrl, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'ar', 'fr', 'es'])
  preferred_language?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  fast_goal_per_week?: number;

  @IsOptional()
  @IsBoolean()
  notification_enabled?: boolean;
}