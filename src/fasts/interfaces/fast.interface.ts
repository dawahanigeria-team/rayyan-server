import { Document, Types } from 'mongoose';

export interface Fast extends Document {
  _id: Types.ObjectId;
  name: string; // DD-MM-YYYY format
  description?: string;
  status: boolean; // true = observed, false = missed
  user: Types.ObjectId; // reference to User
  createdAt: Date;
  updatedAt: Date;
}