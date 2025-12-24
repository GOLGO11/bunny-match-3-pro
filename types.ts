
export enum GemType {
  TYPE_0 = 0,
  TYPE_1 = 1,
  TYPE_2 = 2,
  TYPE_3 = 3,
  TYPE_4 = 4,
  TYPE_5 = 5,
  TYPE_6 = 6,
  TYPE_7 = 7
}

export interface Point {
  x: number;
  y: number;
}

export interface Gem {
  id: string;
  type: GemType;
  gridX: number;
  gridY: number;
  visualX: number;
  visualY: number;
  isMatched: boolean;
  alpha: number;
  scale: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  SWAPPING = 'SWAPPING',
  MATCHING = 'MATCHING',
  FALLING = 'FALLING',
  REFILLING = 'REFILLING'
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
}
