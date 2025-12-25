
import { GRID_SIZE } from '../constants';
import { Point } from '../types';

export class InputHandler {
  canvas: HTMLCanvasElement;
  onDragStart: (x: number, y: number, pixelX: number, pixelY: number) => void;
  onDragMove: (from: Point, to: Point | null, pixelX?: number, pixelY?: number) => void;
  onDragEnd: (from: Point, to: Point | null) => void;
  onItemClick?: (x: number, y: number) => void; // 道具点击回调
  cellSize: number = 0;

  private isDragging: boolean = false;
  private startPos: Point | null = null;
  private currentPos: Point | null = null;
  private currentPixelPos: { x: number; y: number } | null = null;
  private startPixelPos: { x: number; y: number } | null = null; // 记录开始点击的像素位置
  private hasMoved: boolean = false; // 是否发生了移动
  private CLICK_THRESHOLD = 10; // 点击阈值（像素），超过这个距离认为是拖拽
  private lastItemClickTime: number = 0; // 上次道具点击的时间戳
  private lastItemClickPosition: Point | null = null; // 上次道具点击的位置
  private ITEM_CLICK_COOLDOWN = 1200; // 道具点击冷却期（毫秒），防止误触（延长到1200ms以确保动画完成）

  private mouseDownHandler = (e: MouseEvent) => this.handleStart(e.offsetX, e.offsetY);
  private mouseMoveHandler = (e: MouseEvent) => this.handleMove(e.offsetX, e.offsetY);
  private mouseUpHandler = () => this.handleEnd();
  private mouseLeaveHandler = () => this.handleEnd();

