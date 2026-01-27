import { Document, Types } from 'mongoose';

export interface User extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  googleId?: string;
  avatar_url?: string;
  timezone?: string;
  preferred_language?: string;
  fast_goal_per_week?: number;
  notification_enabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}