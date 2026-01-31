import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SakuActionDocument = SakuAction & Document;

export enum ActionType {
  IFTAR_NUDGE = 'iftar_nudge',
  DUA_REQUEST = 'dua_request',
  FASTING_ANNOUNCEMENT = 'fasting_announcement',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class SakuAction {
  _id!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Saku',
    required: true,
  })
  saku!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ActionType),
  })
  actionType!: ActionType;

  @Prop({
    required: false,
    trim: true,
    maxlength: 200,
  })
  message?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const SakuActionSchema = SchemaFactory.createForClass(SakuAction);

// Indexes
SakuActionSchema.index({ saku: 1, createdAt: -1 });
SakuActionSchema.index({ sender: 1 });
SakuActionSchema.index({ createdAt: -1 });

// TTL index - actions expire after 24 hours
SakuActionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
