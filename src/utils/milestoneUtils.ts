/**
 * Utility functions and dynamic style themes for 100-Day Milestones
 * 
 * Rules:
 * - Day 1 to Day 100: Cột mốc 100 ngày
 * - Day 101 to Day 200: Cột mốc 200 ngày
 * - Day 201 to Day 300: Cột mốc 300 ngày
 * - ... up to 3000 days!
 */

export interface MilestoneTheme {
  milestoneDays: number; // 100, 200, 300, 400...
  title: string;
  themeName: string;
  bgGradient: string;
  badgeBg: string;
  accentColor: string;
  glowColor: string;
  icon: string;
  quote: string;
  borderStyle: string;
}

/**
 * Calculates number of full days elapsed since start day
 */
export const getLoveDays = (startIsoString: string): number => {
  if (!startIsoString) return 1;
  try {
    const startTime = new Date(startIsoString).getTime();
    const now = Date.now();
    const diffMs = now - startTime;
    if (diffMs <= 0) return 1;
    // We add 1 so that the very first day is Day 1
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  } catch (e) {
    return 1;
  }
};

/**
 * Calculates start Date of a specific 100-day milestone era (e.g. for M = 100, starts on Day 1)
 */
export const getMilestoneStartDate = (startIsoString: string, milestoneDays: number): Date => {
  const base = new Date(startIsoString);
  const startDayNum = milestoneDays - 99; // Day 1, Day 101, Day 201...
  // Subtract 1 since Day 1 starts exactly on base date
  const milestoneStart = new Date(base.getTime() + (startDayNum - 1) * 24 * 60 * 60 * 1000);
  return milestoneStart;
};

/**
 * Calculates end Date of a specific 100-day milestone era (e.g. for M = 100, ends on Day 100)
 */
export const getMilestoneEndDate = (startIsoString: string, milestoneDays: number): Date => {
  const base = new Date(startIsoString);
  const endDayNum = milestoneDays; // Day 100, Day 200, Day 300...
  // Day M ends at the end of the Mth day (e.g. 23:59:59.999)
  const milestoneEnd = new Date(base.getTime() + endDayNum * 24 * 60 * 60 * 1000 - 1);
  return milestoneEnd;
};

/**
 * Returns dynamic milestone theme per 100 days
 */
