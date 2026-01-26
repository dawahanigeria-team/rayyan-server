import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FastsController } from './fasts.controller';
import { FastsService } from './fasts.service';
import { Fast, FastSchema } from './schemas/fast.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fast.name, schema: FastSchema }]),
  ],
  controllers: [FastsController],
  providers: [FastsService],
  exports: [FastsService, MongooseModule],
})
export class FastsModule {}