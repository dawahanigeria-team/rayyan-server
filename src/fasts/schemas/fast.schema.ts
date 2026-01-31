import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FastType {
  QADA = 'qada',
  SUNNAH = 'sunnah',
  KAFFARAH = 'kaffarah',
  NAFL = 'nafl',
}

export enum SunnahFastType {
  MONDAY = 'monday',
  THURSDAY = 'thursday',
  WHITE_DAYS = 'white_days',
  ASHURA = 'ashura',
  ARAFAH = 'arafah',
  SHAWWAL = 'shawwal',
  SHABAN = 'shaban',
  OTHER = 'other',
}

export type FastDocument = Fast & Document;

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
export class Fast {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    match: [/^\d{2}-\d{2}-\d{4}$/, 'Fast name must be in DD-MM-YYYY format'],
    validate: {
      validator: function (value: string) {
        // Additional validation to ensure it's a valid date
        const [day, month, year] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        );
      },
      message: 'Fast name must be a valid date in DD-MM-YYYY format',
    },
  })
  name!: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(FastType),
    default: FastType.SUNNAH,
  })
  type!: FastType;

  @Prop({
    required: false,
    enum: Object.values(SunnahFastType),
  })
  sunnahType?: SunnahFastType;

  @Prop({
    type: Types.ObjectId,
    ref: 'YearBucket',
    required: false,
  })
  yearBucket?: Types.ObjectId;

  @Prop({
    required: true,
    default: true, // Fast is completed/observed by default when logged
  })
  status!: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const FastSchema = SchemaFactory.createForClass(Fast);

// Create compound index for user + name uniqueness (one fast per date per user)
FastSchema.index({ user: 1, name: 1 }, { unique: true });

// Create indexes for optimization
FastSchema.index({ user: 1 }); // For efficient user-based queries
FastSchema.index({ status: 1 }); // For missed fast queries
FastSchema.index({ createdAt: -1 }); // For sorting by creation date
FastSchema.index({ user: 1, status: 1 }); // Compound index for user + status queries
FastSchema.index({ user: 1, type: 1 }); // For filtering by fast type
FastSchema.index({ yearBucket: 1 }); // For year bucket lookups

// Virtual to populate user information when needed
FastSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

// Static method to find fasts by user
FastSchema.statics.findByUser = function (userId: string | Types.ObjectId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find missed fasts by user
FastSchema.statics.findMissedByUser = function (userId: string | Types.ObjectId) {
  return this.find({ user: userId, status: false }).sort({ name: 1 }); // Sort by date (name)
};

// Instance method to toggle fast status
FastSchema.methods.toggleStatus = function (): Promise<FastDocument> {
  this.status = !this.status;
  return this.save();
};

// Pre-save middleware to ensure referential integrity
FastSchema.pre<FastDocument>('save', async function () {
  if (this.isNew || this.isModified('user')) {
    // Verify that the referenced user exists
    const User = this.db.model('User');
    const userExists = await User.findById(this.user);
    if (!userExists) {
      throw new Error('Referenced user does not exist');
    }
  }
});