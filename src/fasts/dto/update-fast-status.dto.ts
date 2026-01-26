import { IsBoolean } from 'class-validator';

export class UpdateFastStatusDto {
  @IsBoolean({ message: 'Status must be a boolean value' })
  status!: boolean;
}