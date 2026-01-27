import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fast, FastDocument } from '../../fasts/schemas/fast.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UserStats } from '../dto/user-profile-response.dto';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectModel(Fast.name) private readonly fastModel: Model<FastDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async calculateUserStats(userId: string): Promise<UserStats> {
    const userObjectId = new Types.ObjectId(userId);

    // Get all fasts for the user
    const allFasts = await this.fastModel
      .find({ user: userObjectId })
      .sort({ name: 1 }) // Sort by date (name field is DD-MM-YYYY)
      .exec();

    const totalFasts = allFasts.length;
    const completedFasts = allFasts.filter(fast => fast.status === true).length;
    const remainingFasts = totalFasts - completedFasts;
    const completionRate = totalFasts > 0 ? Math.round((completedFasts / totalFasts) * 100) : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(allFasts);

    // Get last fast date
    const lastFastDate = this.getLastFastDate(allFasts);

    return {
      total_fasts: totalFasts,
      completed_fasts: completedFasts,
      remaining_fasts: remainingFasts,
      completion_rate: completionRate,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_fast_date: lastFastDate,
    };
  }

  private calculateStreaks(fasts: FastDocument[]): { currentStreak: number; longestStreak: number } {
    if (fasts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort fasts by date (convert DD-MM-YYYY to Date for proper sorting)
    const sortedFasts = fasts
      .map(fast => ({
        ...fast.toObject(),
        dateObj: this.parseDate(fast.name),
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks based on completed fasts
    for (let i = 0; i < sortedFasts.length; i++) {
      const fast = sortedFasts[i];
      
      if (fast.status === true) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak (from the end)
    for (let i = sortedFasts.length - 1; i >= 0; i--) {
      const fast = sortedFasts[i];
      
      if (fast.status === true) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak };
  }

  private getLastFastDate(fasts: FastDocument[]): string | null {
    if (fasts.length === 0) {
      return null;
    }

    // Find the most recent fast date
    const sortedFasts = fasts
      .map(fast => ({
        name: fast.name,
        dateObj: this.parseDate(fast.name),
      }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    // Return the most recent date in YYYY-MM-DD format
    const lastFast = sortedFasts[0];
    return this.formatDateToISO(lastFast.dateObj);
  }

  private parseDate(dateString: string): Date {
    // Convert DD-MM-YYYY to Date object
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  private formatDateToISO(date: Date): string {
    // Format Date to YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  async getUserFastingGoalProgress(userId: string): Promise<{
    weeklyGoal: number;
    currentWeekCompleted: number;
    weekProgress: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    // Get user's weekly goal
    const user = await this.userModel.findById(userObjectId).exec();
    const weeklyGoal = user?.fast_goal_per_week || 2;

    // Get current week's start and end dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all completed fasts for the user
    const allCompletedFasts = await this.fastModel
      .find({
        user: userObjectId,
        status: true,
      })
      .exec();

    // Filter fasts that fall within current week
    const currentWeekCompleted = allCompletedFasts.filter(fast => {
      const fastDate = this.parseDate(fast.name);
      return fastDate >= startOfWeek && fastDate <= endOfWeek;
    }).length;

    const weekProgress = weeklyGoal > 0 ? Math.round((currentWeekCompleted / weeklyGoal) * 100) : 0;

    return {
      weeklyGoal,
      currentWeekCompleted,
      weekProgress,
    };
  }
}