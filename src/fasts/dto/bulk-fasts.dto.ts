import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFastDto } from './create-fast.dto';

export class BulkFastsDto {
  @IsArray({ message: 'Fasts must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateFastDto)
  fasts!: CreateFastDto[];
}