import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinSakuDto {
  @ApiProperty({ example: 'ABC123', description: 'Invite code to join a circle (6-8 characters)' })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  inviteCode!: string;
}
