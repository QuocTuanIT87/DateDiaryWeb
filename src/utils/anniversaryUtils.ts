/**
 * Utility for managing special Anniversaries & Color-Coded Banner Reminders
 * 
 * Rules:
 * - 1 month before (22-30 days): Banner level 1 (Cyan/Teal)
 * - 3 weeks before (15-21 days): Banner level 2 (Purple/Indigo)
 * - 2 weeks before (8-14 days): Banner level 3 (Amber/Orange)
 * - 1 week before (1-7 days): Banner level 4 (Rose Crimson Red)
 * - Exact Day (0 days): Banner level 5 (Gold & Royal Diamond Magenta - Final Color)
 * - Post 1 week (+1 to +7 days after): Remains on Level 5 color EXCEPT if an upcoming anniversary enters a reminder window, in which case the upcoming anniversary banner takes priority!
 */

export interface AnniversaryItem {
  id: string;
  title: string;
  month: number; // 1-12
  day: number;   // 1-31
  category: "birthday" | "couple" | "holiday";
  icon: string;
  note?: string;
}

export type BannerWindowLevel = 
  | "one_month"      // 22-30 days before
  | "three_weeks"    // 15-21 days before
  | "two_weeks"      // 8-14 days before
  | "one_week"       // 1-7 days before
  | "exact_day"      // Day 0
  | "post_one_week"  // 1-7 days after
  | "none";

export interface AnniversaryBannerState {
  anniversary: AnniversaryItem;
  nextDate: Date;
  diffDays: number; // positive = days until event, 0 = today, negative = days past
  level: BannerWindowLevel;
  badgeLabel: string;
  gradientBg: string;
  textColor: string;
  accentIcon: string;
  urgencyScore: number; // 100 for exact_day, 80 for 1_week, 60 for 2_weeks, 40 for 3_weeks, 20 for 1_month, 10 for post_one_week
}

/**
 * Standard Default Anniversaries per User Requirements:
 * - Sinh nhật nữ: 10 tháng 5
 * - Sinh nhật nam: 8 tháng 7
 * - Ngày Kỷ niệm Tỏ Tình: 1 tháng 1
 * - Các ngày lễ đặc biệt: Valentine 14/2, 8/3, 20/10, 25/12, 1/1
 */
export const DEFAULT_ANNIVERSARIES: AnniversaryItem[] = [
  {
    id: "female_birthday",
    title: "Sinh nhật Bé Yêu (Nữ) 🎂",
    month: 5,
    day: 10,
    category: "birthday",
    icon: "🎀",
    note: "Ngày sinh nhật của công chúa nhỏ (10/05)",
  },
  {
    id: "male_birthday",
    title: "Sinh nhật Anh (Nam) 🎂",
    month: 7,
    day: 8,
    category: "birthday",
    icon: "🎩",
    note: "Ngày sinh nhật của chàng trai (08/07)",
  },
  {
    id: "confession_anniversary",
    title: "Kỷ Niệm Ngày Tỏ Tình 💕",
    month: 1,
    day: 1,
    category: "couple",
    icon: "💖",
    note: "Tròn năm ngày chính thức bên nhau",
  },
  {
    id: "acquainted_anniversary",
    title: "Kỷ Niệm Ngày Quen Nhau 🌹",
    month: 9,
    day: 29,
    category: "couple",
    icon: "👩‍❤️‍👨",
    note: "Ngày định mệnh gặp gỡ lần đầu tiên (29/09)",
  },
  {
    id: "valentine",
    title: "Lễ Tình Nhân Valentine 💘",
    month: 2,
    day: 14,
    category: "holiday",
    icon: "💌",
    note: "Ngày tôn vinh tình yêu lứa đôi",
  },
  {
    id: "women_day_83",
    title: "Quốc Tế Phụ Nữ 8/3 🌸",
    month: 3,
    day: 8,
    category: "holiday",
    icon: "💐",
    note: "Dành tặng món quà bất ngờ cho em",
  },
  {
    id: "vn_women_day_2010",
    title: "Phụ Nữ Việt Nam 20/10 🌷",
    month: 10,
    day: 20,
    category: "holiday",
    icon: "🌺",
    note: "Ngày tôn vinh người phụ nữ yêu thương",
  },
  {
    id: "christmas",
    title: "Đêm Giáng Sinh Christmas 🎄",
    month: 12,
    day: 25,
    category: "holiday",
    icon: "🎅",
    note: "Đón Giáng Sinh ấm áp bên nhau",
  },
  {
    id: "new_year",
    title: "Mùng 1 Tết Dương Lịch 🎆",
    month: 1,
    day: 1,
    category: "holiday",
    icon: "✨",
    note: "Cùng nhau chào đón năm mới hạnh phúc",
  },
];

/**
 * Calculates next date of annual anniversary given current reference date
 */
