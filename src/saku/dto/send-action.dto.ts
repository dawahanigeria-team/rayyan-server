import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType } from '../schemas/saku-action.schema';

export class SendActionDto {
  @ApiProperty({ enum: ActionType, example: 'nudge', description: 'Type of action: nudge or dua_request' })
  @IsEnum(ActionType)
  actionType!: ActionType;

  @ApiPropertyOptional({ example: 'Keep going!', description: 'Optional message with the action' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}
