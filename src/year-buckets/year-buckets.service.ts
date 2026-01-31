import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { YearBucket, YearBucketDocument } from './schemas/year-bucket.schema';
import { CreateYearBucketDto, UpdateYearBucketDto, IncrementCompletedDto } from './dto';

export interface LedgerSummary {
  totalRemaining: number;
  totalCompleted: number;
  totalOwed: number;
  bucketCount: number;
  completedBuckets: number;
}

export interface YearBucketWithProgress extends YearBucket {
  remainingDays: number;
  progressPercentage: number;
}

@Injectable()
export class YearBucketsService {
  constructor(
    @InjectModel(YearBucket.name)
    private readonly yearBucketModel: Model<YearBucketDocument>,
  ) {}

  async create(
    userId: string,
    createYearBucketDto: CreateYearBucketDto,
  ): Promise<YearBucket> {
    const yearBucket = new this.yearBucketModel({
      ...createYearBucketDto,
      user: new Types.ObjectId(userId),
      completedDays: 0,
      isCompleted: false,
    });
    return yearBucket.save();
  }

  async findAllByUser(userId: string): Promise<YearBucketWithProgress[]> {
    const buckets = await this.yearBucketModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ hijriYear: -1 })
      .lean();

    return buckets.map((bucket) => ({
      ...bucket,
      remainingDays: Math.max(0, bucket.totalDaysOwed - bucket.completedDays),
      progressPercentage:
        bucket.totalDaysOwed === 0
          ? 100
          : Math.round((bucket.completedDays / bucket.totalDaysOwed) * 100),
    })) as YearBucketWithProgress[];
  }

  async findIncompleteByUser(userId: string): Promise<YearBucketWithProgress[]> {
    const buckets = await this.yearBucketModel
      .find({ user: new Types.ObjectId(userId), isCompleted: false })
      .sort({ hijriYear: 1 }) // Oldest first (most urgent)
      .lean();

    return buckets.map((bucket) => ({
      ...bucket,
      remainingDays: Math.max(0, bucket.totalDaysOwed - bucket.completedDays),
      progressPercentage:
        bucket.totalDaysOwed === 0
          ? 100
          : Math.round((bucket.completedDays / bucket.totalDaysOwed) * 100),
    })) as YearBucketWithProgress[];
  }

  async findById(
    bucketId: string,
    userId: string,
  ): Promise<YearBucketWithProgress | null> {
    const bucket = await this.yearBucketModel
      .findOne({
        _id: new Types.ObjectId(bucketId),
        user: new Types.ObjectId(userId),
      })
      .lean();

    if (!bucket) return null;

    return {
      ...bucket,
      remainingDays: Math.max(0, bucket.totalDaysOwed - bucket.completedDays),
      progressPercentage:
        bucket.totalDaysOwed === 0
          ? 100
          : Math.round((bucket.completedDays / bucket.totalDaysOwed) * 100),
    } as YearBucketWithProgress;
  }

  async findMostUrgent(userId: string): Promise<YearBucketWithProgress | null> {
    // Returns the oldest incomplete bucket (most urgent to complete)
    const bucket = await this.yearBucketModel
      .findOne({ user: new Types.ObjectId(userId), isCompleted: false })
      .sort({ hijriYear: 1 })
      .lean();

    if (!bucket) return null;

    return {
      ...bucket,
      remainingDays: Math.max(0, bucket.totalDaysOwed - bucket.completedDays),
      progressPercentage:
        bucket.totalDaysOwed === 0
          ? 100
          : Math.round((bucket.completedDays / bucket.totalDaysOwed) * 100),
    } as YearBucketWithProgress;
  }

  async update(
    bucketId: string,
    userId: string,
    updateYearBucketDto: UpdateYearBucketDto,
  ): Promise<YearBucket | null> {
    const bucket = await this.yearBucketModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(bucketId),
        user: new Types.ObjectId(userId),
      },
      { $set: updateYearBucketDto },
      { new: true },
    );

    if (bucket) {
      // Recalculate isCompleted
      bucket.isCompleted = bucket.completedDays >= bucket.totalDaysOwed;
      await bucket.save();
    }

    return bucket;
  }

  async incrementCompleted(
    bucketId: string,
    userId: string,
    incrementDto?: IncrementCompletedDto,
  ): Promise<YearBucket | null> {
    const count = incrementDto?.count ?? 1;

    const bucket = await this.yearBucketModel.findOne({
      _id: new Types.ObjectId(bucketId),
      user: new Types.ObjectId(userId),
    });

    if (!bucket) return null;

    // Don't allow incrementing beyond total owed
    const newCompleted = Math.min(
      bucket.completedDays + count,
      bucket.totalDaysOwed,
    );

    bucket.completedDays = newCompleted;
    bucket.isCompleted = newCompleted >= bucket.totalDaysOwed;

    return bucket.save();
  }

  async decrementCompleted(
    bucketId: string,
    userId: string,
    count: number = 1,
  ): Promise<YearBucket | null> {
    const bucket = await this.yearBucketModel.findOne({
      _id: new Types.ObjectId(bucketId),
      user: new Types.ObjectId(userId),
    });

    if (!bucket) return null;

    // Don't allow decrementing below 0
    bucket.completedDays = Math.max(0, bucket.completedDays - count);
    bucket.isCompleted = bucket.completedDays >= bucket.totalDaysOwed;

    return bucket.save();
  }

  async delete(bucketId: string, userId: string): Promise<boolean> {
    const result = await this.yearBucketModel.deleteOne({
      _id: new Types.ObjectId(bucketId),
      user: new Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  }

  async getLedgerSummary(userId: string): Promise<LedgerSummary> {
    const result = await this.yearBucketModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOwed: { $sum: '$totalDaysOwed' },
          totalCompleted: { $sum: '$completedDays' },
          bucketCount: { $sum: 1 },
          completedBuckets: {
            $sum: { $cond: ['$isCompleted', 1, 0] },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        totalRemaining: 0,
        totalCompleted: 0,
        totalOwed: 0,
        bucketCount: 0,
        completedBuckets: 0,
      };
    }

    return {
      totalRemaining: result[0].totalOwed - result[0].totalCompleted,
      totalCompleted: result[0].totalCompleted,
      totalOwed: result[0].totalOwed,
      bucketCount: result[0].bucketCount,
      completedBuckets: result[0].completedBuckets,
    };
  }
}
