import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetTokenDocument = PasswordResetToken & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class PasswordResetToken {
  _id!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
  })
  token!: string;

  @Prop({
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  })
  expiresAt!: Date;

  @Prop({
    default: false,
  })
  used!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

// Create indexes for optimization
PasswordResetTokenSchema.index({ token: 1 }, { unique: true });
PasswordResetTokenSchema.index({ user: 1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

// Static method to find valid token
PasswordResetTokenSchema.statics.findValidToken = function (token: string) {
  return this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  }).populate('user');
};

// Instance method to mark token as used
PasswordResetTokenSchema.methods.markAsUsed = function (): Promise<PasswordResetTokenDocument> {
  this.used = true;
  return this.save();
};