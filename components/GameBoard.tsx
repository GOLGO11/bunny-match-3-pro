
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../services/GameEngine';
import { Renderer } from '../services/Renderer';
import { InputHandler } from '../services/InputHandler';
import { AudioManager } from '../services/AudioManager';
import * as Types from '../types';
import * as Constants from '../constants';
import { Difficulty } from '../constants';
import { useTranslation } from '../i18n/useTranslation';

interface GameBoardProps {
  onScoreUpdate: (score: number, combo: number) => void;
  onGameOver: () => void;
  onNoMoves: () => void;
  onTimeUp?: () => void;
  onTimeUpdate?: (time: number | null) => void;
  difficulty: Difficulty;
  isPaused?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onScoreUpdate, onGameOver, onNoMoves, onTimeUp, onTimeUpdate, difficulty, isPaused = false }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const dragFromRef = useRef<Types.Point | null>(null);
  const dragToRef = useRef<Types.Point | null>(null);
  const dragPixelPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  
  const scoreUpdateRef = useRef(onScoreUpdate);
  scoreUpdateRef.current = onScoreUpdate;
  const noMovesRef = useRef(onNoMoves);
  noMovesRef.current = onNoMoves;
  const timeUpRef = useRef(onTimeUp);
  timeUpRef.current = onTimeUp;
  const timeUpdateRef = useRef(onTimeUpdate);
  timeUpdateRef.current = onTimeUpdate;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const init = async () => {
      // Create Renderer and load images first
      const renderer = new Renderer(ctx);
      rendererRef.current = renderer;
      await renderer.loadImages();
      setIsAssetsLoaded(true);

      // Initialize Audio Manager
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
      }
      const audioManager = audioManagerRef.current;

      // Initialize Engine (每次难度改变时重新创建)
      if (!engineRef.current || engineRef.current.difficulty !== difficulty) {
        // 清理旧的引擎
        if (engineRef.current) {
          engineRef.current.destroy();
        }
        
        engineRef.current = new GameEngine(
          (s, c) => scoreUpdateRef.current(s, c),
          (matches) => {
            // 当消除发生时，创建樱花特效
            if (rendererRef.current) {
              rendererRef.current.createCherryBlossomEffect(matches);
            }
            // 播放消除音效（兔子叫声）
            if (audioManager) {
              audioManager.playMatchSound(matches.length).catch(() => {
                // 如果播放失败（可能是浏览器限制），静默处理
              });
            }
          },
          () => {
            // 当没有解法时，触发回调
            noMovesRef.current();
          },
          () => {
            // 当时间到时，触发回调
            if (timeUpRef.current) {
              timeUpRef.current();
            }
          },
          difficulty
        );
        
        // 初始化倒计时显示（初始为null，等待第一次交换）
        // 计时器在第一次交换后才启动，所以初始时不显示
        if (timeUpdateRef.current) {
          timeUpdateRef.current(null);
        }
      }
      const engine = engineRef.current;

      // 在用户第一次点击时初始化音频上下文（解决浏览器自动播放限制）
      const initAudioOnInteraction = () => {
        if (audioManager) {
          // 静默激活音频上下文，不播放音效
          audioManager.activateAudioContext();
          // 确保背景音乐开始播放（如果存在）
          audioManager.ensureBackgroundMusicPlaying().catch(() => {});
        }
        canvas.removeEventListener('mousedown', initAudioOnInteraction);
        canvas.removeEventListener('touchstart', initAudioOnInteraction);
      };
      canvas.addEventListener('mousedown', initAudioOnInteraction);
      canvas.addEventListener('touchstart', initAudioOnInteraction);

      // 拖拽开始
      const onDragStart = (x: number, y: number, pixelX: number, pixelY: number) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        dragFromRef.current = { x, y };
        dragToRef.current = null;
        dragPixelPosRef.current = { x: pixelX, y: pixelY };
      };

      // 拖拽移动
      const onDragMove = (from: Types.Point, to: Types.Point | null, pixelX?: number, pixelY?: number) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        dragToRef.current = to;
        if (pixelX !== undefined && pixelY !== undefined) {
          dragPixelPosRef.current = { x: pixelX, y: pixelY };
        }
      };

      // 拖拽结束
      const onDragEnd = (from: Types.Point, to: Types.Point | null) => {
        if (engine.status !== Types.GameStatus.IDLE) return;
        if (to) {
          // 如果拖拽到相邻位置，执行交换
          engine.swapGems(from, to);
        }
        dragFromRef.current = null;
        dragToRef.current = null;
        dragPixelPosRef.current = null;
      };

      const input = new InputHandler(canvas, onDragStart, onDragMove, onDragEnd);
      inputRef.current = input;

      const handleResize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const size = Math.min(parent.clientWidth, parent.clientHeight);
        canvas.width = size;
        canvas.height = size;
        renderer.resize(size, size);
        input.setCellSize(size / Constants.GRID_SIZE);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      // 更新倒计时显示（所有难度）
      const updateTimer = () => {
        // 使用最新的引擎引用
        const currentEngine = engineRef.current;
        if (currentEngine) {
          const remaining = currentEngine.getTimeRemaining();
          // 如果计时器已启动，更新剩余时间
          // 即使时间到了（remaining === 0），也显示0，直到游戏状态改变
          if (currentEngine.isTimerStarted()) {
            if (timeUpdateRef.current) {
              timeUpdateRef.current(remaining);
            }
          } else {
            if (timeUpdateRef.current) {
              timeUpdateRef.current(null);
            }
          }
        } else {
          if (timeUpdateRef.current) {
            timeUpdateRef.current(null);
          }
        }
      };
      const timerUpdateInterval = setInterval(updateTimer, 100);

      let animationId: number;
      let lastTime = performance.now();
      const loop = (currentTime: number) => {
        // 如果暂停，只渲染当前状态，不更新逻辑
        if (isPausedRef.current) {
          renderer.clear();
          renderer.drawGrid();
          
          // 绘制所有兔子（暂停时保持当前状态）
          for (let y = 0; y < Constants.GRID_SIZE; y++) {
            for (let x = 0; x < Constants.GRID_SIZE; x++) {
              const gem = engine.grid[y][x];
              if (gem) {
                renderer.drawGem(gem, false);
              }
            }
          }
          
          renderer.drawParticles();
          animationId = requestAnimationFrame(loop);
          return;
        }
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        engine.updateAnimations();
        renderer.updateParticles(deltaTime);
        renderer.clear();
        renderer.drawGrid();
        
        const dragFrom = dragFromRef.current;
        const dragTo = dragToRef.current;
        const dragPixelPos = dragPixelPosRef.current;
        
        for (let y = 0; y < Constants.GRID_SIZE; y++) {
          for (let x = 0; x < Constants.GRID_SIZE; x++) {
            const gem = engine.grid[y][x];
            if (gem) {
              // 检查是否是拖拽起点（拖拽时隐藏原位置的兔子）
              const isDragFrom = dragFrom?.x === x && dragFrom?.y === y;
              const isDragTo = dragTo?.x === x && dragTo?.y === y;
              
              // 如果正在拖拽这个兔子，不绘制原位置（会在拖拽位置绘制）
              if (!isDragFrom || !dragPixelPos) {
                renderer.drawGem(gem, isDragTo);
              }
            }
          }
        }
        
        // 绘制正在拖拽的兔子（跟随鼠标）
        if (dragFrom && dragPixelPos) {
          const draggedGem = engine.grid[dragFrom.y][dragFrom.x];
          if (draggedGem) {
            renderer.drawDraggingGem(draggedGem, dragPixelPos.x, dragPixelPos.y);
          }
        }
        
        // 绘制拖拽起点和目标的选中框
        if (dragFrom && !dragPixelPos) {
          renderer.drawSelectionBox(dragFrom);
        }
        if (dragTo) {
          renderer.drawSelectionBox(dragTo);
        }
        
        renderer.drawParticles(); // 在最后绘制粒子，确保在最上层
        animationId = requestAnimationFrame(loop);
      };
      loop(performance.now());

      return () => {
        cancelAnimationFrame(animationId);
        if (timerUpdateInterval) {
          clearInterval(timerUpdateInterval);
        }
        if (engineRef.current) {
          engineRef.current.destroy();
        }
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', initAudioOnInteraction);
        canvas.removeEventListener('touchstart', initAudioOnInteraction);
        input.destroy();
      };
    };

    const cleanup = init();
    return () => {
       cleanup.then(unsub => unsub?.());
    };
  }, [difficulty]);

  // 监听暂停状态变化，控制计时器
  useEffect(() => {
    if (engineRef.current) {
      if (isPaused) {
        engineRef.current.pauseTimer();
      } else {
        engineRef.current.resumeTimer();
      }
    }
  }, [isPaused]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 bg-transparent rounded-xl relative">
      {!isAssetsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10 rounded-xl">
           <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
           <p className="text-sm text-slate-300">{t.game.loadingRabbits}</p>
        </div>
      )}
      <canvas ref={canvasRef} className={`rounded-lg shadow-2xl cursor-grab active:cursor-grabbing touch-none transition-opacity duration-500 ${isAssetsLoaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};