export const getMilestoneTheme = (milestoneDays: number): MilestoneTheme => {
  // Map milestoneDays (100, 200, 300...) to theme index (0, 1, 2...)
  const index = Math.max(0, Math.floor((milestoneDays - 1) / 100));

  const themes = [
    {
      title: "Cột Mốc 100 Ngày",
      themeName: "Song Hành Bách Nhật 💜",
      bgGradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#6c5ce7",
      glowColor: "rgba(161, 140, 209, 0.4)",
      icon: "💖",
      quote: "Trăm ngày gắn kết, trăm khoảnh khắc đong đầy yêu thương.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.7)",
    },
    {
      title: "Cột Mốc 200 Ngày",
      themeName: "Song Bách Gắn Kết 💚",
      bgGradient: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
      badgeBg: "rgba(255, 255, 255, 0.4)",
      accentColor: "#00b894",
      glowColor: "rgba(132, 250, 176, 0.4)",
      icon: "🌿",
      quote: "200 ngày cùng nhau vượt qua giông bão, vun đắp tương lai.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.8)",
    },
    {
      title: "Cột Mốc 300 Ngày",
      themeName: "Tam Bách Mặn Nồng 🧡",
      bgGradient: "linear-gradient(135deg, #ff9a44 0%, #fc6076 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#e17055",
      glowColor: "rgba(255, 154, 68, 0.4)",
      icon: "🔥",
      quote: "Tình yêu thêm đậm đà, từng thói quen đều có bóng dáng nhau.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.7)",
    },
    {
      title: "Cột Mốc 400 Ngày",
      themeName: "Bốn Trăm Ngày Thâm Tình ❤️",
      bgGradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#d63031",
      glowColor: "rgba(255, 117, 140, 0.4)",
      icon: "🌹",
      quote: "Bốn trăm ngày bên em, đời anh hóa khúc nhạc vui.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.7)",
    },
    {
      title: "Cột Mốc 500 Ngày",
      themeName: "Nửa Ngàn Ngày Yêu 💎",
      bgGradient: "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)",
      badgeBg: "rgba(255, 255, 255, 0.3)",
      accentColor: "#0984e3",
      glowColor: "rgba(168, 192, 255, 0.4)",
      icon: "💎",
      quote: "Nửa ngàn ngày vun đắp, tình ta sáng tựa kim cương.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.6)",
    },
    {
      title: "Cột Mốc 600 Ngày",
      themeName: "Lục Bách Vĩnh Cửu 🍷",
      bgGradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#fd79a8",
      glowColor: "rgba(248, 87, 166, 0.4)",
      icon: "🍷",
      quote: "Tình say như rượu vang ủ lâu năm, càng đậm càng ngọt.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.7)",
    },
    {
      title: "Cột Mốc 700 Ngày",
      themeName: "Thất Bách Thâm Nhớ 🌌",
      bgGradient: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
      badgeBg: "rgba(255, 255, 255, 0.3)",
      accentColor: "#74b9ff",
      glowColor: "rgba(0, 198, 255, 0.4)",
      icon: "✨",
      quote: "700 ngày - Hai năm rưỡi viết nên câu chuyện cổ tích ngọt ngào.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.6)",
    },
    {
      title: "Cột Mốc 800 Ngày",
      themeName: "Bát Bách Giao Thoa 👑",
      bgGradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#fdcb6e",
      glowColor: "rgba(246, 211, 101, 0.4)",
      icon: "👑",
      quote: "Trong mắt anh, em luôn là hoàng hậu duy nhất.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.8)",
    },
    {
      title: "Cột Mốc 900 Ngày",
      themeName: "Cửu Bách Son Thắt 🔮",
      bgGradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#a29bfe",
      glowColor: "rgba(224, 195, 252, 0.4)",
      icon: "🔮",
      quote: "Gần 1000 ngày cùng chung nhịp đập, trọn đời bên nhau.",
      borderStyle: "1px solid rgba(255, 255, 255, 0.7)",
    },
    {
      title: "Cột Mốc 1000 Ngày",
      themeName: "Thiên Nhật Kim Cương 💖✨",
      bgGradient: "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
      badgeBg: "rgba(255, 255, 255, 0.35)",
      accentColor: "#ff7675",
      glowColor: "rgba(247, 112, 98, 0.4)",
      icon: "👑",
      quote: "Một nghìn ngày - Cột mốc vàng chứng nhân cho tình yêu vĩnh cửu!",
      borderStyle: "1px solid rgba(255, 255, 255, 0.8)",
    },
  ];

  const themeIndex = index % themes.length;
  const targetTheme = themes[themeIndex];

  return {
    milestoneDays,
    title: `Cột Mốc ${milestoneDays} Ngày`,
    themeName: targetTheme.themeName.replace(/\d+ Ngày/, `${milestoneDays} Ngày`),
    bgGradient: targetTheme.bgGradient,
    badgeBg: targetTheme.badgeBg,
    accentColor: targetTheme.accentColor,
    glowColor: targetTheme.glowColor,
    icon: targetTheme.icon,
    quote: targetTheme.quote,
    borderStyle: targetTheme.borderStyle,
  };
};

export interface MilestoneEraInfo {
  milestoneIndex: number; // 1, 2, 3...
  milestoneDays: number;  // 100, 200, 300...
  title: string;
  themeName: string;
  startDate: Date;
  endDate: Date;
  status: "achieved" | "current" | "upcoming";
  progressPercent: number;
  daysToTarget: number;
}

/**
 * Returns all milestone eras up to 3000 days or maximum display
 */
export const getMilestoneEras = (startIsoString: string, currentDays: number): MilestoneEraInfo[] => {
  // Current active milestone target (e.g. M = 100 if days is 45, M = 200 if days is 101)
  const currentMilestoneDays = Math.ceil(currentDays / 100) * 100;
  
  // Display up to 3000 days
  const maxMilestoneDays = Math.min(3000, Math.max(currentMilestoneDays + 300, 1000));

  const eras: MilestoneEraInfo[] = [];

  for (let m = 100; m <= maxMilestoneDays; m += 100) {
    const startDate = getMilestoneStartDate(startIsoString, m);
    const endDate = getMilestoneEndDate(startIsoString, m);
    const theme = getMilestoneTheme(m);

    let status: "achieved" | "current" | "upcoming" = "upcoming";
    let progressPercent = 0;
    let daysToTarget = m - currentDays;

    if (m < currentMilestoneDays) {
      status = "achieved";
      progressPercent = 100;
      daysToTarget = 0;
    } else if (m === currentMilestoneDays) {
      status = "current";
      // Days elapsed inside the current 100-day era
      const daysIntoCurrentMilestone = currentDays - (m - 100);
      progressPercent = Math.min(100, Math.max(0, Math.round((daysIntoCurrentMilestone / 100) * 100)));
      daysToTarget = m - currentDays;
    } else {
      status = "upcoming";
      progressPercent = 0;
    }

    eras.push({
      milestoneIndex: m / 100,
      milestoneDays: m,
      title: theme.title,
      themeName: theme.themeName,
      startDate,
      endDate,
      status,
      progressPercent,
      daysToTarget,
    });
  }

  return eras;
};
