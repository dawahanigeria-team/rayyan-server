import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SakuController } from './saku.controller';
import { SakuService } from './saku.service';
import { Saku, SakuSchema } from './schemas/saku.schema';
import { SakuAction, SakuActionSchema } from './schemas/saku-action.schema';
import { Fast, FastSchema } from '../fasts/schemas/fast.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Saku.name, schema: SakuSchema },
      { name: SakuAction.name, schema: SakuActionSchema },
      { name: Fast.name, schema: FastSchema },
    ]),
  ],
  controllers: [SakuController],
  providers: [SakuService],
  exports: [SakuService],
})
export class SakuModule {}
