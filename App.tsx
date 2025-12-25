
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { UIOverlay } from './components/UIOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { LandscapePrompt } from './components/LandscapePrompt';
import { AdsManager } from './services/AdsManager';
import { AudioManager } from './services/AudioManager';
import { Difficulty } from './constants';
import { useTranslation } from './i18n/useTranslation';
import { getAssetPath } from './utils/paths';
import { requestFullscreen, lockOrientation } from './utils/fullscreen';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'gameover' | 'noMoves'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
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

  const handleStart = useCallback(async (selectedDifficulty?: Difficulty) => {
    if (selectedDifficulty) {
      setDifficulty(selectedDifficulty);
    }
    setTimeRemaining(null);
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
  }, []);

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setTimeRemaining(null);
    // 恢复背景音乐
    audioManager.current.resumeBackgroundMusic();
    setGameState('playing');
  };

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

  // 判断是否为游戏进行中（需要横屏）
  const isGamePlaying = gameState === 'playing' || gameState === 'loading';
  
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
        {gameState !== 'start' && (
          <header className="game-header flex items-center justify-center mb-2 sm:mb-4 px-2 sm:px-4 py-1 sm:py-2 gap-3 sm:gap-4 md:gap-6 bg-transparent rounded-lg">
            {/* 得分 - 左侧 */}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-xs cute-label text-pink-300 uppercase tracking-widest drop-shadow-lg">{t.game.score}</span>
              <span className="text-xl sm:text-2xl md:text-3xl cute-number text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,182,193,0.3)' }}>
                {score.toLocaleString()}
              </span>
            </div>
            
            {/* 血条倒计时 - 中间 */}
            {timeRemaining !== null ? (
              <div className="flex flex-col items-center w-full max-w-[200px] flex-shrink-0">
                {/* 血条容器 */}
                <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-700/80 rounded-full border border-slate-600 shadow-lg overflow-hidden backdrop-blur-sm">
                  {/* 血条填充 */}
                  <div 
                    className={`h-full transition-all duration-300 ease-linear rounded-full ${
                      timeRemaining <= 5 ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse' : 
                      timeRemaining <= 10 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                      'bg-gradient-to-r from-green-500 to-green-400'
                    }`}
                    style={{ width: `${(timeRemaining / 20) * 100}%` }}
                  >
                    {/* 血条内部光效 */}
                    <div className="h-full w-full bg-gradient-to-t from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>
            ) : null}
            
            {/* 连击 - 右侧 */}
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
          </header>
        )}

        <div className="relative flex-grow bg-transparent rounded-xl sm:rounded-2xl overflow-hidden min-h-0">
          {gameState === 'playing' && (
            <GameBoard 
              onScoreUpdate={handleScoreUpdate} 
              onGameOver={handleGameOver}
              onNoMoves={handleNoMoves}
              onTimeUp={handleTimeUp}
              onTimeUpdate={setTimeRemaining}
              difficulty={difficulty}
              isPaused={isPaused}
            />
          )}
          
          <UIOverlay 
            state={gameState} 
            score={score}
            onStart={handleStart}
            onRestart={handleRestart}
            onRewardedAd={handleRequestReward}
            currentDifficulty={difficulty}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
