import { Injectable } from '@nestjs/common';

export interface SunnahOpportunity {
  type: string;
  name: string;
  description: string;
  isToday: boolean;
  hijriDate?: string;
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

@Injectable()
export class SunnahOpportunitiesService {
  private readonly hijriMonthNames = [
    'Muharram',
    'Safar',
    'Rabi al-Awwal',
    'Rabi al-Thani',
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    'Shaban',
    'Ramadan',
    'Shawwal',
    'Dhul Qadah',
    'Dhul Hijjah',
  ];

  /**
   * Simple Hijri date approximation
   * Note: For production, use a proper library like hijri-converter
   * This is a simplified calculation and may be off by 1-2 days
   */
  getApproximateHijriDate(gregorianDate: Date = new Date()): HijriDate {
    // Hijri epoch: July 16, 622 CE (Julian) = July 19, 622 CE (Gregorian)
    const hijriEpoch = new Date(622, 6, 19);
    const msPerDay = 86400000;
    const daysSinceEpoch = Math.floor(
      (gregorianDate.getTime() - hijriEpoch.getTime()) / msPerDay,
    );

    // Average Hijri year length in days
    const hijriYearLength = 354.36667;
    const hijriMonthLength = 29.530588853;

    const hijriYear = Math.floor(daysSinceEpoch / hijriYearLength) + 1;
    const daysIntoYear = daysSinceEpoch % Math.floor(hijriYearLength);
    const hijriMonth = Math.floor(daysIntoYear / hijriMonthLength) + 1;
    const hijriDay = Math.floor(daysIntoYear % hijriMonthLength) + 1;

    return {
      day: Math.min(hijriDay, 30),
      month: Math.min(hijriMonth, 12),
      year: hijriYear,
      monthName: this.hijriMonthNames[Math.min(hijriMonth, 12) - 1],
    };
  }

  /**
   * Check if today is one of the White Days (13th, 14th, 15th of Hijri month)
   */
  isWhiteDay(hijriDate: HijriDate): boolean {
    return [13, 14, 15].includes(hijriDate.day);
  }

  /**
   * Check if today is Monday
   */
  isMonday(date: Date = new Date()): boolean {
    return date.getDay() === 1;
  }

  /**
   * Check if today is Thursday
   */
  isThursday(date: Date = new Date()): boolean {
    return date.getDay() === 4;
  }

  /**
   * Check if current month is Shaban (8th Hijri month)
   */
  isShaban(hijriDate: HijriDate): boolean {
    return hijriDate.month === 8;
  }

  /**
   * Check if today is Day of Arafah (9th of Dhul Hijjah)
   */
  isDayOfArafah(hijriDate: HijriDate): boolean {
    return hijriDate.month === 12 && hijriDate.day === 9;
  }

  /**
   * Check if today is Day of Ashura (10th of Muharram) or day before/after
   */
  isAshuraWindow(hijriDate: HijriDate): boolean {
    return hijriDate.month === 1 && [9, 10, 11].includes(hijriDate.day);
  }

  /**
   * Check if we're in the 6 days of Shawwal
   */
  isShawwalSix(hijriDate: HijriDate): boolean {
    // After Eid (2nd of Shawwal) until 7th
    return hijriDate.month === 10 && hijriDate.day >= 2 && hijriDate.day <= 7;
  }

  /**
   * Get all sunnah opportunities for a given date
   */
  getOpportunities(date: Date = new Date()): SunnahOpportunity[] {
    const hijriDate = this.getApproximateHijriDate(date);
    const opportunities: SunnahOpportunity[] = [];

    // Check Monday/Thursday
    if (this.isMonday(date)) {
      opportunities.push({
        type: 'monday',
        name: 'Monday Fast',
        description: 'The Prophet ﷺ used to fast on Mondays and Thursdays',
        isToday: true,
      });
    }

    if (this.isThursday(date)) {
      opportunities.push({
        type: 'thursday',
        name: 'Thursday Fast',
        description: 'The Prophet ﷺ used to fast on Mondays and Thursdays',
        isToday: true,
      });
    }

    // Check White Days
    if (this.isWhiteDay(hijriDate)) {
      opportunities.push({
        type: 'white_days',
        name: 'White Days',
        description: `Fasting the 13th, 14th, and 15th of the lunar month (Day ${hijriDate.day} of ${hijriDate.monthName})`,
        isToday: true,
        hijriDate: `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}`,
      });
    }

    // Check Shaban
    if (this.isShaban(hijriDate)) {
      opportunities.push({
        type: 'shaban',
        name: 'Shaban Fasting',
        description: 'The Prophet ﷺ used to fast most of Shaban',
        isToday: true,
        hijriDate: `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year}`,
      });
    }

    // Check Day of Arafah
    if (this.isDayOfArafah(hijriDate)) {
      opportunities.push({
        type: 'arafah',
        name: 'Day of Arafah',
        description: 'Fasting expiates sins of the previous year and the coming year',
        isToday: true,
        hijriDate: `9 Dhul Hijjah ${hijriDate.year}`,
      });
    }

    // Check Ashura
    if (this.isAshuraWindow(hijriDate)) {
      opportunities.push({
        type: 'ashura',
        name: 'Ashura & Surrounding Days',
        description: 'Fasting the 9th, 10th, or 11th of Muharram',
        isToday: true,
        hijriDate: `${hijriDate.day} Muharram ${hijriDate.year}`,
      });
    }

    // Check Shawwal Six
    if (this.isShawwalSix(hijriDate)) {
      opportunities.push({
        type: 'shawwal',
        name: 'Six Days of Shawwal',
        description: 'Fasting six days in Shawwal after Ramadan',
        isToday: true,
        hijriDate: `${hijriDate.day} Shawwal ${hijriDate.year}`,
      });
    }

    return opportunities;
  }

  /**
   * Get upcoming sunnah opportunities (next 7 days)
   */
  getUpcomingOpportunities(startDate: Date = new Date()): SunnahOpportunity[] {
    const upcoming: SunnahOpportunity[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayOpportunities = this.getOpportunities(checkDate);
      
      for (const opp of dayOpportunities) {
        if (!seen.has(opp.type)) {
          seen.add(opp.type);
          upcoming.push({
            ...opp,
            isToday: i === 0,
          });
        }
      }
    }

    return upcoming;
  }

  /**
   * Get current Hijri date info for display
   */
  getCurrentHijriInfo(): { date: HijriDate; formatted: string } {
    const hijriDate = this.getApproximateHijriDate();
    return {
      date: hijriDate,
      formatted: `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} AH`,
    };
  }
}
