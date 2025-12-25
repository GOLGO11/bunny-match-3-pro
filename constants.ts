export const GRID_SIZE = 6; // 6*6网格，更适合移动端

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
// 6*6网格：36个格子，调整难度配置以适应更小的网格
export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    gemTypeCount: 3,      // 简单：使用3种兔子类型（平均每种12个）
    icon: '🐰'
  },
  [Difficulty.MEDIUM]: {
    gemTypeCount: 4,      // 中等：使用4种兔子类型（平均每种9个）
    icon: '🐇'
  },
  [Difficulty.HARD]: {
    gemTypeCount: 6,      // 困难：使用6种兔子类型（平均每种6个）
    icon: '🔥'
  }
};

import { getAssetPath } from './utils/paths';

// 8 个兔子图片，占位图（在线 URL）。如果有自己的素材，可以把这些 URL 换成你自己的。
export const RABBIT_IMAGES = [
  getAssetPath('rabbits/rabbit0.png'),
  getAssetPath('rabbits/rabbit1.png'),
  getAssetPath('rabbits/rabbit2.png'),
  getAssetPath('rabbits/rabbit3.png'),
  getAssetPath('rabbits/rabbit4.png'),
  getAssetPath('rabbits/rabbit5.png'),
  getAssetPath('rabbits/rabbit6.png'),
  getAssetPath('rabbits/rabbit7.png'),
];


