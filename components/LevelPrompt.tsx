
import React, { useEffect, useState } from 'react';
import { LevelConfig } from '../constants';
import { useTranslation } from '../i18n/useTranslation';

interface LevelPromptProps {
  levelConfig: LevelConfig | null;
  onClose: () => void;
}

export const LevelPrompt: React.FC<LevelPromptProps> = ({ levelConfig, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (levelConfig) {
      console.log(`[LevelPrompt] 显示关卡提示: 关卡 ${levelConfig.level}`);
      // 显示动画
      setIsVisible(true);
      
      // 3秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false);
        // 等待动画完成后调用 onClose
        setTimeout(() => {
          onClose();
        }, 300);
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsVisible(false);
    }
  }, [levelConfig, onClose]);

  if (!levelConfig) return null;

  return (
    <div 
      className={`fixed inset-0 z-[110] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 悬浮文字 - 无背景 */}
      <div 
        className={`transform transition-all duration-500 ${
          isVisible 
            ? 'scale-100 translate-y-0' 
            : 'scale-90 translate-y-10'
        }`}
      >
        <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 animate-fade-in drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {levelConfig.level === 4 
            ? (t.levelPrompt?.finalLevel || '最终关卡')
            : `${t.levelPrompt?.title || '关卡'} ${levelConfig.level}`
          }
        </h2>
      </div>
    </div>
  );
};

