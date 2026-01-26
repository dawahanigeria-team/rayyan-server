import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fast, FastDocument } from './schemas/fast.schema';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto } from './dto';

@Injectable()
export class FastsService {
  constructor(
    @InjectModel(Fast.name) private readonly fastModel: Model<FastDocument>,
  ) {}

  async createFast(userId: string, createFastDto: CreateFastDto): Promise<Fast> {
    const fast = new this.fastModel({
      ...createFastDto,
      user: new Types.ObjectId(userId),
    });
    return fast.save();
  }

  async getUserFasts(userId: string): Promise<Fast[]> {
    return this.fastModel.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async getFastById(fastId: string, userId: string): Promise<Fast | null> {
    return this.fastModel.findOne({
      _id: new Types.ObjectId(fastId),
      user: new Types.ObjectId(userId),
    });
  }

  async updateFastStatus(
    fastId: string,
    userId: string,
    updateFastStatusDto: UpdateFastStatusDto,
  ): Promise<Fast | null> {
    return this.fastModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(fastId),
        user: new Types.ObjectId(userId),
      },
      { status: updateFastStatusDto.status },
      { new: true },
    );
  }

  async getMissedFasts(userId: string): Promise<Fast[]> {
    return this.fastModel.find({ 
      user: new Types.ObjectId(userId), 
      status: false 
    }).sort({ name: 1 }); // Sort by date (name)
  }

  async createBulkFasts(userId: string, bulkFastsDto: BulkFastsDto): Promise<Fast[]> {
    const fastsWithUser = bulkFastsDto.fasts.map((fast) => ({
      ...fast,
      user: new Types.ObjectId(userId),
    }));

    return this.fastModel.insertMany(fastsWithUser);
  }
}