/**
 * 全屏工具函数
 * 用于隐藏浏览器地址栏，实现全屏游戏体验
 */

/**
 * 尝试进入全屏模式（隐藏地址栏）
 */
export async function requestFullscreen(): Promise<void> {
  const doc = document.documentElement as any;
  
  try {
    // 标准全屏API
    if (doc.requestFullscreen) {
      await doc.requestFullscreen();
    }
    // WebKit (Safari)
    else if (doc.webkitRequestFullscreen) {
      await doc.webkitRequestFullscreen();
    }
    // Mozilla
    else if (doc.mozRequestFullScreen) {
      await doc.mozRequestFullScreen();
    }
    // MS (IE/Edge)
    else if (doc.msRequestFullscreen) {
      await doc.msRequestFullscreen();
    }
  } catch (error) {
    console.log('Fullscreen request failed:', error);
    // 如果全屏失败，尝试滚动隐藏地址栏（移动端）
    hideAddressBar();
  }
}

/**
 * 退出全屏模式
 */
export function exitFullscreen(): void {
  const doc = document as any;
  
  if (doc.exitFullscreen) {
    doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    doc.mozCancelFullScreen();
  } else if (doc.msExitFullscreen) {
    doc.msExitFullscreen();
  }
}

/**
 * 检查是否处于全屏模式
 */
export function isFullscreen(): boolean {
  const doc = document as any;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * 移动端隐藏地址栏的替代方案
 * 通过滚动页面来隐藏地址栏
 */
function hideAddressBar(): void {
  // 移动端检测
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // 延迟执行，确保在用户交互后
    setTimeout(() => {
      window.scrollTo(0, 1);
      // 再次滚动确保地址栏隐藏
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }, 100);
  }
}

/**
 * 锁定屏幕方向（需要全屏API支持）
 */
export async function lockOrientation(orientation: 'landscape' | 'portrait'): Promise<void> {
  const screen = (window.screen as any);
  
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock(orientation);
    }
    // 旧版API
    else if (screen.lockOrientation) {
      screen.lockOrientation(orientation === 'landscape' ? 'landscape-primary' : 'portrait-primary');
    }
    // WebKit
    else if (screen.webkitLockOrientation) {
      screen.webkitLockOrientation(orientation === 'landscape' ? 'landscape-primary' : 'portrait-primary');
    }
    // Mozilla
    else if (screen.mozLockOrientation) {
      screen.mozLockOrientation(orientation === 'landscape' ? 'landscape-primary' : 'portrait-primary');
    }
    // MS
    else if (screen.msLockOrientation) {
      screen.msLockOrientation(orientation === 'landscape' ? 'landscape-primary' : 'portrait-primary');
    }
  } catch (error) {
    console.log('Orientation lock failed:', error);
  }
}

