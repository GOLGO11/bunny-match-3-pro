
import { Particle, Point } from '../types';

export class ParticleEffect {
  particles: Particle[] = [];
  cellSize: number = 0;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  setCellSize(cellSize: number) {
    this.cellSize = cellSize;
  }

  // 在指定位置创建樱花特效
  createCherryBlossomEffect(x: number, y: number, count: number = 12) {
    const centerX = x * this.cellSize + this.cellSize / 2;
    const centerY = y * this.cellSize + this.cellSize / 2;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 30 + Math.random() * 40;
      const life = 800 + Math.random() * 400; // 800-1200ms
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20, // 向上飘散
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        scale: 0.5 + Math.random() * 0.5,
        alpha: 1,
        life: life,
        maxLife: life
      });
    }
  }

  // 批量创建特效（用于多个消除位置）
  createEffectsAtPositions(positions: Point[]) {
    positions.forEach(pos => {
      this.createCherryBlossomEffect(pos.x, pos.y, 10 + Math.floor(Math.random() * 6));
    });
  }

  // 更新所有粒子
  update(deltaTime: number = 16) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // 更新位置
      p.x += p.vx * (deltaTime / 16);
      p.y += p.vy * (deltaTime / 16);
      
      // 重力效果
      p.vy += 20 * (deltaTime / 16);
      
      // 旋转
      p.rotation += p.rotationSpeed;
      
      // 更新生命周期
      p.life -= deltaTime;
      
      // 更新透明度（淡出效果）
      p.alpha = Math.max(0, p.life / p.maxLife);
      
      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // 绘制樱花粒子
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    for (const p of this.particles) {
      if (p.alpha <= 0) continue;
      
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      
      // 绘制樱花花瓣（5瓣）
      this.drawCherryBlossom(ctx);
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  // 绘制单个樱花花瓣
  private drawCherryBlossom(ctx: CanvasRenderingContext2D) {
    const size = 8;
    const petalCount = 5;
    
    ctx.fillStyle = '#ffb3d9'; // 粉色
    ctx.strokeStyle = '#ff80bf';
    ctx.lineWidth = 1;
    
    // 绘制5个花瓣
    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount;
      ctx.save();
      ctx.rotate(angle);
      
      // 花瓣形状（椭圆）
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.6, size * 0.4, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }
    
    // 中心花蕊
    ctx.fillStyle = '#ffd9e6';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 清除所有粒子
  clear() {
    this.particles = [];
  }
}

