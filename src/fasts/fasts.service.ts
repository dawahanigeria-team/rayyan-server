import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fast, FastDocument, FastType } from './schemas/fast.schema';
import { CreateFastDto, UpdateFastStatusDto, BulkFastsDto } from './dto';
import { YearBucket, YearBucketDocument } from '../year-buckets/schemas/year-bucket.schema';

export interface FastStats {
  totalFasts: number;
  qadaFasts: number;
  sunnahFasts: number;
  kaffarahFasts: number;
  naflFasts: number;
}

@Injectable()
export class FastsService {
  constructor(
    @InjectModel(Fast.name) private readonly fastModel: Model<FastDocument>,
    @InjectModel(YearBucket.name) private readonly yearBucketModel: Model<YearBucketDocument>,
  ) {}

  async createFast(userId: string, createFastDto: CreateFastDto): Promise<Fast> {
    const { yearBucketId, ...fastData } = createFastDto;

    const fast = new this.fastModel({
      ...fastData,
      user: new Types.ObjectId(userId),
      yearBucket: yearBucketId ? new Types.ObjectId(yearBucketId) : undefined,
    });

    const savedFast = await fast.save();

    // If this is a Qada fast linked to a year bucket, increment the bucket's completed count
    if (savedFast.type === FastType.QADA && yearBucketId) {
      await this.yearBucketModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(yearBucketId),
          user: new Types.ObjectId(userId),
        },
        { $inc: { completedDays: 1 } },
      );

      // Check if bucket is now complete and update flag
      const bucket = await this.yearBucketModel.findById(yearBucketId);
      if (bucket && bucket.completedDays >= bucket.totalDaysOwed) {
        bucket.isCompleted = true;
        await bucket.save();
      }
    }

    return savedFast;
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

  async createBulkFasts(userId: string, bulkFastsDto: BulkFastsDto) {
    const fastsWithUser = bulkFastsDto.fasts.map((fast) => ({
      ...fast,
      user: new Types.ObjectId(userId),
    }));

    return this.fastModel.insertMany(fastsWithUser);
  }

  async getFastsByType(userId: string, type: FastType): Promise<Fast[]> {
    return this.fastModel
      .find({ user: new Types.ObjectId(userId), type })
      .sort({ createdAt: -1 });
  }

  async getFastsByYearBucket(userId: string, yearBucketId: string): Promise<Fast[]> {
    return this.fastModel
      .find({
        user: new Types.ObjectId(userId),
        yearBucket: new Types.ObjectId(yearBucketId),
      })
      .sort({ name: 1 });
  }

  async getTodayFast(userId: string): Promise<Fast | null> {
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    return this.fastModel.findOne({
      user: new Types.ObjectId(userId),
      name: dateString,
    });
  }

  async getStats(userId: string): Promise<FastStats> {
    const result = await this.fastModel.aggregate([
      { $match: { user: new Types.ObjectId(userId), status: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats: FastStats = {
      totalFasts: 0,
      qadaFasts: 0,
      sunnahFasts: 0,
      kaffarahFasts: 0,
      naflFasts: 0,
    };

    result.forEach((item) => {
      switch (item._id) {
        case FastType.QADA:
          stats.qadaFasts = item.count;
          break;
        case FastType.SUNNAH:
          stats.sunnahFasts = item.count;
          break;
        case FastType.KAFFARAH:
          stats.kaffarahFasts = item.count;
          break;
        case FastType.NAFL:
          stats.naflFasts = item.count;
          break;
      }
      stats.totalFasts += item.count;
    });

    return stats;
  }

  async deleteFast(fastId: string, userId: string): Promise<boolean> {
    const fast = await this.fastModel.findOne({
      _id: new Types.ObjectId(fastId),
      user: new Types.ObjectId(userId),
    });

    if (!fast) return false;

    // If this was a Qada fast linked to a year bucket, decrement the bucket's completed count
    if (fast.type === FastType.QADA && fast.yearBucket) {
      await this.yearBucketModel.findOneAndUpdate(
        { _id: fast.yearBucket },
        { $inc: { completedDays: -1 } },
      );

      // Update isCompleted flag
      const bucket = await this.yearBucketModel.findById(fast.yearBucket);
      if (bucket) {
        bucket.isCompleted = bucket.completedDays >= bucket.totalDaysOwed;
        await bucket.save();
      }
    }

    const result = await this.fastModel.deleteOne({ _id: fast._id });
    return result.deletedCount > 0;
  }
}