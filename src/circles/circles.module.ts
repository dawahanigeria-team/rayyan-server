import { Module } from '@nestjs/common';
import { CirclesController } from './circles.controller';
import { SakuModule } from '../saku/saku.module';

@Module({
  imports: [SakuModule],
  controllers: [CirclesController],
})
export class CirclesModule {}
