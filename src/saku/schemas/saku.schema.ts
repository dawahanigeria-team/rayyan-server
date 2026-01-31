import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SakuDocument = Saku & Document;

export enum PrivacyTier {
  PUBLIC = 'public', // Show progress and fasting status
  LIMITED = 'limited', // Show fasting status only
  PRIVATE = 'private', // Show only that they're a member
}

export interface SakuMember {
  user: Types.ObjectId;
  joinedAt: Date;
  privacyTier: PrivacyTier;
  isAdmin: boolean;
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
export class Saku {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name!: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 200,
  })
  description?: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 8,
  })
  inviteCode!: string;

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
        privacyTier: {
          type: String,
          enum: Object.values(PrivacyTier),
          default: PrivacyTier.LIMITED,
        },
        isAdmin: { type: Boolean, default: false },
      },
    ],
    default: [],
    validate: {
      validator: function (members: SakuMember[]) {
        return members.length <= 5;
      },
      message: 'Circle membership is capped at 5 members',
    },
  })
  members!: SakuMember[];

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const SakuSchema = SchemaFactory.createForClass(Saku);

// Indexes
SakuSchema.index({ inviteCode: 1 }, { unique: true });
SakuSchema.index({ 'members.user': 1 }); // For finding circles by member
SakuSchema.index({ createdBy: 1 });

// Virtual for member count
SakuSchema.virtual('memberCount').get(function () {
  return this.members?.length || 0;
});

// Static method to find circle by member
SakuSchema.statics.findByMember = function (userId: string | Types.ObjectId) {
  return this.findOne({ 'members.user': userId });
};

// Static method to generate unique invite code
SakuSchema.statics.generateInviteCode = function (): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
