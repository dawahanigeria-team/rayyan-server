import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

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