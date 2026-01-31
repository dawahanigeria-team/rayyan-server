import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  revoked!: boolean;

  @Prop()
  revokedAt?: Date;

  @Prop()
  replacedByToken?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ user: 1, revoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