  private touchStartHandler = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.handleStart(touch.clientX - rect.left, touch.clientY - rect.top);
  };
  private touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isDragging) return;
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.handleMove(touch.clientX - rect.left, touch.clientY - rect.top);
  };
  private touchEndHandler = () => this.handleEnd();

  constructor(
    canvas: HTMLCanvasElement,
    onDragStart: (x: number, y: number) => void,
    onDragMove: (from: Point, to: Point | null, pixelX?: number, pixelY?: number) => void,
    onDragEnd: (from: Point, to: Point | null) => void,
    onItemClick?: (x: number, y: number) => void
  ) {
    this.canvas = canvas;
    this.onDragStart = onDragStart;
    this.onDragMove = onDragMove;
    this.onDragEnd = onDragEnd;
    this.onItemClick = onItemClick;
    this.init();
  }

  setCellSize(size: number) {
    this.cellSize = size;
  }

  init() {
    this.canvas.addEventListener('mousedown', this.mouseDownHandler);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    this.canvas.addEventListener('touchend', this.touchEndHandler);
    this.canvas.addEventListener('touchcancel', this.touchEndHandler);
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.canvas.removeEventListener('touchstart', this.touchStartHandler);
    this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
    this.canvas.removeEventListener('touchend', this.touchEndHandler);
    this.canvas.removeEventListener('touchcancel', this.touchEndHandler);
  }

  private handleStart(x: number, y: number) {
    if (!this.cellSize) return;
    
    // 检查是否在道具点击冷却期内（防止道具激活后误触新下落的兔子或道具）
    const now = Date.now();
    const inCooldown = now - this.lastItemClickTime < this.ITEM_CLICK_COOLDOWN;
    
    if (inCooldown) {
      // 在冷却期内，忽略所有新的输入开始（防止误触新下落的兔子或道具）
      // 这可以防止道具激活后，如果手指/鼠标还停留在画布上时误触发
      return;
    }
    
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      this.isDragging = true;
      this.hasMoved = false; // 重置移动标志
      this.startPos = { x: gridX, y: gridY };
      this.currentPos = { x: gridX, y: gridY };
      this.currentPixelPos = { x, y }; // 初始化像素位置
      this.startPixelPos = { x, y }; // 记录开始位置
      this.onDragStart(gridX, gridY, x, y);
    }
  }

  private handleMove(x: number, y: number) {
    if (!this.isDragging || !this.startPos || !this.cellSize || !this.startPixelPos) return;
    
    // 检查是否在冷却期内（如果正在拖拽时进入冷却期，立即清理状态）
    const now = Date.now();
    if (now - this.lastItemClickTime < this.ITEM_CLICK_COOLDOWN) {
      // 在冷却期内，清理拖拽状态，防止误操作
      this.clearInputState();
      return;
    }
    
    // 计算移动距离
    const dx = x - this.startPixelPos.x;
    const dy = y - this.startPixelPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果移动距离超过阈值，标记为已移动
    if (distance > this.CLICK_THRESHOLD) {
      this.hasMoved = true;
    }
    
    // 保存像素坐标（用于拖拽跟随）
    this.currentPixelPos = { x, y };
    
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    // 检查是否在有效范围内
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const newPos = { x: gridX, y: gridY };
      
      // 检查是否是相邻位置
      const dx2 = Math.abs(this.startPos.x - gridX);
      const dy2 = Math.abs(this.startPos.y - gridY);
      const isAdjacent = (dx2 === 1 && dy2 === 0) || (dx2 === 0 && dy2 === 1);
      
      // 即使网格位置没变，也要更新像素位置（用于平滑拖拽）
      this.currentPos = newPos;
      this.onDragMove(this.startPos, isAdjacent ? newPos : null, x, y);
    } else {
      // 如果移出边界，清除目标位置，但仍传递像素坐标
      this.onDragMove(this.startPos, null, x, y);
    }
  }

  private handleEnd() {
    if (!this.isDragging || !this.startPos) return;
    
    // 检查是否在冷却期内（防止道具激活后误触任何元素）
    const now = Date.now();
    const inCooldown = now - this.lastItemClickTime < this.ITEM_CLICK_COOLDOWN;
    
    // 如果没有移动，可能是点击（用于道具激活或拖拽交换）
    if (!this.hasMoved && this.onItemClick) {
      // 在冷却期内，忽略所有点击（防止误触新下落的兔子、道具等任何元素）
      if (inCooldown) {
        this.clearInputState();
        return;
      }
      
      // 不在冷却期，可以触发道具点击回调（回调内部会检查是否是道具）
      this.onItemClick(this.startPos.x, this.startPos.y);
    }
    
    // 处理拖拽交换（如果有移动）
    const endPos = this.currentPos;
    if (endPos && this.hasMoved) {
      // 在冷却期内，也忽略拖拽交换（防止误操作）
      if (inCooldown) {
        this.clearInputState();
        return;
      }
      
      const dx = Math.abs(this.startPos.x - endPos.x);
      const dy = Math.abs(this.startPos.y - endPos.y);
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      
      this.onDragEnd(this.startPos, isAdjacent ? endPos : null);
    } else if (this.hasMoved) {
      // 有移动但没有有效的结束位置
      if (!inCooldown) {
        this.onDragEnd(this.startPos, null);
      }
    }
    
    this.clearInputState();
  }

  // 通知输入处理器道具已被激活（用于设置冷却期）
  notifyItemActivated(x: number, y: number): void {
    this.lastItemClickTime = Date.now();
    this.lastItemClickPosition = { x, y }; // 记录道具激活的位置
    // 立即清理当前输入状态，防止残留的触摸/鼠标事件
    this.clearInputState();
  }

  // 检查是否在道具冷却期内
  isInItemCooldown(): boolean {
    const now = Date.now();
    return now - this.lastItemClickTime < this.ITEM_CLICK_COOLDOWN;
  }

  // 清理所有输入状态
  private clearInputState(): void {
    this.isDragging = false;
    this.startPos = null;
    this.currentPos = null;
    this.currentPixelPos = null;
    this.startPixelPos = null;
    this.hasMoved = false;
  }
}
