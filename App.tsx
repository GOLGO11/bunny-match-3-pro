
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { UIOverlay } from './components/UIOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { LandscapePrompt } from './components/LandscapePrompt';
import { LevelPrompt } from './components/LevelPrompt';
import { AdsManager } from './services/AdsManager';
import { AudioManager } from './services/AudioManager';
import { Difficulty, LevelConfig, getLevelByScore } from './constants';
import { useTranslation } from './i18n/useTranslation';
import { getAssetPath } from './utils/paths';
import { requestFullscreen, lockOrientation } from './utils/fullscreen';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'gameover' | 'noMoves'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.HARD);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // 时间更新回调
  const handleTimeUpdate = useCallback((time: number | null) => {
    // 调试：输出时间更新
    if (time !== null) {
      console.log(`[App] Time updated: ${time}`);
    }
    // 直接更新，React 会自动处理相同值的优化
    setTimeRemaining(time);
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1); // 当前关卡编号
  const [levelPromptConfig, setLevelPromptConfig] = useState<LevelConfig | null>(null); // 关卡提示配置
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false); // 资源是否已加载完成
  const adsManager = useRef(new AdsManager());
  const audioManager = useRef(new AudioManager());

  // 初始化平台适配器
  useEffect(() => {
    adsManager.current.init().then(() => {
      console.log(`[Platform] Initialized: ${adsManager.current.getPlatform()}`);
    });
  }, []);

  const handleScoreUpdate = useCallback((newScore: number, currentCombo: number) => {
    setScore(prev => prev + newScore);
    setCombo(currentCombo);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleNoMoves = useCallback(() => {
    setGameState('noMoves');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleTimeUp = useCallback(() => {
    setGameState('gameover');
    // 通知平台游戏停止
    adsManager.current.gameplayStop();
    // 暂停背景音乐
    audioManager.current.pauseBackgroundMusic();
    // 播放风声音效
    audioManager.current.playWindSound(0.6).catch(() => {
      // 如果播放失败，静默处理
    });
    adsManager.current.showInterstitialAd();
  }, []);

  const handleStart = useCallback(async () => {
    // 固定使用困难模式
    const finalDifficulty = Difficulty.HARD;
    setDifficulty(finalDifficulty);
    setCurrentLevel(1); // 重置关卡
    setLevelPromptConfig(null); // 清除之前的提示
    // 初始化时间为第一关的时间限制，确保血条一开始就显示
    const firstLevelConfig = getLevelByScore(0, finalDifficulty);
    setTimeRemaining(firstLevelConfig.timeLimit);
    setGameState('loading');
    await adsManager.current.showLoadingAd();
    
    // 通知平台游戏开始
    adsManager.current.gameplayStart();
    
    // 移动端：尝试进入全屏并锁定横屏
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    
    if (isMobile) {
      try {
        // 先锁定横屏方向
        await lockOrientation('landscape');
        // 然后进入全屏（隐藏地址栏）
        await requestFullscreen();
      } catch (e) {
        console.log('Fullscreen/orientation setup failed:', e);
        // 如果失败，继续游戏
      }
    }
    
    // 开始播放背景音乐
    const baseUrl = import.meta.env.BASE_URL || '/';
    const musicFiles = [
      `${baseUrl}sounds/background-music.wav`,
      `${baseUrl}sounds/bgm.wav`,
      `${baseUrl}sounds/music.wav`
    ];
    
    for (const file of musicFiles) {
      try {
        await audioManager.current.playBackgroundMusic(file, 0.2);
        break; // 如果成功播放，就停止尝试其他文件
      } catch (e) {
        // 继续尝试下一个文件
      }
    }
    
    setGameState('playing');
    setIsAssetsLoaded(false); // 重置资源加载状态
  }, []);

  // 资源加载完成回调
  const handleAssetsLoaded = useCallback(() => {
    console.log('[App] 资源加载完成');
    setIsAssetsLoaded(true);
    
    // 所有难度下，资源加载完成后显示第一关提示
    const firstLevelConfig = getLevelByScore(0, difficulty);
    console.log(`[App] 资源加载完成，显示第一关提示: 关卡 ${firstLevelConfig.level}, difficulty=${difficulty}`);
    // 稍微延迟，确保游戏界面已完全渲染
    setTimeout(() => {
      console.log(`[App] 设置第一关提示配置`);
      setLevelPromptConfig(firstLevelConfig);
    }, 300);
  }, [difficulty]);

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setTimeRemaining(null);
    setCurrentLevel(1); // 重置关卡
    setLevelPromptConfig(null); // 清除之前的提示
    setIsAssetsLoaded(false); // 重置资源加载状态
    // 恢复背景音乐
    audioManager.current.resumeBackgroundMusic();
    setGameState('playing');
    // 注意：关卡提示会在 handleAssetsLoaded 中显示，如果资源已经加载过，
    // GameBoard 的 useEffect 可能不会再次执行，所以我们需要确保资源加载状态正确
  };

  // 关卡切换回调
  const handleLevelChange = useCallback((oldLevel: number, newLevel: number, levelConfig: LevelConfig) => {
    setCurrentLevel(newLevel);
    console.log(`[Level] 关卡切换: ${oldLevel} -> ${newLevel}, 时间限制: ${levelConfig.timeLimit}秒, 当前难度: ${difficulty}`);
    
    // 所有难度下显示关卡提示
    if (oldLevel !== newLevel) {
      console.log(`[Level] 显示关卡提示: 关卡 ${newLevel}`);
      setLevelPromptConfig(levelConfig);
    } else {
      console.log(`[Level] 不显示关卡提示: difficulty=${difficulty}, oldLevel=${oldLevel}, newLevel=${newLevel}`);
    }
  }, [difficulty]);
  
  // 关闭关卡提示
  const handleCloseLevelPrompt = useCallback(() => {
    setLevelPromptConfig(null);
  }, []);

  const handleRequestReward = async () => {
    const success = await adsManager.current.showRewardedAd();
    if (success) {
      alert("Reward granted! (Implementation Placeholder)");
    }
  };

  const handlePause = useCallback(() => {
    setIsPaused(true);
    audioManager.current.pauseBackgroundMusic();
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    audioManager.current.resumeBackgroundMusic();
  }, []);

  // 开发模式：快捷键测试无解法界面（连按三下P键，PC端）
  useEffect(() => {
    let pKeyPresses: number[] = []; // 记录P键按下时间戳
    const PRESS_TIME_WINDOW = 800; // 800ms内连续按三下
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 仅在游戏进行中时监听
      if (gameState !== 'playing') return;
      
      // 检测P键
      if (e.key.toLowerCase() === 'p') {
        const now = Date.now();
        
        // 清除超时的按键记录
        pKeyPresses = pKeyPresses.filter(timestamp => now - timestamp < PRESS_TIME_WINDOW);
        
        // 添加当前按键时间戳
        pKeyPresses.push(now);
        
        // 如果连续按了三下（在时间窗口内）
        if (pKeyPresses.length >= 3) {
          e.preventDefault();
          console.log('[Dev] Triggering noMoves test (triple P press)');
          handleNoMoves();
          pKeyPresses = []; // 重置计数器
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleNoMoves]);

  // 判断是否为游戏进行中（需要横屏）
  const isGamePlaying = gameState === 'playing' || gameState === 'loading';
  
  // 检测是否为移动设备（用于显示测试按钮）
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  // 检测是否为横屏（用于显示关卡提示）
  const [isLandscape, setIsLandscape] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      setIsMobileDevice(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 检测横屏/竖屏
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  return (
    <div 
      className={`relative w-screen h-screen flex items-center justify-center overflow-hidden text-white select-none ${
        isGamePlaying ? 'landscape-mode' : 'portrait-mode'
      }`}
    >
      {/* 背景图片 */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${getAssetPath('background.jpg')}), url(${getAssetPath('background.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // 确保背景图在电脑上正确显示，2730*1319分辨率适配
          minHeight: '100vh',
          minWidth: '100vw',
          // 保持背景图比例，避免拉伸
          backgroundAttachment: 'fixed'
        }}
      >
        {/* 背景遮罩层，确保内容可读性（更透明以显示背景图） */}
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]"></div>
      </div>

      {/* 横屏提示（游戏进行中且移动端竖屏时显示） */}
      <LandscapePrompt gameState={gameState} />
      
      {/* 关卡提示（在所有难度下且横屏时显示） */}
      {gameState === 'playing' && isLandscape && (
        <LevelPrompt 
          levelConfig={levelPromptConfig} 
          onClose={handleCloseLevelPrompt}
        />
      )}

      {/* 开发模式：移动端测试无解法按钮（仅在移动端游戏进行中时显示） */}
      {gameState === 'playing' && isMobileDevice && (
        <button
          onClick={handleNoMoves}
          className="fixed bottom-4 right-4 z-40 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm border-2 border-red-400/50 rounded-full w-12 h-12 flex items-center justify-center text-white text-xl shadow-lg transition-all active:scale-90"
          title="测试无解法界面"
        >
          🧪
        </button>
      )}

      {/* 设置面板 */}
      <SettingsPanel
        audioManager={audioManager.current}
        onPause={handlePause}
        onResume={handleResume}
        isPaused={isPaused}
        gameState={gameState}
      />
      
      <div className={`main-game-container relative z-10 w-full h-full flex flex-col p-1 sm:p-2 md:p-4 box-border ${
        isGamePlaying ? 'max-w-5xl mx-auto' : 'max-w-md mx-auto'
      }`}>

        <div className="relative flex-grow flex gap-2 sm:gap-3 md:gap-4 bg-transparent rounded-xl sm:rounded-2xl overflow-hidden min-h-0">
          {/* 游戏区域 */}
          <div className="relative flex-grow bg-transparent rounded-xl sm:rounded-2xl overflow-hidden min-h-0">
            {gameState === 'playing' && (
              <GameBoard 
                onScoreUpdate={handleScoreUpdate} 
                onGameOver={handleGameOver}
                onNoMoves={handleNoMoves}
                onTimeUp={handleTimeUp}
                onTimeUpdate={handleTimeUpdate}
                onLevelChange={handleLevelChange}
                onAssetsLoaded={handleAssetsLoaded}
                audioManager={audioManager.current}
                currentScore={score}
                difficulty={difficulty}
                isPaused={isPaused}
              />
            )}
            
            <UIOverlay 
              state={gameState} 
              score={score}
              onStart={() => handleStart()}
              onRestart={handleRestart}
              onRewardedAd={handleRequestReward}
              currentDifficulty={difficulty}
            />
          </div>

          {/* 右侧信息显示（仅在游戏进行中显示） */}
          {gameState === 'playing' && (() => {
            const levelConfig = getLevelByScore(score, difficulty);
            const timeLimit = levelConfig.timeLimit;
            // 使用 timeRemaining 如果已设置，否则使用当前关卡的时间限制
            const displayTime = timeRemaining !== null ? timeRemaining : timeLimit;
            const percentage = timeLimit > 0 ? Math.max(0, Math.min(100, (displayTime / timeLimit) * 100)) : 100;
            
            return (
              <div className="flex flex-col items-end justify-start gap-3 sm:gap-4 pt-2 sm:pt-4 min-w-[80px] sm:min-w-[100px] md:min-w-[120px]">
                {/* 得分 - 第一排 */}
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-[10px] sm:text-xs cute-label text-pink-300 uppercase tracking-widest drop-shadow-lg">{t.game.score}</span>
                  <span className="text-xl sm:text-2xl md:text-3xl cute-number text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,182,193,0.3)' }}>
                    {score.toLocaleString()}
                  </span>
                </div>
                
                {/* 连击 - 第二排 */}
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-[10px] sm:text-xs cute-label text-yellow-300 uppercase tracking-widest drop-shadow-lg">{t.game.combo}</span>
                  <span 
                    className={`text-xl sm:text-2xl md:text-3xl cute-number transition-all drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] ${
                      combo > 1 
                        ? 'text-yellow-300 scale-110' 
                        : 'text-yellow-400/70'
                    }`}
                    style={{ 
                      textShadow: combo > 1 
                        ? '3px 3px 6px rgba(0,0,0,0.9), 0 0 15px rgba(255,215,0,0.6), 0 0 25px rgba(255,215,0,0.4)' 
                        : '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.3)'
                    }}
                  >
                    x{combo}
                  </span>
                </div>
                
                {/* 关卡和血条 - 第三排 */}
                <div className="flex flex-col items-end gap-1.5 w-full">
                  {/* 关卡显示 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] cute-label text-purple-300 uppercase tracking-wider drop-shadow-lg">
                      {t.game.level || 'Level'}
                    </span>
                    <span className="text-base sm:text-lg md:text-xl cute-number text-purple-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">
                      {currentLevel === 4 ? (t.levelPrompt?.finalLevel || '最终关卡') : currentLevel}
                    </span>
                  </div>
                  {/* 血条容器 */}
                  <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-700/80 rounded-full border border-slate-600 shadow-lg overflow-hidden backdrop-blur-sm">
                    {/* 血条填充 */}
                    <div 
                      className={`h-full transition-all duration-300 ease-linear rounded-full ${
                        displayTime <= timeLimit * 0.2 ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse' : 
                        displayTime <= timeLimit * 0.5 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                        'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                      style={{ 
                        width: `${percentage}%`,
                        transition: 'width 0.3s linear'
                      }}
                    >
                      {/* 血条内部光效 */}
                      <div className="h-full w-full bg-gradient-to-t from-transparent via-white/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default App;
