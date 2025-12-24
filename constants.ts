export const GRID_SIZE = 9; // 改为9*9

export const GEM_COLORS = [
  '#ff4d4d',
  '#38bdf8',
  '#4ade80',
  '#fbbf24',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#06b6d4',
];

export const BASE_SCORE = 100;
export const MATCH_MIN_COUNT = 3;

// 难度配置
export enum Difficulty {
  EASY = 'easy',      // 简单：使用4种兔子类型
  MEDIUM = 'medium',  // 中等：使用6种兔子类型
  HARD = 'hard'       // 困难：使用8种兔子类型
}

// 难度配置（名称和描述通过国际化获取）
export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    gemTypeCount: 4,      // 只使用4种兔子类型
    icon: '🐰'
  },
  [Difficulty.MEDIUM]: {
    gemTypeCount: 6,      // 使用6种兔子类型
    icon: '🐇'
  },
  [Difficulty.HARD]: {
    gemTypeCount: 8,      // 使用全部8种兔子类型
    icon: '🔥'
  }
};

// 8 个兔子图片，占位图（在线 URL）。如果有自己的素材，可以把这些 URL 换成你自己的。
export const RABBIT_IMAGES = [
  '/rabbits/rabbit0.png',
  '/rabbits/rabbit1.png',
  '/rabbits/rabbit2.png',
  '/rabbits/rabbit3.png',
  '/rabbits/rabbit4.png',
  '/rabbits/rabbit5.png',
  '/rabbits/rabbit6.png',
  '/rabbits/rabbit7.png',

];


