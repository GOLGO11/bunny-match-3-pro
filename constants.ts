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

// 关卡配置（基于分数）
export interface LevelConfig {
  level: number;           // 关卡编号（1-4）
  minScore: number;        // 最低分数（包含）
  maxScore: number | null; // 最高分数（null表示无上限）
  timeLimit: number;       // 倒计时时间（秒）
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, minScore: 0, maxScore: 300000, timeLimit: 25 },      // 第一关：0-30万分，25秒
  { level: 2, minScore: 300000, maxScore: 600000, timeLimit: 15 },  // 第二关：30-60万分，15秒
  { level: 3, minScore: 600000, maxScore: 900000, timeLimit: 8 },    // 第三关：60-90万分，8秒
  { level: 4, minScore: 900000, maxScore: null, timeLimit: 5 },     // 第四关：90万分以上，5秒
];

// 根据分数获取当前关卡配置
export function getLevelByScore(score: number): LevelConfig {
  for (const config of LEVEL_CONFIGS) {
    if (score >= config.minScore && (config.maxScore === null || score < config.maxScore)) {
      return config;
    }
  }
  // 如果分数超出所有关卡，返回最后一关
  return LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
}

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


