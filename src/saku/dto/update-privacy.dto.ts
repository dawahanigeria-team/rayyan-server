import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrivacyTier } from '../schemas/saku.schema';

export class UpdatePrivacyDto {
  @ApiProperty({ enum: PrivacyTier, example: 'limited', description: 'Privacy level: public (show all), limited (show streaks only), private (hide all)' })
  @IsEnum(PrivacyTier)
  privacyTier!: PrivacyTier;
}
