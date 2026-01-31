import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type YearBucketDocument = YearBucket & Document;

export enum MissedReason {
  CYCLE = 'cycle',
  TRAVEL = 'travel',
  ILLNESS = 'illness',
  PREGNANCY = 'pregnancy',
  POSTPARTUM = 'postpartum',
  BREASTFEEDING = 'breastfeeding',
  OTHER = 'other',
}

export interface ReasonBreakdown {
  reason: MissedReason;
  count: number;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class YearBucket {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  user!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 50,
  })
  name!: string; // e.g., "Ramadan 2023", "1444 AH"

  @Prop({
    required: true,
    min: 2000,
    max: 2100,
  })
  hijriYear!: number; // Hijri year for sorting/ordering

  @Prop({
    required: true,
    min: 1,
    max: 30, // Ramadan has max 30 days
  })
  totalDaysOwed!: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  completedDays!: number;

  @Prop({
    type: [
      {
        reason: {
          type: String,
          enum: Object.values(MissedReason),
        },
        count: {
          type: Number,
          min: 0,
        },
      },
    ],
    default: [],
  })
  reasonBreakdown!: ReasonBreakdown[];

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  notes?: string;

  @Prop({
    required: false,
    default: false,
  })
  isCompleted!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const YearBucketSchema = SchemaFactory.createForClass(YearBucket);

// Compound index for user + hijriYear uniqueness
YearBucketSchema.index({ user: 1, hijriYear: 1 }, { unique: true });

// Index for efficient queries
YearBucketSchema.index({ user: 1, isCompleted: 1 });
YearBucketSchema.index({ user: 1 }); // For user-based queries
YearBucketSchema.index({ hijriYear: -1 }); // For sorting by year

// Virtual for remaining days
YearBucketSchema.virtual('remainingDays').get(function () {
  return Math.max(0, this.totalDaysOwed - this.completedDays);
});

// Virtual for progress percentage
YearBucketSchema.virtual('progressPercentage').get(function () {
  if (this.totalDaysOwed === 0) return 100;
  return Math.round((this.completedDays / this.totalDaysOwed) * 100);
});

// Pre-save middleware to update isCompleted flag
YearBucketSchema.pre<YearBucketDocument>('save', function () {
  this.isCompleted = this.completedDays >= this.totalDaysOwed;
});

// Static method to find incomplete buckets by user
YearBucketSchema.statics.findIncompleteByUser = function (
  userId: string | Types.ObjectId,
) {
  return this.find({ user: userId, isCompleted: false }).sort({ hijriYear: 1 });
};

// Static method to get total remaining days for user
YearBucketSchema.statics.getTotalRemainingDays = async function (
  userId: string | Types.ObjectId,
) {
  const result = await this.aggregate([
    { $match: { user: new Types.ObjectId(userId.toString()), isCompleted: false } },
    {
      $group: {
        _id: null,
        totalOwed: { $sum: '$totalDaysOwed' },
        totalCompleted: { $sum: '$completedDays' },
      },
    },
  ]);
  if (result.length === 0) return 0;
  return result[0].totalOwed - result[0].totalCompleted;
};
