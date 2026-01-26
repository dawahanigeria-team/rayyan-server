import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateFastDto {
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'Fast name must be in DD-MM-YYYY format',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}