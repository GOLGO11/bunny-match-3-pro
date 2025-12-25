
import { Gem, GemType, GameStatus } from '../types';
import { GRID_SIZE, BASE_SCORE, MATCH_MIN_COUNT, Difficulty, DIFFICULTY_CONFIG, LevelConfig, getLevelByScore } from '../constants';

export class GameEngine {
  grid: (Gem | null)[][] = [];
  status: GameStatus = GameStatus.IDLE;
  scoreCallback: (score: number, combo: number) => void;
  matchCallback?: (matches: Gem[]) => void; // 消除回调
  noMovesCallback?: () => void; // 无解法回调
  timeUpCallback?: () => void; // 时间到回调（所有难度）
  comboCount: number = 0;
  difficulty: Difficulty;
  gemTypeCount: number; // 当前难度使用的兔子类型数量
  
  // 关卡系统
  private currentScore: number = 0; // 当前累计分数
  private currentLevel: LevelConfig; // 当前关卡配置
  levelChangeCallback?: (oldLevel: number, newLevel: number, levelConfig: LevelConfig) => void; // 关卡切换回调
  
  // 计时器相关（所有难度）
  private timerInterval: number | null = null;
  private timeRemaining: number = 20; // 当前剩余时间
  private timerStarted: boolean = false; // 计时器是否已启动
  private timerPaused: boolean = false; // 计时器是否已暂停
  
