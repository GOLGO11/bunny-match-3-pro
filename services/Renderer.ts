
import { Gem } from '../types';
import { GRID_SIZE, RABBIT_IMAGES } from '../constants';
import { ParticleEffect } from './ParticleEffect';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  cellSize: number = 0;
  padding: number = 6;
  rabbitImages: HTMLImageElement[] = [];
  isReady: boolean = false;
  particleEffect: ParticleEffect;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.particleEffect = new ParticleEffect(0);
  }

  async loadImages(): Promise<void> {
    const loadPromises = RABBIT_IMAGES.map(url => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.crossOrigin = "anonymous"; // 避免跨域画布污染
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    });

    try {
      this.rabbitImages = await Promise.all(loadPromises);
      this.isReady = true;
    } catch (e) {
      console.error("Failed to load rabbit images", e);
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cellSize = Math.min(width, height) / GRID_SIZE;
    this.particleEffect.setCellSize(this.cellSize);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    // 透明背景，让背景图显示出来
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制绿色藤条边框
    this.ctx.save();
    
    // 绘制每个格子的藤条边框
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        this.drawVineBorder(cellX, cellY, this.cellSize);
      }
    }
    
    this.ctx.restore();
  }

  // 绘制单个格子的树枝边框（闭合）
  private drawVineBorder(x: number, y: number, size: number) {
    const ctx = this.ctx;
    const lineWidth = 2.5;
    const padding = 3;
    
    ctx.save();
    
    // 使用绿色渐变
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#22c55e'); // 亮绿色
    gradient.addColorStop(0.5, '#16a34a'); // 中绿色
    gradient.addColorStop(1, '#15803d'); // 深绿色
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const innerX = x + padding;
    const innerY = y + padding;
    const innerSize = size - padding * 2;
    
    // 使用种子值创建每个格子独特的树枝样式
    const seed = (x / size + y / size) * 1000;
    const random = (offset: number) => {
      const s = Math.sin(seed + offset) * 10000;
      return s - Math.floor(s);
    };
    
    // 绘制闭合的树枝边框路径
    ctx.beginPath();
    
    // 定义四个角的坐标（确保闭合）
    const topLeft = { x: innerX, y: innerY };
    const topRight = { x: innerX + innerSize, y: innerY };
    const bottomRight = { x: innerX + innerSize, y: innerY + innerSize };
    const bottomLeft = { x: innerX, y: innerY + innerSize };
    
    // 从左上角开始，绘制闭合路径
    this.drawBranchSegment(ctx, topLeft, topRight, random(1), 'top');
    this.drawBranchSegment(ctx, topRight, bottomRight, random(2), 'right');
    this.drawBranchSegment(ctx, bottomRight, bottomLeft, random(3), 'bottom');
    this.drawBranchSegment(ctx, bottomLeft, topLeft, random(4), 'left');
    
    // 闭合路径
    ctx.closePath();
    ctx.stroke();
    
    // 在边框上随机添加小分支（向内）
    this.drawRandomBranches(ctx, innerX, innerY, innerSize, random);
    
    ctx.restore();
  }

  // 绘制树枝段（确保连接）
  private drawBranchSegment(
    ctx: CanvasRenderingContext2D,
    start: { x: number, y: number },
    end: { x: number, y: number },
    seed: number,
    side: 'top' | 'right' | 'bottom' | 'left'
  ) {
    const steps = 5;
    const isHorizontal = side === 'top' || side === 'bottom';
    
    // 移动到起点
    if (ctx.currentPath && ctx.currentPath.length === 0) {
      ctx.moveTo(start.x, start.y);
    }
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const baseX = start.x + (end.x - start.x) * t;
      const baseY = start.y + (end.y - start.y) * t;
      
      // 添加自然的弯曲（幅度较小，确保不超出边界）
      const noise = Math.sin(seed + i * 8) * 1.5;
      
      let newX, newY;
      if (isHorizontal) {
        newX = baseX;
        // 根据是上边还是下边决定弯曲方向
        newY = baseY + (side === 'top' ? noise : -noise);
      } else {
        // 根据是左边还是右边决定弯曲方向
        newX = baseX + (side === 'right' ? -noise : noise);
        newY = baseY;
      }
      
      // 使用二次贝塞尔曲线创建平滑路径
      if (i === 1) {
        const controlX = (start.x + newX) / 2;
        const controlY = (start.y + newY) / 2;
        ctx.quadraticCurveTo(controlX, controlY, newX, newY);
      } else if (i < steps) {
        const prevT = (i - 1) / steps;
        const prevX = start.x + (end.x - start.x) * prevT;
        const prevY = start.y + (end.y - start.y) * prevT;
        const prevNoise = Math.sin(seed + (i - 1) * 8) * 1.5;
        
        let prevActualX, prevActualY;
        if (isHorizontal) {
          prevActualX = prevX;
          prevActualY = prevY + (side === 'top' ? prevNoise : -prevNoise);
        } else {
          prevActualX = prevX + (side === 'right' ? -prevNoise : prevNoise);
          prevActualY = prevY;
        }
        
        const controlX = (prevActualX + newX) / 2;
        const controlY = (prevActualY + newY) / 2;
        ctx.quadraticCurveTo(controlX, controlY, newX, newY);
      } else {
        // 最后一步，确保到达终点
        ctx.lineTo(end.x, end.y);
      }
    }
  }

  // 随机添加小分支
  private drawRandomBranches(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number,
    random: (offset: number) => number
  ) {
    ctx.save();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.2;
    
    // 在每条边上随机添加1-2个小分支
    const branchCount = Math.floor(random(20) * 2) + 1;
    
    for (let i = 0; i < branchCount; i++) {
      const side = Math.floor(random(30 + i) * 4);
      const pos = random(40 + i);
      const branchLength = 3 + random(50 + i) * 2;
      
      let startX, startY, angle;
      
      switch (side) {
        case 0: // 上边
          startX = x + size * pos;
          startY = y;
          angle = Math.PI / 2; // 向下
          break;
        case 1: // 右边
          startX = x + size;
          startY = y + size * pos;
          angle = Math.PI; // 向左
          break;
        case 2: // 下边
          startX = x + size * pos;
          startY = y + size;
          angle = -Math.PI / 2; // 向上
          break;
        default: // 左边
          startX = x;
          startY = y + size * pos;
          angle = 0; // 向右
          break;
      }
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + Math.cos(angle) * branchLength,
        startY + Math.sin(angle) * branchLength
      );
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawGem(gem: Gem, isSelected: boolean) {
    if (!this.isReady || !this.rabbitImages[gem.type]) return;

    const cx = gem.visualX * this.cellSize + this.cellSize / 2;
    const cy = gem.visualY * this.cellSize + this.cellSize / 2;
    
    // Calculate display size based on gem state
    const baseSize = (this.cellSize - this.padding * 2) * gem.scale;
    const size = isSelected ? baseSize * 1.15 : baseSize;

    this.ctx.save();
    this.ctx.globalAlpha = gem.alpha;
    this.ctx.translate(cx, cy);

    // Selection glow
    if (isSelected) {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    }

    // Draw the image
    const img = this.rabbitImages[gem.type];
    this.ctx.drawImage(
      img, 
      -size / 2, 
      -size / 2, 
      size, 
      size
    );

    this.ctx.restore();
  }

  drawSelectionBox(p: {x: number, y: number}) {
    const x = p.x * this.cellSize;
    const y = p.y * this.cellSize;
    const pad = 4;
    
    this.ctx.save();
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(x + pad, y + pad, this.cellSize - pad*2, this.cellSize - pad*2);
    this.ctx.restore();
  }

  // 绘制正在拖拽的兔子（使用像素坐标，跟随鼠标）
  drawDraggingGem(gem: Gem, pixelX: number, pixelY: number) {
    if (!this.isReady || !this.rabbitImages[gem.type]) return;

    const size = (this.cellSize - this.padding * 2) * 1.2; // 拖拽时稍微放大

    this.ctx.save();
    this.ctx.globalAlpha = gem.alpha * 0.9; // 稍微透明
    this.ctx.translate(pixelX, pixelY);

    // 拖拽时的发光效果
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';

    // 绘制兔子图片
    const img = this.rabbitImages[gem.type];
    this.ctx.drawImage(
      img, 
      -size / 2, 
      -size / 2, 
      size, 
      size
    );

    this.ctx.restore();
  }

  // 更新并绘制粒子特效
  updateParticles(deltaTime: number = 16) {
    this.particleEffect.update(deltaTime);
  }

  drawParticles() {
    this.particleEffect.draw(this.ctx);
  }

  // 在指定位置创建樱花特效
  createCherryBlossomEffect(matches: Gem[]) {
    const positions = matches.map(gem => ({
      x: gem.gridX,
      y: gem.gridY
    }));
    this.particleEffect.createEffectsAtPositions(positions);
  }
}
