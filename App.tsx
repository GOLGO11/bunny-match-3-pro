
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { UIOverlay } from './components/UIOverlay';
import { LanguageSelector } from './components/LanguageSelector';
import { AdsManager } from './services/AdsManager';
import { AudioManager } from './services/AudioManager';
import { Difficulty } from './constants';
import { useTranslation } from './i18n/useTranslation';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'gameover' | 'noMoves'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
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
    
    // 开始播放背景音乐
    const musicFiles = [
      '/sounds/background-music.wav',
      '/sounds/bgm.wav',
      '/sounds/music.wav'
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

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden text-white select-none">
      <div className="w-full h-full max-w-2xl flex flex-col p-4 box-border">
        {gameState !== 'start' && (
          <header className="flex justify-between items-center mb-4 px-2 relative">
            <div className="flex flex-col flex-1">
              <span className="text-xs text-slate-400 uppercase tracking-widest">{t.game.score}</span>
              <span className="text-3xl font-bold font-mono">{score.toLocaleString()}</span>
            </div>
            {/* 困难模式倒计时显示在中间 */}
            {difficulty === Difficulty.HARD && timeRemaining !== null && (
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full border-2 border-red-400 shadow-lg z-10">
                <span className="text-base animate-pulse">⏰</span>
                <span className={`text-lg font-bold font-mono ${
                  timeRemaining <= 5 ? 'text-yellow-300 animate-pulse' : 
                  timeRemaining <= 10 ? 'text-orange-300' : 
                  'text-white'
                }`}>
                  {timeRemaining}
                </span>
                <span className="text-[10px] text-red-100">{t.game.timeRemaining}</span>
              </div>
            )}
            <div className="flex flex-col items-end flex-1">
              <span className="text-xs text-slate-400 uppercase tracking-widest">{t.game.combo}</span>
              <span className={`text-2xl font-bold transition-all ${combo > 1 ? 'text-yellow-400 scale-110' : 'text-slate-500'}`}>
                x{combo}
              </span>
            </div>
          </header>
        )}

        <div className="relative flex-grow bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {gameState === 'playing' && (
            <GameBoard 
              onScoreUpdate={handleScoreUpdate} 
              onGameOver={handleGameOver}
              onNoMoves={handleNoMoves}
              onTimeUp={handleTimeUp}
              onTimeUpdate={setTimeRemaining}
              difficulty={difficulty}
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

        
        {/* 语言选择器 */}
        <LanguageSelector />
      </div>
    </div>
  );
};

export default App;
