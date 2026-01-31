import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  used!: boolean;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index to auto-delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ email: 1, used: 1 });