export const getNextAnniversaryDate = (anniversary: AnniversaryItem, now: Date = new Date()): { nextDate: Date; diffDays: number } => {
  const currentYear = now.getFullYear();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Try anniversary in current year
  const thisYearDate = new Date(currentYear, anniversary.month - 1, anniversary.day);
  const thisYearTime = thisYearDate.getTime();

  // Calculate day difference
  const msInDay = 24 * 60 * 60 * 1000;
  const diffDaysThisYear = Math.round((thisYearTime - todayStart) / msInDay);

  // If the date was within the past 7 days, it's in the post_one_week window!
  if (diffDaysThisYear >= -7 && diffDaysThisYear <= 0) {
    return { nextDate: thisYearDate, diffDays: diffDaysThisYear };
  }

  // If this year date has passed (older than 7 days), target next year's occurrence
  if (diffDaysThisYear < -7) {
    const nextYearDate = new Date(currentYear + 1, anniversary.month - 1, anniversary.day);
    const diffDaysNextYear = Math.round((nextYearDate.getTime() - todayStart) / msInDay);
    return { nextDate: nextYearDate, diffDays: diffDaysNextYear };
  }

  return { nextDate: thisYearDate, diffDays: diffDaysThisYear };
};

/**
 * Returns color-coded banner configuration based on remaining days
 */
export const evaluateAnniversaryBannerState = (
  anniversary: AnniversaryItem,
  now: Date = new Date()
): AnniversaryBannerState | null => {
  const { nextDate, diffDays } = getNextAnniversaryDate(anniversary, now);

  let level: BannerWindowLevel = "none";
  let badgeLabel = "";
  let gradientBg = "";
  let textColor = "#ffffff";
  let accentIcon = anniversary.icon;
  let urgencyScore = 0;

  if (diffDays === 0) {
    level = "exact_day";
    badgeLabel = "🎉 HÔM NAY LÀ KỶ NIỆM!";
    gradientBg = "linear-gradient(135deg, #FFD700 0%, #FF1493 50%, #7928CA 100%)"; // Gold & Diamond Pink (Final celebration color)
    accentIcon = "💖✨🎉";
    urgencyScore = 100;
  } else if (diffDays < 0 && Math.abs(diffDays) <= 7) {
    level = "post_one_week";
    badgeLabel = `🥂 ĐỢT KỶ NIỆM NGỌT NGÀO (+${Math.abs(diffDays)} ngày)`;
    gradientBg = "linear-gradient(135deg, #FFD700 0%, #FF1493 50%, #7928CA 100%)"; // Keeps final celebration color
    accentIcon = "🥂✨";
    urgencyScore = 10; // Low score so any UPCOMING upcoming anniversary takes priority!
  } else if (diffDays >= 1 && diffDays <= 7) {
    level = "one_week";
    badgeLabel = `❤️ SẮP ĐẾN RỒI! (Còn ${diffDays} ngày)`;
    gradientBg = "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"; // Passionate Rose Red
    accentIcon = "🚨❤️";
    urgencyScore = 80;
  } else if (diffDays >= 8 && diffDays <= 14) {
    level = "two_weeks";
    badgeLabel = `🧡 CÒN 2 TUẦN NỮA! (Còn ${diffDays} ngày)`;
    gradientBg = "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"; // Warm Amber Orange
    accentIcon = "🧡⏰";
    urgencyScore = 60;
  } else if (diffDays >= 15 && diffDays <= 21) {
    level = "three_weeks";
    badgeLabel = `💜 CÒN 3 TUẦN NỮA (Còn ${diffDays} ngày)`;
    gradientBg = "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)"; // Elegant Purple/Indigo
    accentIcon = "💜📅";
    urgencyScore = 40;
  } else if (diffDays >= 22 && diffDays <= 30) {
    level = "one_month";
    badgeLabel = `🩵 CÒN 1 THÁNG NỮA (Còn ${diffDays} ngày)`;
    gradientBg = "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"; // Sky Teal/Cyan
    accentIcon = "🩵🗓️";
    urgencyScore = 20;
  } else {
    return null; // Not in any active reminder banner window
  }

  return {
    anniversary,
    nextDate,
    diffDays,
    level,
    badgeLabel,
    gradientBg,
    textColor,
    accentIcon,
    urgencyScore,
  };
};

/**
 * Resolves Priority when multiple anniversaries are active in window:
 * - Upcoming anniversaries in reminder stages ALWAYS take precedence over post-1-week past anniversaries.
 * - Higher urgency score (Exact Day > 1 Week > 2 Weeks > 3 Weeks > 1 Month > Post 1 Week) wins.
 */
export const getActiveAnniversaryBanners = (
  customList: AnniversaryItem[] = DEFAULT_ANNIVERSARIES,
  now: Date = new Date()
): { primaryBanner: AnniversaryBannerState | null; allActiveBanners: AnniversaryBannerState[] } => {
  const activeBanners: AnniversaryBannerState[] = [];

  for (const ann of customList) {
    const state = evaluateAnniversaryBannerState(ann, now);
    if (state) {
      activeBanners.push(state);
    }
  }

  if (activeBanners.length === 0) {
    return { primaryBanner: null, allActiveBanners: [] };
  }

  // Sort by urgency score descending (100 -> 80 -> 60 -> 40 -> 20 -> 10)
  // If tied, sort by smaller diffDays (closer date first)
  activeBanners.sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }
    return Math.abs(a.diffDays) - Math.abs(b.diffDays);
  });

  return {
    primaryBanner: activeBanners[0],
    allActiveBanners: activeBanners,
  };
};
