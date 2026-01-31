import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum SchoolOfThought {
  HANAFI = 'hanafi',
  MALIKI = 'maliki',
  SHAFII = 'shafii',
  HANBALI = 'hanbali',
}

export enum PrayerCalculationMethod {
  MWL = 'mwl', // Muslim World League
  ISNA = 'isna', // Islamic Society of North America
  EGYPT = 'egypt', // Egyptian General Authority of Survey
  MAKKAH = 'makkah', // Umm al-Qura University, Makkah
  KARACHI = 'karachi', // University of Islamic Sciences, Karachi
  TEHRAN = 'tehran', // Institute of Geophysics, University of Tehran
  JAFARI = 'jafari', // Shia Ithna Ashari
}

export enum AccountPrivacy {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret: any) {
      delete ret.password;
      return ret;
    },
  },
  toObject: {
    transform: function (_doc, ret: any) {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  })
  firstName!: string;

  @Prop({
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  })
  lastName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  })
  email!: string;

  @Prop({
    required: true,
    minlength: 8,
    select: false, // Exclude password from queries by default
  })
  password!: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true, // Allow multiple null values but unique non-null values
  })
  googleId?: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
  })
  appleId?: string;

  @Prop({
    required: false,
    trim: true,
  })
  avatar_url?: string;

  @Prop({
    required: false,
    default: 'UTC',
    trim: true,
  })
  timezone?: string;

  @Prop({
    required: false,
    default: 'en',
    trim: true,
    enum: ['en', 'ar', 'fr', 'es'], // Add more languages as needed
  })
  preferred_language?: string;

  @Prop({
    required: false,
    default: 2,
    min: 1,
    max: 7,
  })
  fast_goal_per_week?: number;

  @Prop({
    required: false,
    default: true,
  })
  notification_enabled?: boolean;

  // Fiqh Settings
  @Prop({
    required: false,
    enum: Object.values(SchoolOfThought),
    default: SchoolOfThought.HANAFI,
  })
  school_of_thought?: SchoolOfThought;

  @Prop({
    required: false,
    enum: Object.values(PrayerCalculationMethod),
    default: PrayerCalculationMethod.MWL,
  })
  prayer_calculation_method?: PrayerCalculationMethod;

  // Privacy Settings
  @Prop({
    required: false,
    enum: Object.values(AccountPrivacy),
    default: AccountPrivacy.FRIENDS_ONLY,
  })
  account_privacy?: AccountPrivacy;

  @Prop({
    required: false,
    default: true,
  })
  show_progress_in_saku?: boolean;

  // Notification Preferences
  @Prop({
    required: false,
    default: true,
  })
  notify_white_days?: boolean;

  @Prop({
    required: false,
    default: true,
  })
  notify_shaban_sprint?: boolean;

  @Prop({
    required: false,
    default: true,
  })
  notify_iftar_reminder?: boolean;

  @Prop({
    required: false,
    default: true,
  })
  notify_monday_thursday?: boolean;

  // Location for prayer times
  @Prop({
    required: false,
    type: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String,
    },
  })
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };

  // Appearance
  @Prop({
    required: false,
    default: 'system',
    enum: ['light', 'dark', 'system'],
  })
  theme?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes for optimization (only the ones not already defined in @Prop)
UserSchema.index({ createdAt: -1 }); // For sorting by creation date

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware for password hashing
UserSchema.pre<UserDocument>('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  } catch (error) {
    throw error;
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user with password (when needed for authentication)
UserSchema.statics.findWithPassword = function (filter: any) {
  return this.findOne(filter).select('+password');
};