  constructor(
    onScore: (s: number, c: number) => void, 
    onMatch?: (matches: Gem[]) => void,
    onNoMoves?: () => void,
    onTimeUp?: () => void,
    difficulty: Difficulty = Difficulty.MEDIUM
  ) {
    this.scoreCallback = onScore;
    this.matchCallback = onMatch;
    this.noMovesCallback = onNoMoves;
    this.timeUpCallback = onTimeUp;
    this.difficulty = difficulty;
    this.gemTypeCount = DIFFICULTY_CONFIG[difficulty].gemTypeCount;
    this.currentScore = 0;
    this.currentLevel = getLevelByScore(0); // 初始为第一关
    this.timeRemaining = this.currentLevel.timeLimit;
    this.initGrid();
    // 计时器在第一次交换后才启动
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initGrid() {
    this.grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let attempts = 0;
        while (attempts < 100) {
          const gem = this.createGem(x, y);
          this.grid[y][x] = gem;
          if (!this.checkSpecificMatch(x, y)) break;
          attempts++;
        }
      }
    }
    this.status = GameStatus.IDLE;
  }

  private checkSpecificMatch(x: number, y: number): boolean {
    const type = this.grid[y][x]?.type;
    if (type === undefined) return false;
    if (x >= 2 && this.grid[y][x-1]?.type === type && this.grid[y][x-2]?.type === type) return true;
    if (y >= 2 && this.grid[y-1][x]?.type === type && this.grid[y-2][x]?.type === type) return true;
    return false;
  }

  createGem(x: number, y: number, type?: GemType): Gem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      // 根据难度随机生成兔子类型（0 到 gemTypeCount-1）
      type: type ?? (Math.floor(Math.random() * this.gemTypeCount) as GemType),
      gridX: x,
      gridY: y,
      visualX: x,
      visualY: y,
      isMatched: false,
      alpha: 1,
      scale: 1
    };
  }

  findMatches(): Gem[] {
    const matched = new Set<Gem>();
    // Horizontal
    for (let y = 0; y < GRID_SIZE; y++) {
      let tempMatch = [this.grid[y][0]];
      for (let x = 1; x < GRID_SIZE; x++) {
        const current = this.grid[y][x];
        const last = tempMatch[tempMatch.length - 1];
        if (current && last && current.type === last.type) {
          tempMatch.push(current);
        } else {
          if (tempMatch.length >= MATCH_MIN_COUNT) tempMatch.forEach(g => g && matched.add(g));
          tempMatch = [current];
        }
      }
      if (tempMatch.length >= MATCH_MIN_COUNT) tempMatch.forEach(g => g && matched.add(g));
    }
    // Vertical
    for (let x = 0; x < GRID_SIZE; x++) {
      let tempMatch = [this.grid[0][x]];
      for (let y = 1; y < GRID_SIZE; y++) {
        const current = this.grid[y][x];
        const last = tempMatch[tempMatch.length - 1];
        if (current && last && current.type === last.type) {
          tempMatch.push(current);
        } else {
          if (tempMatch.length >= MATCH_MIN_COUNT) tempMatch.forEach(g => g && matched.add(g));
          tempMatch = [current];
        }
      }
      if (tempMatch.length >= MATCH_MIN_COUNT) tempMatch.forEach(g => g && matched.add(g));
    }
    return Array.from(matched);
  }

  async swapGems(p1: {x: number, y: number}, p2: {x: number, y: number}) {
    if (this.status !== GameStatus.IDLE) return;
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) return;

    // 在交换开始时立即启动或重置计时器（所有难度）
    // 这样用户一有动作就重置计时器
    if (!this.timerStarted) {
      // 第一次交换，启动计时器
      this.startTimer();
    } else {
      // 后续交换，重置计时器
      this.resetTimer();
    }

    try {
      this.status = GameStatus.SWAPPING;
      const g1 = this.grid[p1.y][p1.x];
      const g2 = this.grid[p2.y][p2.x];
      if (!g1 || !g2) throw new Error("Missing gems");
      this.grid[p1.y][p1.x] = g2; g2.gridX = p1.x; g2.gridY = p1.y;
      this.grid[p2.y][p2.x] = g1; g1.gridX = p2.x; g1.gridY = p2.y;
      await this.sleep(250);
      const matches = this.findMatches();
      if (matches.length > 0) {
        await this.handleSequencing(matches);
      } else {
        this.grid[p1.y][p1.x] = g1; g1.gridX = p1.x; g1.gridY = p1.y;
        this.grid[p2.y][p2.x] = g2; g2.gridX = p2.x; g2.gridY = p2.y;
        await this.sleep(250);
        this.status = GameStatus.IDLE;
      }
    } catch (e) {
      this.status = GameStatus.IDLE;
    }
  }

  // 更新分数并检测关卡切换（从外部调用，传入当前总分数）
  updateScore(totalScore: number) {
    const oldLevel = this.currentLevel.level;
    this.currentScore = totalScore;
    const newLevelConfig = getLevelByScore(totalScore);
    
    // 检测关卡是否切换
    if (newLevelConfig.level !== this.currentLevel.level) {
      const oldLevelNum = this.currentLevel.level;
      this.currentLevel = newLevelConfig;
      
      // 如果计时器已启动，重置为新的时间限制
      if (this.timerStarted) {
        this.resetTimer();
      }
      
      // 触发关卡切换回调
      if (this.levelChangeCallback) {
        this.levelChangeCallback(oldLevelNum, newLevelConfig.level, newLevelConfig);
      }
    }
  }

  // 获取当前关卡信息
  getCurrentLevel(): LevelConfig {
    return this.currentLevel;
  }

  // 获取当前关卡编号
  getCurrentLevelNumber(): number {
    return this.currentLevel.level;
  }

  private async handleSequencing(initialMatches: Gem[]) {
    let currentMatches = initialMatches;
    this.comboCount = 1;
    
    // 第一次匹配时重置计时器（如果计时器已启动）
    if (this.timerStarted) {
      this.resetTimer();
    }
    
    try {
      while (currentMatches.length > 0) {
        this.status = GameStatus.MATCHING;
        currentMatches.forEach(g => g.isMatched = true);
        this.scoreCallback(currentMatches.length * BASE_SCORE * this.comboCount, this.comboCount);
        // 触发消除特效
        if (this.matchCallback) {
          this.matchCallback(currentMatches);
        }
        await this.sleep(450);
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (this.grid[y][x]?.isMatched) this.grid[y][x] = null;
          }
        }
        this.status = GameStatus.FALLING;
        this.applyGravity();
        await this.sleep(350);
        this.status = GameStatus.REFILLING;
        this.refill();
        await this.sleep(400);
        currentMatches = this.findMatches();
        if (currentMatches.length > 0) {
          this.comboCount++;
          // 每次combo发生时重置计时器
          if (this.timerStarted) {
            this.resetTimer();
          }
        }
      }
    } finally {
      this.status = GameStatus.IDLE;
      this.comboCount = 0;
      const missed = this.findMatches();
      if (missed.length > 0) {
        this.handleSequencing(missed);
      } else {
        // 消除完成后，检查是否还有可用的解法
        if (!this.hasPossibleMoves()) {
          if (this.noMovesCallback) {
            this.noMovesCallback();
          }
        }
      }
    }
  }

  private applyGravity() {
    for (let x = 0; x < GRID_SIZE; x++) {
      let empty = 0;
      for (let y = GRID_SIZE - 1; y >= 0; y--) {
        if (this.grid[y][x] === null) empty++;
        else if (empty > 0) {
          const gem = this.grid[y][x]!;
          this.grid[y + empty][x] = gem;
          this.grid[y][x] = null;
          gem.gridY = y + empty;
        }
      }
    }
  }

  private refill() {
    for (let x = 0; x < GRID_SIZE; x++) {
      let missingCount = 0;
      for (let y = GRID_SIZE - 1; y >= 0; y--) {
        if (this.grid[y][x] === null) {
          missingCount++;
          const gem = this.createGem(x, y);
          gem.visualX = x;
          gem.visualY = -missingCount - 0.5;
          this.grid[y][x] = gem;
        }
      }
    }
  }

  updateAnimations() {
    const speed = 0.25;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const gem = this.grid[y][x];
        if (!gem) continue;
        gem.visualX += (gem.gridX - gem.visualX) * speed;
        gem.visualY += (gem.gridY - gem.visualY) * speed;
        const targetScale = gem.isMatched ? 0 : 1;
        const targetAlpha = gem.isMatched ? 0 : 1;
        gem.scale += (targetScale - gem.scale) * speed;
        gem.alpha += (targetAlpha - gem.alpha) * speed;
      }
    }
  }

  // 检测是否还有可用的解法
  hasPossibleMoves(): boolean {
    // 检查所有相邻的交换是否可能形成三连
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const gem = this.grid[y][x];
        if (!gem) continue;

        // 检查右侧交换
        if (x < GRID_SIZE - 1) {
          const rightGem = this.grid[y][x + 1];
          if (rightGem && this.wouldCreateMatch(x, y, x + 1, y)) {
            return true;
          }
        }

        // 检查下方交换
        if (y < GRID_SIZE - 1) {
          const bottomGem = this.grid[y + 1][x];
          if (bottomGem && this.wouldCreateMatch(x, y, x, y + 1)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 检查交换两个位置是否会形成三连
  private wouldCreateMatch(x1: number, y1: number, x2: number, y2: number): boolean {
    // 临时交换
    const g1 = this.grid[y1][x1];
    const g2 = this.grid[y2][x2];
    if (!g1 || !g2) return false;

    this.grid[y1][x1] = g2;
    this.grid[y2][x2] = g1;

    // 检查交换后是否形成匹配
    const matches = this.findMatches();
    const hasMatch = matches.length > 0;

    // 恢复
    this.grid[y1][x1] = g1;
    this.grid[y2][x2] = g2;

    return hasMatch;
  }

  // 计时器相关方法（所有难度）
  private startTimer(): void {
    if (this.timerStarted) {
      console.log(`[GameEngine] Timer already started, skipping`);
      return;
    }
    console.log(`[GameEngine] Starting timer with timeLimit: ${this.currentLevel.timeLimit}`);
    this.timerStarted = true;
    // 确保计时器未被暂停
    this.timerPaused = false;
    // 使用当前关卡的时间限制
    this.timeRemaining = this.currentLevel.timeLimit;
    
    // 清除可能存在的旧计时器
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    console.log(`[GameEngine] Creating interval, timerPaused: ${this.timerPaused}, timeRemaining: ${this.timeRemaining}`);
    
    // 使用箭头函数确保 this 上下文正确
    const timerCallback = () => {
      console.log(`[GameEngine] Interval callback fired! timerPaused: ${this.timerPaused}, timeRemaining: ${this.timeRemaining}`);
      
      // 如果暂停，不减少时间
      if (this.timerPaused) {
        console.log(`[GameEngine] Timer is paused, skipping`);
        return;
      }
      
      if (this.timeRemaining > 0) {
        this.timeRemaining -= 1;
        // 调试：输出时间减少
        console.log(`[GameEngine] Time remaining: ${this.timeRemaining}`);
      }
      if (this.timeRemaining <= 0) {
        console.log(`[GameEngine] Time's up!`);
        this.stopTimer();
        // 确保只调用一次回调
        if (this.timeUpCallback) {
          const callback = this.timeUpCallback;
          this.timeUpCallback = undefined; // 防止重复调用
          callback();
        }
      }
    };
    
    this.timerInterval = window.setInterval(timerCallback, 1000);
    console.log(`[GameEngine] Timer interval created: ${this.timerInterval}`);
    
    // 立即测试一次回调，确保它能执行
    console.log(`[GameEngine] Testing callback immediately...`);
    setTimeout(() => {
      console.log(`[GameEngine] After 1 second, checking if callback was called...`);
      console.log(`[GameEngine] Current timeRemaining: ${this.timeRemaining}, timerInterval: ${this.timerInterval}`);
    }, 1100);
  }

  private resetTimer(): void {
    if (!this.timerStarted) return;
    // 重置为当前关卡的时间限制
    this.timeRemaining = this.currentLevel.timeLimit;
  }

  private stopTimer(): void {
    console.log(`[GameEngine] stopTimer called, timerInterval: ${this.timerInterval}`);
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      console.log(`[GameEngine] Timer interval cleared`);
    }
    // 注意：不重置 timerStarted，这样 UI 可以继续显示时间（即使为0）
    // 只有在 destroy() 时才重置 timerStarted
  }

  // 获取剩余时间（用于显示）
  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  // 检查计时器是否已启动且仍在运行
  isTimerActive(): boolean {
    // 计时器已启动且剩余时间大于0
    return this.timerStarted && this.timeRemaining > 0;
  }

  // 检查计时器是否已启动（用于显示）
  isTimerStarted(): boolean {
    return this.timerStarted;
  }

  // 暂停计时器
  pauseTimer(): void {
    this.timerPaused = true;
  }

  // 恢复计时器
  resumeTimer(): void {
    this.timerPaused = false;
  }

  // 清理资源
  destroy(): void {
    console.log(`[GameEngine] destroy() called, timerInterval: ${this.timerInterval}`);
    this.stopTimer();
    this.timerStarted = false;
    this.timerPaused = false;
    this.currentScore = 0;
    this.currentLevel = getLevelByScore(0);
    console.log(`[GameEngine] destroy() completed`);
  }
}
