import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { PasswordResetToken, PasswordResetTokenSchema } from './schemas/password-reset-token.schema';
import { Fast, FastSchema } from '../fasts/schemas/fast.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserStatsService } from './services/user-stats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
      { name: Fast.name, schema: FastSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserStatsService],
  exports: [UsersService, UserStatsService, MongooseModule],
})
export class UsersModule {}