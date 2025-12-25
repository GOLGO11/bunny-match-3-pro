
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface LandscapePromptProps {
  gameState: 'start' | 'loading' | 'playing' | 'gameover' | 'noMoves';
}

export const LandscapePrompt: React.FC<LandscapePromptProps> = ({ gameState }) => {
  const { t } = useTranslation();
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isPortraitMode = window.innerHeight > window.innerWidth;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      
      setIsPortrait(isPortraitMode);
      setIsMobile(isMobileDevice);
    };

    // 初始检查
    checkOrientation();

    // 监听窗口大小变化和方向变化
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 只在游戏进行中且移动端竖屏时显示
  if (gameState !== 'playing' || !isMobile || !isPortrait) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        {/* 旋转图标动画 */}
        <div className="text-6xl animate-spin" style={{ animationDuration: '2s' }}>
          🔄
        </div>
        
        {/* 提示文字 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">
            {t.landscape?.title || '请横屏游戏'}
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            {t.landscape?.message || '为了获得最佳游戏体验，请将设备旋转至横屏模式'}
          </p>
        </div>

        {/* 装饰性元素 */}
        <div className="flex gap-2 mt-4">
          <div className="text-2xl animate-float" style={{ animationDelay: '0s' }}>📱</div>
          <div className="text-2xl animate-float" style={{ animationDelay: '0.2s' }}>➡️</div>
          <div className="text-2xl animate-float" style={{ animationDelay: '0.4s' }}>📱</div>
        </div>
      </div>
    </div>
  );
};

