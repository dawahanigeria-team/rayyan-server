export interface UserStats {
  total_fasts: number;
  completed_fasts: number;
  remaining_fasts: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  last_fast_date: string | null;
}

export interface UserProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar_url?: string;
  timezone?: string;
  preferred_language?: string;
  fast_goal_per_week?: number;
  notification_enabled?: boolean;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}