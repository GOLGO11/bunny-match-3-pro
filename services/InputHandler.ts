
import { GRID_SIZE } from '../constants';
import { Point } from '../types';

export class InputHandler {
  canvas: HTMLCanvasElement;
  onDragStart: (x: number, y: number, pixelX: number, pixelY: number) => void;
  onDragMove: (from: Point, to: Point | null, pixelX?: number, pixelY?: number) => void;
  onDragEnd: (from: Point, to: Point | null) => void;
  cellSize: number = 0;

  private isDragging: boolean = false;
  private startPos: Point | null = null;
  private currentPos: Point | null = null;
  private currentPixelPos: { x: number; y: number } | null = null;

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
    onDragMove: (from: Point, to: Point | null) => void,
    onDragEnd: (from: Point, to: Point | null) => void
  ) {
    this.canvas = canvas;
    this.onDragStart = onDragStart;
    this.onDragMove = onDragMove;
    this.onDragEnd = onDragEnd;
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
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      this.isDragging = true;
      this.startPos = { x: gridX, y: gridY };
      this.currentPos = { x: gridX, y: gridY };
      this.currentPixelPos = { x, y }; // 初始化像素位置
      this.onDragStart(gridX, gridY, x, y);
    }
  }

  private handleMove(x: number, y: number) {
    if (!this.isDragging || !this.startPos || !this.cellSize) return;
    
    // 保存像素坐标（用于拖拽跟随）
    this.currentPixelPos = { x, y };
    
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    // 检查是否在有效范围内
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const newPos = { x: gridX, y: gridY };
      
      // 检查是否是相邻位置
      const dx = Math.abs(this.startPos.x - gridX);
      const dy = Math.abs(this.startPos.y - gridY);
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      
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
    
    const endPos = this.currentPos;
    if (endPos) {
      const dx = Math.abs(this.startPos.x - endPos.x);
      const dy = Math.abs(this.startPos.y - endPos.y);
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      
      this.onDragEnd(this.startPos, isAdjacent ? endPos : null);
    } else {
      this.onDragEnd(this.startPos, null);
    }
    
    this.isDragging = false;
    this.startPos = null;
    this.currentPos = null;
    this.currentPixelPos = null;
  }
}
